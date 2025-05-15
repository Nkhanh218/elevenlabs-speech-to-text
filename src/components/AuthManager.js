import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button, Modal, Spinner, Alert } from 'react-bootstrap';
import { FaGoogle, FaSignOutAlt, FaUser } from 'react-icons/fa';
import styled from 'styled-components';
import { login, logout, getCurrentUser } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Context để quản lý trạng thái đăng nhập xuyên suốt ứng dụng
export const AuthContext = createContext(null);

const UserInfoContainer = styled.div`
  display: flex;
  align-items: center;
  color: #f1f1f2;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #2d2d42;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
`;

const UserAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  border: 2px solid #6c5ce7;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const UserName = styled.span`
  font-weight: 500;
  margin-right: auto;
`;

const AuthContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: center;
  padding: 1rem;
`;

// Provider component để wrap toàn bộ ứng dụng
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Hàm kiểm tra URL ảnh có hoạt động không
  const checkImageUrl = async (url) => {
    if (!url) return null;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => {
        console.error('Image failed to load:', url);
        resolve(null);
      };
      img.src = url;
    });
  };
  
  useEffect(() => {
    // Kiểm tra nếu người dùng đã đăng nhập trước đó
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);
  
  const handleLogin = async (credential) => {
    try {
      setLoading(true);
      const decodedUser = jwtDecode(credential);
      
      // Debug log để kiểm tra cấu trúc của token
      console.log('Decoded Google token:', decodedUser);
      console.log('Picture URL from token:', decodedUser.picture);
      
      // Xử lý URL ảnh từ Google 
      let imageUrl = null;
      if (decodedUser.picture) {
        // Đảm bảo URL bắt đầu bằng https
        imageUrl = decodedUser.picture.replace(/^http:\/\//i, 'https://');
        // Thêm size parameter nếu chưa có
        if (!imageUrl.includes('sz=')) {
          imageUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'sz=128';
        }
        console.log('Modified Google avatar URL:', imageUrl);
        
        // Kiểm tra xem URL ảnh có hoạt động không
        imageUrl = await checkImageUrl(imageUrl);
      }
      
      const userData = {
        name: decodedUser.name || decodedUser.given_name || 'Google User',
        email: decodedUser.email,
        imageUrl: imageUrl || null
      };
      
      // Lưu thông tin vào localStorage để giả lập lưu trạng thái đăng nhập
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      console.error('Đăng nhập thất bại:', error);
      console.error('Error details:', error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    setUser(null);
  };
  
  // Context value được truyền xuống các component con
  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    setUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Tạo URL ảnh đại diện mặc định cục bộ
const createLocalAvatar = (name) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  
  // Tạo màu ngẫu nhiên dựa trên tên
  const getHashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  
  const intToRGB = (i) => {
    const c = (i & 0x00FFFFFF)
      .toString(16)
      .padStart(6, '0');
    return c;
  };
  
  const bgColor = intToRGB(getHashCode(name));
  
  // Tạo data URL cho SVG
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" fill="#${bgColor}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF">${initials}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent.trim())}`;
};

// Component hiển thị nút đăng nhập hoặc thông tin người dùng
const AuthManager = () => {
  const { user, isAuthenticated, loading, login, logout, setUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [fallbackAvatar, setFallbackAvatar] = useState(null);
  
  // Debug: Log environment variables
  console.log('All environment variables in React:', process.env);
  console.log('REACT_APP_GOOGLE_CLIENT_ID value:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
  
  // Try with fallback for debugging purposes
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'debug_mode_client_id';
  
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      setError('');
      console.log('Google credential received:', credentialResponse.credential);
      
      // Gửi token về backend để xác thực
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/auth/google-token`, {
        token: credentialResponse.credential
      });
      
      console.log('Backend response:', response.data);
      
      // Lưu JWT token từ backend
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const userData = {
          ...response.data.user,
          imageUrl: response.data.user.imageUrl || response.data.user.picture
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        // Nếu không có token từ backend, sử dụng giải pháp localStorage tạm thời
        login(credentialResponse.credential);
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Đăng nhập thất bại:', error);
      setError('Không thể kết nối đến máy chủ. Đang sử dụng chế độ offline.');
      // Sử dụng xác thực cục bộ nếu không kết nối được với server
      login(credentialResponse.credential);
      setShowModal(false);
    }
  };
  
  const handleLoginFailure = () => {
    console.error('Đăng nhập Google thất bại');
    setError('Đăng nhập không thành công. Vui lòng thử lại.');
  };
  
  const handleLogoutClick = () => {
    logout();
  };
  
  const openLoginModal = () => {
    setError('');
    setShowModal(true);
  };
  
  useEffect(() => {
    if (user && user.name) {
      setFallbackAvatar(createLocalAvatar(user.name));
    }
  }, [user]);
  
  return (
    <AuthContainer>
      {loading ? (
        <Spinner animation="border" variant="primary" size="sm" />
      ) : isAuthenticated ? (
        <UserInfoContainer>
          {console.log('User data:', user)}
          <UserAvatar 
            src={user.imageUrl || user.picture || fallbackAvatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"></svg>`} 
            alt={user.name}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={(e) => {
              console.log('Error loading avatar image, falling back to placeholder');
              e.target.onerror = null;
              if (fallbackAvatar) {
                e.target.src = fallbackAvatar;
              } else {
                setFallbackAvatar(createLocalAvatar(user.name));
                e.target.src = createLocalAvatar(user.name);
              }
            }}
          />
          <UserName>{user.name}</UserName>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleLogoutClick}
          >
            <FaSignOutAlt className="me-1" /> Đăng xuất
          </Button>
        </UserInfoContainer>
      ) : (
        <Button 
          variant="primary" 
          onClick={openLoginModal}
        >
          <FaUser className="me-2" /> Đăng nhập
        </Button>
      )}
      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2' }}>
          <Modal.Title>Đăng nhập</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2', textAlign: 'center' }}>
          <p>Đăng nhập để lưu cấu hình API key và lịch sử chuyển đổi</p>
          
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <div className="d-flex justify-content-center my-4">
            {googleClientId ? (
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginFailure}
                theme="filled_blue"
                text="signin_with"
                shape="circle"
                size="large"
                locale="vi"
              />
            ) : (
              <Alert variant="warning">
                Google Client ID chưa được cấu hình. Vui lòng thêm REACT_APP_GOOGLE_CLIENT_ID vào file .env
              </Alert>
            )}
          </div>
        </Modal.Body>
        <ModalFooter style={{ backgroundColor: '#1e1e2e', borderTop: '1px solid #3c3c57' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
        </ModalFooter>
      </Modal>
    </AuthContainer>
  );
};

export default AuthManager;