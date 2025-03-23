import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (formData) => {
  try {
    const response = await api.post('/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Помилка завантаження файлу');
  }
};

export const analyzeData = async (data) => {
  try {
    const response = await api.post('/analyze', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Помилка аналізу даних');
  }
};

export const generateReport = async (data) => {
  try {
    const response = await api.post('/generate-report', data, {
      responseType: 'blob',
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `regression_report.${data.report_format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Помилка генерації звіту');
  }
};

export default api;
