// src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

const rootEl = document.getElementById("root")

if (!rootEl) {
  throw new Error("Root element #root not found. Check index.html.")
}

// IMPORTANT: Only one root, only one render.
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
