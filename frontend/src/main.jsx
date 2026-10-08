import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { VaultProvider } from './context/VaultContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <VaultProvider>
          <App />
        </VaultProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
