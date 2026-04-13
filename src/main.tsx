// src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

const rootEl = document.getElementById("root")

if (!rootEl) {
  throw new Error("Root element #root not found. Check index.html.")
}

const root = ReactDOM.createRoot(rootEl)

// Optional: better error visibility in production
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)