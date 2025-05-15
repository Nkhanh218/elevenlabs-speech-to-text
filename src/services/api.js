import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://elevenlabs-backend.vercel.app/api';

// Tạo instance axios với cấu hình chung
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor cho request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API authentication
export const login = async (googleToken) => {
  try {
    const response = await api.post('/auth/google', { token: googleToken });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('elevenlabs_api_key');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    // Đảm bảo luôn có imageUrl cho avatar
    if (!user.imageUrl && user.picture) {
      user.imageUrl = user.picture;
    }
    return user;
  }
  return null;
};

// API key management
export const saveApiKey = async (apiKey) => {
  try {
    // Lưu API key vào localStorage
    localStorage.setItem('elevenlabs_api_key', apiKey);
    
    // Nếu người dùng đã đăng nhập, lưu vào database
    const token = localStorage.getItem('token');
    if (token) {
      const response = await api.post('/auth/apikey', { apiKey });
      console.log('API key saved to database:', response.data);
      return response.data;
    }
    
    return { success: true, message: 'API key saved locally' };
  } catch (error) {
    console.error('Error saving API key:', error);
    // Vẫn lưu vào localStorage ngay cả khi API gọi thất bại
    localStorage.setItem('elevenlabs_api_key', apiKey);
    return { success: true, message: 'API key saved locally', error: error.message };
  }
};

export const getApiKey = () => {
  // Đầu tiên, kiểm tra trong localStorage
  const localApiKey = localStorage.getItem('elevenlabs_api_key');
  if (localApiKey) {
    return localApiKey;
  }
  
  // Nếu không có trong localStorage, trả về null
  return null;
};

// Transcription services
export const uploadForTranscription = async (formData, onProgress) => {
  try {
    const response = await api.post('/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Chuyển đổi thất bại');
  }
};

export const getTranscriptHistory = async () => {
  try {
    const response = await api.get('/transcribe/history');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy lịch sử thất bại');
  }
};

export const getTranscriptDetail = async (id) => {
  try {
    const response = await api.get(`/transcribe/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy chi tiết bản ghi thất bại');
  }
};

export const deleteTranscript = async (id) => {
  try {
    const response = await api.delete(`/transcribe/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Xóa bản ghi thất bại');
  }
};

// ElevenLabs API proxy
export const transcribeWithElevenLabs = async (file, options = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình ElevenLabs API key. Vui lòng nhập API key của bạn.');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model_id', options.model_id || 'scribe_v1');
  
  if (options.diarize) {
    formData.append('diarize', 'true');
  }
  
  if (options.numSpeakers) {
    formData.append('num_speakers', options.numSpeakers.toString());
  }
  
  if (options.language_code) {
    formData.append('language_code', options.language_code);
  }
  
  try {
    // Gọi trực tiếp đến ElevenLabs API
    const response = await axios.post('https://api.elevenlabs.io/v1/speech-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'xi-api-key': apiKey,
      },
      onUploadProgress: (progressEvent) => {
        if (options.onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(percentCompleted);
        }
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('API key không hợp lệ. Vui lòng kiểm tra và cập nhật lại API key của bạn.');
    } else if (error.response && error.response.data) {
      throw new Error(`Lỗi từ ElevenLabs API: ${error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data)}`);
    }
    throw new Error(error.message || 'Đã có lỗi xảy ra khi gọi ElevenLabs API');
  }
};

// Thêm các hàm liên quan đến lịch sử chuyển đổi

// Lưu lịch sử chuyển đổi mới vào DB
export const saveTranscriptionHistory = async (transcriptionData) => {
  try {
    // Đảm bảo có userId (nếu đã đăng nhập)
    const apiKey = await getApiKey();
    
    // Chuẩn bị dữ liệu để lưu
    const historyItem = {
      fileName: transcriptionData.fileName || 'Không có tên',
      language: transcriptionData.language_code || 'unknown',
      duration: transcriptionData.audio_duration || 0,
      textPreview: transcriptionData.text ? transcriptionData.text.substring(0, 100) + '...' : 'Không có nội dung',
      createdAt: new Date().toISOString(),
      transcription: transcriptionData
    };
    
    // Lấy lịch sử hiện tại từ localStorage
    let history = JSON.parse(localStorage.getItem('transcriptionHistory') || '[]');
    
    // Thêm vào đầu mảng (vị trí gần nhất)
    history.unshift(historyItem);
    
    // Chỉ giữ 5 mục gần nhất
    if (history.length > 5) {
      history = history.slice(0, 5);
    }
    
    // Lưu trở lại localStorage
    localStorage.setItem('transcriptionHistory', JSON.stringify(history));
    
    // Nếu có API key (đã đăng nhập), đồng bộ lên server
    if (apiKey) {
      // Kết nối với endpoint API để lưu lịch sử (triển khai sau)
      // Có thể triển khai phần này khi có backend API
      console.log('Lưu lịch sử lên server với API key:', apiKey);
    }
    
    return { success: true, history };
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử chuyển đổi:', error);
    return { success: false, error: error.message };
  }
};

// Lấy lịch sử chuyển đổi từ DB
export const getTranscriptionHistory = async () => {
  try {
    // Lấy từ localStorage trước
    const localHistory = JSON.parse(localStorage.getItem('transcriptionHistory') || '[]');
    
    // Đảm bảo có userId (nếu đã đăng nhập)
    const apiKey = await getApiKey();
    
    // Nếu có API key (đã đăng nhập), đồng bộ từ server
    if (apiKey) {
      // Kết nối với endpoint API để lấy lịch sử (triển khai sau)
      // Có thể triển khai phần này khi có backend API
      console.log('Lấy lịch sử từ server với API key:', apiKey);
      
      // Giả lập lấy dữ liệu từ server - khi có API thực, thay đoạn này
      // const serverHistory = await axios.get('/api/transcription-history', {
      //   headers: { 'xi-api-key': apiKey }
      // });
      // return serverHistory.data;
    }
    
    return { success: true, history: localHistory };
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chuyển đổi:', error);
    return { success: false, error: error.message, history: [] };
  }
};

// Xóa một mục trong lịch sử chuyển đổi
export const deleteTranscriptionHistoryItem = async (itemId) => {
  try {
    // Lấy lịch sử hiện tại từ localStorage
    let history = JSON.parse(localStorage.getItem('transcriptionHistory') || '[]');
    
    // Lọc bỏ mục cần xóa
    history = history.filter((item, index) => index !== itemId);
    
    // Lưu trở lại localStorage
    localStorage.setItem('transcriptionHistory', JSON.stringify(history));
    
    // Đảm bảo có userId (nếu đã đăng nhập)
    const apiKey = await getApiKey();
    
    // Nếu có API key (đã đăng nhập), đồng bộ lên server
    if (apiKey) {
      // Kết nối với endpoint API để xóa lịch sử (triển khai sau)
      // Có thể triển khai phần này khi có backend API
      console.log('Xóa lịch sử trên server với API key:', apiKey);
    }
    
    return { success: true, history };
  } catch (error) {
    console.error('Lỗi khi xóa mục lịch sử chuyển đổi:', error);
    return { success: false, error: error.message };
  }
};

// Xóa toàn bộ lịch sử chuyển đổi
export const clearTranscriptionHistory = async () => {
  try {
    // Xóa khỏi localStorage
    localStorage.removeItem('transcriptionHistory');
    
    // Đảm bảo có userId (nếu đã đăng nhập)
    const apiKey = await getApiKey();
    
    // Nếu có API key (đã đăng nhập), đồng bộ lên server
    if (apiKey) {
      // Kết nối với endpoint API để xóa toàn bộ lịch sử (triển khai sau)
      // Có thể triển khai phần này khi có backend API
      console.log('Xóa toàn bộ lịch sử trên server với API key:', apiKey);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi xóa toàn bộ lịch sử chuyển đổi:', error);
    return { success: false, error: error.message };
  }
};

export default api; 