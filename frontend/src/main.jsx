import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Inyectamos variables de Vite al window para que librerías externas/handlers
// tengan acceso consistente tanto en dev como en build.
// (GIS/Google Identity Services puede inicializarse en distintos momentos.)
window.__VITE_GOOGLE_CLIENT_ID__ = import.meta.env?.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
