import React, { useState, useRef } from 'react';
import { FaMicrophone, FaFileUpload, FaTrash, FaUpload, FaPlay, FaPause } from 'react-icons/fa';
import styled from 'styled-components';
import { Button, ProgressBar, Form, Alert, Spinner } from 'react-bootstrap';
import AudioRecorder from './AudioRecorder';
import { transcribeWithElevenLabs } from '../services/api';
import axios from 'axios';

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

const UploadForm = styled.div`
  margin-bottom: 2rem;
`;

const FileInput = styled(Form.Control)`
  background-color: #2d2d42;
  border: 1px dashed #6c5ce7;
  padding: 3rem;
  text-align: center;
  color: #f1f1f2;
  cursor: pointer;
  
  &:hover {
    background-color: #353558;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const StyledProgressBar = styled(ProgressBar)`
  height: 0.8rem;
  border-radius: 8px;
  margin-top: 1rem;
`;

const AudioUploader = ({ onFileSelect, onTranscriptionComplete, submitButtonText = "Chuyển đổi thành văn bản" }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Tạo URL cho file âm thanh
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      // Reset các state khác
      setRecordedAudio(null);
      setError(null);
      
      // Gọi callback khi chọn file nếu có
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      // Tạo URL cho file âm thanh
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      // Reset các state khác
      setRecordedAudio(null);
      setError(null);
      
      // Gọi callback khi thả file nếu có
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRecordedAudio = (blob) => {
    setRecordedAudio(blob);
    setSelectedFile(null);
    
    // Tạo URL cho âm thanh đã ghi
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    // Reset các state khác
    setError(null);
    
    // Gọi callback khi ghi âm nếu có
    if (onFileSelect) {
      onFileSelect(blob);
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const uploadToServer = async () => {
    // Xác định file để upload
    const fileToUpload = selectedFile || recordedAudio;
    if (!fileToUpload) {
      setError('Vui lòng tải lên hoặc ghi âm trước khi chuyển đổi.');
      return;
    }
    
    try {
      setIsLoading(true);
      if (onTranscriptionComplete) {
        // Thông báo cho component cha rằng đang loading
        onTranscriptionComplete(null, audioUrl, null, true);
      }
      setError(null);
      
      // Cấu hình transcribe options
      const options = {
        model_id: 'scribe_v1',
        diarize: true,
        numSpeakers: 20,
        language_code: 'vi',
        onProgress: (percentCompleted) => {
          setUploadProgress(percentCompleted);
        }
      };
      
      // Gọi API qua helper function
      const response = await transcribeWithElevenLabs(fileToUpload, options);
      
      console.log('Kết quả API:', response);
      
      // Truyền kết quả lên component cha
      if (onTranscriptionComplete) {
        onTranscriptionComplete(response, audioUrl);
      }
      
      setIsLoading(false);
      setUploadProgress(100);
    } catch (err) {
      setIsLoading(false);
      
      // Hiển thị lỗi chi tiết hơn
      console.error('Error during transcription:', err);
      let errorMessage = err.message || 'Đã xảy ra lỗi khi chuyển đổi.';
      
      // Thông báo lỗi cho component cha
      if (onTranscriptionComplete) {
        onTranscriptionComplete(null, audioUrl, err, false);
      }
      
      setError(errorMessage);
      setUploadProgress(0);
    }
  };

  return (
    <div>
      <UploaderContainer>
        <h3 className="mb-4">Tải lên hoặc ghi âm</h3>
        
        {!isRecording ? (
          <UploadForm>
            <FileInput
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              ref={fileInputRef}
              onClick={(e) => e.target.value = null}
              custom="true"
              label={selectedFile ? `Đã chọn: ${selectedFile.name}` : "Kéo thả hoặc click để tải lên tập tin âm thanh"}
            />
            
            <ButtonContainer>
              <Button 
                variant="primary" 
                onClick={() => setIsRecording(true)}
              >
                <FaMicrophone /> Ghi âm
              </Button>
              
              <Button 
                variant="success" 
                onClick={uploadToServer}
                disabled={!selectedFile && !recordedAudio || isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <FaUpload /> {submitButtonText}
                  </>
                )}
              </Button>
              
              {(selectedFile || recordedAudio) && (
                <Button 
                  variant={isPlaying ? "warning" : "info"} 
                  onClick={toggleAudioPlayback}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />} {isPlaying ? 'Tạm dừng' : 'Phát'}
                </Button>
              )}
            </ButtonContainer>
            
            {(selectedFile || recordedAudio) && (
              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />
            )}
            
            {uploadProgress > 0 && (
              <StyledProgressBar 
                now={uploadProgress} 
                variant={uploadProgress < 100 ? "primary" : "success"} 
                label={`${uploadProgress}%`} 
              />
            )}
            
            {error && (
              <Alert variant="danger" className="mt-3">
                <strong>Lỗi: </strong> {error}
              </Alert>
            )}
          </UploadForm>
        ) : (
          <AudioRecorder 
            onRecordingComplete={handleRecordedAudio} 
            onCancel={() => setIsRecording(false)} 
          />
        )}
      </UploaderContainer>
    </div>
  );
};

export default AudioUploader; 