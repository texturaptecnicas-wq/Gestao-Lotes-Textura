import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import AtivacaoGate from '@/components/AtivacaoGate';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AtivacaoGate>
      <App />
    </AtivacaoGate>
  </BrowserRouter>
);