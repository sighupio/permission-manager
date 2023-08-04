import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App';

it('renders without crashing', () => {
  const domNode = document.getElementById('root');
  const root = createRoot(domNode);

  root.render(<App />);
});
