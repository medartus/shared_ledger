import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App';
import WalletConnectionProvider from './components/walletConnectionProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <WalletConnectionProvider>
      <App />
    </WalletConnectionProvider>
  </React.StrictMode>
);
