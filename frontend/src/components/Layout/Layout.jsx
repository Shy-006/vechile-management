import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../Navbar/Navbar';
import { Sidebar } from '../Sidebar/Sidebar';
import styles from './Layout.module.css';

export const Layout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        gap: '16px',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--bg-tertiary)',
          borderTopColor: 'var(--color-secondary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>Loading Session...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password reset if user is on temporary password
  if (user.isTemporaryPassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div className={styles.layoutContainer}>
      <Navbar />
      <div className={styles.mainBody}>
        <Sidebar />
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
