import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Button, ProgressBar } from 'react-bootstrap';
import { FaMicrophone, FaStop, FaSave, FaTrash } from 'react-icons/fa';

const RecorderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #2d2d42;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const TimeDisplay = styled.div`
  font-size: 3rem;
  font-weight: bold;
  margin: 1.5rem 0;
  color: #f1f1f2;
`;

const WaveformContainer = styled.div`
  width: 100%;
  height: 100px;
  background-color: #1e1e2e;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  position: relative;
`;

const WaveformAnimation = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WaveBar = styled.div`
  height: ${props => props.height}px;
  width: 5px;
  background-color: #6c5ce7;
  margin: 0 2px;
  border-radius: 3px;
  animation: wave 0.5s infinite ease-in-out alternate;
  animation-delay: ${props => props.delay}s;

  @keyframes wave {
    0% {
      height: 10px;
    }
    100% {
      height: ${props => props.maxHeight}px;
    }
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const AudioRecorder = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  
  useEffect(() => {
    // Cleanup function
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  const startRecording = async () => {
    try {
      // Yêu cầu quyền truy cập microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Tạo media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Thiết lập các sự kiện
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Tạo blob từ các chunks âm thanh
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
      };
      
      // Bắt đầu ghi âm
      mediaRecorder.start();
      setIsRecording(true);
      
      // Bắt đầu đếm thời gian
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Không thể truy cập microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập của trình duyệt.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      
      // Dừng tất cả các tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  const playPauseAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleSave = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };
  
  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    
    // Nếu có URL, revoke nó
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };
  
  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Tạo mảng thanh sóng giả cho hiệu ứng
  const waveformBars = [...Array(50)].map((_, index) => {
    const height = Math.sin(index * 0.4) * 20 + 30;
    return (
      <WaveBar 
        key={index} 
        height={isRecording ? height / 2 : 10} 
        maxHeight={height} 
        delay={(index % 10) * 0.1}
      />
    );
  });
  
  return (
    <RecorderContainer>
      <h4>{isRecording ? 'Đang ghi âm...' : audioBlob ? 'Ghi âm hoàn tất' : 'Bắt đầu ghi âm'}</h4>
      
      <TimeDisplay>
        {formatTime(recordingTime)}
      </TimeDisplay>
      
      <WaveformContainer>
        <WaveformAnimation>
          {waveformBars}
        </WaveformAnimation>
      </WaveformContainer>
      
      <ButtonsContainer>
        {!isRecording && !audioBlob && (
          <Button 
            variant="primary" 
            size="lg" 
            onClick={startRecording}
          >
            <FaMicrophone /> Bắt đầu ghi âm
          </Button>
        )}
        
        {isRecording && (
          <Button 
            variant="danger" 
            size="lg" 
            onClick={stopRecording}
          >
            <FaStop /> Dừng ghi âm
          </Button>
        )}
        
        {audioBlob && (
          <>
            <Button 
              variant={isPlaying ? "warning" : "info"} 
              onClick={playPauseAudio}
            >
              {isPlaying ? <FaStop /> : <FaMicrophone />} {isPlaying ? 'Dừng' : 'Nghe lại'}
            </Button>
            
            <Button 
              variant="success" 
              onClick={handleSave}
            >
              <FaSave /> Lưu bản ghi
            </Button>
            
            <Button 
              variant="outline-secondary" 
              onClick={resetRecording}
            >
              <FaTrash /> Xóa và ghi lại
            </Button>
          </>
        )}
        
        <Button 
          variant="outline-danger" 
          onClick={onCancel}
        >
          Hủy
        </Button>
      </ButtonsContainer>
      
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          style={{ display: 'none' }} 
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </RecorderContainer>
  );
};

export default AudioRecorder; 