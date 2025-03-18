import React from 'react';
import Plot from 'react-plotly.js';

const Visualization = ({ type, analysisResults, dependentVariable, independentVariables }) => {
    if (!analysisResults) {
        return <div>Дані для візуалізації відсутні.</div>;
    }

    const { predicted_vs_actual, residuals, coefficients, intercept } = analysisResults;

    // Отримуємо фактичні та прогнозовані значення
    const actual = predicted_vs_actual.map((item) => item.actual);
    const predicted = predicted_vs_actual.map((item) => item.predicted);

    // Графік функції (якщо кількість незалежних змінних ≤ 2)
    if (type === 'function' && independentVariables.length <= 2) {
        let plotData = [];

        if (independentVariables.length === 1) {
            // Для 2D графіка (одна незалежна змінна)
            const xVar = independentVariables[0];
            const xValues = predicted_vs_actual.map(item => item[xVar]);

            if (!xValues || xValues.length === 0) {
                return <div>Дані для незалежної змінної відсутні.</div>;
            }

            // Створення точок для плавної лінії регресії
            const xMin = Math.min(...xValues);
            const xMax = Math.max(...xValues);
            const smoothX = Array.from({ length: 100 }, (_, i) => xMin + (xMax - xMin) * i / 99);

            // Обчислення значень y для плавної лінії за допомогою коефіцієнтів
            const smoothY = smoothX.map(xVal => {
                return intercept + coefficients[xVar] * xVal;
            });

            plotData = [
                // Плавна лінія регресії
                {
                    x: smoothX,
                    y: smoothY,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Лінія регресії',
                    line: { color: '#2563eb', width: 3 },
                },
                // Прогнозовані значення
                {
                    x: xValues,
                    y: predicted,
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Прогнозовані значення',
                    marker: { color: '#2563eb', size: 8, opacity: 0.5 },
                },
                // Фактичні значення
                {
                    x: xValues,
                    y: actual,
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Фактичні значення',
                    marker: { color: '#ef4444', size: 8 },
                },
            ];

            return (
                <div style={{ width: '100%', marginBottom: '32px' }}>
                    <Plot
                        data={plotData}
                        layout={{
                            title: `Графік функції для ${dependentVariable}`,
                            xaxis: { title: xVar },
                            yaxis: { title: dependentVariable },
                            width: '100%',
                            height: 500,
                            margin: { t: 40, b: 40 },
                            legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 }
                        }}
                    />
                </div>
            );

        } else if (independentVariables.length === 2) {
            // Для 3D графіка (дві незалежні змінні)
            const xVar = independentVariables[0];
            const yVar = independentVariables[1];

            const xValues = predicted_vs_actual.map(item => item[xVar]);
            const yValues = predicted_vs_actual.map(item => item[yVar]);
            const zValues = actual;

            // Перевірка на наявність даних
            if (!xValues || !yValues || !zValues || xValues.length === 0 || yValues.length === 0 || zValues.length === 0) {
                return <div>Дані для незалежних змінних відсутні.</div>;
            }

            // Створення сітки точок для плавної поверхні
            const xMin = Math.min(...xValues);
            const xMax = Math.max(...xValues);
            const yMin = Math.min(...yValues);
            const yMax = Math.max(...yValues);

            const xGrid = Array.from({ length: 25 }, (_, i) => xMin + (xMax - xMin) * i / 24);
            const yGrid = Array.from({ length: 25 }, (_, i) => yMin + (yMax - yMin) * i / 24);

            // Створення матриці значень для поверхні з коефіцієнтів
            const zMatrix = [];
            for (let i = 0; i < yGrid.length; i++) {
                const zRow = [];
                for (let j = 0; j < xGrid.length; j++) {
                    // Обчислення значення z за допомогою коефіцієнтів регресії
                    const zVal = intercept +
                        coefficients[xVar] * xGrid[j] +
                        coefficients[yVar] * yGrid[i];
                    zRow.push(zVal);
                }
                zMatrix.push(zRow);
            }

            plotData = [
                // Плавна поверхня регресії
                {
                    x: xGrid,
                    y: yGrid,
                    z: zMatrix,
                    type: 'surface',
                    name: 'Площина регресії',
                    colorscale: 'Blues',
                    opacity: 0.5, // Зроблено більш прозорою
                    showscale: false
                },
                // Фактичні значення
                {
                    x: xValues,
                    y: yValues,
                    z: zValues,
                    type: 'scatter3d',
                    mode: 'markers',
                    name: 'Фактичні значення',
                    marker: { color: '#ef4444', size: 5 },
                },
                // Прогнозовані значення
                {
                    x: xValues,
                    y: yValues,
                    z: predicted,
                    type: 'scatter3d',
                    mode: 'markers',
                    name: 'Прогнозовані значення',
                    marker: { color: '#2563eb', size: 5, opacity: 0.7 },
                }
            ];

            return (
                <div style={{ width: '100%', marginBottom: '32px' }}>
                    <Plot
                        data={plotData}
                        layout={{
                            title: `Графік функції для ${dependentVariable}`,
                            scene: {
                                xaxis: { title: xVar }, // Назва осі X відповідає назві змінної
                                yaxis: { title: yVar }, // Назва осі Y відповідає назві змінної
                                zaxis: { title: dependentVariable }, // Назва осі Z відповідає залежній змінній
                                camera: {
                                    eye: { x: 1.5, y: 1.5, z: 1 }
                                }
                            },
                            width: '100%',
                            height: 600,
                            margin: { t: 40, b: 40 },
                        }}
                    />
                </div>
            );
        }
    }

    // Графік фактичних vs прогнозованих значень
    if (type === 'actual_vs_predicted') {
        if (!actual || !predicted || actual.length === 0 || predicted.length === 0) {
            return <div>Дані для графіка відсутні.</div>;
        }
        return (
            <div style={{ width: '100%', marginBottom: '32px' }}>
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
                        title: `Фактичні vs Прогнозовані значення для ${dependentVariable}`,
                        xaxis: { title: `Фактичні значення ${dependentVariable}` },
                        yaxis: { title: `Прогнозовані значення ${dependentVariable}` },
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
        if (!residuals || !predicted || residuals.length === 0 || predicted.length === 0) {
            return <div>Дані для графіка залишків відсутні.</div>;
        }
        const residualValues = residuals.map((item) => item.residual);
        return (
            <div style={{ width: '100%', marginBottom: '32px' }}>
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
                        title: `Графік залишків для ${dependentVariable}`,
                        xaxis: { title: `Прогнозовані значення ${dependentVariable}` },
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
