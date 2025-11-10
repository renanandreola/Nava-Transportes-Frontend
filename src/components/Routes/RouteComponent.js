import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "../Pages/Home/Home";
import ScrollToTop from "../Layout/ScrollToTop";
import Login from "../Pages/Login/Login"
import RequireAuth from "./RequireAuth";

function RouteComponent() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Página inicial = Login */}
        <Route path="/" element={<Login />} />

        {/* Exemplo de rota protegida */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RouteComponent;
