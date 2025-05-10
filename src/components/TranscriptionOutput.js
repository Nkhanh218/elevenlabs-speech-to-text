import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import { FaCopy, FaDownload, FaCheck, FaUser, FaUserFriends } from 'react-icons/fa';

const OutputContainer = styled.div`
  background-color: #1e1e2e;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
  min-height: 300px;
`;

const TranscriptionText = styled.div`
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  background-color: #2d2d42;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #f1f1f2;
`;

const WordSpan = styled.span`
  background-color: ${props => props.highlighted ? 'rgba(108, 92, 231, 0.3)' : 'transparent'};
  padding: 0 2px;
  border-radius: 3px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(108, 92, 231, 0.2);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const SpeakerLabel = styled.span`
  background-color: ${props => {
    const colors = ['#6c5ce7', '#e84393', '#00b894', '#fdcb6e', '#e17055'];
    return colors[parseInt(props.speaker.replace('speaker_', '')) % colors.length];
  }};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-right: 8px;
  color: white;
`;

const TimestampBadge = styled(Badge)`
  background-color: #2d3436;
  margin-left: 8px;
  font-size: 0.7rem;
  vertical-align: middle;
`;

const TranscriptionOutput = ({ 
  transcription, 
  loading, 
  error 
}) => {
  const [copied, setCopied] = useState(false);
  
  if (loading) {
    return (
      <OutputContainer className="d-flex justify-content-center align-items-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang chuyển đổi audio thành văn bản...</p>
        </div>
      </OutputContainer>
    );
  }
  
  if (error) {
    return (
      <OutputContainer>
        <Card bg="danger" text="white">
          <Card.Header>Lỗi</Card.Header>
          <Card.Body>
            <Card.Title>Đã xảy ra lỗi khi chuyển đổi</Card.Title>
            <Card.Text>{error.message || 'Không thể chuyển đổi audio thành văn bản.'}</Card.Text>
          </Card.Body>
        </Card>
      </OutputContainer>
    );
  }
  
  if (!transcription) {
    return (
      <OutputContainer className="d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h4>Chưa có dữ liệu chuyển đổi</h4>
          <p className="text-muted">Tải lên âm thanh và chuyển đổi để xem kết quả ở đây</p>
        </div>
      </OutputContainer>
    );
  }
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadTranscription = () => {
    const element = document.createElement('a');
    const file = new Blob([transcription.text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${new Date().toISOString()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const renderWords = () => {
    if (!transcription.words || transcription.words.length === 0) {
      return transcription.text;
    }
    
    return transcription.words.map((word, index) => {
      if (word.type === 'spacing') {
        return ' ';
      }
      
      return (
        <WordSpan key={index}>
          {word.speaker_id && <SpeakerLabel speaker={word.speaker_id}>
            <FaUser size={10} /> {word.speaker_id.replace('speaker_', '')}
          </SpeakerLabel>}
          {word.text}
          {word.start !== undefined && word.end !== undefined && 
            <TimestampBadge>{formatTime(word.start)}</TimestampBadge>
          }
        </WordSpan>
      );
    });
  };
  
  return (
    <OutputContainer>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Kết quả chuyển đổi</h3>
        <div>
          <Badge bg="primary" className="me-2">
            {transcription.language_code?.toUpperCase() || 'N/A'}
          </Badge>
          <Badge bg="info">
            Độ tin cậy: {Math.round(transcription.language_probability * 100)}%
          </Badge>
        </div>
      </div>
      
      <TranscriptionText>
        {renderWords()}
      </TranscriptionText>
      
      <ButtonsContainer>
        <Button 
          variant="outline-primary" 
          onClick={copyToClipboard}
        >
          {copied ? <><FaCheck /> Đã sao chép</> : <><FaCopy /> Sao chép</>}
        </Button>
        <Button 
          variant="outline-secondary" 
          onClick={downloadTranscription}
        >
          <FaDownload /> Tải xuống
        </Button>
      </ButtonsContainer>
    </OutputContainer>
  );
};

export default TranscriptionOutput; 