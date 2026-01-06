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
import AdminTrips from "../Pages/Admin/AdminTrips";
import DriverLayout from "../Pages/Driver/DriverLayout";
import DriverHome from "../Pages/Driver/DriverHome";
import DriverTripForm from "../Pages/Driver/DriverTripForm";
import DriverTripList from "../Pages/Driver/DriverTripList";
// import AdminAnalytics from "../Pages/Admin/AdminAnalytics";

function RouteComponent() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Público */}
        <Route path="/" element={<Login />} />

        {/* Área Driver */}
        <Route
          path="/driver"
          element={
            <RequireRole role="driver">
              <DriverLayout />
            </RequireRole>
          }
        >
          <Route index element={<DriverHome />} />
          <Route path="trips/new" element={<DriverTripForm />} />
          <Route path="trips" element={<DriverTripList />} />
        </Route>

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
          <Route path="trips" element={<AdminTrips />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


export default RouteComponent;
