import React, { useState, useRef } from 'react';
import { FaMicrophone, FaFileUpload, FaTrash } from 'react-icons/fa';
import styled from 'styled-components';
import { Button, ProgressBar, Form } from 'react-bootstrap';

const UploaderContainer = styled.div`
  background-color: #1e1e2e;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const FileInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #6c5ce7;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #a29bfe;
    background-color: rgba(108, 92, 231, 0.05);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: rgba(108, 92, 231, 0.1);
  padding: 1rem;
  border-radius: 8px;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #ddd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
`;

const RecordButton = styled(Button)`
  margin-top: 1rem;
  background-color: ${props => props.isRecording ? '#e74c3c' : '#6c5ce7'};
  border: none;
  &:hover {
    background-color: ${props => props.isRecording ? '#c0392b' : '#a29bfe'};
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const AudioUploader = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Mô phỏng việc upload
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      simulateUpload();
    }
  };

  const handleRecordClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
        
        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.webm`, { 
            type: 'audio/webm' 
          });
          setSelectedFile(audioFile);
          simulateUpload();
          
          // Dừng tất cả các track
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingTime(0);
        
        // Bắt đầu đếm thời gian
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitFile = () => {
    if (selectedFile && uploadProgress === 100) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <UploaderContainer>
      <h3 className="mb-4">Tải lên hoặc ghi âm</h3>
      
      {!selectedFile && (
        <FileInputWrapper 
          onDragOver={handleDragOver} 
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <FaFileUpload size={48} color="#6c5ce7" />
          <p className="mt-3 mb-0">Kéo thả file âm thanh hoặc nhấp để chọn</p>
          <small className="text-muted">Hỗ trợ tất cả các định dạng âm thanh và video phổ biến</small>
          <HiddenInput 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="audio/*,video/*"
          />
        </FileInputWrapper>
      )}
      
      {selectedFile && (
        <>
          <FileInfo>
            <FileName>{selectedFile.name}</FileName>
            <Button variant="outline-danger" size="sm" onClick={clearFile}>
              <FaTrash />
            </Button>
          </FileInfo>
          <div className="mt-3">
            <ProgressBar 
              animated={uploadProgress < 100} 
              variant={uploadProgress === 100 ? "success" : "primary"} 
              now={uploadProgress} 
              label={`${uploadProgress}%`} 
            />
          </div>
        </>
      )}
      
      <RecordButton 
        variant={isRecording ? "danger" : "primary"} 
        size="lg" 
        block 
        onClick={handleRecordClick}
        isRecording={isRecording}
        disabled={selectedFile && !isRecording}
      >
        <FaMicrophone className="me-2" />
        {isRecording ? `Đang ghi âm ${formatTime(recordingTime)}` : "Ghi âm"}
      </RecordButton>
      
      <ButtonsContainer>
        <Button 
          variant="success" 
          size="lg" 
          disabled={!selectedFile || uploadProgress < 100} 
          onClick={submitFile}
        >
          Chuyển đổi thành văn bản
        </Button>
      </ButtonsContainer>
    </UploaderContainer>
  );
};

export default AudioUploader; 