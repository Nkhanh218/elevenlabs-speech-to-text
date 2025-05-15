import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaKey, FaEye, FaEyeSlash, FaCheck, FaClipboard, FaSave, FaTimes } from 'react-icons/fa';
import styled from 'styled-components';
import { saveApiKey, getApiKey } from '../services/api';
import { useAuth } from './AuthManager';

const ApiKeyCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  background-color: #1e1e2e;
  color: #f1f1f2;
`;

const ApiKeyInput = styled(Form.Control)`
  background-color: #2d2d42;
  border-color: #3c3c57;
  color: #f1f1f2;
  
  &:focus {
    background-color: #2d2d42;
    color: #f1f1f2;
    border-color: #6c63ff;
    box-shadow: 0 0 0 0.25rem rgba(108, 99, 255, 0.25);
  }
`;

const ApiKeyHelp = styled.div`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #a1a1b5;
`;

const ApiKeyLink = styled.a`
  color: #84ffff;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
    color: #84ffff;
  }
`;

// Thêm styled component để tùy chỉnh nút đóng trong Modal
const StyledModal = styled(Modal)`
  .btn-close {
    color: white;
    filter: invert(1) brightness(100%);
  }
`;

const ApiKeyManager = ({ onApiKeyUpdate, isModal = false, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    loadApiKey();
  }, [isAuthenticated]);
  
  const loadApiKey = () => {
    try {
      setIsLoading(true);
      const key = getApiKey();
      
      if (key) {
        setApiKey(key);
        setHasStoredKey(true);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };
  
  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    setError('');
    setSuccess('');
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setSuccess('Đã sao chép API key vào clipboard');
    setTimeout(() => setSuccess(''), 3000);
  };
  
  const clearApiKey = () => {
    setApiKey('');
    setHasStoredKey(false);
    setError('');
    setSuccess('');
  };
  
  const validateApiKey = () => {
    if (!apiKey) {
      setError('API key không được để trống');
      return false;
    }
    
    if (apiKey.length < 32) {
      setError('API key không hợp lệ');
      return false;
    }
    
    return true;
  };
  
  const handleSaveApiKey = async () => {
    if (!validateApiKey()) return;
    
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      // Lưu vào database qua API endpoint
      await saveApiKey(apiKey);
      
      // saveApiKey trong services/api.js đã tự lưu vào localStorage
      
      setHasStoredKey(true);
      setSuccess('API key đã được lưu thành công');
      
      // Thông báo cho component cha khi API key được cập nhật
      if (onApiKeyUpdate) {
        onApiKeyUpdate(apiKey);
      }
      
      // Đóng modal nếu cần
      if (isModal && onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setError(error.message || 'Không thể lưu API key');
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderContent = () => (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form.Group>
        <Form.Label>ElevenLabs API Key</Form.Label>
        <InputGroup>
          <ApiKeyInput
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Nhập ElevenLabs API key của bạn"
            disabled={isSaving}
          />
          <Button
            variant="secondary"
            onClick={toggleShowApiKey}
          >
            {showApiKey ? <FaEyeSlash /> : <FaEye />}
          </Button>
          
          {hasStoredKey && (
            <Button
              variant="secondary"
              onClick={copyToClipboard}
            >
              <FaClipboard />
            </Button>
          )}
          
          {hasStoredKey && (
            <Button
              variant="danger"
              onClick={clearApiKey}
            >
              <FaTimes />
            </Button>
          )}
        </InputGroup>
      </Form.Group>
      
      <div className="mt-3">
        <Button
          variant="primary"
          onClick={handleSaveApiKey}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Đang lưu...
            </>
          ) : (
            <>
              <FaSave className="me-2" /> Lưu API Key
            </>
          )}
        </Button>
      </div>
      
      <ApiKeyHelp>
        <p>
          Bạn cần API key của ElevenLabs để sử dụng dịch vụ chuyển đổi giọng nói sang văn bản.
          Lấy API key của bạn từ tài khoản ElevenLabs.
        </p>
        <p>
          <ApiKeyLink 
            href="https://elevenlabs.io/speech-to-text"
            target="_blank"
            rel="noopener noreferrer"
          >
            Đăng ký tài khoản ElevenLabs
          </ApiKeyLink>
        </p>
      </ApiKeyHelp>
    </>
  );
  
  // Nếu là modal, hiển thị trong Modal component
  if (isModal) {
    return (
      <StyledModal show={true} onHide={onClose} centered backdrop="static" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <Modal.Header closeButton style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2' }}>
          <Modal.Title>
            <FaKey className="me-2" /> Cấu hình ElevenLabs API Key
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2' }}>
          {isLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : (
            renderContent()
          )}
        </Modal.Body>
      </StyledModal>
    );
  }
  
  // Hiển thị dạng card thông thường
  return (
    <ApiKeyCard>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaKey className="me-2" /> ElevenLabs API Key
        </h5>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải...</p>
          </div>
        ) : (
          renderContent()
        )}
      </Card.Body>
    </ApiKeyCard>
  );
};

export default ApiKeyManager; 