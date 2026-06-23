import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

// Patch fetch once so every request to our ngrok backend skips the warning page
const originalFetch = window.fetch;

window.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input.toString();

  if (url.includes("ngrok-free.dev") || url.includes("ngrok-free.app")) {
    init.headers = {
      ...init.headers,
      "ngrok-skip-browser-warning": "true",
    };
  }

  return originalFetch(input, init);
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
