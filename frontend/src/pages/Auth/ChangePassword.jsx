import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './ChangePassword.module.css';

export const ChangePassword = () => {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const msg = await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(msg || 'Password updated successfully!');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--color-warning)', marginBottom: '8px' }}>
            <ShieldCheck size={36} />
          </div>
          <h2>Update Password</h2>
          {user?.isTemporaryPassword ? (
            <p style={{ color: 'var(--color-warning)' }}>
              <strong>Required action:</strong> You are currently using a temporary password. Please set a secure password to unlock full access to DriveCare.
            </p>
          ) : (
            <p>Modify your login password below.</p>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <CheckCircle size={16} />
            <span>{success} Redirecting...</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="currentPassword">Current Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                id="currentPassword"
                className={styles.input}
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                id="newPassword"
                className={styles.input}
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                id="confirmPassword"
                className={styles.input}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default ChangePassword;
