import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@fontsource/orbitron/900.css';
import App from './App.jsx';
import AppTest from './AppTest.jsx' //For testing additional web pages

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
