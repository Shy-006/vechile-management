import React, { useState, useEffect } from 'react';
import { Wrench, Plus, ShieldAlert, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Services.module.css';

export const Services = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [serviceName, setServiceName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!serviceName || basePrice === '') {
      setFormError('Service category name and baseline pricing are required.');
      return;
    }

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: serviceName.trim(),
          basePrice: Number(basePrice)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add service definition.');
      }

      setFormSuccess('Service category added to catalog.');
      setServices(prev => [...prev, data].sort((a, b) => a.serviceName.localeCompare(b.serviceName)));
      setServiceName('');
      setBasePrice('');
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 style={{ fontSize: '24px', margin: '0 0 6px' }}>Service Catalog</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Browse standard service options, rates, and catalog descriptions.
        </p>
      </div>

      <div className={styles.layout}>
        {/* Left Side: Services List */}
        <div className={styles.card}>
          <h2>Catalog Categories</h2>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>Loading catalog...</div>
          ) : services.length === 0 ? (
            <div className={styles.emptyState}>No service categories registered.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Standard Base Price</th>
                    <th>Date Configured</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service._id}>
                      <td style={{ fontWeight: '600' }}>{service.serviceName}</td>
                      <td className={styles.price}>${service.basePrice.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(service.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Admin Form */}
        {isAdmin && (
          <div className={styles.card}>
            <h2>Configure Category</h2>
            
            {formError && (
              <div className={styles.error}>
                <ShieldAlert size={14} style={{ marginRight: '6px', display: 'inline' }} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className={styles.success}>
                <CheckCircle size={14} style={{ marginRight: '6px', display: 'inline' }} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form className={styles.form} onSubmit={handleCreateService}>
              <div className={styles.inputGroup}>
                <label htmlFor="serviceName">Category Name</label>
                <input
                  type="text"
                  id="serviceName"
                  className={styles.input}
                  placeholder="e.g. Brake Fluid Exchange"
                  value={serviceName}
                  onChange={(e) => { setServiceName(e.target.value); setFormError(''); setFormSuccess(''); }}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="basePrice">Base Price ($)</label>
                <input
                  type="number"
                  id="basePrice"
                  className={styles.input}
                  placeholder="e.g. 79.99"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => { setBasePrice(e.target.value); setFormError(''); setFormSuccess(''); }}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                <Plus size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
                Create Service
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default Services;
