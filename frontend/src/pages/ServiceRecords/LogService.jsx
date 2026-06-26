import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';
import styles from './LogService.module.css';

export const LogService = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If a vehicle ID was passed via route state
  const preselectedVehicleId = location.state?.preselectedVehicleId || '';

  // Data States
  const [vehicles, setVehicles] = useState([]);
  const [catalogServices, setCatalogServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [selectedVehicle, setSelectedVehicle] = useState(preselectedVehicleId);
  const [selectedServices, setSelectedServices] = useState({}); // format: { serviceId: cost }
  const [remarks, setRemarks] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextServiceDate, setNextServiceDate] = useState('');
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFormError('');
        
        // Fetch vehicles
        const vRes = await fetch('/api/vehicles');
        const vContentType = vRes.headers.get('content-type');
        if (!vContentType || !vContentType.includes('application/json')) {
          throw new Error('Server returned invalid data format (HTML). Please verify the backend is running and the route exists.');
        }
        const vData = await vRes.json();
        if (!vRes.ok) {
          throw new Error(vData.error || 'Failed to fetch registered vehicles.');
        }
        setVehicles(vData);

        // Fetch catalog services
        const sRes = await fetch('/api/services');
        const sContentType = sRes.headers.get('content-type');
        if (!sContentType || !sContentType.includes('application/json')) {
          throw new Error('Server returned invalid data format (HTML). Please verify the backend is running and the route exists.');
        }
        const sData = await sRes.json();
        if (!sRes.ok) {
          throw new Error(sData.error || 'Failed to fetch catalog service definitions.');
        }
        setCatalogServices(sData);
      } catch (err) {
        console.error('Error fetching logs prerequisites:', err);
        setFormError(err.message || 'Failed to load form prerequisites. Please check your backend connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckboxChange = (serviceId, basePrice, isChecked) => {
    setSelectedServices(prev => {
      const copy = { ...prev };
      if (isChecked) {
        copy[serviceId] = basePrice;
      } else {
        delete copy[serviceId];
      }
      return copy;
    });
  };

  const handleCostChange = (serviceId, cost) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: cost === '' ? '' : Number(cost)
    }));
  };

  // Compute live total cost
  const totalAmount = Object.values(selectedServices).reduce((sum, val) => sum + (Number(val) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedVehicle) {
      setFormError('Please select a vehicle.');
      return;
    }

    const servicesPayload = Object.entries(selectedServices).map(([serviceId, cost]) => {
      if (cost === '') {
        throw new Error('Please specify a cost for all selected services.');
      }
      return { serviceId, cost };
    });

    if (servicesPayload.length === 0) {
      setFormError('Please select at least one service category.');
      return;
    }

    // Validate next service date is after service date
    if (nextServiceDate) {
      const sDateObj = new Date(serviceDate);
      const nDateObj = new Date(nextServiceDate);
      if (nDateObj <= sDateObj) {
        setFormError('Next service due date must be scheduled after the service date.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        vehicleId: selectedVehicle,
        services: servicesPayload,
        remarks: remarks.trim(),
        serviceDate
      };

      if (nextServiceDate) {
        payload.nextServiceDate = nextServiceDate;
      }

      const res = await fetch('/api/service-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit service record.');
      }

      setFormSuccess('Service record successfully logged!');
      setTimeout(() => {
        // Navigate back to the selected vehicle's history page
        navigate(`/vehicles/${selectedVehicle}`);
      }, 1500);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '50px', textAlign: 'center' }}>Loading log prerequisites...</div>;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
        <ArrowLeft size={14} />
        <span>Go Back</span>
      </button>

      <div className={styles.card}>
        <h2>Log Service Entry</h2>

        {formError && (
          <div className={styles.error}>
            <ShieldAlert size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className={styles.success}>
            <CheckCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
            <span>{formSuccess}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Vehicle Dropdown */}
          <div className={styles.inputGroup}>
            <label htmlFor="vehicle">Select Vehicle</label>
            <select
              id="vehicle"
              className={styles.select}
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              required
            >
              <option value="">-- Choose a registered vehicle --</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>
                  {v.vehicleNumber} - {v.manufacturer} {v.model} {v.userId ? `(${v.userId.name})` : ''}
                </option>
              ))}
            </select>
            {vehicles.length === 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
                No registered vehicles found. Please <Link to="/vehicles" style={{ textDecoration: 'underline', color: 'var(--color-secondary)' }}>Register a Vehicle</Link> first.
              </span>
            )}
          </div>

          {/* Services Checklist */}
          <div className={styles.inputGroup}>
            <label>Service Categories Performed</label>
            <div className={styles.servicesList}>
              {catalogServices.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
                  No service categories found in the catalog. Please <Link to="/services" style={{ textDecoration: 'underline', color: 'var(--color-secondary)' }}>Configure a Category</Link> first.
                </div>
              ) : (
                catalogServices.map(service => {
                  const isChecked = selectedServices[service._id] !== undefined;
                  return (
                    <div key={service._id} className={styles.serviceRow}>
                      <label className={styles.serviceLabel}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxChange(service._id, service.basePrice, e.target.checked)}
                        />
                        <span>{service.serviceName}</span>
                      </label>
                      
                      <input
                        type="number"
                        className={styles.costInput}
                        placeholder={`$${service.basePrice}`}
                        min="0"
                        step="0.01"
                        disabled={!isChecked}
                        value={isChecked ? (selectedServices[service._id] ?? '') : ''}
                        onChange={(e) => handleCostChange(service._id, e.target.value)}
                        required={isChecked}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live Total Cost */}
          <div className={styles.totalBanner}>
            <span className={styles.totalLabel}>Computed Total Amount:</span>
            <span className={styles.totalVal}>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Dates Row */}
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="serviceDate">Service Date</label>
              <input
                type="date"
                id="serviceDate"
                className={styles.input}
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="nextServiceDate">Next Service Due Date (Optional)</label>
              <input
                type="date"
                id="nextServiceDate"
                className={styles.input}
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
                placeholder="Calculates 3 months default if left blank"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className={styles.inputGroup}>
            <label htmlFor="remarks">Service Notes / Remarks</label>
            <textarea
              id="remarks"
              className={styles.textarea}
              placeholder="Describe work details, part replacements, recommended intervals..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Saving Service Log...' : 'Record Service Log'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default LogService;
