import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './NotificationCenter.module.css';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/service-reminders');
      if (res.ok) {
        const data = await res.json();
        // Show SENT (triggered notifications) and PENDING (upcoming reminders)
        setReminders(data);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  useEffect(() => {
    fetchReminders();
    
    // Poll for notifications every 60 seconds to keep dashboard dynamic
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/service-reminders/${id}/dismiss`, {
        method: 'PUT'
      });
      if (res.ok) {
        // Remove or update the dismissed reminder local state
        setReminders(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      console.error('Error dismissing reminder:', err);
    }
  };

  // Only display SENT reminders as active unread notifications in the badge
  const unreadCount = reminders.filter(r => r.status === 'SENT').length;
  // Sort reminders to show active SENT notifications first
  const activeNotifications = reminders.filter(r => r.status === 'SENT');

  return (
    <div className={styles.container} ref={containerRef} style={{ position: 'relative' }}>
      <button 
        className={styles.bellBtn} 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchReminders();
        }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.notificationCenter}>
          <div className={styles.header}>
            <h3>Service Reminders</h3>
            {unreadCount > 0 && <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{unreadCount} due</span>}
          </div>
          
          <div className={styles.list}>
            {activeNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <BellOff size={24} style={{ color: 'var(--text-muted)' }} />
                <span>No active service notifications.</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>We will alert you when your vehicle is due for service.</span>
              </div>
            ) : (
              activeNotifications.map(reminder => (
                <div key={reminder._id} className={`${styles.item} ${styles.unread}`}>
                  <span className={styles.message}>{reminder.message}</span>
                  <div className={styles.footer}>
                    <span className={styles.date}>
                      Due: {new Date(reminder.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button 
                      className={styles.dismissBtn}
                      onClick={(e) => handleDismiss(reminder._id, e)}
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
