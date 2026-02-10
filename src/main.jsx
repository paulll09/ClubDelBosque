import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext.jsx";

import App from "./App.jsx";
import Admin from "./Admin.jsx";

import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";

import "./index.css";

import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/admin" element={<Admin />} />

              {/* Recuperación de contraseña */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
