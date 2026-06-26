import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Wrench, 
  FileText, 
  BarChart3, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  ArrowRight,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State for Customer
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [customerReminders, setCustomerReminders] = useState([]);

  // State for Admin
  const [adminVehiclesCount, setAdminVehiclesCount] = useState(0);
  const [adminServicesCount, setAdminServicesCount] = useState(0);
  const [adminRevenue, setAdminRevenue] = useState(0);
  const [adminReminders, setAdminReminders] = useState([]);
  const [recentServices, setRecentServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      // Fetch vehicles
      const vehiclesRes = await fetch('/api/vehicles');
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setCustomerVehicles(vehiclesData);
      }

      // Fetch active reminders
      const remindersRes = await fetch('/api/service-reminders');
      if (remindersRes.ok) {
        const remindersData = await remindersRes.json();
        setCustomerReminders(remindersData.filter(r => r.status === 'SENT'));
      }
    } catch (err) {
      console.error('Error fetching customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all vehicles count
      const vehiclesRes = await fetch('/api/vehicles');
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setAdminVehiclesCount(vehiclesData.length);
      }

      // Fetch service definitions count
      const servicesRes = await fetch('/api/services');
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setAdminServicesCount(servicesData.length);
      }

      // Fetch revenue stats
      const reportsRes = await fetch('/api/reports/revenue');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setAdminRevenue(reportsData.overall?.totalRevenue || 0);
      }

      // Fetch all reminders
      const remindersRes = await fetch('/api/service-reminders/admin');
      if (remindersRes.ok) {
        const remindersData = await remindersRes.json();
        setAdminReminders(remindersData);
      }

      // Fetch recent service records
      const recordsRes = await fetch('/api/service-records');
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setRecentServices(recordsData);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissReminder = async (id) => {
    try {
      const res = await fetch(`/api/service-reminders/${id}/dismiss`, {
        method: 'PUT'
      });
      if (res.ok) {
        setCustomerReminders(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      console.error('Error dismissing reminder:', err);
    }
  };

  const handleTriggerNotifications = async () => {
    try {
      setTriggerLoading(true);
      const res = await fetch('/api/service-reminders/admin/trigger', {
        method: 'POST'
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error('Error triggering notifications:', err);
    } finally {
      setTriggerLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchCustomerData();
    }
  }, [user, isAdmin]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '50px' }}>Loading Dashboard...</div>;
  }

  // Admin Dashboard Render
  if (isAdmin) {
    const pendingNotificationsCount = adminReminders.filter(r => r.status === 'PENDING' && new Date(r.dueDate) <= new Date()).length;
    const sentNotificationsCount = adminReminders.filter(r => r.status === 'SENT').length;

    return (
      <div className={styles.dashboard}>
        <div className={styles.welcomeSection}>
          <h1>Welcome Back, {user.name}!</h1>
          <p>Here is your overview of DriveCare services and vehicle compliance records.</p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconPrimary}`}>
              <Car size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{adminVehiclesCount}</span>
              <span className={styles.statLabel}>Total Vehicles</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconSuccess}`}>
              <DollarSign size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>${adminRevenue.toLocaleString()}</span>
              <span className={styles.statLabel}>Total Revenue</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconAccent}`}>
              <Wrench size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{adminServicesCount}</span>
              <span className={styles.statLabel}>Catalog Services</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconWarning}`}>
              <Bell size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{sentNotificationsCount}</span>
              <span className={styles.statLabel}>Active Reminders</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className={styles.mainGrid}>
          {/* Left Side: Recent Activity & Reminders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* System Reminders Notification Controller */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>System-Wide Reminders Status</h2>
                {pendingNotificationsCount > 0 && (
                  <button 
                    className={styles.headerActionBtn}
                    onClick={handleTriggerNotifications}
                    disabled={triggerLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={12} className={triggerLoading ? 'spin' : ''} />
                    Trigger {pendingNotificationsCount} Due Alerts
                  </button>
                )}
              </div>

              <div className={styles.remindersContainer}>
                {adminReminders.filter(r => r.status === 'SENT').length === 0 ? (
                  <div className={styles.emptyState}>No active due reminders triggered currently in the system.</div>
                ) : (
                  adminReminders.filter(r => r.status === 'SENT').slice(0, 4).map(reminder => (
                    <div key={reminder._id} className={styles.reminderAlert} style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-error)' }}>
                      <div>
                        <span className={styles.reminderText} style={{ fontWeight: '500' }}>
                          {reminder.message}
                        </span>
                        <span className={styles.reminderDate}>
                          Owner: {reminder.userId?.name || 'Deleted User'} ({reminder.userId?.email || 'N/A'})
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: '700', textTransform: 'uppercase' }}>Overdue</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Services Table */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Recent Service Entries</h2>
                <Link to="/log-service" className={styles.headerActionBtn}>Log New Service</Link>
              </div>

              <div className={styles.recentTableWrapper}>
                {recentServices.length === 0 ? (
                  <div className={styles.emptyState}>No service records logged yet.</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Services</th>
                        <th>Total Cost</th>
                        <th>Technician</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentServices.slice(0, 5).map(record => (
                        <tr key={record._id}>
                          <td>{new Date(record.serviceDate).toLocaleDateString()}</td>
                          <td>
                            <Link to={`/vehicles/${record.vehicleId?._id}`} style={{ fontWeight: '600' }}>
                              {record.vehicleId?.vehicleNumber || 'Unknown'}
                            </Link>
                          </td>
                          <td>
                            {record.services.map(s => s.serviceId?.serviceName).join(', ') || 'N/A'}
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                            ${record.totalAmount}
                          </td>
                          <td>{record.performedBy?.name || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

          {/* Right Side: Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className={styles.sectionCard}>
              <h2>Quick Actions</h2>
              <div className={styles.quickActions}>
                <Link to="/vehicles" className={styles.actionLink}>
                  <Car size={16} className={styles.actionLinkIcon} />
                  <span>Manage Vehicles</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </Link>
                <Link to="/log-service" className={styles.actionLink}>
                  <FileText size={16} className={styles.actionLinkIcon} />
                  <span>Log Service Work</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </Link>
                <Link to="/services" className={styles.actionLink}>
                  <Wrench size={16} className={styles.actionLinkIcon} />
                  <span>Services Catalog</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </Link>
                <Link to="/reports" className={styles.actionLink}>
                  <BarChart3 size={16} className={styles.actionLinkIcon} />
                  <span>View Revenue Analytics</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Customer Dashboard Render
  return (
    <div className={styles.dashboard}>
      <div className={styles.welcomeSection} style={{ background: 'linear-gradient(135deg, #093145, #0d3b66)' }}>
        <h1>Hello, {user.name}!</h1>
        <p>Keep track of your vehicles, service history, and upcoming maintenance schedules.</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconPrimary}`}>
            <Car size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{customerVehicles.length}</span>
            <span className={styles.statLabel}>My Vehicles</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconWarning}`}>
            <Bell size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{customerReminders.length}</span>
            <span className={styles.statLabel}>Due Service Alerts</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Left Side: Active Reminders & Vehicles Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Service Notifications Alerts */}
          {customerReminders.length > 0 && (
            <div className={styles.sectionCard} style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <h2>Active Due Maintenance Reminders</h2>
              <div className={styles.remindersContainer}>
                {customerReminders.map(reminder => (
                  <div key={reminder._id} className={styles.reminderAlert}>
                    <div>
                      <span className={styles.reminderText}>
                        {reminder.message}
                      </span>
                      <span className={styles.reminderDate}>
                        Scheduled Due: {new Date(reminder.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleDismissReminder(reminder._id)}
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles List */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>My Registered Vehicles</h2>
            </div>

            {customerVehicles.length === 0 ? (
              <div className={styles.emptyState}>
                <Car size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p>No vehicles registered to your account yet.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Please contact an administrator to register your vehicle.</p>
              </div>
            ) : (
              <div className={styles.vehicleGrid}>
                {customerVehicles.map(vehicle => (
                  <div key={vehicle._id} className={styles.vehicleCard}>
                    <div className={styles.vehicleHeader}>
                      <div>
                        <h3>{vehicle.manufacturer} {vehicle.model}</h3>
                        <p>Vehicle Identification</p>
                      </div>
                      <span className={styles.vehiclePlate}>{vehicle.vehicleNumber}</span>
                    </div>
                    <div className={styles.vehicleFooter}>
                      <Link to={`/vehicles/${vehicle._id}`} className={styles.actionBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Service Records</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className={styles.sectionCard}>
            <h2>DriveCare Support</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p>For any issues or questions about your service history, pricing, or registration, please contact our support department at support@drivecare.com.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', fontWeight: '600' }}>
                <CheckCircle2 size={16} />
                <span>Compliance Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
