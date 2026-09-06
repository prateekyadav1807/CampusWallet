import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store/store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e1e2e',
              color: '#e2e8f0',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1e1e2e' },
              style: { borderColor: 'rgba(16,185,129,0.3)' }
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#1e1e2e' },
              style: { borderColor: 'rgba(244,63,94,0.3)' }
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
