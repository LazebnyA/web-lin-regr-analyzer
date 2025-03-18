import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeData, generateReport } from '../services/api';
import Visualization from './Visualization';
import styled from 'styled-components';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const Container = styled.div`
  background: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 24px;
  max-width: 1024px;
  margin: 40px auto;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 24px;
`;

const Subtitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
`;

const Text = styled.p`
  margin-bottom: 16px;
  color: #718096;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;

const CheckboxContainer = styled.div`
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px;
  max-height: 160px;
  overflow-y: auto;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const CheckboxLabel = styled.label`
  margin-left: 8px;
`;

const ErrorText = styled.div`
  color: #e53e3e;
  text-align: center;
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

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: #f9fafb;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const Th = styled.th`
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  background: #f3f4f6;
`;

const Td = styled.td`
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
`;

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
        independent_variables: selectedIndependent,
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
        report_format: reportFormat,
      };
      await generateReport(reportData);
    } catch (err) {
      setError(err.message || 'Error generating report');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleCheckboxChange = (column) => {
    setSelectedIndependent((prev) =>
        prev.includes(column)
            ? prev.filter((item) => item !== column)
            : [...prev, column]
    );
  };

  if (!sessionData) return null;

  return (
      <Container>
        <Title>Аналіз даних</Title>
        {!analysisResults ? (
            <div>
              <Subtitle>Вибір змінних</Subtitle>
              <Text>
                Вибрано файл з {sessionData.rows} рядками та {sessionData.columns.length} стовпцями.
                Виберіть залежну змінну та одну або кілька незалежних змінних для аналізу.
              </Text>
              <Form onSubmit={handleAnalysis}>
                <div>
                  <Label>Залежна змінна (Y):</Label>
                  <Select
                      value={selectedDependent}
                      onChange={(e) => setSelectedDependent(e.target.value)}
                  >
                    <option value="">Виберіть залежну змінну</option>
                    {sessionData.columns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Незалежні змінні (X):</Label>
                  <CheckboxContainer>
                    {sessionData.columns
                        .filter((column) => column !== selectedDependent)
                        .map((column) => (
                            <CheckboxItem key={column}>
                              <input
                                  type="checkbox"
                                  id={`checkbox-${column}`}
                                  checked={selectedIndependent.includes(column)}
                                  onChange={() => handleCheckboxChange(column)}
                              />
                              <CheckboxLabel htmlFor={`checkbox-${column}`}>
                                {column}
                              </CheckboxLabel>
                            </CheckboxItem>
                        ))}
                  </CheckboxContainer>
                </div>
                {error && <ErrorText>{error}</ErrorText>}
                <ButtonWrapper>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Аналіз...' : 'Аналізувати дані'}
                  </Button>
                </ButtonWrapper>
              </Form>
            </div>
        ) : (
            <div>
              <Subtitle>Результати аналізу</Subtitle>
              <MetricsGrid>
                {/* Основні метрики */}
                <Card>
                  <h3 style={{ marginBottom: '8px', fontWeight: '500' }}>Основні метрики</h3>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px' }}>
                      <div style={{ fontWeight: '600' }}>R²:</div>
                      <div>{(analysisResults.r_squared * 100).toFixed(2)}%</div>
                      <div style={{ fontWeight: '600' }}>MSE:</div>
                      <div>{analysisResults.mse.toFixed(4)}</div>
                    </div>
                  </div>
                </Card>

                {/* Рівняння регресії */}
                <Card>
                  <h3 style={{ marginBottom: '8px', fontWeight: '500' }}>Рівняння регресії</h3>
                  <div style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>
                    <BlockMath>
                      {`${selectedDependent} = ${analysisResults.intercept.toFixed(4)} ${Object.entries(analysisResults.coefficients)
                          .map(([variable, coefficient]) => `${coefficient >= 0 ? '+' : ''} ${coefficient.toFixed(4)} \\cdot ${variable}`)
                          .join(' ')}`}
                    </BlockMath>
                  </div>
                </Card>
              </MetricsGrid>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontWeight: '500', marginBottom: '8px' }}>
                  Коефіцієнти регресії
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <Table>
                    <thead>
                    <tr>
                      <Th>Змінна</Th>
                      <Th>Коефіцієнт</Th>
                      <Th>P-value</Th>
                      <Th>Значущість</Th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                      <Td>Перетин</Td>
                      <Td>{analysisResults.intercept.toFixed(4)}</Td>
                      <Td>-</Td>
                      <Td>-</Td>
                    </tr>
                    {Object.entries(analysisResults.coefficients).map(
                        ([variable, coefficient]) => (
                            <tr key={variable}>
                              <Td>{variable}</Td>
                              <Td>{coefficient.toFixed(4)}</Td>
                              <Td>
                                {analysisResults.p_values[variable].toFixed(4)}
                              </Td>
                              <Td>
                                {analysisResults.p_values[variable] < 0.05 ? (
                                    <span style={{ color: '#10b981' }}>Значущий</span>
                                ) : (
                                    <span style={{ color: '#ef4444' }}>Незначущий</span>
                                )}
                              </Td>
                            </tr>
                        )
                    )}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Графіки */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontWeight: '500', marginBottom: '16px' }}>Графіки</h3>
                {/* Графік функції (якщо кількість незалежних змінних ≤ 3) */}
                {selectedIndependent.length <= 2 && (
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Графік функції</h4>
                      <Visualization
                          type="function"
                          analysisResults={analysisResults}
                          dependentVariable={selectedDependent}
                          independentVariables={selectedIndependent}
                      />
                    </div>
                )}

                {/* Фактичні vs Прогнозовані значення */}
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Фактичні vs Прогнозовані значення</h4>
                  <Visualization
                      type="actual_vs_predicted"
                      analysisResults={analysisResults}
                  />
                </div>

                {/* Графік залишків */}
                {analysisResults.residuals && (
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Залишки</h4>
                      <Visualization
                          type="residuals"
                          analysisResults={analysisResults}
                      />
                    </div>
                )}
              </div>

              <div
                  style={{
                    marginTop: '32px',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '24px',
                  }}
              >
                <Subtitle>Згенерувати звіт</Subtitle>
                <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                >
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <Label>Формат звіту:</Label>
                    <Select
                        value={reportFormat}
                        onChange={(e) => setReportFormat(e.target.value)}
                    >
                      <option value="pdf">PDF</option>
                      <option value="xlsx">Excel (.xlsx)</option>
                    </Select>
                  </div>
                  <Button onClick={handleReportGeneration} disabled={reportGenerating}>
                    {reportGenerating ? 'Генерація...' : 'Згенерувати звіт'}
                  </Button>
                </div>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                <Button
                    onClick={() => setAnalysisResults(null)}
                    style={{ background: '#6b7280' }}
                >
                  Назад до вибору змінних
                </Button>
              </div>
            </div>
        )}
      </Container>
  );
};

export default ResultsView;
