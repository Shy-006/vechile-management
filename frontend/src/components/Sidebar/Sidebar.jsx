import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Wrench, 
  FileText, 
  BarChart3,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  // Navigation config based on roles
  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      show: true
    },
    {
      path: '/vehicles',
      label: 'Vehicles',
      icon: <Car size={18} />,
      show: true
    },
    {
      path: '/services',
      label: 'Services Catalog',
      icon: <Wrench size={18} />,
      show: isAdmin
    },
    {
      path: '/log-service',
      label: 'Log Service',
      icon: <FileText size={18} />,
      show: isAdmin
    },
    {
      path: '/reports',
      label: 'Analytics Reports',
      icon: <BarChart3 size={18} />,
      show: isAdmin
    },
    {
      path: '/change-password',
      label: 'Reset Password',
      icon: <KeyRound size={18} />,
      show: user.isTemporaryPassword
    }
  ];

  return (
    <aside className={styles.sidebar}>
      {navItems
        .filter(item => item.show)
        .map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `${styles.link} ${isActive ? styles.activeLink : ''}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}

      <div className={styles.sidebarFooter}>
        <p>DriveCare v1.0.0</p>
        <p style={{ marginTop: '4px', fontSize: '9px' }}>Logged in as: {user.role}</p>
      </div>
    </aside>
  );
};
