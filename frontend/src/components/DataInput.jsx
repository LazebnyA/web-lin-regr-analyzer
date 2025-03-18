import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../services/api';

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

    // Check file extension
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
    <div className="bg-white shadow-md rounded p-6 max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Багатофакторна лінійна регресія</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Завантаження даних</h2>
        <p className="mb-4 text-gray-600">
          Завантажте файл CSV або Excel з вашими даними для аналізу регресії.
          Файл повинен містити стовпці для залежної та незалежних змінних.
        </p>

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              className="hidden"
              id="fileInput"
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
            />

            <label
              htmlFor="fileInput"
              className="block cursor-pointer"
            >
              <div className="mb-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">
                {file ? file.name : 'Натисніть для вибору файлу'}
              </p>
              <p className="text-sm text-gray-500">
                CSV, Excel (.xlsx, .xls)
              </p>
            </label>
          </div>

          {error && (
            <div className="text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Завантаження...' : 'Завантажити файл'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-2">Підтримувані формати файлів:</h3>
        <ul className="list-disc pl-5 text-gray-600">
          <li>CSV файли (.csv)</li>
          <li>Excel файли (.xlsx, .xls)</li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">Вимоги до даних:</h3>
        <ul className="list-disc pl-5 text-gray-600">
          <li>Перший рядок повинен містити назви стовпців</li>
          <li>Числові дані для всіх змінних</li>
          <li>Відсутність пропущених значень (або мінімальна їх кількість)</li>
        </ul>
      </div>
    </div>
  );
};

export default DataInput;