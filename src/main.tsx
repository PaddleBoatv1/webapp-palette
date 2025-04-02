
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Main entry point for the React application
 * Renders the App component into the root DOM element
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found! Make sure there is a div with id 'root' in your HTML.");
} else {
  createRoot(rootElement).render(<App />);
}
