import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert, Tabs, Tab } from 'react-bootstrap';
import AudioUploader from './components/AudioUploader';
import TranscriptionOutput from './components/TranscriptionOutput';
import ApiKeyModal from './components/ApiKeyModal';
import { FaBars, FaHistory, FaCog, FaInfoCircle } from 'react-icons/fa';
import { getApiKey, saveTranscriptionHistory, getTranscriptionHistory } from './services/api';
import TranscriptionHistory from './components/TranscriptionHistory';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('speech-to-text');
  const [audioUrl, setAudioUrl] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    // Kiểm tra xem đã có API key chưa
    const checkApiKey = async () => {
      try {
        const apiKey = await getApiKey();
        setHasApiKey(!!apiKey);
      } catch (error) {
        console.error('Error checking API key:', error);
        setHasApiKey(false);
      }
    };
    
    checkApiKey();
    
    // Lấy lịch sử chuyển đổi khi component mount
    loadTranscriptionHistory();
  }, []);
  
  // Hàm tải lịch sử chuyển đổi
  const loadTranscriptionHistory = async () => {
    try {
      const result = await getTranscriptionHistory();
      if (result.success) {
        setHistory(result.history);
      } else {
        console.error('Lỗi khi tải lịch sử:', result.error);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử:', error);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const handleTranscriptionComplete = (result, audioUrl, err, isLoading) => {
    if (isLoading) {
      setLoading(true);
      setError(null);
      return;
    }
    
    setLoading(false);
    
    if (err) {
      setError(err);
      return;
    }
    
    if (result) {
      setTranscription(result);
      setError(null);
      
      // Lưu vào lịch sử khi chuyển đổi thành công
      saveTranscriptionToHistory(result, selectedFile?.name);
    }
    
    setAudioUrl(audioUrl);
  };
  
  // Hàm lưu kết quả chuyển đổi vào lịch sử
  const saveTranscriptionToHistory = async (transcriptionData, fileName) => {
    try {
      // Thêm tên file vào dữ liệu
      const dataToSave = {
        ...transcriptionData,
        fileName: fileName || 'Không có tên'
      };
      
      // Gọi API để lưu vào lịch sử
      const result = await saveTranscriptionHistory(dataToSave);
      
      if (result.success) {
        // Cập nhật state với lịch sử mới
        setHistory(result.history);
      } else {
        console.error('Lỗi khi lưu lịch sử:', result.error);
      }
    } catch (error) {
      console.error('Lỗi khi lưu lịch sử:', error);
    }
  };
  
  // Hàm tải lịch sử đã lưu vào component chính
  const loadHistoryItem = (historyItem) => {
    setTranscription(historyItem.transcription);
    setError(null);
    setActiveTab('speech-to-text');
  };

  return (
    <div className="app-container">
      <Container fluid className="main-content">
        <Row>
          <Col md={12}>
            <Card className="mb-4 main-card">
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-4 custom-tabs"
                >
                  <Tab eventKey="speech-to-text" title="Chuyển đổi giọng nói">
                    <Row>
                      <Col md={12} lg={12}>
                        <AudioUploader
                          onFileSelect={handleFileSelect}
                          onTranscriptionComplete={handleTranscriptionComplete}
                        />
                        {hasApiKey ? null : (
                          <Alert variant="warning" className="mt-3">
                            <FaInfoCircle className="me-2" />
                            Bạn cần thiết lập ElevenLabs API key để sử dụng công cụ này.
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="ms-3"
                              onClick={() => setShowApiKeyModal(true)}
                            >
                              Thiết lập API Key
                            </Button>
                          </Alert>
                        )}
                        <TranscriptionOutput
                          transcription={transcription}
                          loading={loading}
                          error={error}
                          audioUrl={audioUrl}
                        />
                      </Col>
                    </Row>
                  </Tab>
                  <Tab eventKey="history" title="Lịch sử chuyển đổi">
                    <TranscriptionHistory 
                      history={history} 
                      onSelectItem={loadHistoryItem}
                      onRefresh={loadTranscriptionHistory}
                    />
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <ApiKeyModal
        show={showApiKeyModal}
        onHide={() => setShowApiKeyModal(false)}
        onSave={() => {
          setHasApiKey(true);
          setShowApiKeyModal(false);
        }}
      />
    </div>
  );
}

export default App; 