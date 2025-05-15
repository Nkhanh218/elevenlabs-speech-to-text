import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FaGoogle } from 'react-icons/fa';
import styled from 'styled-components';

const LoginContainer = styled(Container)`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoginCard = styled(Card)`
  background-color: #1e1e2e;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
`;

const GoogleButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  padding: 0.75rem;
  margin-top: 1.5rem;
  background-color: #4285F4;
  border-color: #4285F4;
  
  &:hover {
    background-color: #3367D6;
    border-color: #3367D6;
  }
`;

const AppInfo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    margin-bottom: 1rem;
    color: #f1f1f2;
  }
  
  p {
    color: #a0a0a0;
  }
`;

const Login = ({ error }) => {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <LoginContainer>
      <LoginCard>
        <AppInfo>
          <h2>ElevenLabs Speech-to-Text</h2>
          <p>Chuyển đổi giọng nói thành văn bản dễ dàng với ElevenLabs API</p>
        </AppInfo>
        
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        
        <Row>
          <Col xs={12}>
            <GoogleButton variant="primary" onClick={handleGoogleLogin}>
              <FaGoogle size={20} />
              <span>Đăng nhập với Google</span>
            </GoogleButton>
          </Col>
        </Row>
        
        <div className="text-center mt-4">
          <p className="text-muted">
            Đăng nhập để lưu API key và theo dõi lịch sử chuyển đổi của bạn.
          </p>
        </div>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login; 