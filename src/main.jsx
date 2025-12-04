// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext.jsx";

import App from "./App.jsx";
import Admin from "./Admin.jsx"; // Panel admin
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
      <Routes>
        {/* Página p  rincipal (clientes) */}
        <Route path="/" element={<App />} />

        {/* Panel administrativo */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);
