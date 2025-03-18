import React from 'react';
import Plot from 'react-plotly.js';

const Visualization = ({ type, analysisResults, dependentVariable, independentVariables }) => {
    if (!analysisResults) {
        return <div>Дані для візуалізації відсутні.</div>;
    }

    const { predicted_vs_actual, residuals } = analysisResults;

    // Отримуємо фактичні та прогнозовані значення
    const actual = predicted_vs_actual.map((item) => item.actual);
    const predicted = predicted_vs_actual.map((item) => item.predicted);

    // Індекси для побудови графіка
    const indices = Array.from({ length: predicted_vs_actual.length }, (_, i) => i);

    // Графік функції (якщо кількість незалежних змінних ≤ 2)
    if (type === 'function' && independentVariables && independentVariables.length <= 2) {
        let plotData = [];
        if (independentVariables.length === 1) {
            // Для 2D графіка (одна незалежна змінна)
            plotData = [
                {
                    x: indices, // Використовуємо індекси як значення x
                    y: predicted,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Прогнозовані значення',
                    line: { color: '#2563eb' },
                },
                {
                    x: indices, // Використовуємо індекси як значення x
                    y: actual,
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Фактичні значення',
                    marker: { color: '#ef4444' },
                },
            ];
        } else if (independentVariables.length === 2) {
            // Для 3D графіка (дві незалежні змінні)
            const x = indices; // Використовуємо індекси як значення x
            const y = indices; // Використовуємо індекси як значення y
            const z = predicted;

            plotData = [
                {
                    x: x,
                    y: y,
                    z: z,
                    type: 'surface',
                    name: 'Прогнозовані значення',
                    colorscale: 'Viridis',
                },
            ];
        }

        return (
            <div style={{ width: '100%', marginBottom: '32px' }}>
                <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Графік функції</h4>
                <Plot
                    data={plotData}
                    layout={{
                        title: `Графік функції для ${dependentVariable}`,
                        xaxis: { title: independentVariables[0] || 'Індекс' },
                        yaxis: { title: independentVariables.length > 1 ? independentVariables[1] : 'Індекс' },
                        zaxis: independentVariables.length > 1 ? { title: dependentVariable } : undefined,
                        width: '100%',
                        height: 500,
                        margin: { t: 40, b: 40 },
                    }}
                />
            </div>
        );
    }

    // Графік фактичних vs прогнозованих значень
    if (type === 'actual_vs_predicted') {
        if (!actual || !predicted) {
            return <div>Дані для графіка відсутні.</div>;
        }
        return (
            <div style={{ width: '100%', marginBottom: '32px' }}>
                <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Фактичні vs Прогнозовані значення</h4>
                <Plot
                    data={[
                        {
                            x: actual,
                            y: predicted,
                            type: 'scatter',
                            mode: 'markers',
                            name: 'Фактичні vs Прогнозовані',
                            marker: { color: '#2563eb' },
                        },
                        {
                            x: [Math.min(...actual), Math.max(...actual)],
                            y: [Math.min(...actual), Math.max(...actual)],
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Ідеальна лінія',
                            line: { color: '#ef4444', dash: 'dash' },
                        },
                    ]}
                    layout={{
                        title: 'Фактичні vs Прогнозовані значення',
                        xaxis: { title: 'Фактичні значення' },
                        yaxis: { title: 'Прогнозовані значення' },
                        width: '100%',
                        height: 500,
                        margin: { t: 40, b: 40 },
                    }}
                />
            </div>
        );
    }

    // Графік залишків
    if (type === 'residuals') {
        if (!residuals || !predicted) {
            return <div>Дані для графіка залишків відсутні.</div>;
        }
        const residualValues = residuals.map((item) => item.residual);
        return (
            <div style={{ width: '100%', marginBottom: '32px' }}>
                <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Залишки</h4>
                <Plot
                    data={[
                        {
                            x: predicted,
                            y: residualValues,
                            type: 'scatter',
                            mode: 'markers',
                            name: 'Залишки',
                            marker: { color: '#2563eb' },
                        },
                        {
                            x: [Math.min(...predicted), Math.max(...predicted)],
                            y: [0, 0],
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Нульова лінія',
                            line: { color: '#ef4444', dash: 'dash' },
                        },
                    ]}
                    layout={{
                        title: 'Графік залишків',
                        xaxis: { title: 'Прогнозовані значення' },
                        yaxis: { title: 'Залишки' },
                        width: '100%',
                        height: 500,
                        margin: { t: 40, b: 40 },
                    }}
                />
            </div>
        );
    }

    return null;
};

export default Visualization;
