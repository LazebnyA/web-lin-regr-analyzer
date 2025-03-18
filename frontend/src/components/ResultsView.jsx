import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeData, generateReport } from '../services/api';
import Visualization from './Visualization';

const ResultsView = ({ sessionData, analysisResults, setAnalysisResults }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDependent, setSelectedDependent] = useState('');
  const [selectedIndependent, setSelectedIndependent] = useState([]);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportGenerating, setReportGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionData) {
      navigate('/');
    }
  }, [sessionData, navigate]);

  const handleAnalysis = async (e) => {
    e.preventDefault();

    if (!selectedDependent) {
      setError('Please select a dependent variable');
      return;
    }

    if (selectedIndependent.length === 0) {
      setError('Please select at least one independent variable');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const analysisData = {
        session_id: sessionData.session_id,
        dependent_variable: selectedDependent,
        independent_variables: selectedIndependent
      };

      const results = await analyzeData(analysisData);
      setAnalysisResults(results);
    } catch (err) {
      setError(err.message || 'Error during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleReportGeneration = async () => {
    setReportGenerating(true);
    try {
      const reportData = {
        session_id: sessionData.session_id,
        dependent_variable: selectedDependent,
        independent_variables: selectedIndependent,
        report_format: reportFormat
      };

      await generateReport(reportData);
    } catch (err) {
      setError(err.message || 'Error generating report');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleCheckboxChange = (column) => {
    setSelectedIndependent(prev => {
      if (prev.includes(column)) {
        return prev.filter(item => item !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  if (!sessionData) {
    return null;
  }

  return (
    <div className="bg-white shadow-md rounded p-6 max-w-6xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Аналіз даних</h1>

      {!analysisResults ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Вибір змінних</h2>
          <p className="mb-4 text-gray-600">
            Вибрано файл з {sessionData.rows} рядками та {sessionData.columns.length} стовпцями.
            Виберіть залежну змінну та одну або кілька незалежних змінних для аналізу.
          </p>

          <form onSubmit={handleAnalysis} className="space-y-6">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Залежна змінна (Y):
              </label>
              <select
                value={selectedDependent}
                onChange={(e) => setSelectedDependent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Виберіть залежну змінну</option>
                {sessionData.columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Незалежні змінні (X):
              </label>
              <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                {sessionData.columns
                  .filter(column => column !== selectedDependent)
                  .map((column) => (
                    <div key={column} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`checkbox-${column}`}
                        checked={selectedIndependent.includes(column)}
                        onChange={() => handleCheckboxChange(column)}
                        className="mr-2"
                      />
                      <label htmlFor={`checkbox-${column}`}>{column}</label>
                    </div>
                  ))}
              </div>
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
                {loading ? 'Аналіз...' : 'Аналізувати дані'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="results-container">
          <h2 className="text-xl font-semibold mb-4">Результати аналізу</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Основні метрики</h3>
              <div className="text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-semibold">R²:</div>
                  <div>{(analysisResults.r_squared * 100).toFixed(2)}%</div>

                  <div className="font-semibold">MSE:</div>
                  <div>{analysisResults.mse.toFixed(4)}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Рівняння регресії</h3>
              <div className="text-sm">
                <p className="break-words">
                  {selectedDependent} = {analysisResults.intercept.toFixed(4)}
                  {Object.entries(analysisResults.coefficients).map(([variable, coefficient]) => (
                    <span key={variable}>
                      {' '}
                      {coefficient >= 0 ? '+' : ''}
                      {coefficient.toFixed(4)} × {variable}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-medium mb-2">Коефіцієнти регресії</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-1 px-3 text-left border-b border-gray-200">Змінна</th>
                    <th className="py-1 px-3 text-left border-b border-gray-200">Коефіцієнт</th>
                    <th className="py-1 px-3 text-left border-b border-gray-200">P-value</th>
                    <th className="py-1 px-3 text-left border-b border-gray-200">Значущість</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-3 border-b border-gray-200">Перетин</td>
                    <td className="py-1 px-3 border-b border-gray-200">{analysisResults.intercept.toFixed(4)}</td>
                    <td className="py-1 px-3 border-b border-gray-200">-</td>
                    <td className="py-1 px-3 border-b border-gray-200">-</td>
                  </tr>
                  {Object.entries(analysisResults.coefficients).map(([variable, coefficient]) => (
                    <tr key={variable}>
                      <td className="py-1 px-3 border-b border-gray-200">{variable}</td>
                      <td className="py-1 px-3 border-b border-gray-200">{coefficient.toFixed(4)}</td>
                      <td className="py-1 px-3 border-b border-gray-200">
                        {analysisResults.p_values[variable].toFixed(4)}
                      </td>
                      <td className="py-1 px-3 border-b border-gray-200">
                        {analysisResults.p_values[variable] < 0.05 ? (
                          <span className="text-green-500">Значущий</span>
                        ) : (
                          <span className="text-red-500">Незначущий</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Visualization analysisResults={analysisResults} />

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Згенерувати звіт</h3>
            <div className="flex items-center">
              <div className="mr-4">
                <label className="block font-medium text-gray-700 mb-2">
                  Формат звіту:
                </label>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                </select>
              </div>

              <button
                onClick={handleReportGeneration}
                disabled={reportGenerating}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300 mt-6"
              >
                {reportGenerating ? 'Генерація...' : 'Згенерувати звіт'}
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setAnalysisResults(null)}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Назад до вибору змінних
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;