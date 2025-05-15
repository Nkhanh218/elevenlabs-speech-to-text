import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button, Form, Row, Col, ProgressBar } from 'react-bootstrap';
import { FaPlay, FaPause, FaCut, FaSave, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TrimmerContainer = styled.div`
  background-color: #1e1e2e;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const WaveformContainer = styled.div`
  height: 100px;
  background-color: #2d2d42;
  border-radius: 8px;
  margin: 1rem 0;
  position: relative;
  cursor: pointer;
  overflow: hidden;
`;

const Waveform = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WaveCanvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

const TimeIndicator = styled.div`
  position: absolute;
  height: 100%;
  width: 2px;
  background-color: #6c5ce7;
  left: ${props => props.position}%;
  top: 0;
  pointer-events: none;
`;

const RangeSlider = styled.div`
  position: relative;
  margin: 1.5rem 0;
  height: 24px;
`;

const SliderTrack = styled.div`
  position: absolute;
  width: 100%;
  height: 6px;
  background-color: #2d2d42;
  border-radius: 3px;
  top: 50%;
  transform: translateY(-50%);
`;

const SliderRange = styled.div`
  position: absolute;
  height: 6px;
  background-color: #6c5ce7;
  border-radius: 3px;
  top: 50%;
  transform: translateY(-50%);
  left: ${props => props.start}%;
  width: ${props => props.end - props.start}%;
`;

const SliderHandle = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: #6c5ce7;
  border-radius: 50%;
  top: 50%;
  left: ${props => props.position}%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  
  &:hover {
    background-color: #a29bfe;
  }
  
  &:active {
    background-color: #a29bfe;
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  color: #f1f1f2;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
`;

const TimeInput = styled(Form.Control)`
  background-color: #2d2d42;
  border: 1px solid #3c3c57;
  color: #f1f1f2;
  
  &:focus {
    background-color: #3c3c57;
    color: #f1f1f2;
  }
`;

const AudioTrimmer = ({ audioFile, onSaveTrimmed }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isDragging, setIsDragging] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trimmedUrl, setTrimmedUrl] = useState(null);
  const [trimmedFile, setTrimmedFile] = useState(null);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  
  // Thêm biến tham chiếu để theo dõi vị trí và cập nhật trực tiếp DOM
  const sliderTrackRef = useRef(null);
  const startHandleRef = useRef(null);
  const endHandleRef = useRef(null);
  const sliderRangeRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  
  useEffect(() => {
    if (audioFile) {
      console.log('AudioTrimmer: Nhận file', audioFile.name, audioFile.type, audioFile.size);
      
      // Revoke previous URL if exists
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      
      // Create a new URL for the file
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      
      // Reset trimming points when a new file is loaded
      setStartTime(0);
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Initialize Web Audio API for visualization
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
        }
        
        console.log('AudioTrimmer: Khởi tạo AudioContext thành công');
      } catch (error) {
        console.error('AudioTrimmer: Lỗi khởi tạo AudioContext', error);
      }
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioFile]);
  
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      console.log('AudioTrimmer: Audio URL được thiết lập', audioUrl.substring(0, 30) + '...');
      
      const handleLoadedMetadata = () => {
        console.log('AudioTrimmer: Audio metadata đã tải xong, duration =', audioRef.current.duration);
        setDuration(audioRef.current.duration);
        setEndTime(audioRef.current.duration);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
        
        // Loop playback within selected range
        if (audioRef.current.currentTime >= endTime) {
          audioRef.current.currentTime = startTime;
          if (isPlaying) audioRef.current.play();
        }
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        audioRef.current.currentTime = startTime;
      };
      
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
      
      // Connect audio to Web Audio API for visualization
      try {
        if (audioContextRef.current && !sourceRef.current && audioRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          
          // Start visualization
          console.log('AudioTrimmer: Kết nối Audio API và bắt đầu vẽ waveform');
          drawWaveform();
        }
      } catch (error) {
        console.error('AudioTrimmer: Lỗi kết nối Audio API', error);
      }
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [audioUrl, startTime, endTime, isPlaying]);
  
  // Function to draw waveform
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) {
      console.error('AudioTrimmer: Không thể vẽ waveform, thiếu canvas hoặc analyser');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    console.log('AudioTrimmer: Bắt đầu vẽ waveform, buffer length =', bufferLength);
    
    const draw = () => {
      requestAnimationFrame(draw);
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#2d2d42';
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        ctx.fillStyle = '#6c5ce7';
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };
  
  // Thêm function mới để xử lý file audio mà không cần Web Audio API
  const createSimpleWaveform = () => {
    if (!canvasRef.current) return;
    
    console.log('AudioTrimmer: Tạo waveform đơn giản (fallback)');
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Vẽ background
    ctx.fillStyle = '#2d2d42';
    ctx.fillRect(0, 0, width, height);
    
    // Vẽ một waveform đơn giản
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Vẽ dạng sóng sin đơn giản
    const amplitude = height / 3;
    const frequency = 0.02;
    
    ctx.moveTo(0, height / 2);
    for (let x = 0; x < width; x++) {
      const y = height / 2 + amplitude * Math.sin(x * frequency);
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
  };
  
  // Thay đổi togglePlayPause để xử lý lỗi
  const togglePlayPause = () => {
    if (!audioRef.current) {
      console.error('AudioTrimmer: Không có tham chiếu audio');
      return;
    }
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Set current time to start time if outside of range
        if (currentTime < startTime || currentTime > endTime) {
          audioRef.current.currentTime = startTime;
        }
        
        // Khi gọi play(), có thể phát sinh lỗi do trình duyệt cần tương tác người dùng
        // Chúng ta dùng Promise để xử lý
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('AudioTrimmer: Bắt đầu phát thành công');
            })
            .catch(error => {
              console.error('AudioTrimmer: Lỗi khi phát audio', error);
              toast.error('Không thể phát audio. Vui lòng thử lại hoặc tải lại trang.');
            });
        }
      }
      
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('AudioTrimmer: Lỗi xử lý audio', error);
    }
  };
  
  const handleStartTimeChange = (e) => {
    const newStartTime = parseFloat(e.target.value);
    if (!isNaN(newStartTime) && newStartTime >= 0 && newStartTime < endTime) {
      setStartTime(newStartTime);
      if (currentTime < newStartTime) {
        setCurrentTime(newStartTime);
        if (audioRef.current) audioRef.current.currentTime = newStartTime;
      }
    }
  };
  
  const handleEndTimeChange = (e) => {
    const newEndTime = parseFloat(e.target.value);
    if (!isNaN(newEndTime) && newEndTime > startTime && newEndTime <= duration) {
      setEndTime(newEndTime);
      if (currentTime > newEndTime) {
        setCurrentTime(newEndTime);
        if (audioRef.current) audioRef.current.currentTime = newEndTime;
      }
    }
  };
  
  // Áp dụng throttling và tối ưu hóa handleMouseMove
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !duration) return;
    
    // Áp dụng throttle để hạn chế số lần cập nhật (mỗi 16ms ~ 60fps)
    const now = Date.now();
    if (now - lastMoveTimeRef.current < 16) return;
    lastMoveTimeRef.current = now;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percentage / 100) * duration;
    
    if (isDragging === 'start' && time < endTime) {
      // Cập nhật trực tiếp DOM trước khi cập nhật state để có cảm giác mượt mà hơn
      if (startHandleRef.current) {
        startHandleRef.current.style.left = `${percentage}%`;
      }
      if (sliderRangeRef.current) {
        sliderRangeRef.current.style.left = `${percentage}%`;
        sliderRangeRef.current.style.width = `${(endTime / duration * 100) - percentage}%`;
      }
      
      setStartTime(Math.max(0, time));
    } else if (isDragging === 'end' && time > startTime) {
      // Cập nhật trực tiếp DOM trước khi cập nhật state
      if (endHandleRef.current) {
        endHandleRef.current.style.left = `${percentage}%`;
      }
      if (sliderRangeRef.current) {
        sliderRangeRef.current.style.width = `${percentage - (startTime / duration * 100)}%`;
      }
      
      setEndTime(Math.min(duration, time));
    }
  }, [isDragging, duration, startTime, endTime]);
  
  // Thêm useCallback để tối ưu hóa các handlers khác
  const handleMouseDown = useCallback((handle) => {
    setIsDragging(handle);
    document.body.style.userSelect = 'none'; // Ngăn chặn lựa chọn văn bản khi kéo
  }, []);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    document.body.style.userSelect = ''; // Khôi phục lựa chọn văn bản
  }, []);
  
  const handleWaveformClick = (e) => {
    if (!duration) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const time = (percentage / 100) * duration;
    
    // Ensure the clicked time is within the selected range
    const newTime = Math.max(startTime, Math.min(endTime, time));
    setCurrentTime(newTime);
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };
  
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const trimAudio = async () => {
    if (!audioFile || !duration) return;
    
    try {
      setProcessing(true);
      setProgress(0);
      
      // Simulate processing with progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Create a new AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Fetch file as ArrayBuffer
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode the audio file
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Calculate start and end samples
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const frameCount = endSample - startSample;
      
      // Create a new buffer for the trimmed audio
      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        frameCount,
        sampleRate
      );
      
      // Copy the portion we want from the original buffer
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        
        for (let i = 0; i < frameCount; i++) {
          trimmedData[i] = channelData[startSample + i];
        }
      }
      
      // Convert the trimmed buffer to WAV
      const trimmedWav = bufferToWav(trimmedBuffer);
      
      // Create a Blob from the WAV
      const blob = new Blob([trimmedWav], { type: audioFile.type });
      
      // Create a File object with the original name
      const fileName = audioFile.name.replace(/\.[^/.]+$/, "") + "_trimmed." + audioFile.name.split('.').pop();
      const newTrimmedFile = new File([blob], fileName, { type: audioFile.type });
      
      // Create URL for download
      const url = URL.createObjectURL(blob);
      setTrimmedUrl(url);
      setTrimmedFile(newTrimmedFile);
      
      // Finish progress
      setProgress(100);
      
      // Call the callback with the trimmed file
      onSaveTrimmed(newTrimmedFile);
      
      // Clean up interval
      clearInterval(interval);
      
      // Reset progress after a delay
      setTimeout(() => {
        setProcessing(false);
        setProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Error trimming audio:', error);
      setProcessing(false);
      setProgress(0);
    }
  };
  
  // Convert AudioBuffer to WAV format
  const bufferToWav = (buffer) => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const sampleRate = buffer.sampleRate;
    
    // Create the buffer for the WAV file
    const wavBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(wavBuffer);
    
    // Write the WAV container
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 32 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChannels * 2, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    // Write the PCM audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const sampleIndex = offset + (i * numOfChannels + channel) * 2;
        
        // Convert float to 16-bit PCM
        const int16Sample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(sampleIndex, int16Sample, true);
      }
    }
    
    return wavBuffer;
  };
  
  // Utility to write a string to a DataView
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // Thêm xử lý phòng khi Web Audio API không hoạt động
  useEffect(() => {
    // Tạo waveform đơn giản sau khi component mount
    const timer = setTimeout(() => {
      // Kiểm tra xem đã có waveform thông qua Web Audio API chưa
      if (canvasRef.current && !sourceRef.current) {
        console.log('AudioTrimmer: Không thể tạo waveform qua Web Audio API, sử dụng fallback');
        createSimpleWaveform();
      }
    }, 1000); // Chờ 1 giây sau khi component mount
    
    return () => clearTimeout(timer);
  }, []);

  // Hàm xử lý tải xuống file đã cắt
  const handleDownload = () => {
    if (!trimmedUrl || !trimmedFile) {
      toast.error('Vui lòng cắt audio/video trước khi tải xuống', {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }
    
    const a = document.createElement('a');
    a.href = trimmedUrl;
    a.download = trimmedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Đang tải xuống...', {
      position: "top-right",
      autoClose: 2000
    });
  };

  // Thêm handler cho sự kiện di chuột toàn cục
  useEffect(() => {
    const globalMouseMoveHandler = (e) => {
      if (isDragging && sliderTrackRef.current) {
        const rect = sliderTrackRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const time = (percentage / 100) * duration;
        
        // Xử lý tương tự như handleMouseMove nhưng cho sự kiện toàn cục
        if (isDragging === 'start' && time < endTime) {
          if (startHandleRef.current) {
            startHandleRef.current.style.left = `${percentage}%`;
          }
          if (sliderRangeRef.current) {
            sliderRangeRef.current.style.left = `${percentage}%`;
            sliderRangeRef.current.style.width = `${(endTime / duration * 100) - percentage}%`;
          }
          
          setStartTime(Math.max(0, time));
        } else if (isDragging === 'end' && time > startTime) {
          if (endHandleRef.current) {
            endHandleRef.current.style.left = `${percentage}%`;
          }
          if (sliderRangeRef.current) {
            sliderRangeRef.current.style.width = `${percentage - (startTime / duration * 100)}%`;
          }
          
          setEndTime(Math.min(duration, time));
        }
      }
    };
    
    const globalMouseUpHandler = () => {
      handleMouseUp();
    };
    
    if (isDragging) {
      // Thêm sự kiện toàn cục khi đang kéo
      document.addEventListener('mousemove', globalMouseMoveHandler);
      document.addEventListener('mouseup', globalMouseUpHandler);
    }
    
    return () => {
      // Loại bỏ sự kiện toàn cục khi cleanup
      document.removeEventListener('mousemove', globalMouseMoveHandler);
      document.removeEventListener('mouseup', globalMouseUpHandler);
    };
  }, [isDragging, duration, startTime, endTime, handleMouseUp]);

  return (
    <TrimmerContainer>
      <h4>Cắt Audio/Video</h4>
      
      <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
      
      <WaveformContainer onClick={handleWaveformClick}>
        <Waveform>
          <WaveCanvas ref={canvasRef} width="1000" height="100" />
        </Waveform>
        <TimeIndicator position={(currentTime / duration) * 100 || 0} />
      </WaveformContainer>
      
      <RangeSlider 
        ref={sliderTrackRef}
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseUp}
      >
        <SliderTrack />
        <SliderRange 
          ref={sliderRangeRef}
          start={(startTime / duration) * 100 || 0} 
          end={(endTime / duration) * 100 || 100} 
        />
        <SliderHandle 
          ref={startHandleRef}
          position={(startTime / duration) * 100 || 0} 
          onMouseDown={() => handleMouseDown('start')} 
        />
        <SliderHandle 
          ref={endHandleRef}
          position={(endTime / duration) * 100 || 100} 
          onMouseDown={() => handleMouseDown('end')} 
        />
      </RangeSlider>
      
      <TimeDisplay>
        <span>{formatTime(startTime)}</span>
        <span>{formatTime(endTime)}</span>
      </TimeDisplay>
      
      <Row className="mt-3">
        <Col xs={6} sm={3}>
          <Form.Group>
            <Form.Label>Thời gian bắt đầu</Form.Label>
            <TimeInput 
              type="number" 
              step="0.1" 
              min="0" 
              max={endTime} 
              value={startTime.toFixed(1)} 
              onChange={handleStartTimeChange} 
            />
          </Form.Group>
        </Col>
        <Col xs={6} sm={3}>
          <Form.Group>
            <Form.Label>Thời gian kết thúc</Form.Label>
            <TimeInput 
              type="number" 
              step="0.1" 
              min={startTime} 
              max={duration} 
              value={endTime.toFixed(1)} 
              onChange={handleEndTimeChange} 
            />
          </Form.Group>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Group>
            <Form.Label>Độ dài đã chọn</Form.Label>
            <TimeInput 
              type="text" 
              value={`${formatTime(endTime - startTime)} (${((endTime - startTime) / duration * 100).toFixed(1)}%)`} 
              readOnly 
            />
          </Form.Group>
        </Col>
      </Row>
      
      <ControlsContainer>
        <Button 
          variant={isPlaying ? "danger" : "primary"} 
          onClick={togglePlayPause}
        >
          {isPlaying ? <><FaPause /> Tạm dừng</> : <><FaPlay /> Phát</>}
        </Button>
        
        <Button 
          variant="success" 
          onClick={trimAudio}
          disabled={processing || startTime === 0 && endTime === duration}
        >
          <FaCut /> Cắt audio
        </Button>
        
        <Button 
          variant="info" 
          onClick={handleDownload}
          disabled={!trimmedUrl}
        >
          <FaDownload /> Tải xuống
        </Button>
      </ControlsContainer>
      
      {processing && (
        <div className="mt-3">
          <ProgressBar 
            animated 
            now={progress} 
            label={`${progress}%`} 
          />
          <p className="text-center mt-2">Đang xử lý...</p>
        </div>
      )}
    </TrimmerContainer>
  );
};

export default AudioTrimmer; 