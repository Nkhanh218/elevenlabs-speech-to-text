import React, { useState } from 'react';
import { Container, Row, Col, Navbar, Nav } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import styled, { createGlobalStyle } from 'styled-components';
import { FaMicrophone } from 'react-icons/fa';
import AudioUploader from './components/AudioUploader';
import TranscriptionOutput from './components/TranscriptionOutput';
import { convertSpeechToText } from './services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Cấu hình cứng các cài đặt
const DEFAULT_SETTINGS = {
  modelId: 'scribe_v1',
  diarize: true,
  tagAudioEvents: true,
  timestampsGranularity: 'word',
  languageCode: 'vi',
  numSpeakers: ''
};

/*
 * API key của ElevenLabs
 * API key có thể lấy từ trang: https://elevenlabs.io/app/account 
 * Định dạng API key thường là một chuỗi ký tự mà không bắt đầu bằng "sk_"
 * Ví dụ: "a1b2c3d4e5f6g7h8i9j0"
 */
// Điền API key đúng của bạn vào đây
const API_KEY = "sk_c4716195cb4b9fabee223be86ef4e899d4ff55dc92a52999";

// Kiểm tra API key khi ứng dụng khởi động
console.log('API key được cấu hình:', API_KEY ? `${API_KEY.substring(0, 5)}...` : 'Không có');

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
  
  const handleFileSelect = async (file) => {
    try {
      setLoading(true);
      setError(null);
      setTranscription(null);
      
      console.log('Tập tin được chọn:', file.name, file.type, file.size);
      
      const options = {
        ...DEFAULT_SETTINGS
      };
      
      console.log('Bắt đầu gọi API với tùy chọn:', options);
      const result = await convertSpeechToText(file, API_KEY, options);
      console.log('Kết quả từ API:', result);
      setTranscription(result);
      toast.success('Chuyển đổi thành công!', {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err) {
      console.error('Chi tiết lỗi:', err);
      setError(err);
      let errorMessage = 'Lỗi khi chuyển đổi';
      
      if (err.response) {
        // Lỗi từ server
        if (err.response.status === 401) {
          errorMessage = 'Lỗi xác thực API key. Vui lòng kiểm tra lại API key.';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = `Lỗi: ${err.response.data.message}`;
        } else {
          errorMessage = `Lỗi ${err.response.status}: ${err.message}`;
        }
      } else if (err.request) {
        // Không nhận được phản hồi
        errorMessage = 'Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        // Lỗi khác
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
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
              {/* <Nav.Link href="https://elevenlabs.io/docs" target="_blank" rel="noreferrer">
                Tài liệu
              </Nav.Link> */}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </NavbarStyled>
      
      <MainContainer>
        <Row>
          <Col lg={6}>
            <AudioUploader onFileSelect={handleFileSelect} />
          </Col>
          <Col lg={6}>
            <TranscriptionOutput 
              transcription={transcription} 
              loading={loading} 
              error={error} 
            />
          </Col>
        </Row>
        
        <Footer>
          <p>
            {/* Powered by <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">ElevenLabs API</a> */}
          </p>
        </Footer>
      </MainContainer>
      
      <ToastContainer position="top-right" theme="dark" />
    </>
  );
}

export default App;
