import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ShieldAlert, ArrowRight, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export const Auth = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Where to redirect after login/register
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setActiveTab('login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Wrench size={32} />
          </div>
          <h1>DriveCare</h1>
          <p>Premium Vehicle Service & Tracking</p>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'login' ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab('login'); setApiError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'register' ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab('register'); setApiError(''); }}
          >
            Register
          </button>
        </div>

        {apiError && (
          <div className={styles.error}>
            <ShieldAlert size={16} />
            <span>{apiError}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="name">Full Name</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.inputIcon} />
                <input 
                  type="text" 
                  id="name"
                  className={styles.input}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input 
                type="email" 
                id="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input 
                type="password" 
                id="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="role">Account Type</label>
              <select 
                id="role"
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER">Customer Account</option>
                <option value="ADMIN">Service Technician / Admin</option>
              </select>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className={styles.demoBox}>
          <div className={styles.demoTitle}>Demo Quick-Fill Accounts</div>
          <div className={styles.demoBadges}>
            <div 
              className={styles.demoBadge} 
              onClick={() => handleDemoFill('admin@example.com', 'admin123')}
            >
              <span className={styles.demoLabel}>Admin:</span>
              <span className={styles.demoCreds}>admin@example.com / admin123</span>
            </div>
            <div 
              className={styles.demoBadge} 
              onClick={() => handleDemoFill('customer@example.com', 'customer123')}
            >
              <span className={styles.demoLabel}>Customer:</span>
              <span className={styles.demoCreds}>customer@example.com / customer123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Auth;
