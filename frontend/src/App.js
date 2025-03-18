import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navigation from './components/Navigation';
import DataInput from './components/DataInput';
import ResultsView from './components/ResultsView';
import './assets/styles/main.css';

function App() {
  const [sessionData, setSessionData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={
              <DataInput
                onDataProcessed={(data) => {
                  setSessionData(data);
                  setAnalysisResults(null);
                }}
              />
            } />

            <Route path="/results" element={
              <ResultsView
                sessionData={sessionData}
                analysisResults={analysisResults}
                setAnalysisResults={setAnalysisResults}
              />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;