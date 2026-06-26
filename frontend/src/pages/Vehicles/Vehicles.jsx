import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, X, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Vehicles.module.css';

export const Vehicles = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [formError, setFormError] = useState('');
  
  // Registration Success details (for auto-created users)
  const [creationDetails, setCreationDetails] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreationDetails(null);

    if (!vehicleNumber || !manufacturer || !model) {
      setFormError('License plate, manufacturer, and model are required.');
      return;
    }

    try {
      const payload = {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        manufacturer: manufacturer.trim(),
        model: model.trim()
      };

      if (isAdmin && ownerEmail) {
        payload.ownerEmail = ownerEmail.trim().toLowerCase();
      }

      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register vehicle.');
      }

      // Add to local state
      setVehicles(prev => [data.vehicle || data, ...prev]);

      // Check if temporary account details were returned
      if (data.ownerCreated) {
        setCreationDetails(data);
      } else {
        // Close modal if no temp password details to show
        handleCloseModal();
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setVehicleNumber('');
    setManufacturer('');
    setModel('');
    setOwnerEmail('');
    setFormError('');
    setCreationDetails(null);
  };

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchesPlate = v.vehicleNumber.toLowerCase().includes(term);
    const matchesMake = v.manufacturer.toLowerCase().includes(term);
    const matchesModel = v.model.toLowerCase().includes(term);
    const matchesOwner = isAdmin && v.userId?.name?.toLowerCase().includes(term);
    const matchesOwnerEmail = isAdmin && v.userId?.email?.toLowerCase().includes(term);

    return matchesPlate || matchesMake || matchesModel || matchesOwner || matchesOwnerEmail;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 6px' }}>Vehicle Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {isAdmin ? 'View and manage all registered customer vehicles.' : 'Manage your registered vehicles and review maintenance files.'}
          </p>
        </div>

        {isAdmin && (
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Register Vehicle</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.searchBar}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by license plate, make, model, owner name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading vehicles list...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No vehicles match your search filter.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredVehicles.map(vehicle => (
            <div key={vehicle._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{vehicle.manufacturer} {vehicle.model}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered vehicle profile</span>
                </div>
                <span className={styles.plate}>{vehicle.vehicleNumber}</span>
              </div>

              <div className={styles.cardBody}>
                {isAdmin && vehicle.userId && (
                  <div className={styles.ownerInfo}>
                    <span className={styles.ownerLabel}>Registered Owner</span>
                    <span className={styles.ownerValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} style={{ color: 'var(--color-secondary)' }} />
                      {vehicle.userId.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{vehicle.userId.email}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <Link to={`/vehicles/${vehicle._id}`} className={styles.viewBtn}>
                  <span>Service History</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal Overlay */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>
                {creationDetails ? 'Account Created Successfully!' : 'Register Vehicle'}
              </h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className={styles.error}>
                <span>{formError}</span>
              </div>
            )}

            {creationDetails ? (
              <div style={{ display: 'flex', flexDirectory: 'column', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.tempPassAlert}>
                  <p style={{ fontWeight: '600', marginBottom: '8px' }}>Important Account Credentials:</p>
                  <p style={{ marginBottom: '4px' }}>A new user account was auto-created for this customer email address. Please share these temporary login details with the owner:</p>
                  <div style={{ fontFamily: 'monospace', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px', margin: '10px 0', fontSize: '13px' }}>
                    <div><strong>Username:</strong> {ownerEmail}</div>
                    <div><strong>Temporary Password:</strong> {creationDetails.temporaryPassword}</div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>They will be prompted to reset their password upon their first sign-in.</p>
                </div>
                <button 
                  className={styles.submitBtn} 
                  onClick={handleCloseModal}
                  style={{ background: 'var(--grad-accent)' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleAddVehicle}>
                <div className={styles.inputGroup}>
                  <label htmlFor="modalPlate">License Plate Number</label>
                  <input
                    type="text"
                    id="modalPlate"
                    className={styles.input}
                    placeholder="e.g. MH12AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="modalMake">Manufacturer / Make</label>
                  <input
                    type="text"
                    id="modalMake"
                    className={styles.input}
                    placeholder="e.g. Toyota, Tesla"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="modalModel">Vehicle Model</label>
                  <input
                    type="text"
                    id="modalModel"
                    className={styles.input}
                    placeholder="e.g. Corolla, Model 3"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>

                {isAdmin && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="modalOwner">Owner Email Address</label>
                    <input
                      type="email"
                      id="modalOwner"
                      className={styles.input}
                      placeholder="customer@example.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      If owner email does not match a registered customer, a new user account will be generated.
                    </span>
                  </div>
                )}

                <button type="submit" className={styles.submitBtn}>
                  Register Vehicle
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Vehicles;
