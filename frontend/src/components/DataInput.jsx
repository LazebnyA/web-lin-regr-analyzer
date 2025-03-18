import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../services/api';
import styled from 'styled-components';

const Container = styled.div`
  background: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 50px;
  max-width: 640px;
  margin: 40px auto;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
`;

const Subtitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 10px;
  margin-bottom: 20px;
`;

const Text = styled.p`
  margin-bottom: 20px;
  color: #718096;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FileInputContainer = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  cursor: pointer;
  display: block;
`;

const FileName = styled.p`
  font-weight: 500;
  color: #1a202c;
`;

const FileFormatText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ErrorText = styled.div`
  color: #e53e3e;
  text-align: center;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: ${(props) => (props.disabled ? '#93c5fd' : '#2563eb')};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.3s ease;
  &:hover {
    background: ${(props) => (props.disabled ? '#93c5fd' : '#1d4ed8')};
  }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #2563eb;
  }
`;

const Section = styled.div`
  margin-top: 32px;
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
`;

const List = styled.ul`
  list-style: disc;
  padding-left: 20px;
  color: #718096;
`;

const DataInput = ({ onDataProcessed }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setError('Please upload a CSV or Excel file');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadFile(formData);
      if (response.status === 'success') {
        onDataProcessed(response);
        navigate('/results');
      }
    } catch (err) {
      setError(err.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
      <Container>
        <Title>Багатофакторна лінійна регресія</Title>
        <div>
          <Subtitle>Завантаження даних</Subtitle>
          <Text>
            Завантажте файл CSV або Excel з вашими даними для аналізу регресії.
            Файл повинен містити стовпці для залежної та незалежних змінних.
          </Text>
          <Form onSubmit={handleFileUpload}>
            <FileInputContainer>
              <HiddenFileInput
                  type="file"
                  id="fileInput"
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
              />
              <FileLabel htmlFor="fileInput">
                <div style={{ marginBottom: '16px' }}>
                  <svg
                      style={{ display: 'block', margin: '0 auto', height: '48px', width: '48px', color: '#cbd5e0' }}
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                  >
                    <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <FileName>{file ? file.name : 'Натисніть для вибору файлу'}</FileName>
                <FileFormatText>CSV, Excel (.xlsx, .xls)</FileFormatText>
              </FileLabel>
            </FileInputContainer>
            {error && <ErrorText>{error}</ErrorText>}
            <ButtonWrapper>
              <Button type="submit" disabled={loading}>
                {loading ? 'Завантаження...' : 'Завантажити файл'}
              </Button>
            </ButtonWrapper>
          </Form>
        </div>
        <Section>
          <Subtitle>Підтримувані формати файлів:</Subtitle>
          <List>
            <li>CSV файли (.csv)</li>
            <li>Excel файли (.xlsx, .xls)</li>
          </List>
          <Subtitle style={{ marginTop: '16px' }}>Вимоги до даних:</Subtitle>
          <List>
            <li>Перший рядок повинен містити назви стовпців</li>
            <li>Числові дані для всіх змінних</li>
            <li>Відсутність пропущених значень (або мінімальна їх кількість)</li>
          </List>
        </Section>
      </Container>
  );
};

export default DataInput;
