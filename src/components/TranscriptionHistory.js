import React from 'react';
import { Card, Button, Badge, Alert, Table, Spinner } from 'react-bootstrap';
import { FaFileAudio, FaPlay, FaTrash, FaSync, FaEraser } from 'react-icons/fa';
import styled from 'styled-components';
import { deleteTranscriptionHistoryItem, clearTranscriptionHistory } from '../services/api';

const HistoryCard = styled(Card)`
  background-color: #1e1e2e;
  border-radius: 12px;
  margin-bottom: 1rem;
  color: #f1f1f2;
`;

const HistoryItemRow = styled.tr`
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(108, 92, 231, 0.1);
  }
`;

const NoHistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #a29bfe;
`;

const ActionButton = styled(Button)`
  margin: 0 0.2rem;
`;

const HistoryControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
`;

const TranscriptionHistory = ({ history, onSelectItem, onRefresh }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleDelete = async (index, e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan sang hàng
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này khỏi lịch sử không?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await deleteTranscriptionHistoryItem(index);
      if (result.success) {
        // Làm mới danh sách
        onRefresh();
      } else {
        setError('Không thể xóa mục. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa mục.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử chuyển đổi không?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await clearTranscriptionHistory();
      if (result.success) {
        // Làm mới danh sách
        onRefresh();
      } else {
        setError('Không thể xóa lịch sử. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa lịch sử.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang xử lý...</p>
      </div>
    );
  }
  
  return (
    <HistoryCard>
      <Card.Body>
        <Card.Title className="mb-4">Lịch sử chuyển đổi gần đây</Card.Title>
        
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        <HistoryControls>
          <Button variant="outline-primary" onClick={onRefresh} className="me-2">
            <FaSync className="me-1" /> Làm mới
          </Button>
          {history.length > 0 && (
            <Button variant="outline-danger" onClick={handleClearAll}>
              <FaEraser className="me-1" /> Xóa tất cả
            </Button>
          )}
        </HistoryControls>
        
        {history.length === 0 ? (
          <NoHistoryContainer>
            <FaFileAudio size={50} className="mb-3" />
            <h4>Chưa có lịch sử chuyển đổi</h4>
            <p>Các lịch sử chuyển đổi của bạn sẽ xuất hiện ở đây (tối đa 5 mục gần nhất)</p>
          </NoHistoryContainer>
        ) : (
          <Table responsive hover variant="dark" className="mt-3">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên file</th>
                <th>Ngôn ngữ</th>
                <th>Thời lượng</th>
                <th>Nội dung</th>
                <th>Thời gian tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <HistoryItemRow key={index} onClick={() => onSelectItem(item)}>
                  <td>{index + 1}</td>
                  <td>{item.fileName}</td>
                  <td>
                    <Badge bg="primary">
                      {item.language?.toUpperCase() || 'N/A'}
                    </Badge>
                  </td>
                  <td>{formatDuration(item.duration)}</td>
                  <td>{item.textPreview}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <ActionButton 
                      variant="outline-primary" 
                      size="sm"
                      title="Mở lại kết quả này"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item);
                      }}
                    >
                      <FaPlay />
                    </ActionButton>
                    <ActionButton 
                      variant="outline-danger" 
                      size="sm"
                      title="Xóa khỏi lịch sử"
                      onClick={(e) => handleDelete(index, e)}
                    >
                      <FaTrash />
                    </ActionButton>
                  </td>
                </HistoryItemRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </HistoryCard>
  );
};

export default TranscriptionHistory; 