import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "../Layout/ScrollToTop";
import Login from "../Pages/Login/Login";
// import Home from "../Pages/Home/Home";
// import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";
import AdminLayout from "../Pages/Admin/AdminLayout";
import AdminDashboard from "../Pages/Admin/AdminDashboard";
import AdminUsers from "../Pages/Admin/AdminUsers";
import DriverHome from "../Pages/Driver/DriverHome";
import DriverTripForm from "../Pages/Driver/DriverTripForm";

function RouteComponent() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />

        {/* compatibilidade: /home -> /driver */}
        <Route path="/home" element={<Navigate to="/driver" replace />} />

        {/* Área Driver (usuário comum) */}
        <Route
          path="/driver"
          element={
            <RequireRole role="driver">
              <DriverHome />
            </RequireRole>
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

        <Route
          path="/driver"
          element={
            <RequireRole role="driver">
              <DriverHome />   {/* pode manter */}
            </RequireRole>
          }
        />

        <Route
          path="/driver/trips/new"
          element={
            <RequireRole role="driver">
              <DriverTripForm />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RouteComponent;
