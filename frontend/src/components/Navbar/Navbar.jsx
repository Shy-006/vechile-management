import React from 'react';
import { LogOut, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../NotificationCenter/NotificationCenter';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Get initials for profile avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.titleArea}>
        <Wrench size={22} style={{ color: 'var(--color-secondary)' }} />
        <h2>DriveCare</h2>
      </div>

      <div className={styles.rightArea}>
        {/* Render notification bell for users */}
        <NotificationCenter />

        <div className={styles.profileInfo}>
          <div className={styles.avatar}>
            {getInitials(user.name)}
          </div>
          <div className={styles.details}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.role}>{user.role}</span>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};
