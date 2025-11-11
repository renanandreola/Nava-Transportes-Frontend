import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "../Layout/ScrollToTop";
import Login from "../Pages/Login/Login";
import Home from "../Pages/Home/Home";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";
import AdminLayout from "../Pages/Admin/AdminLayout";
import AdminDashboard from "../Pages/Admin/AdminDashboard";
import AdminUsers from "../Pages/Admin/AdminUsers";

function RouteComponent() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        {/* Área Admin */}
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminLayout />
              </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RouteComponent;
