import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import Auth from './pages/Auth/Auth';
import ChangePassword from './pages/Auth/ChangePassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Vehicles from './pages/Vehicles/Vehicles';
import VehicleDetails from './pages/Vehicles/VehicleDetails';
import Services from './pages/Services/Services';
import LogService from './pages/ServiceRecords/LogService';
import Reports from './pages/Reports/Reports';

// Guard for admin-only pages
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login/Register Page */}
        <Route path="/login" element={<Auth />} />

        {/* Protected Pages under Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:vehicleId" element={<VehicleDetails />} />
          <Route path="change-password" element={<ChangePassword />} />

          {/* Admin Protected routes */}
          <Route 
            path="services" 
            element={
              <AdminRoute>
                <Services />
              </AdminRoute>
            } 
          />
          <Route 
            path="log-service" 
            element={
              <AdminRoute>
                <LogService />
              </AdminRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <AdminRoute>
                <Reports />
              </AdminRoute>
            } 
          />
        </Route>

        {/* Redirect unmatched URLs to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
