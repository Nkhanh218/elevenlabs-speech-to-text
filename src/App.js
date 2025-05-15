import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Tabs, Tab, Button } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import styled, { createGlobalStyle } from 'styled-components';
import { FaMicrophone, FaScissors } from 'react-icons/fa';
import AudioUploader from './components/AudioUploader';
import TranscriptionOutput from './components/TranscriptionOutput';
import AudioTrimmer from './components/AudioTrimmer';
import { convertSpeechToText, getApiKey } from './services/api';
import { AuthProvider } from './components/AuthManager';
import AuthManager from './components/AuthManager';
import ApiKeyManager from './components/ApiKeyManager';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Cấu hình cứng các cài đặt
const DEFAULT_SETTINGS = {
  modelId: 'scribe_v1',
  diarize: true,
  tagAudioEvents: true,
  timestampsGranularity: 'word',
  languageCode: 'vi',
  numSpeakers: '2'
};

// Sử dụng Google Client ID từ biến môi trường hoặc giá trị mặc định
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID ||'324340717915-0glap5kdvp1lhgkj1n1qmckru3lufkpo.apps.googleusercontent.com';

// Debug environment variables
console.log('Environment Variables Debug:');
console.log('REACT_APP_GOOGLE_CLIENT_ID exists:', Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID));

// Kiểm tra Google Client ID khi ứng dụng khởi động
console.log('Google Client ID được cấu hình:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 8)}...` : 'Không có');

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #0f0f1a;
    color: #f1f1f2;
    font-family: 'Inter', sans-serif;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1e1e2e;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #6c5ce7;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a29bfe;
  }
`;

const MainContainer = styled(Container)`
  padding: 2rem 1.5rem;
`;

const NavbarStyled = styled(Navbar)`
  background-color: #1e1e2e;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f1f2;
  
  svg {
    margin-right: 0.75rem;
    color: #6c5ce7;
  }
`;

const TabsStyled = styled(Tabs)`
  border-bottom: none;
  margin-bottom: 2rem;
  
  .nav-link {
    color: #a0a0a0;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem 0.5rem 0 0;
    margin-right: 0.5rem;
    background-color: transparent;
    
    &:hover {
      color: #f1f1f2;
      border-color: transparent;
    }
    
    &.active {
      color: #f1f1f2;
      background-color: #1e1e2e;
      border-color: transparent;
    }
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 2rem 0;
  margin-top: 2rem;
  color: #a0a0a0;
  
  a {
    color: #6c5ce7;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

function App() {
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('speech-to-text');
  const [audioUrl, setAudioUrl] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
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
  }, []);
  
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    
    // Nếu đang ở tab cắt, hiển thị AudioTrimmer ngay lập tức
    if (activeTab === 'trim') {
      console.log('File đã chọn cho tab cắt:', file.name);
      return;
    }
  };
  
  const handleTranscriptionComplete = (data, url, err, isLoading) => {
    setAudioUrl(url);
    setTranscription(data);
    
    // Kiểm tra lỗi API key
    if (err && err.message && (err.message.includes('API key') || err.message.includes('Chưa cấu hình ElevenLabs API key'))) {
      setShowApiKeyModal(true);
      setError({
        message: 'API key không được cấu hình. Vui lòng thêm ElevenLabs API key để tiếp tục.'
      });
    } else {
    setError(err);
    }
    
    // Cập nhật trạng thái loading
    if (isLoading !== undefined) {
      setLoading(isLoading);
    } else {
      setLoading(false);
    }
    
    if (data) {
      toast.success('Chuyển đổi thành công!', {
        position: "top-right",
        autoClose: 3000
      });
    } else if (err && !err.message.includes('API key')) {
      toast.error(err.message || 'Lỗi khi chuyển đổi', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };
  
  const handleTrimmedAudio = (trimmedFile) => {
    setSelectedFile(trimmedFile);
    toast.success('Đã cắt audio thành công!', {
      position: "top-right",
      autoClose: 3000
    });
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset trạng thái khi chuyển tab nếu cần
    if (tab === 'speech-to-text' && selectedFile) {
      handleFileSelect(selectedFile);
    }
  };
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <GlobalStyle />
      <NavbarStyled expand="lg" variant="dark">
        <Container>
          <Navbar.Brand href="#">
            <Logo>
              <FaMicrophone size={24} />
              <span>Speech to Text</span>
            </Logo>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
                <div className="d-flex align-items-center">
                  <AuthManager />
                </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </NavbarStyled>
      
      <MainContainer>
          {!hasApiKey && (
            <Row className="mb-4">
              <Col>
                <ApiKeyManager onApiKeyUpdate={() => setHasApiKey(true)} />
              </Col>
            </Row>
          )}
          
        <TabsStyled 
          activeKey={activeTab} 
          onSelect={handleTabChange}
        >
          <Tab eventKey="speech-to-text" title="Chuyển đổi Speech to Text">
            <Row>
              <Col lg={6}>
                <AudioUploader 
                  onFileSelect={handleFileSelect}
                  onTranscriptionComplete={handleTranscriptionComplete}
                  submitButtonText="Chuyển đổi thành văn bản"
                />
                  
                  {/* Nút cấu hình API key */}
                  {hasApiKey && (
                    <div className="mt-3 text-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowApiKeyModal(true)}
                      >
                        Cập nhật ElevenLabs API Key
                      </Button>
                    </div>
                  )}
              </Col>
              <Col lg={6}>
                <TranscriptionOutput 
                  transcription={transcription} 
                  loading={loading} 
                  error={error} 
                  audioUrl={audioUrl}
                />
                  
                  {/* Hiển thị component ApiKeyManager khi có lỗi API key */}
                  {error && error.message && error.message.includes('API key') && (
                    <div className="mt-3">
                      <ApiKeyManager 
                        onApiKeyUpdate={() => {
                          setHasApiKey(true);
                          setError(null);
                        }}
                      />
                    </div>
                  )}
              </Col>
            </Row>
          </Tab>
          <Tab eventKey="trim" title="Cắt Audio/Video">
            <Row>
              <Col lg={12}>
                {selectedFile ? (
                  <>
                    <div className="mb-3 p-3" style={{ backgroundColor: '#1e1e2e', borderRadius: '8px' }}>
                      <h5 className="mb-2">File đã chọn:</h5>
                      <div className="d-flex align-items-center justify-content-between">
                        <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Chọn file khác
                        </Button>
                      </div>
    </div>
                    <AudioTrimmer 
                      audioFile={selectedFile}
                      onSaveTrimmed={handleTrimmedAudio}
                    />
                  </>
                ) : (
                  <AudioUploader 
                    onFileSelect={handleFileSelect} 
                      submitButtonText="Tải lên để cắt"
                      hideRecorder={true}
                  />
                )}
              </Col>
            </Row>
          </Tab>
        </TabsStyled>
        </MainContainer>
        
        {/* Modal cho API Key */}
        {showApiKeyModal && (
          <ApiKeyManager 
            isModal={true} 
            onClose={() => setShowApiKeyModal(false)}
            onApiKeyUpdate={(apiKey) => {
              setHasApiKey(true);
              // Reload trang sau khi lưu API key
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }}
          />
        )}

        <ToastContainer />
        <Footer>
          &copy; {new Date().getFullYear()} ElevenLabs Speech to Text. Powered by <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">ElevenLabs API</a>
        </Footer>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
