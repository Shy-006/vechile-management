import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Wrench, ShieldAlert, ClipboardList, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './VehicleDetails.module.css';

export const VehicleDetails = () => {
  const { vehicleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [vehicle, setVehicle] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch vehicle history
      const res = await fetch(`/api/service-records/${vehicleId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve vehicle details.');
      }

      setVehicle(data.vehicle);
      setRecords(data.records);

      // Fetch active reminders to find if this vehicle has an upcoming service
      const reminderUrl = isAdmin ? '/api/service-reminders/admin' : '/api/service-reminders';
      const reminderRes = await fetch(reminderUrl);
      if (reminderRes.ok) {
        const remindersData = await reminderRes.json();
        // Find if there is an active reminder (PENDING or SENT) for this vehicle
        const match = remindersData.find(r => 
          (r.vehicleId?._id === vehicleId || r.vehicleId === vehicleId) && 
          (r.status === 'PENDING' || r.status === 'SENT')
        );
        setActiveReminder(match);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [vehicleId]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '50px', textAlign: 'center' }}>Loading vehicle history details...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={14} />
          <span>Back to Registry</span>
        </button>
        <div className={styles.emptyState} style={{ borderColor: 'var(--color-error)' }}>
          <ShieldAlert size={36} style={{ color: 'var(--color-error)' }} />
          <h3>Access Denied / Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/vehicles')}>
        <ArrowLeft size={14} />
        <span>Back to Registry</span>
      </button>

      {/* Vehicle Info Card */}
      {vehicle && (
        <div className={styles.detailsCard}>
          <div className={styles.infoBlock}>
            <span className={styles.plateBadge}>{vehicle.vehicleNumber}</span>
            <h1 style={{ fontSize: '22px', margin: '8px 0 2px' }}>{vehicle.manufacturer} {vehicle.model}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Registered Vehicle Profile</p>
          </div>

          {isAdmin && vehicle.userId && (
            <div className={styles.infoBlock} style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Vehicle Owner</span>
              <span style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <User size={14} style={{ color: 'var(--color-secondary)' }} />
                {vehicle.userId.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{vehicle.userId.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Active Service Due Alert */}
      {activeReminder && (
        <div className={styles.dueReminder} style={activeReminder.status === 'SENT' ? { borderLeftColor: 'var(--color-error)', backgroundColor: 'rgba(239, 68, 68, 0.04)' } : {}}>
          <Clock size={20} style={{ color: activeReminder.status === 'SENT' ? 'var(--color-error)' : 'var(--color-warning)' }} />
          <div>
            <span style={{ fontWeight: '600', display: 'block', color: activeReminder.status === 'SENT' ? 'var(--color-error)' : 'var(--color-warning)' }}>
              {activeReminder.status === 'SENT' ? 'Maintenance Overdue!' : 'Upcoming Maintenance Scheduled'}
            </span>
            <span style={{ display: 'block', marginTop: '2px' }}>{activeReminder.message}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Next service target date: {new Date(activeReminder.dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div className={styles.historyHeader}>
        <h2>Maintenance Service Logs</h2>
      </div>

      {records.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={40} style={{ color: 'var(--text-muted)' }} />
          <h3>No Maintenance Logs Found</h3>
          <p>This vehicle has not been serviced yet.</p>
          {isAdmin && (
            <Link 
              to="/log-service" 
              state={{ preselectedVehicleId: vehicleId }}
              className={styles.backBtn}
              style={{ background: 'var(--grad-primary)', color: 'white', borderColor: 'transparent', marginTop: '10px' }}
            >
              Log First Service
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.timeline}>
          {records.map(record => (
            <div key={record._id} className={styles.timelineItem}>
              <div className={styles.timelineMarker}>
                <Wrench size={12} style={{ color: 'white' }} />
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.recordHeader}>
                  <span className={styles.recordDate}>
                    {new Date(record.serviceDate).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className={styles.recordTotal}>
                    ${record.totalAmount.toLocaleString()}
                  </span>
                </div>

                {record.remarks && (
                  <p className={styles.recordRemarks}>
                    &ldquo;{record.remarks}&rdquo;
                  </p>
                )}

                <div className={styles.recordServices}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.02em' }}>
                    Performed Service Categories
                  </div>
                  {record.services.map((item, index) => (
                    <div key={index} className={styles.serviceItem}>
                      <span className={styles.serviceName}>{item.serviceId?.serviceName || 'Service Category'}</span>
                      <span className={styles.serviceCost}>${item.cost}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.recordFooter}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} />
                    Performed by: {record.performedBy?.name || 'Unknown'}
                  </span>
                  <span>Logged ID: {record._id.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default VehicleDetails;
