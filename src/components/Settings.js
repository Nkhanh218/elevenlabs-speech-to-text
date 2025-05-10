import React, { useState } from 'react';
import { Form, Button, Card, Accordion } from 'react-bootstrap';
import styled from 'styled-components';
import { FaCog, FaKey, FaLanguage, FaUserFriends, FaRegClock } from 'react-icons/fa';

const SettingsContainer = styled.div`
  background-color: #1e1e2e;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
`;

const AccordionStyled = styled(Accordion)`
  .accordion-button {
    background-color: #2d2d42;
    color: #f1f1f2;
    box-shadow: none;
    
    &:not(.collapsed) {
      color: #f1f1f2;
      background-color: #3c3c57;
      box-shadow: none;
    }
    
    &:focus {
      box-shadow: none;
      border-color: #6c5ce7;
    }
    
    &::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23f1f1f2'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
    }
  }
  
  .accordion-body {
    background-color: #2d2d42;
    color: #f1f1f2;
  }
`;

const FormGroup = styled(Form.Group)`
  margin-bottom: 1.5rem;
`;

const ApiKeyInput = styled(Form.Control)`
  font-family: monospace;
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    margin-left: 0.75rem;
  }
`;

const Settings = ({ 
  settings, 
  onSettingsChange,
  onSaveSettings
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setLocalSettings({
      ...localSettings,
      [name]: newValue
    });
  };
  
  const handleSave = () => {
    onSaveSettings(localSettings);
  };
  
  return (
    <SettingsContainer>
      <SettingsHeader>
        <FaCog size={24} />
        <h3>Cài đặt</h3>
      </SettingsHeader>
      
      <AccordionStyled defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <FaKey className="me-2" /> API key và Cài đặt cơ bản
          </Accordion.Header>
          <Accordion.Body>
            <Form>
              <FormGroup className="mb-3">
                <Form.Label>ElevenLabs API Key</Form.Label>
                <div className="input-group">
                  <ApiKeyInput
                    type={showApiKey ? "text" : "password"}
                    placeholder="Nhập API key của bạn tại đây"
                    name="apiKey"
                    value={localSettings.apiKey || ''}
                    onChange={handleChange}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Ẩn" : "Hiện"}
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Lấy API key của bạn từ <a href="https://elevenlabs.io/app" target="_blank" rel="noreferrer">trang ElevenLabs</a>
                </Form.Text>
              </FormGroup>
              
              <FormGroup className="mb-3">
                <Form.Label>Model ID</Form.Label>
                <Form.Select
                  name="modelId"
                  value={localSettings.modelId || 'scribe_v1'}
                  onChange={handleChange}
                >
                  <option value="scribe_v1">scribe_v1 (Mặc định)</option>
                  <option value="scribe_v1_experimental">scribe_v1_experimental</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Model được sử dụng để phiên âm
                </Form.Text>
              </FormGroup>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
        
        <Accordion.Item eventKey="1">
          <Accordion.Header>
            <FaLanguage className="me-2" /> Cài đặt ngôn ngữ
          </Accordion.Header>
          <Accordion.Body>
            <Form>
              <FormGroup className="mb-3">
                <Form.Label>Mã ngôn ngữ (tùy chọn)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="vd: en, vi, fr, ja..."
                  name="languageCode"
                  value={localSettings.languageCode || ''}
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  Để trống để tự động phát hiện ngôn ngữ
                </Form.Text>
              </FormGroup>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
        
        <Accordion.Item eventKey="2">
          <Accordion.Header>
            <FaUserFriends className="me-2" /> Phân tách người nói
          </Accordion.Header>
          <Accordion.Body>
            <Form>
              <FormGroup className="mb-3">
                <Form.Check
                  type="switch"
                  id="diarizeSwitch"
                  label="Phân tách người nói"
                  name="diarize"
                  checked={localSettings.diarize || false}
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  Chú thích người nói hiện tại trong file tải lên
                </Form.Text>
              </FormGroup>
              
              <FormGroup className="mb-3">
                <Form.Label>Số lượng người nói tối đa (tùy chọn)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="32"
                  placeholder="Tối đa 32 người"
                  name="numSpeakers"
                  value={localSettings.numSpeakers || ''}
                  onChange={handleChange}
                  disabled={!localSettings.diarize}
                />
                <Form.Text className="text-muted">
                  Để trống để tự động phát hiện số lượng người nói
                </Form.Text>
              </FormGroup>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
        
        <Accordion.Item eventKey="3">
          <Accordion.Header>
            <FaRegClock className="me-2" /> Cài đặt thời gian
          </Accordion.Header>
          <Accordion.Body>
            <Form>
              <FormGroup className="mb-3">
                <Form.Label>Độ chi tiết của thời gian</Form.Label>
                <Form.Select
                  name="timestampsGranularity"
                  value={localSettings.timestampsGranularity || 'word'}
                  onChange={handleChange}
                >
                  <option value="word">Từng từ (Mặc định)</option>
                  <option value="character">Từng ký tự</option>
                  <option value="none">Không có</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Mức độ chi tiết của thời gian trong bản ghi
                </Form.Text>
              </FormGroup>
              
              <FormGroup className="mb-3">
                <Form.Check
                  type="switch"
                  id="tagAudioEventsSwitch"
                  label="Gắn thẻ sự kiện âm thanh"
                  name="tagAudioEvents"
                  checked={localSettings.tagAudioEvents !== false}
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  Gắn thẻ các sự kiện âm thanh như (cười), (bước chân), v.v. trong bản ghi
                </Form.Text>
              </FormGroup>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
      </AccordionStyled>
      
      <div className="d-flex justify-content-end mt-4">
        <Button variant="primary" size="lg" onClick={handleSave}>
          Lưu cài đặt
        </Button>
      </div>
    </SettingsContainer>
  );
};

export default Settings; 