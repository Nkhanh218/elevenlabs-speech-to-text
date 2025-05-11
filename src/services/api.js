import axios from 'axios';

const API_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

/**
 * Gửi file âm thanh lên ElevenLabs API để chuyển đổi thành văn bản
 * @param {File} audioFile - File âm thanh cần chuyển đổi
 * @param {string} apiKey - API key của ElevenLabs
 * @param {Object} options - Các tùy chọn bổ sung cho API
 * @returns {Promise} Kết quả chuyển đổi
 */
export const convertSpeechToText = async (audioFile, apiKey, options = {}) => {
  console.log('Bắt đầu chuyển đổi với API key:', apiKey ? apiKey.substring(0, 5) + '...' : 'Không có');
  
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model_id', options.modelId || 'scribe_v1');
  
  if (options.languageCode) {
    formData.append('language_code', options.languageCode);
    console.log('Sử dụng ngôn ngữ:', options.languageCode);
  }
  
  if (options.numSpeakers) {
    formData.append('num_speakers', options.numSpeakers);
  } else {
    formData.append('num_speakers', '20');
  }
  
  if (options.timestampsGranularity) {
    formData.append('timestamps_granularity', options.timestampsGranularity);
  }
  
  formData.append('diarize', 'true');
  formData.append('tag_audio_events', (options.tagAudioEvents !== undefined ? options.tagAudioEvents : true).toString());

  console.log('File được gửi:', {
    name: audioFile.name,
    type: audioFile.type,
    size: audioFile.size + ' bytes',
  });

  try {
    console.log('Gửi request đến ElevenLabs API:', API_URL);
    
    const config = {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey.trim()
      }
    };
    
    console.log('Headers được thiết lập:', {
      'Accept': 'application/json',
      'xi-api-key': apiKey ? `${apiKey.substring(0, 5)}...` : 'Không có'
    });
    
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }
    
    const response = await axios.post(API_URL, formData, config);
    
    console.log('Phản hồi thành công từ API:', response.status);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gọi API Speech-to-Text:', error);
    
    if (error.response) {
      console.error('Mã lỗi:', error.response.status);
      console.error('Dữ liệu lỗi:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('Lỗi xác thực (401) - API key không hợp lệ hoặc không được cung cấp');
        console.error('Vui lòng kiểm tra API key tại trang: https://elevenlabs.io/app/account');
      } else if (error.response.status === 400) {
        console.error('Lỗi định dạng request (400) - Kiểm tra tham số gửi đi');
      }
    } else if (error.request) {
      console.error('Không nhận được phản hồi từ server');
    } else {
      console.error('Lỗi cấu hình request:', error.message);
    }
    
    throw error;
  }
}; 