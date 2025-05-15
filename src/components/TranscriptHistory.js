import React, { useState, useEffect } from 'react';
import { Card, Table, Button, InputGroup, FormControl, Modal, Alert, Spinner, Pagination } from 'react-bootstrap';
import { FaSearch, FaEye, FaDownload, FaTrashAlt, FaCheck, FaTimes } from 'react-icons/fa';
import styled from 'styled-components';
import { getTranscriptHistory, getTranscriptDetail, deleteTranscript } from '../services/api';
import { useAuth } from './AuthManager';

const HistoryCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  background-color: #1e1e2e;
  color: #f1f1f2;
`;

const HistoryTable = styled(Table)`
  margin-bottom: 0;
  color: #f1f1f2;
  
  thead th {
    background-color: #2d2d42;
    color: #f1f1f2;
    border-bottom: none;
    padding: 12px 16px;
  }
  
  tbody td {
    border-color: #3c3c57;
    padding: 12px 16px;
    vertical-align: middle;
  }
  
  tr:hover td {
    background-color: #2d2d42;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
`;

const ModalContent = styled.div`
  background-color: #1e1e2e;
  color: #f1f1f2;
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  
  .timestamp {
    color: #84ffff;
    font-size: 0.9em;
    margin-right: 5px;
  }
  
  .speaker {
    color: #f087b3;
    font-weight: bold;
    margin-right: 5px;
  }
`;

const NoRecordsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #a1a1b5;
  font-style: italic;
`;

const TranscriptHistory = () => {
  const { isAuthenticated } = useAuth();
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchTranscripts();
    }
  }, [isAuthenticated, currentPage]);
  
  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getTranscriptHistory();
      setTranscripts(data);
      setTotalItems(data.length); // Nếu API có trả về tổng số items
      
    } catch (error) {
      console.error('Error fetching transcript history:', error);
      setError('Không thể tải lịch sử chuyển đổi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleViewDetail = async (id) => {
    try {
      setDetailLoading(true);
      const data = await getTranscriptDetail(id);
      setSelectedTranscript(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching transcript detail:', error);
      setError('Không thể tải chi tiết bản ghi. Vui lòng thử lại sau.');
    } finally {
      setDetailLoading(false);
    }
  };
  
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTranscript(null);
  };
  
  const confirmDelete = (id) => {
    setSelectedTranscript(transcripts.find(t => t._id === id));
    setShowDeleteModal(true);
  };
  
  const handleDelete = async () => {
    try {
      await deleteTranscript(selectedTranscript._id);
      setShowDeleteModal(false);
      fetchTranscripts();
    } catch (error) {
      console.error('Error deleting transcript:', error);
      setError('Không thể xóa bản ghi. Vui lòng thử lại sau.');
    }
  };
  
  const handleDownload = (transcript) => {
    const text = transcript.text;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.fileName.split('.')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };
  
  const filteredTranscripts = transcripts.filter(transcript => 
    transcript.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    transcript.text.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const renderTranscriptDetail = () => {
    if (!selectedTranscript) return null;
    
    if (selectedTranscript.words && selectedTranscript.words.length > 0) {
      // Nếu có dữ liệu phân đoạn theo từng từ
      const speakerMap = {};
      let currentText = [];
      
      selectedTranscript.words.forEach((word, index) => {
        if (word.speaker) {
          if (!speakerMap[word.speaker]) {
            speakerMap[word.speaker] = `Người ${Object.keys(speakerMap).length + 1}`;
          }
          
          const formattedTime = `[${formatTime(word.start)}]`;
          currentText.push(
            <span key={index}>
              <span className="timestamp">{formattedTime}</span>
              <span className="speaker">{speakerMap[word.speaker]}:</span>
              <span>{word.word} </span>
            </span>
          );
        } else {
          currentText.push(<span key={index}>{word.word} </span>);
        }
      });
      
      return currentText;
    }
    
    // Nếu không có dữ liệu chi tiết, hiển thị văn bản thô
    return selectedTranscript.text;
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!isAuthenticated) {
    return (
      <HistoryCard>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Lịch sử chuyển đổi</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            Vui lòng đăng nhập để xem lịch sử chuyển đổi của bạn.
          </Alert>
        </Card.Body>
      </HistoryCard>
    );
  }
  
  return (
    <HistoryCard>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Lịch sử chuyển đổi</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <SearchContainer>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl 
              placeholder="Tìm kiếm theo tên file hoặc nội dung..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </InputGroup>
        </SearchContainer>
        
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải dữ liệu...</p>
          </div>
        ) : transcripts.length === 0 ? (
          <NoRecordsMessage>
            Chưa có bản ghi chuyển đổi nào.
          </NoRecordsMessage>
        ) : (
          <>
            <div className="table-responsive">
              <HistoryTable hover>
                <thead>
                  <tr>
                    <th>Tên file</th>
                    <th>Ngôn ngữ</th>
                    <th>Kích thước</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTranscripts.map(transcript => (
                    <tr key={transcript._id}>
                      <td>{transcript.fileName}</td>
                      <td>{transcript.language_code || 'N/A'}</td>
                      <td>{formatFileSize(transcript.fileSize)}</td>
                      <td>{formatDate(transcript.createdAt)}</td>
                      <td style={{ width: '180px' }}>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-1"
                          onClick={() => handleViewDetail(transcript._id)}
                        >
                          <FaEye />
                        </Button>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-1"
                          onClick={() => handleDownload(transcript)}
                        >
                          <FaDownload />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => confirmDelete(transcript._id)}
                        >
                          <FaTrashAlt />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </HistoryTable>
            </div>
            
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    // Hiển thị trang hiện tại, 2 trang trước và 2 trang sau
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                    ) {
                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    } else if (
                      pageNumber === currentPage - 3 ||
                      pageNumber === currentPage + 3
                    ) {
                      return <Pagination.Ellipsis key={pageNumber} />;
                    }
                    return null;
                  })}
                  
                  <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                  <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card.Body>
      
      {/* Modal xem chi tiết bản ghi */}
      <Modal 
        show={showDetailModal} 
        onHide={handleCloseDetailModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2' }}>
          <Modal.Title>
            {selectedTranscript?.fileName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2' }}>
          {detailLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <ModalContent>
              {renderTranscriptDetail()}
            </ModalContent>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#1e1e2e', borderTop: '1px solid #3c3c57' }}>
          <Button 
            variant="success" 
            onClick={() => selectedTranscript && handleDownload(selectedTranscript)}
          >
            <FaDownload className="me-2" /> Tải xuống
          </Button>
          <Button variant="secondary" onClick={handleCloseDetailModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal xác nhận xóa */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2' }}>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#1e1e2e', color: '#f1f1f2' }}>
          <p>Bạn có chắc chắn muốn xóa bản ghi chuyển đổi này?</p>
          <p><strong>Tên file:</strong> {selectedTranscript?.fileName}</p>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#1e1e2e', borderTop: '1px solid #3c3c57' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            <FaTimes className="me-2" /> Hủy
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <FaCheck className="me-2" /> Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </HistoryCard>
  );
};

export default TranscriptHistory; 