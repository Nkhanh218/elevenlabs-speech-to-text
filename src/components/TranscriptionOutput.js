import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Card, Button, Spinner, Badge, Form, Row, Col, Toast } from 'react-bootstrap';
import { FaCopy, FaDownload, FaCheck, FaUser, FaUserFriends, FaEdit, FaSave, FaFont, FaHighlighter, FaRegTimesCircle, FaPlay, FaPause, FaVolumeUp, FaExpand, FaExclamationTriangle, FaFilter, FaAngleUp, FaAngleDown } from 'react-icons/fa';

const OutputContainer = styled.div`
  background-color: #1e1e2e;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
  min-height: 300px;
  display: flex;
  flex-direction: column;
`;

const TranscriptionText = styled.div`
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  background-color: #2d2d42;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  font-size: ${props => props.fontSize || '1.1rem'};
  line-height: 1.6;
  color: #f1f1f2;
  flex-grow: 1;
`;

const EditableTranscriptionText = styled.textarea`
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  background-color: #2d2d42;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  font-size: ${props => props.fontSize || '1.1rem'};
  line-height: 1.6;
  color: #f1f1f2;
  width: 100%;
  border: 1px solid #6c5ce7;
  resize: vertical;
  min-height: 300px;
  flex-grow: 1;
`;

const WordSpan = styled.span`
  background-color: ${props => 
    props.isCurrentlyPlaying 
      ? 'rgba(255, 152, 0, 0.5)'  /* Màu nổi bật hơn cho từ đang phát */
      : props.highlighted 
        ? 'rgba(108, 92, 231, 0.3)' 
        : props.speakerHighlight || 'transparent'
  };
  padding: 2px 4px;  /* Thêm padding để rõ hơn */
  margin: 0 1px;     /* Tạo khoảng cách giữa các từ */
  border-radius: 3px;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: ${props => props.isCurrentlyPlaying ? '0 0 0 2px rgba(255, 152, 0, 0.7)' : 'none'};
  font-weight: ${props => props.isCurrentlyPlaying ? 'bold' : 'normal'};  /* In đậm từ đang phát */
  
  &:hover {
    background-color: rgba(108, 92, 231, 0.3);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
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

const ControlPanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #2d2d42;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SpeakerFilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const SpeakerFilterButton = styled(Button)`
  background-color: ${props => props.isActive ? props.color : 'transparent'};
  border-color: ${props => props.color};
  opacity: ${props => props.isActive ? 1 : 0.7};
  
  &:hover {
    background-color: ${props => props.color};
    opacity: 1;
  }
`;

// Thêm các styled-components mới để hiển thị theo kiểu hội thoại
const DialogueContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const SpeakerSegment = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: ${props => props.showBorder ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'};
`;

const SpeakerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
`;

const SpeakerContent = styled.div`
  flex-grow: 1;
`;

const SpeakerName = styled.div`
  font-weight: bold;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SpeakerText = styled.div`
  margin: 0.5rem 0;
  line-height: 1.6;
  font-size: ${props => props.fontSize || '1.1rem'};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: ${props => props.isCurrentlyPlaying ? 'rgba(255, 152, 0, 0.1)' : 'transparent'};
  border-left: ${props => props.isCurrentlyPlaying ? '3px solid rgba(255, 152, 0, 0.7)' : 'none'};
  
  &:hover {
    background-color: rgba(108, 92, 231, 0.05);
  }
`;

const TimeRange = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.3rem;
`;

const DisplayOptions = styled.div`
  display: flex;
  margin-top: 1rem;
  gap: 1rem;
`;

const DisplayOption = styled(Button)`
  font-size: 0.85rem;
`;

// Thêm styled-components cho trình phát âm thanh
const AudioPlayerContainer = styled.div`
  background-color: #2d2d42;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  width: 100%;
`;

const AudioControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const PlayButton = styled(Button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
`;

const TimeDisplay = styled.div`
  font-size: 0.9rem;
  color: #f1f1f2;
  min-width: 80px;
`;

const ProgressBarContainer = styled.div`
  flex-grow: 1;
  background-color: rgba(255, 255, 255, 0.1);
  height: 6px;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
`;

const ProgressBar = styled.div`
  background-color: #6c5ce7;
  height: 100%;
  border-radius: 3px;
  width: ${props => props.progress || '0%'};
  transition: width 0.1s ease; /* Thêm hiệu ứng chuyển động mượt mà */
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VolumeSlider = styled.input`
  -webkit-appearance: none;
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #6c5ce7;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #6c5ce7;
    cursor: pointer;
  }
`;

// Thêm styled-components cho chế độ toàn màn hình
const FullscreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: #1e1e2e;
  z-index: 9999;
  overflow: hidden;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
`;

const FullscreenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2d2d42;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const FullscreenCloseButton = styled(Button)`
  position: absolute;
  right: 1rem;
  top: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 10000;
`;

const FullscreenContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 2rem;
  height: calc(100vh - 220px);
  width: 100%;
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
`;

// Thêm styled component cho nút ẩn hiện
const FilterToggleButton = styled(Button)`
  position: absolute;
  right: 1rem;
  top: 1rem;
  background-color: #2d2d42;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  z-index: 10;
  width: 32px;
  height: 32px;
  
  &:hover {
    background-color: #3c3c57;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  max-height: ${props => props.isVisible ? '1000px' : '0'};
  opacity: ${props => props.isVisible ? '1' : '0'};
  overflow: hidden;
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
`;

const TranscriptionOutput = ({ 
  transcription, 
  loading, 
  error,
  audioUrl // URL của file âm thanh đã tải lên
}) => {
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [fontSize, setFontSize] = useState('1.1rem');
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSpeakers, setFilteredSpeakers] = useState([]);
  const [speakerColors, setSpeakerColors] = useState({});
  const [displayMode, setDisplayMode] = useState('dialogue'); // 'words' hoặc 'dialogue'
  const [isFullscreen, setIsFullscreen] = useState(false); // State cho chế độ toàn màn hình
  
  // State cho audio player
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1); // Thêm state lưu trữ từ hiện tại đang phát
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1); // Thêm state lưu trữ đoạn hiện tại đang phát
  
  // Thêm state cho việc chỉnh sửa tên các speaker
  const [speakerNames, setSpeakerNames] = useState({});
  const [editingSpeakerId, setEditingSpeakerId] = useState(null);
  const [editingSpeakerName, setEditingSpeakerName] = useState('');
  
  // Thêm state để lưu transcription đã được chỉnh sửa
  const [editedTranscription, setEditedTranscription] = useState(null);
  
  const textAreaRef = useRef(null);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const fullscreenContentRef = useRef(null);
  const transcriptionTextRef = useRef(null);
  const wordRefs = useRef({}); // Thêm refs cho từng từ để cuộn đến vị trí tương ứng
  const segmentRefs = useRef({}); // Thêm refs cho từng đoạn để cuộn đến vị trí tương ứng
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Thêm state cho việc ẩn/hiện phần lọc
  const [showFilters, setShowFilters] = useState(true);

  // Tất cả các useEffect hooks phải được đặt ở đầu component
  // trước bất kỳ lệnh return nào
  useEffect(() => {
    if (transcription) {
      // Khởi tạo editedTranscription khi transcription thay đổi
      setEditedTranscription(transcription);
      setEditedText(transcription.text);
      
      // Extract unique speakers
      if (transcription.words && transcription.words.length > 0) {
        const speakers = [...new Set(transcription.words
          .filter(word => word.speaker_id)
          .map(word => word.speaker_id))];
        
        // Generate colors for speakers
        const colors = {};
        const colorPalette = ['rgba(108, 92, 231, 0.2)', 'rgba(232, 67, 147, 0.2)', 'rgba(0, 184, 148, 0.2)', 
                             'rgba(253, 203, 110, 0.2)', 'rgba(225, 112, 85, 0.2)'];
        
        // Thêm màu mặc định cho trường hợp không có speaker_id
        colors['unknown'] = 'rgba(150, 150, 150, 0.2)';
        
        speakers.forEach((speaker, index) => {
          colors[speaker] = colorPalette[index % colorPalette.length];
          // Khởi tạo tên mặc định cho speaker
          if (!speakerNames[speaker]) {
            speakerNames[speaker] = `Người ${speaker.replace('speaker_', '')}`;
          }
        });
        
        setSpeakerColors(colors);
        setSpeakerNames(prevNames => {
          const newNames = {...prevNames};
          speakers.forEach(speaker => {
            if (!newNames[speaker]) {
              newNames[speaker] = `Người ${speaker.replace('speaker_', '')}`;
            }
          });
          return newNames;
        });
      }
    }
  }, [transcription]);
  
  // Xử lý sự kiện cho audio player
  useEffect(() => {
    const audio = audioRef.current;
    
    // Kiểm tra nếu audio player đã được tải
    if (!audio) return;
    
    // Xử lý sự kiện
    const setAudioData = () => {
      setDuration(audio.duration);
    };
    
    const setAudioTime = () => {
      try {
        // Cập nhật thời gian hiện tại
        setCurrentTime(audio.currentTime);
        
        // Cập nhật thanh tiến trình ngay lập tức
        const progressBarElement = progressBarRef.current?.querySelector('div');
        if (progressBarElement && duration > 0) {
          const percentage = (audio.currentTime / duration) * 100;
          progressBarElement.style.width = `${percentage}%`;
        }
        
        // Tìm từ hiện tại dựa trên thời gian phát
        if (transcription && transcription.words && transcription.words.length > 0) {
          // Tìm từ có khoảng thời gian chứa thời điểm hiện tại
          const currentWord = findWordIndexAtTime(audio.currentTime);
          
          if (currentWord !== -1 && currentWord !== currentWordIndex) {
            setCurrentWordIndex(currentWord);
            
            // Ghi log debug thông tin từ hiện tại
            const word = transcription.words[currentWord];
            if (word) {
              const timeInfo = word.start !== undefined 
                ? `${word.start}s-${word.end}s` 
                : (word.time !== undefined ? `${word.time}s` : 'không có thời gian');
              console.log(`Đang phát từ "${word.text}" tại ${timeInfo}`);
            }
            
            // Cuộn đến từ hiện tại nếu ở chế độ hiển thị từng từ
            if (displayMode === 'words' && wordRefs.current[currentWord]) {
              try {
                wordRefs.current[currentWord].scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center',
                  inline: 'nearest' 
                });
              } catch (err) {
                console.error("Lỗi khi cuộn đến từ hiện tại:", err);
              }
            }
          }
          
          // Xác định đoạn hiện tại đang phát (cho chế độ dialogue)
          const currentSegment = findSegmentIndexAtTime(audio.currentTime);
          
          if (currentSegment !== -1 && currentSegment !== currentSegmentIndex) {
            setCurrentSegmentIndex(currentSegment);
            
            // Cuộn đến đoạn hiện tại nếu ở chế độ hiển thị hội thoại
            if (displayMode === 'dialogue' && segmentRefs.current[currentSegment]) {
              try {
                segmentRefs.current[currentSegment].scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center',
                  inline: 'nearest' 
                });
              } catch (err) {
                console.error("Lỗi khi cuộn đến đoạn hiện tại:", err);
              }
            }
          }
        }
      } catch (error) {
        console.error("Lỗi trong hàm setAudioTime:", error);
      }
    };
    
    const setAudioEnd = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setCurrentSegmentIndex(-1);
    };
    
    const setAudioPlay = () => {
      setIsPlaying(true);
    };
    
    const setAudioPause = () => {
      setIsPlaying(false);
    };
    
    // Đăng ký các sự kiện
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', setAudioEnd);
    audio.addEventListener('play', setAudioPlay);
    audio.addEventListener('pause', setAudioPause);
    
    // Cleanup sự kiện khi component bị hủy
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', setAudioEnd);
      audio.removeEventListener('play', setAudioPlay);
      audio.removeEventListener('pause', setAudioPause);
    };
  }, [audioRef, transcription, displayMode, duration, currentWordIndex, currentSegmentIndex]);
  
  // Xử lý khi component bị unmount, đảm bảo trả lại scroll cho body
  useEffect(() => {
    // Cleanup function để đảm bảo trả lại scroll bình thường khi unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Reset current word/segment index when changing display mode
  useEffect(() => {
    setCurrentWordIndex(-1);
    setCurrentSegmentIndex(-1);
  }, [displayMode]);
  
  // Hàm xử lý bật/tắt chế độ toàn màn hình
  const toggleFullscreen = () => {
    try {
      // Đảm bảo dữ liệu có tồn tại trước khi chuyển sang chế độ toàn màn hình
      if (!transcription && !isFullscreen) {
        console.error('Không thể mở toàn màn hình: Thiếu dữ liệu transcription');
        return;
      }
      
      // Chuyển đổi trạng thái fullscreen
      setIsFullscreen(prevState => !prevState);
      
      // Xử lý scroll cho body
      if (!isFullscreen) {
        document.body.style.overflow = 'hidden'; // Ngăn scroll khi ở chế độ fullscreen
        
        // Khi chuyển sang chế độ toàn màn hình, đảm bảo scroll lên đầu nội dung
        // Sử dụng timeout để đảm bảo DOM đã cập nhật
        setTimeout(() => {
          if (fullscreenContentRef.current) {
            fullscreenContentRef.current.scrollTop = 0;
          }
        }, 200);
      } else {
        document.body.style.overflow = ''; // Trả lại scroll bình thường
      }
      
      // Cập nhật lại kích thước nếu có audio player
      if (audioRef.current) {
        setTimeout(() => {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }, 300);
      }
    } catch (error) {
      console.error('Lỗi khi chuyển đổi chế độ toàn màn hình:', error);
      // Đảm bảo trạng thái body được khôi phục
      document.body.style.overflow = '';
    }
  };

  // Hook effect để cập nhật thanh tiến trình khi currentTime hoặc duration thay đổi
  useEffect(() => {
    // Cập nhật thanh tiến trình ngay lập tức
    const progressBarElement = progressBarRef.current?.querySelector('div');
    if (progressBarElement && duration > 0) {
      const percentage = (currentTime / duration) * 100;
      progressBarElement.style.width = `${percentage}%`;
    }
  }, [currentTime, duration]);

  // Thêm logs để debug
  useEffect(() => {
    if (editedTranscription) {
      console.log("editedTranscription đã được cập nhật:", 
        editedTranscription.text ? 
        editedTranscription.text.substring(0, 100) + "..." : 
        "không có văn bản");
    }
  }, [editedTranscription]);

  // Thêm useEffect để log và kiểm tra khi editedTranscription thay đổi
  useEffect(() => {
    if (editedTranscription) {
      console.log("editedTranscription đã được cập nhật:", 
        editedTranscription.text ? 
        editedTranscription.text.substring(0, 100) + "..." : 
        "không có văn bản");
        
      // Cập nhật dữ liệu hiển thị cho người dùng
      if (!editMode) {
        // Force re-render bằng cách cập nhật một state liên quan
        if (displayMode === 'words') {
          setHighlightedWords([]); // Reset highlighted words
        } else {
          // Nếu đang ở chế độ dialogue, cập nhật segment hiện tại
          setCurrentSegmentIndex(-1);
        }
      }
    }
  }, [editedTranscription, editMode, displayMode]);

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
    const textToCopy = editMode ? editedText : (editedTranscription ? editedTranscription.text : transcription.text);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Không thể sao chép vào clipboard:', err);
      });
  };
  
  const downloadTranscription = () => {
    // Tạo nội dung định dạng theo người nói và thời gian
    let textToDownload = ''; 
    
    if (displayMode === 'dialogue' || editMode) {
      // Nếu đang ở chế độ chỉnh sửa, sử dụng văn bản đã chỉnh sửa
      if (editMode) {
        textToDownload = editedText;
      } else {
        // Tạo định dạng theo người nói và thời gian từ các segments
        const segments = getSegments();
        textToDownload = segments.map(segment => {
          const speakerId = segment.speaker_id || 'unknown';
          // Sử dụng tên đã chỉnh sửa từ speakerNames thay vì "Người X" cố định
          const speakerName = speakerNames[speakerId] || `Người ${speakerId.replace('speaker_', '')}`;
          const timeRange = `${formatTime(segment.start)} - ${formatTime(segment.end)}`;
          return `${speakerName} ${timeRange}\n${segment.text}\n\n`;
        }).join('');
      }
    } else {
      // Sử dụng văn bản thô nếu đang ở chế độ hiển thị từng từ
      textToDownload = editedTranscription ? editedTranscription.text : transcription.text;
    }
    
    // Tạo metadata ở đầu file
    const currentTranscription = editedTranscription || transcription;
    const metadata = [
      '================================================',
      'THÔNG TIN CHUYỂN ĐỔI',
      '================================================',
      `Ngôn ngữ: ${currentTranscription.language_code?.toUpperCase() || 'Không xác định'}`,
      `Độ tin cậy: ${currentTranscription.language_probability ? Math.round(currentTranscription.language_probability * 100) + '%' : 'Không xác định'}`,
      `Thời lượng: ${formatTime(currentTranscription.audio_duration || 0)}`,
      `Thời gian tạo: ${new Date().toLocaleString('vi-VN')}`,
      '================================================\n\n'
    ].join('\n');
    
    // Kết hợp metadata và nội dung
    const finalContent = metadata + textToDownload;
    
    // Tạo và tải file
    const element = document.createElement('a');
    const file = new Blob([finalContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${new Date().toISOString()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const toggleEditMode = () => {
    if (!editMode) {
      // Chuyển sang chế độ chỉnh sửa
      setEditMode(true);
      
      // Chuẩn bị văn bản để chỉnh sửa dựa trên chế độ hiển thị hiện tại
      if (displayMode === 'dialogue') {
        // Nếu đang ở chế độ dialogue, tạo văn bản từ các segments đã lọc
        const segments = getSegments();
        const formattedText = segments.map(segment => {
          const speakerId = segment.speaker_id || 'unknown';
          const speakerName = speakerNames[speakerId] || `Người ${speakerId.replace('speaker_', '')}`;
          return `${speakerName}: ${segment.text}`;
        }).join('\n\n');
        
        setEditedText(formattedText);
      } else {
        // Nếu đang ở chế độ words, sử dụng văn bản gốc
        const currentText = editedTranscription ? editedTranscription.text : transcription.text;
        setEditedText(currentText);
      }
    } else {
      // Thoát khỏi chế độ chỉnh sửa mà không lưu
      setEditMode(false);
    }
  };
  
  // Tách renderTextWithHighlight thành hàm tiện ích riêng
  const renderTextWithHighlight = (text) => {
    if (!searchTerm || !text) return text;
    
    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return (
        <>
          {parts.map((part, i) => (
            part.toLowerCase() === searchTerm.toLowerCase() ? (
              <span 
                key={i}
                style={{
                  backgroundColor: 'rgba(255, 193, 7, 0.5)',
                  padding: '0 2px',
                  borderRadius: '3px',
                  fontWeight: 'bold'
                }}
              >
                {part}
              </span>
            ) : part
          ))}
        </>
      );
    } catch (error) {
      console.error('Lỗi khi highlight từ khóa:', error);
      return text;
    }
  };
  
  // Sửa đổi hàm saveEditedText để cập nhật rõ ràng hơn và thêm logs
  const saveEditedText = () => {
    try {
      console.log("Bắt đầu lưu văn bản đã chỉnh sửa...");
      
      // Tạo bản sao của transcription để cập nhật
      const updatedTranscription = JSON.parse(JSON.stringify(
        editedTranscription || transcription
      ));
      
      console.log("Văn bản gốc:", updatedTranscription.text ? updatedTranscription.text.substring(0, 50) + "..." : "không có");
      console.log("Văn bản mới:", editedText ? editedText.substring(0, 50) + "..." : "không có");
      
      // Cập nhật văn bản trong bản sao
      updatedTranscription.text = editedText;
      
      // Nếu đang ở chế độ dialogue, cần phân tích để cập nhật words
      if (displayMode === 'dialogue') {
        try {
          // Phân tích văn bản để cập nhật theo định dạng dialogue
          console.log("Lưu văn bản ở chế độ dialogue");
          
          // Nếu có words, cập nhật text cho words (đơn giản)
          if (updatedTranscription.words && updatedTranscription.words.length > 0) {
            const fullText = editedText.trim();
            updatedTranscription.text = fullText;
          }
        } catch (parseError) {
          console.error("Lỗi khi phân tích văn bản dialogue:", parseError);
        }
      } else {
        // Ở chế độ words, chỉ cần cập nhật text
        console.log("Lưu văn bản ở chế độ words");
      }
      
      console.log("Đã cập nhật văn bản thành:", updatedTranscription.text.substring(0, 50) + "...");
      
      // Đảm bảo các thành phần quan trọng của transcription được giữ lại
      if (transcription.language_code) {
        updatedTranscription.language_code = transcription.language_code;
      }
      if (transcription.language_probability) {
        updatedTranscription.language_probability = transcription.language_probability;
      }
      if (transcription.audio_duration) {
        updatedTranscription.audio_duration = transcription.audio_duration;
      }
      
      // Lưu bản sao đã cập nhật vào state bằng cách đợi state được cập nhật hoàn tất
      setEditedTranscription(updatedTranscription);
      
      // Thoát khỏi chế độ chỉnh sửa
      setEditMode(false);
      
      // Hiển thị thông báo thành công sau khi cập nhật state
      showToastMessage('Đã lưu văn bản chỉnh sửa');
      
      // Log để xác nhận cập nhật đã thành công
      console.log("Văn bản sau khi lưu:", updatedTranscription.text.substring(0, 50) + "...");
    } catch (error) {
      console.error('Lỗi khi lưu văn bản:', error);
      showToastMessage('Lỗi khi lưu văn bản: ' + error.message);
    }
  };
  
  const handleFontSizeChange = (e) => {
    setFontSize(e.target.value);
  };
  
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    
    // Làm tròn đến 2 chữ số thập phân
    const roundedSeconds = Math.round(seconds * 100) / 100;
    
    const mins = Math.floor(roundedSeconds / 60);
    const secs = Math.floor(roundedSeconds % 60);
    const ms = Math.floor((roundedSeconds % 1) * 100);
    
    // Hiển thị thêm mili giây
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Hàm xử lý nút phát/tạm dừng audio
  const onPlayPauseClick = () => {
    if (!audioRef.current) {
      showErrorToast("Không thể phát âm thanh: Không tìm thấy trình phát âm thanh");
      return;
    }
    
    try {
      if (isPlaying) {
        // Đang phát, cần tạm dừng
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Đang tạm dừng, cần phát
        const playPromise = audioRef.current.play();
        
        // Xử lý lỗi phát âm thanh (browser policy có thể yêu cầu tương tác người dùng)
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              console.log("Đã bắt đầu phát âm thanh");
            })
            .catch(error => {
              console.error("Không thể phát âm thanh:", error);
              showErrorToast(`Không thể phát âm thanh: ${error.message}`);
              setIsPlaying(false);
            });
        } else {
          // Một số trình duyệt cũ không trả về promise
          setIsPlaying(true);
        }
      }
    } catch (error) {
      showErrorToast(`Lỗi khi điều khiển phát/tạm dừng âm thanh: ${error.message}`);
      console.error("Error in onPlayPauseClick:", error);
    }
  };
  
  const onVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };
  
  const onProgressBarClick = (e) => {
    if (!audioRef.current || !duration || !progressBarRef.current) {
      showErrorToast("Không thể tương tác với thanh tiến trình: Trình phát âm thanh không sẵn sàng");
      return;
    }

    try {
      // Tính toán vị trí nhấp chuột
      const rect = progressBarRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const clickPositionRatio = offsetX / rect.width;
      
      // Tính thời gian mới
      const newTime = clickPositionRatio * duration;
      
      // Đặt thời gian hiện tại
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Cập nhật thanh tiến trình ngay lập tức
      const progressBarElement = progressBarRef.current?.querySelector('div');
      if (progressBarElement) {
        progressBarElement.style.width = `${(newTime / duration) * 100}%`;
      }
      
      // Tìm từ và đoạn tương ứng với thời gian mới
      const newWordIndex = findWordIndexAtTime(newTime);
      const newSegmentIndex = findSegmentIndexAtTime(newTime);
      
      // Cập nhật từ và đoạn hiện tại
      if (newWordIndex !== -1) {
        setCurrentWordIndex(newWordIndex);
        
        // Cuộn đến từ hiện tại
        if (wordRefs.current[newWordIndex]) {
          wordRefs.current[newWordIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
      
      if (newSegmentIndex !== -1) {
        setCurrentSegmentIndex(newSegmentIndex);
        
        // Nếu đang hiển thị theo kiểu đoạn hội thoại, cuộn đến đoạn hiện tại
        if (displayMode === 'dialogue' && segmentRefs.current[newSegmentIndex]) {
          segmentRefs.current[newSegmentIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    } catch (error) {
      showErrorToast(`Lỗi khi tương tác với thanh tiến trình: ${error.message}`);
      console.error("Error in onProgressBarClick:", error);
    }
  };
  
  // Hàm tìm từ dựa trên thời gian
  const findWordIndexAtTime = (time) => {
    if (!transcription.words || transcription.words.length === 0) return -1;
    
    // Tìm từ gần nhất với thời gian hiện tại
    for (let i = 0; i < transcription.words.length; i++) {
      const word = transcription.words[i];
      if (word.type === 'spacing') continue;
      
      const wordStart = word.start !== undefined ? word.start : (word.time !== undefined ? word.time : null);
      const wordEnd = word.end !== undefined ? word.end : (word.time !== undefined ? word.time + 0.3 : null);
      
      if (wordStart !== null && wordEnd !== null) {
        if (time >= wordStart && time <= wordEnd) {
          return i;
        }
      }
    }
    
    // Nếu không tìm thấy từ chính xác, tìm từ gần nhất
    const closestWordIndex = transcription.words
      .map((word, index) => {
        if (word.type === 'spacing') return { index, diff: Infinity };
        const wordTime = word.start !== undefined ? word.start : (word.time !== undefined ? word.time : null);
        if (wordTime === null) return { index, diff: Infinity };
        return { index, diff: Math.abs(wordTime - time) };
      })
      .sort((a, b) => a.diff - b.diff)[0]?.index || -1;
    
    return closestWordIndex;
  };
  
  // Hàm tìm đoạn dựa trên thời gian
  const findSegmentIndexAtTime = (time) => {
    const segments = getSegments();
    if (!segments || segments.length === 0) return -1;
    
    // Tìm đoạn chứa thời gian hiện tại
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (segment.start !== undefined && segment.end !== undefined) {
        if (time >= segment.start && time <= segment.end) {
          return i;
        }
      }
    }
    
    // Nếu không tìm thấy đoạn chính xác, tìm đoạn gần nhất
    const closestSegmentIndex = segments
      .map((segment, index) => {
        if (segment.start === undefined) return { index, diff: Infinity };
        return { index, diff: Math.abs(segment.start - time) };
      })
      .sort((a, b) => a.diff - b.diff)[0]?.index || -1;
    
    return closestSegmentIndex;
  };
  
  // Hàm hiển thị thông báo toast
  const showErrorToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Cải thiện hàm xử lý tìm kiếm
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term || !transcription || !transcription.words) {
      // Nếu xóa từ khóa tìm kiếm, xóa highlight
      setHighlightedWords([]);
      return;
    }
    
    try {
      // Tìm tất cả các từ khớp với term và highlight chúng
      const matchedWordIndices = [];
      const lowerTerm = term.toLowerCase();
      
      // Tìm trong từng từ
      transcription.words.forEach((word, index) => {
        if (word.text && word.text.toLowerCase().includes(lowerTerm)) {
          matchedWordIndices.push(index);
        }
      });
      
      // Cập nhật danh sách từ được highlight
      setHighlightedWords(matchedWordIndices);
      
      // Cuộn đến từ đầu tiên khớp nếu có
      if (matchedWordIndices.length > 0 && displayMode === 'words' && wordRefs.current[matchedWordIndices[0]]) {
        setTimeout(() => {
          wordRefs.current[matchedWordIndices[0]]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
      
      // Tìm trong các đoạn và cuộn đến đoạn đầu tiên khớp nếu ở chế độ dialogue
      if (displayMode === 'dialogue') {
        const segments = getSegments();
        for (let i = 0; i < segments.length; i++) {
          if (segments[i].text && segments[i].text.toLowerCase().includes(lowerTerm)) {
            setTimeout(() => {
              segmentRefs.current[i]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }, 100);
            break;
          }
        }
      }
      
      // Log thông tin tìm kiếm
      console.log(`Tìm thấy ${matchedWordIndices.length} kết quả cho "${term}"`);
      
      // Hiển thị thông báo về số kết quả tìm thấy
      if (matchedWordIndices.length > 0) {
        showToastMessage(`Tìm thấy ${matchedWordIndices.length} kết quả cho "${term}"`);
      } else {
        showToastMessage(`Không tìm thấy kết quả nào cho "${term}"`);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      showToastMessage('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.');
    }
  };
  
  // Hàm hiển thị thông báo toast thông thường (không phải lỗi)
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  // Sửa hàm clearSearchAndFilters để cập nhật UI khi xóa tìm kiếm
  const clearSearchAndFilters = () => {
    setSearchTerm('');
    setFilteredSpeakers([]);
    setHighlightedWords([]);
    showToastMessage('Đã xóa tất cả bộ lọc và từ khóa tìm kiếm');
  };

  // Cải thiện renderWords để highlight tốt hơn các từ khớp với tìm kiếm
  const renderWords = () => {
    // Sử dụng transcription đã chỉnh sửa nếu có
    const currentTranscription = editedTranscription || transcription;
    
    if (!currentTranscription.words || currentTranscription.words.length === 0) {
      return currentTranscription.text;
    }
    
    return currentTranscription.words.map((word, index) => {
      if (word.type === 'spacing') {
        return ' ';
      }
      
      // Kiểm tra xem từ có khớp với searchTerm không
      const isMatchingSearch = searchTerm && 
                             word.text && 
                             word.text.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Kiểm tra xem từ có bị lọc theo speaker không
      const isSpeakerFiltered = word.speaker_id && filteredSpeakers.length > 0 && 
                              !filteredSpeakers.includes(word.speaker_id);
      
      // Tính toán màu nền dựa trên speaker
      const speakerHighlight = word.speaker_id ? speakerColors[word.speaker_id] : null;
      
      // Xác định thời gian của từ
      const wordStart = word.start !== undefined ? word.start : (word.time !== undefined ? word.time : null);
      const wordEnd = word.end !== undefined ? word.end : (word.time !== undefined ? word.time + 0.3 : null);
      
      // Hiển thị từ nếu không bị lọc
      if (!isSpeakerFiltered) {
        return (
          <WordSpan 
            key={index} 
            highlighted={highlightedWords.includes(index) || isMatchingSearch}
            speakerHighlight={speakerHighlight}
            isCurrentlyPlaying={index === currentWordIndex}
            onClick={() => handleWordClick(index)}
            ref={el => wordRefs.current[index] = el}
            title={wordStart ? `${formatTime(wordStart)} - ${formatTime(wordEnd || wordStart)}` : "Không có thông tin thời gian"}
            style={{
              backgroundColor: isMatchingSearch ? 'rgba(255, 193, 7, 0.3)' : undefined,
              padding: isMatchingSearch ? '0 3px' : undefined,
              borderRadius: isMatchingSearch ? '3px' : undefined
            }}
          >
            {word.speaker_id && <SpeakerLabel speaker={word.speaker_id}>
              <FaUser size={10} /> {word.speaker_id.replace('speaker_', '')}
            </SpeakerLabel>}
            {word.text}
            {wordStart !== null && 
              <TimestampBadge>{formatTime(wordStart)}</TimestampBadge>
            }
          </WordSpan>
        );
      }
      
      return null;
    });
  };

  // Cải thiện renderDialogue để highlight tốt hơn các đoạn khớp với tìm kiếm
  const renderDialogue = () => {
    // Sử dụng transcription đã chỉnh sửa nếu có
    const currentTranscription = editedTranscription || transcription;
    
    if (!currentTranscription.words || currentTranscription.words.length === 0) {
      // Nếu không có words, hiển thị văn bản thô
      return <div>{currentTranscription.text}</div>;
    }

    // Lấy segments từ dữ liệu hiện tại
    const segments = getSegments();
    
    // Kiểm tra lọc speaker
    const filteredSegments = segments.filter(segment => {
      if (filteredSpeakers.length === 0) return true;
      return segment.speaker_id && filteredSpeakers.includes(segment.speaker_id);
    });
    
    // Log để debug
    console.log(`Hiển thị ${filteredSegments.length} segments từ: ${currentTranscription === editedTranscription ? 'văn bản đã chỉnh sửa' : 'văn bản gốc'}`);
    
    // Hiển thị các segments
    return (
      <DialogueContainer>
        {filteredSegments.length > 0 ? (
          filteredSegments.map((segment, index) => {
            // Kiểm tra tìm kiếm
            const matchesSearch = searchTerm && 
                                segment.text && 
                                segment.text.toLowerCase().includes(searchTerm.toLowerCase());
            
            const speakerNum = segment.speaker_id ? segment.speaker_id.replace('speaker_', '') : 'U';
            const speakerColors = ['#6c5ce7', '#e84393', '#00b894', '#fdcb6e', '#e17055'];
            const avatarColor = speakerColors[parseInt(speakerNum) % speakerColors.length];
            
            // Kiểm tra xem đoạn này có đang phát không
            const isCurrentlyPlaying = index === currentSegmentIndex;
            
            return (
              <SpeakerSegment 
                key={index} 
                showBorder={index < filteredSegments.length - 1}
                ref={el => segmentRefs.current[index] = el}
              >
                <SpeakerAvatar color={avatarColor}>
                  {speakerNum}
                </SpeakerAvatar>
                
                <SpeakerContent>
                  <SpeakerNameComponent speakerId={segment.speaker_id} index={index} />
                  <TimeRange>
                    {segment.start !== undefined && segment.end !== undefined && 
                      `${formatTime(segment.start)} - ${formatTime(segment.end)}`}
                  </TimeRange>
                  
                  <SpeakerText 
                    fontSize={fontSize}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                    style={{
                      backgroundColor: matchesSearch 
                        ? 'rgba(255, 193, 7, 0.15)'
                        : isCurrentlyPlaying 
                          ? 'rgba(255, 152, 0, 0.1)' 
                          : 'transparent',
                      padding: matchesSearch || isCurrentlyPlaying ? '0.5rem' : '0',
                      borderRadius: matchesSearch || isCurrentlyPlaying ? '4px' : '0',
                      borderLeft: isCurrentlyPlaying ? '3px solid rgba(255, 152, 0, 0.7)' : 
                                matchesSearch ? '3px solid rgba(255, 193, 7, 0.7)' : 'none'
                    }}
                    onClick={() => handleSegmentClick(segment, index)}
                  >
                    {renderTextWithHighlight(segment.text)}
                  </SpeakerText>
                </SpeakerContent>
              </SpeakerSegment>
            );
          })
        ) : (
          // Hiển thị thông báo nếu không có segments nào
          <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
            {filteredSpeakers.length > 0 ? 
              'Không có đoạn nào khớp với bộ lọc người nói.' :
              'Không có đoạn hội thoại nào để hiển thị.'}
          </div>
        )}
      </DialogueContainer>
    );
  };
  
  // Lấy danh sách speakers từ transcription
  const speakers = transcription.words ? 
    [...new Set(transcription.words
      .filter(word => word.speaker_id)
      .map(word => word.speaker_id))] : [];
  
  // Thêm mảng màu mặc định để tránh lỗi khi speakerColors chưa được khởi tạo
  const defaultSpeakerColors = ['#6c5ce7', '#e84393', '#00b894', '#fdcb6e', '#e17055'];
  
  // Thêm lại hàm handleWordClick
  const handleWordClick = (index) => {
    if (!audioRef.current) {
      showErrorToast("Không thể phát âm thanh: Không tìm thấy trình phát âm thanh.");
      return;
    }

    try {
      const word = transcription.words[index];
      
      if (!word) {
        showErrorToast("Không thể phát âm thanh: Không tìm thấy từ đã chọn.");
        return;
      }
      
      // Lấy thời gian của từ
      const wordTime = word.start !== undefined ? word.start : (word.time !== undefined ? word.time : null);
      
      if (wordTime === null) {
        showErrorToast("Không thể phát âm thanh: Từ này không có thông tin thời gian.");
        return;
      }
      
      // Đặt thời gian hiện tại
      audioRef.current.currentTime = wordTime;
      
      // Phát audio
      if (!isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            showErrorToast(`Lỗi khi phát âm thanh: ${error.message}`);
          });
      }
      
      // Thiết lập phần trăm tiến trình
      if (duration > 0) {
        const percentage = (wordTime / duration) * 100;
        
        // Cập nhật thanh tiến trình ngay lập tức
        const progressBarElement = progressBarRef.current?.querySelector('div');
        if (progressBarElement) {
          progressBarElement.style.width = `${percentage}%`;
        }
      }
      
      // Cập nhật trạng thái
      setCurrentWordIndex(index);
      
      // Tìm đoạn chứa từ này
      const segmentIndex = getSegments().findIndex(segment => 
        wordTime >= segment.start && wordTime <= segment.end
      );
      
      if (segmentIndex !== -1) {
        setCurrentSegmentIndex(segmentIndex);
      }
      
      // Cuộn đến từ hiện tại
      if (wordRefs.current[index]) {
        wordRefs.current[index].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    } catch (error) {
      showErrorToast(`Lỗi khi xử lý sự kiện click từ: ${error.message}`);
      console.error("Error in handleWordClick:", error);
    }
  };
  
  // Thêm lại hàm getSegments với sự hỗ trợ cho editedTranscription
  const getSegments = () => {
    // Sử dụng transcription đã chỉnh sửa nếu có
    const currentTranscription = editedTranscription || transcription;
    
    if (!currentTranscription.words || currentTranscription.words.length === 0) {
      console.log("Không có words trong transcript để tạo segments");
      return [];
    }

    // Nhóm từ theo speaker và thời gian
    const segments = [];
    let currentSegment = null;
    let currentText = '';
    
    currentTranscription.words.forEach((word, index) => {
      // Bỏ qua khoảng trắng trong quá trình xử lý
      if (word.type === 'spacing') {
        currentText += ' ';
        return;
      }
      
      // Nếu người nói thay đổi hoặc khoảng cách thời gian quá lớn, tạo segment mới
      if (!currentSegment || 
          (word.speaker_id !== currentSegment.speaker_id)) {
        
        // Lưu segment hiện tại nếu có
        if (currentSegment) {
          segments.push({
            ...currentSegment,
            text: currentText.trim(),
            end: word.start ? word.start : currentSegment.end
          });
        }
        
        // Tạo segment mới
        currentSegment = {
          speaker_id: word.speaker_id || 'unknown',
          start: word.start,
          end: word.end,
          words: [index]
        };
        currentText = word.text;
      } else {
        // Thêm từ vào segment hiện tại
        currentSegment.words.push(index);
        currentSegment.end = word.end;
        currentText += (' ' + word.text);
      }
    });
    
    // Thêm segment cuối cùng
    if (currentSegment) {
      segments.push({
        ...currentSegment,
        text: currentText.trim()
      });
    }
    
    return segments;
  };
  
  // Thêm lại hàm handleSegmentClick
  const handleSegmentClick = (segment, index) => {
    if (!audioRef.current) {
      showErrorToast("Không thể phát âm thanh: Không tìm thấy trình phát âm thanh.");
      return;
    }

    if (segment.start === undefined || segment.end === undefined) {
      showErrorToast("Không thể phát âm thanh: Đoạn này không có thông tin thời gian.");
      return;
    }

    try {
      // Thời gian bắt đầu của đoạn
      const startTime = segment.start;
      
      // Đặt thời gian hiện tại
      audioRef.current.currentTime = startTime;
      
      // Phát audio
      if (!isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            showErrorToast(`Lỗi khi phát âm thanh: ${error.message}`);
          });
      }
      
      // Thiết lập phần trăm tiến trình
      if (duration > 0) {
        const percentage = (startTime / duration) * 100;
        
        // Cập nhật thanh tiến trình ngay lập tức
        const progressBarElement = progressBarRef.current?.querySelector('div');
        if (progressBarElement) {
          progressBarElement.style.width = `${percentage}%`;
        }
      }
      
      // Cập nhật trạng thái 
      setCurrentSegmentIndex(index);
      
      // Tìm từ đầu tiên trong đoạn này
      const firstWordIndex = transcription.words.findIndex(word => 
        (word.start !== undefined && word.start >= segment.start) || 
        (word.time !== undefined && word.time >= segment.start)
      );
      
      if (firstWordIndex !== -1) {
        setCurrentWordIndex(firstWordIndex);
      }
      
      // Cuộn đến đoạn hiện tại
      if (segmentRefs.current[index]) {
        segmentRefs.current[index].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    } catch (error) {
      showErrorToast(`Lỗi khi xử lý sự kiện click đoạn: ${error.message}`);
      console.error("Error in handleSegmentClick:", error);
    }
  };
  
  // Cập nhật lại hàm toggleSpeakerFilter - Thống nhất logic giữa các trang
  const toggleSpeakerFilter = (speakerId) => {
    console.log("Chọn lọc người nói:", speakerId, "Hiện tại:", filteredSpeakers);
    
    // Nếu speaker_id đã có trong danh sách lọc thì xóa đi, ngược lại thêm vào
    if (filteredSpeakers.includes(speakerId)) {
      setFilteredSpeakers(filteredSpeakers.filter(id => id !== speakerId));
    } else {
      setFilteredSpeakers([...filteredSpeakers, speakerId]);
    }
  };
  
  // Toggle hiển thị phần lọc
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Lấy segments từ hàm getSegments() để tránh lỗi segments is not defined
  const segments = getSegments();
    
  // Cập nhật phần lọc đoạn hội thoại cho cả hai trang - THỐNG NHẤT LOGIC GIỮA CÁC TRANG
  const getFilteredSegments = () => {
    // Lấy tất cả các segments
    const segments = getSegments();
    
    // Nếu không có lọc gì, trả về tất cả
    if (filteredSpeakers.length === 0) {
      return segments;
    }
    
    // Trả về các segments khớp với lọc speakers
    return segments.filter(segment => filteredSpeakers.includes(segment.speaker_id));
  };

  // Thêm hàm xử lý việc chỉnh sửa tên speaker
  const startEditSpeakerName = (speakerId) => {
    setEditingSpeakerId(speakerId);
    setEditingSpeakerName(speakerNames[speakerId] || `Người ${speakerId.replace('speaker_', '')}`);
  };
  
  const saveSpeakerName = () => {
    if (editingSpeakerId) {
      setSpeakerNames(prevNames => ({
        ...prevNames,
        [editingSpeakerId]: editingSpeakerName.trim() || `Người ${editingSpeakerId.replace('speaker_', '')}`
      }));
      setEditingSpeakerId(null);
      setEditingSpeakerName('');
      showToastMessage('Đã lưu tên người nói');
    }
  };
  
  const cancelEditSpeakerName = () => {
    setEditingSpeakerId(null);
    setEditingSpeakerName('');
  };

  // Cập nhật component SpeakerName để cho phép sửa tên
  const SpeakerNameComponent = ({ speakerId, index }) => {
    const speakerNum = speakerId ? speakerId.replace('speaker_', '') : 'U';
    const isEditing = speakerId === editingSpeakerId;
    
    return (
      <SpeakerName>
        {isEditing ? (
          <>
            <Form.Control
              type="text"
              value={editingSpeakerName}
              onChange={(e) => setEditingSpeakerName(e.target.value)}
              size="sm"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && saveSpeakerName()}
              style={{ width: '60%', display: 'inline-block' }}
            />
            <Button 
              variant="success" 
              size="sm" 
              onClick={saveSpeakerName}
              style={{ marginLeft: '5px' }}
            >
              <FaCheck />
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={cancelEditSpeakerName}
              style={{ marginLeft: '5px' }}
            >
              <FaRegTimesCircle />
            </Button>
          </>
        ) : (
          <>
            {speakerNames[speakerId] || `Người ${speakerNum}`}
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => startEditSpeakerName(speakerId)}
              style={{ padding: '0', marginLeft: '5px', color: '#84ffff' }}
            >
              <FaEdit />
            </Button>
          </>
        )}
      </SpeakerName>
    );
  };

  // Giao diện toàn màn hình
  if (isFullscreen) {
    return (
      <>
        <FullscreenContainer>
          <FullscreenHeader>
            <h2>Kết quả chuyển đổi</h2>
            <div className="d-flex align-items-center gap-3">
              <Badge bg="primary" className="me-2">
                {transcription.language_code?.toUpperCase() || 'N/A'}
              </Badge>
              {transcription.language_probability && (
                <Badge bg="info">
                  Độ tin cậy: {Math.round(transcription.language_probability * 100)}%
                </Badge>
              )}
            </div>
            <FullscreenCloseButton variant="danger" onClick={toggleFullscreen}>
              ×
            </FullscreenCloseButton>
          </FullscreenHeader>
          
          {/* Thêm nút ẩn/hiện phần lọc */}
          <div style={{ position: 'relative' }}>
            <FilterToggleButton 
              variant="secondary" 
              onClick={toggleFilters}
              title={showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              style={{ 
                right: '2rem', 
                top: '1rem',
                zIndex: 1001
              }}
            >
              {showFilters ? <FaAngleUp /> : <FaAngleDown />}
            </FilterToggleButton>
            
            {/* Phần bộ lọc có thể ẩn/hiện */}
            <FilterSection isVisible={showFilters} style={{ margin: '0 2rem', borderRadius: 0 }}>
              <ControlPanel style={{ margin: '0', borderRadius: '8px', transition: 'all 0.3s ease' }}>
            <Row className="w-100">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Tìm kiếm văn bản</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Nhập từ cần tìm..." 
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Kích thước chữ</Form.Label>
                  <Form.Select value={fontSize} onChange={handleFontSizeChange}>
                    <option value="0.9rem">Nhỏ</option>
                    <option value="1.1rem">Vừa</option>
                    <option value="1.3rem">Lớn</option>
                    <option value="1.5rem">Rất lớn</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Kiểu hiển thị</Form.Label>
                  <Form.Select 
                    value={displayMode} 
                    onChange={(e) => setDisplayMode(e.target.value)}
                  >
                    <option value="dialogue">Đoạn hội thoại</option>
                    <option value="words">Từng từ</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3} className="d-flex align-items-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={clearSearchAndFilters}
                  className="w-100"
                >
                  <FaRegTimesCircle /> Xóa tìm kiếm & lọc
                </Button>
              </Col>
            </Row>
            
            {speakers.length > 0 && (
              <SpeakerFilterContainer className="w-100">
                <span className="me-2">Lọc theo người nói:</span>
                {speakers.map((speaker, index) => {
                  const speakerNum = speaker.replace('speaker_', '');
                  const colors = ['#6c5ce7', '#e84393', '#00b894', '#fdcb6e', '#e17055'];
                  const color = colors[index % colors.length];
                      
                  // Trạng thái active phụ thuộc vào việc có trong danh sách lọc hay không
                  const isActive = filteredSpeakers.includes(speaker);
                  
                  // Sử dụng tên đã chỉnh sửa từ speakerNames
                  const speakerName = speakerNames[speaker] || `Người ${speakerNum}`;
                  
                  return (
                    <SpeakerFilterButton
                      key={speaker}
                      variant="outline-primary"
                      size="sm"
                      isActive={isActive}
                      color={color}
                      onClick={() => toggleSpeakerFilter(speaker)}
                    >
                      {speakerName}
                    </SpeakerFilterButton>
                  );
                })}
              </SpeakerFilterContainer>
            )}
          </ControlPanel>
            </FilterSection>
          </div>
          
          <FullscreenContent 
            ref={fullscreenContentRef}
            style={{
              height: showFilters ? 'calc(100vh - 220px - 170px)' : 'calc(100vh - 220px)',
              transition: 'height 0.3s ease'
            }}
          >
            {/* Hiển thị nội dung theo kiểu được chọn */}
            {displayMode === 'dialogue' ? (
              <DialogueContainer style={{ padding: '0 1rem' }}>
                {/* Hiển thị theo đoạn hội thoại có lọc theo người nói */}
                {getFilteredSegments().map((segment, index) => {
                  // Xác định speaker number và màu an toàn
                  const speakerNum = segment.speaker_id ? segment.speaker_id.replace('speaker_', '') : '?';
                  const speakerColorIndex = speakerNum !== '?' ? parseInt(speakerNum) % defaultSpeakerColors.length : 0;
                  const avatarColor = defaultSpeakerColors[speakerColorIndex];
                  
                  // Kiểm tra xem đoạn này có đang phát không
                  const isCurrentlyPlaying = index === currentSegmentIndex;
                  
                  return (
                    <SpeakerSegment 
                      key={index} 
                      showBorder={index < segments.length - 1}
                      ref={el => segmentRefs.current[index] = el}
                    >
                      <SpeakerAvatar color={avatarColor}>
                        {speakerNum}
                      </SpeakerAvatar>
                      
                      <SpeakerContent>
                        <SpeakerNameComponent speakerId={segment.speaker_id} index={index} />
                        <TimeRange>
                          {segment.start !== undefined && segment.end !== undefined && 
                            `${formatTime(segment.start)} - ${formatTime(segment.end)}`}
                        </TimeRange>
                        
                        <SpeakerText 
                          fontSize={fontSize}
                          isCurrentlyPlaying={isCurrentlyPlaying}
                          style={{
                            backgroundColor: isCurrentlyPlaying 
                              ? 'rgba(255, 152, 0, 0.1)' 
                              : 'transparent',
                            padding: isCurrentlyPlaying ? '0.5rem' : '0',
                            borderLeft: isCurrentlyPlaying ? '3px solid rgba(255, 152, 0, 0.7)' : 'none'
                          }}
                          onClick={() => handleSegmentClick(segment, index)}
                        >
                          {renderTextWithHighlight(segment.text)}
                        </SpeakerText>
                      </SpeakerContent>
                    </SpeakerSegment>
                  );
                })}
              </DialogueContainer>
            ) : (
              <TranscriptionText 
                fontSize={fontSize} 
                style={{ 
                  maxHeight: 'none', 
                  height: 'auto', 
                  margin: '1rem 0',
                  padding: '1rem',
                  background: 'transparent' 
                }}
                ref={transcriptionTextRef}
              >
                {/* Hiển thị từng từ riêng biệt */}
                {renderWords()}
              </TranscriptionText>
            )}
          </FullscreenContent>
          
          {/* Audio Player */}
          {audioUrl && (
            <AudioPlayerContainer style={{ margin: '0 2rem', borderRadius: 0, position: 'sticky', bottom: 0, zIndex: 1000 }}>
              <audio ref={audioRef} src={audioUrl} preload="metadata" />
              
              <AudioControlsContainer>
                <PlayButton 
                  variant={isPlaying ? "warning" : "primary"} 
                  onClick={onPlayPauseClick}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </PlayButton>
                
                <TimeDisplay>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </TimeDisplay>
                
                <ProgressBarContainer 
                  onClick={onProgressBarClick}
                  ref={progressBarRef}
                >
                  <ProgressBar 
                    progress={duration ? `${(currentTime / duration) * 100}%` : '0%'} 
                  />
                </ProgressBarContainer>
                
                <VolumeControl>
                  <FaVolumeUp />
                  <VolumeSlider 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume}
                    onChange={onVolumeChange}
                  />
                </VolumeControl>
              </AudioControlsContainer>
              
              <div className="text-center text-muted mt-2">
                <small>Nhấp vào bất kỳ từ hoặc đoạn văn bản nào để di chuyển đến thời điểm tương ứng</small>
              </div>
            </AudioPlayerContainer>
          )}
        </FullscreenContainer>
        
        {/* Toast notifications */}
        <ToastContainer>
          <Toast 
            show={showToast} 
            onClose={() => setShowToast(false)}
            delay={3000}
            autohide
            bg="danger"
          >
            <Toast.Header closeButton={true}>
              <FaExclamationTriangle className="me-2" />
              <strong className="me-auto">Lỗi phát âm thanh</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>
      </>
    );
  }

  // Giao diện bình thường (không phải toàn màn hình)
  return (
    <>
      <OutputContainer>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Kết quả chuyển đổi</h3>
          <div className="d-flex align-items-center">
            <div className="me-3">
              <Badge bg="primary" className="me-2">
                {(editedTranscription || transcription)?.language_code?.toUpperCase() || 'N/A'}
              </Badge>
              {(editedTranscription || transcription)?.language_probability && (
                <Badge bg="info">
                  Độ tin cậy: {Math.round((editedTranscription || transcription).language_probability * 100)}%
                </Badge>
              )}
            </div>
            {(editedTranscription || transcription) && !editMode && (
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={toggleFullscreen}
                className="d-flex align-items-center"
                style={{ height: '34px' }}
              >
                <FaExpand className="me-1" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Không hiển thị bộ lọc và tìm kiếm trong chế độ chỉnh sửa */}
        {!editMode && (
          <>
            {/* Nút ẩn/hiện phần lọc */}
            {((editedTranscription || transcription) && (editedTranscription || transcription).speakers && segments.length > 0) && (
              <FilterToggleButton 
                variant="secondary" 
                onClick={toggleFilters}
                title={showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              >
                {showFilters ? <FaAngleUp /> : <FaAngleDown />}
              </FilterToggleButton>
            )}
            
            {/* Phần bộ lọc có thể ẩn/hiện */}
            <FilterSection isVisible={showFilters}>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Tìm kiếm văn bản</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Nhập từ khóa..."
                      value={searchTerm}
                      onChange={handleSearch}
                      style={{ backgroundColor: '#2d2d42', color: '#f1f1f2', border: '1px solid #3c3c57' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Kích thước chữ</Form.Label>
                    <Form.Select
                      value={fontSize}
                      onChange={handleFontSizeChange}
                      style={{ backgroundColor: '#2d2d42', color: '#f1f1f2', border: '1px solid #3c3c57' }}
                    >
                      <option value="0.9rem">Nhỏ</option>
                      <option value="1.1rem">Vừa</option>
                      <option value="1.3rem">Lớn</option>
                      <option value="1.5rem">Rất lớn</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Kiểu hiển thị</Form.Label>
                    <Form.Select 
                      value={displayMode} 
                      onChange={(e) => setDisplayMode(e.target.value)}
                      style={{ backgroundColor: '#2d2d42', color: '#f1f1f2', border: '1px solid #3c3c57' }}
                    >
                      <option value="dialogue">Đoạn hội thoại</option>
                      <option value="words">Từng từ</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
                
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Lọc theo người nói:</strong>
                  <Button 
                    variant="link"
                    className="p-0"
                    onClick={clearSearchAndFilters}
                    style={{ color: '#a29bfe', textDecoration: 'none' }}
                  >
                    <FaRegTimesCircle className="me-1" /> Xóa tìm kiếm & lọc
                  </Button>
                </div>
                <SpeakerFilterContainer>
                  {speakers.map((speaker, idx) => {
                    const speakerColors = ['#6c5ce7', '#e84393', '#00b894', '#fdcb6e', '#e17055'];
                    const color = speakerColors[idx % speakerColors.length];
                    // Sử dụng tên đã chỉnh sửa từ speakerNames thay vì "Người X" cố định
                    const speakerName = speakerNames[speaker] || `Người ${speaker.replace('speaker_', '')}`;
                    return (
                      <SpeakerFilterButton
                        key={speaker}
                        variant="outline-primary"
                        size="sm"
                        color={color}
                        isActive={filteredSpeakers.includes(speaker)}
                        onClick={() => toggleSpeakerFilter(speaker)}
                      >
                        {speakerName}
                      </SpeakerFilterButton>
                    );
                  })}
                </SpeakerFilterContainer>
              </div>
            </FilterSection>
          </>
        )}
        
        {/* Content container với chiều cao lớn hơn nếu ẩn bộ lọc */}
        <div style={{ 
          maxHeight: editMode ? '600px' : (showFilters ? '400px' : '600px'),
          overflowY: 'auto',
          transition: 'max-height 0.3s ease',
          marginBottom: '1rem'
        }}>
          {/* Hiển thị chế độ chỉnh sửa */}
          {editMode ? (
            <EditableTranscriptionText
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              fontSize={fontSize}
              ref={textAreaRef}
              style={{
                backgroundColor: '#2d2d42',
                color: '#f1f1f2',
                border: '1px solid #6c5ce7',
                borderRadius: '8px',
                margin: '0 0 1rem 0'
              }}
              placeholder="Chỉnh sửa văn bản tại đây..."
            />
          ) : (
            // Render nội dung hiện tại, ưu tiên dùng dữ liệu đã chỉnh sửa
            displayMode === 'dialogue' ? (
              <DialogueContainer>
                {getFilteredSegments().map((segment, index) => {
                  // Xác định speaker number và màu an toàn
                  const speakerNum = segment.speaker_id ? segment.speaker_id.replace('speaker_', '') : '?';
                  const speakerColorIndex = speakerNum !== '?' ? parseInt(speakerNum) % defaultSpeakerColors.length : 0;
                  const avatarColor = defaultSpeakerColors[speakerColorIndex];
                  
                  // Kiểm tra xem đoạn này có đang phát không
                  const isCurrentlyPlaying = index === currentSegmentIndex;
                  // Kiểm tra tìm kiếm
                  const matchesSearch = searchTerm && 
                               segment.text && 
                               segment.text.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  return (
                    <SpeakerSegment key={`segment-${index}`} showBorder={index < segments.length - 1}>
                      <SpeakerAvatar color={avatarColor}>
                        {speakerNum}
                      </SpeakerAvatar>
                      <SpeakerContent>
                        <SpeakerNameComponent speakerId={segment.speaker_id} index={index} />
                        <TimeRange>
                          {formatTime(segment.start)} - {formatTime(segment.end)}
                        </TimeRange>
                        <SpeakerText 
                          fontSize={fontSize}
                          onClick={() => handleSegmentClick(segment, index)}
                          isCurrentlyPlaying={isCurrentlyPlaying}
                          style={{
                            backgroundColor: matchesSearch 
                              ? 'rgba(255, 193, 7, 0.15)'
                              : isCurrentlyPlaying 
                                ? 'rgba(255, 152, 0, 0.1)' 
                                : 'transparent',
                            padding: matchesSearch || isCurrentlyPlaying ? '0.5rem' : '0',
                            borderRadius: matchesSearch || isCurrentlyPlaying ? '4px' : '0',
                            borderLeft: isCurrentlyPlaying ? '3px solid rgba(255, 152, 0, 0.7)' : 
                                      matchesSearch ? '3px solid rgba(255, 193, 7, 0.7)' : 'none'
                          }}
                        >
                          {renderTextWithHighlight(segment.text)}
                        </SpeakerText>
                      </SpeakerContent>
                    </SpeakerSegment>
                  );
                })}
              </DialogueContainer>
            ) : (
              <TranscriptionText fontSize={fontSize}>
                {/* Hiển thị văn bản đã chỉnh sửa nếu là chế độ words đơn giản */}
                {!editedTranscription?.words || editedTranscription.words.length === 0 ? 
                  (editedTranscription?.text || transcription.text) :
                  renderWords()
                }
              </TranscriptionText>
            )
          )}
        </div>
        
        {/* Audio Player - Ẩn trong chế độ chỉnh sửa */}
        {audioUrl && !editMode && (
          <AudioPlayerContainer>
            <AudioControlsContainer>
              <PlayButton 
                variant={isPlaying ? "warning" : "primary"} 
                onClick={onPlayPauseClick}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </PlayButton>
              <TimeDisplay>
                {formatTime(currentTime)} / {formatTime(duration)}
              </TimeDisplay>
              <ProgressBarContainer onClick={onProgressBarClick} ref={progressBarRef}>
                <ProgressBar progress={`${(currentTime / duration) * 100}%`} />
              </ProgressBarContainer>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaVolumeUp />
                <Form.Range 
                  min={0} 
                  max={1} 
                  step={0.01} 
                  value={volume}
                  onChange={onVolumeChange}
                  style={{ width: '80px' }} 
                />
              </div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={toggleFullscreen}
              >
                <FaExpand />
              </Button>
            </AudioControlsContainer>
            <audio ref={audioRef} src={audioUrl} />
          </AudioPlayerContainer>
        )}
        
        <ButtonsContainer>
          <Button 
            variant="primary" 
            onClick={copyToClipboard}
          >
            {copied ? <FaCheck className="me-1" /> : <FaCopy className="me-1" />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </Button>
          <Button 
            variant="success" 
            onClick={downloadTranscription}
          >
            <FaDownload className="me-1" /> Tải xuống
          </Button>
          {!editMode ? (
            <Button 
              variant="warning" 
              onClick={toggleEditMode}
            >
              <FaEdit className="me-1" /> Chỉnh sửa
            </Button>
          ) : (
            <>
              <Button 
                variant="success" 
                onClick={saveEditedText}
              >
                <FaSave className="me-1" /> Lưu
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setEditMode(false)}
              >
                <FaRegTimesCircle className="me-1" /> Hủy
              </Button>
            </>
          )}
        </ButtonsContainer>
      </OutputContainer>
      
      {/* Toast notifications */}
      <ToastContainer>
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={toastMessage.includes('Lỗi') ? 'danger' : 'success'}
        >
          <Toast.Header closeButton={true}>
            {toastMessage.includes('Lỗi') ? (
              <FaExclamationTriangle className="me-2" />
            ) : (
              <FaCheck className="me-2" />
            )}
            <strong className="me-auto">
              {toastMessage.includes('Lỗi') ? 'Lỗi' : 'Thông báo'}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default TranscriptionOutput; 