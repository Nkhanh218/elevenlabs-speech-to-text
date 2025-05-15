import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Kiểm tra xem đã có token trong localStorage chưa
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      try {
        // Kiểm tra xem token có hết hạn không
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token đã hết hạn, đăng xuất
          logout();
        } else {
          // Thiết lập header authorization
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Lấy thông tin người dùng
          fetchCurrentUser();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Phiên đăng nhập không hợp lệ');
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Không thể lấy thông tin người dùng');
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setLoading(false);
  };

  const saveAPIKey = async (apiKey) => {
    try {
      const response = await axios.post('/api/auth/apikey', { apiKey });
      
      // Cập nhật thông tin người dùng để hiển thị API key đã lưu
      await fetchCurrentUser();
      
      return response.data;
    } catch (error) {
      console.error('Error saving API key:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lưu API key');
    }
  };

  const saveSettings = async (settings) => {
    try {
      const response = await axios.post('/api/auth/settings', { settings });
      
      // Cập nhật thông tin người dùng để hiển thị cài đặt đã lưu
      await fetchCurrentUser();
      
      return response.data;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lưu cài đặt');
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    logout,
    saveAPIKey,
    saveSettings,
    fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 