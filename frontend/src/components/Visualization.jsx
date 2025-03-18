import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const Visualization = ({ analysisResults }) => {
  const actualVsPredictedRef = useRef(null);
  const residualsRef = useRef(null);
  const actualVsPredictedChart = useRef(null);
  const residualsChart = useRef(null);

  useEffect(() => {
    if (!analysisResults) return;

    // Clean up existing charts
    if (actualVsPredictedChart.current) {
      actualVsPredictedChart.current.destroy();
    }
    if (residualsChart.current) {
      residualsChart.current.destroy();
    }

    // Create Actual vs Predicted Chart
    const actualVsPredictedCtx = actualVsPredictedRef.current.getContext('2d');
    const actualValues = analysisResults.predicted_vs_actual.map(item => item.actual);
    const predictedValues = analysisResults.predicted_vs_actual.map(item => item.predicted);

    const minValue = Math.min(...actualValues);
    const maxValue = Math.max(...actualValues);

    actualVsPredictedChart.current = new Chart(actualVsPredictedCtx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Фактичні vs Прогнозовані',
            data: analysisResults.predicted_vs_actual.map(item => ({
              x: item.actual,
              y: item.predicted
            })),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Ідеальна лінія',
            data: [
              { x: minValue, y: minValue },
              { x: maxValue, y: maxValue }
            ],
            type: 'line',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Фактичні vs Прогнозовані значення'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Фактичні значення'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Прогнозовані значення'
            }
          }
        }
      }
    });

    // Create Residuals Chart
    const residualsCtx = residualsRef.current.getContext('2d');
    residualsChart.current = new Chart(residualsCtx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Залишки',
          data: analysisResults.predicted_vs_actual.map((item, index) => ({
            x: item.predicted,
            y: item.residual
          })),
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Залишки vs Прогнозовані значення'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Прогнозовані значення'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Залишки'
            },
            beginAtZero: false
          }
        }
      }
    });

    return () => {
      if (actualVsPredictedChart.current) {
        actualVsPredictedChart.current.destroy();
      }
      if (residualsChart.current) {
        residualsChart.current.destroy();
      }
    };
  }, [analysisResults]);

  return (
    <div className="visualization-container">
      <h2 className="text-xl font-semibold mb-4">Візуалізація</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">Фактичні vs Прогнозовані значення</h3>
          <div className="bg-white p-2 border border-gray-200 rounded-md">
            <canvas ref={actualVsPredictedRef}></canvas>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Залишки</h3>
          <div className="bg-white p-2 border border-gray-200 rounded-md">
            <canvas ref={residualsRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualization;