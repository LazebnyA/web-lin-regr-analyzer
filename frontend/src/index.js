import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/styles/main.css'

document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('root');

    if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    } else {
        console.error("Root element not found!");
    }
});
