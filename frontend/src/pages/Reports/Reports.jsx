import React, { useState, useEffect } from 'react';
import { DollarSign, ClipboardList, ShieldAlert, BarChart } from 'lucide-react';
import styles from './Reports.module.css';

export const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/reports/revenue');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve reports.');
      }
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '50px', textAlign: 'center' }}>Loading reports data...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState} style={{ borderColor: 'var(--color-error)' }}>
          <ShieldAlert size={36} style={{ color: 'var(--color-error)' }} />
          <h3>Error Loading Reports</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const overall = reportData?.overall || { totalRevenue: 0, totalCount: 0 };
  const monthlyData = reportData?.monthly || [];

  // Sort monthly data chronologically (aggregate returns them grouped, usually we want old to new on the chart)
  const sortedMonths = [...monthlyData].reverse();

  // Find max revenue value to scale chart bars appropriately
  const maxRevenue = sortedMonths.reduce((max, m) => Math.max(max, m.totalRevenue), 0) || 100;

  // Chart configuration for responsive SVG coordinates
  const svgWidth = 600;
  const svgHeight = 280;
  const chartHeight = 200; // max height of a bar
  const paddingX = 60;
  const paddingY = 40;
  
  const barWidth = sortedMonths.length > 0 
    ? Math.min(40, ((svgWidth - (paddingX * 2)) / sortedMonths.length) * 0.6) 
    : 40;

  const getBarX = (index) => {
    if (sortedMonths.length === 0) return 0;
    const availableWidth = svgWidth - (paddingX * 2);
    const spacing = availableWidth / sortedMonths.length;
    return paddingX + (index * spacing) + (spacing - barWidth) / 2;
  };

  // Convert monthly "YYYY-MM" to readable "MMM YY" (e.g. "Jun 26")
  const formatMonthLabel = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 style={{ fontSize: '24px', margin: '0 0 6px' }}>Business Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Evaluate store performance, historical revenue, and metrics.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconSuccess}`}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>${overall.totalRevenue.toLocaleString()}</span>
            <span className={styles.statLabel}>Total Store Revenue</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconAccent}`}>
            <ClipboardList size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{overall.totalCount}</span>
            <span className={styles.statLabel}>Total Services Logged</span>
          </div>
        </div>
      </div>

      {/* Custom SVG Bar Chart */}
      <div className={styles.chartCard}>
        <h2>Monthly Revenue Breakdown</h2>
        
        {sortedMonths.length === 0 ? (
          <div className={styles.emptyState}>
            <BarChart size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p>No service records logged yet to compile charts.</p>
          </div>
        ) : (
          <div className={styles.chartContainer}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className={styles.chartSvg} width="100%">
              {/* Define bar gradients */}
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + (chartHeight * (1 - ratio));
                const value = Math.round(maxRevenue * ratio);
                return (
                  <g key={i}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      className={styles.chartGridLine} 
                    />
                    <text 
                      x={paddingX - 10} 
                      y={y + 4} 
                      className={styles.chartText} 
                      style={{ textAnchor: 'end', fontWeight: '500' }}
                    >
                      ${value}
                    </text>
                  </g>
                );
              })}

              {/* Draw Bars */}
              {sortedMonths.map((month, index) => {
                const height = (month.totalRevenue / maxRevenue) * chartHeight;
                const x = getBarX(index);
                const y = paddingY + chartHeight - height;

                return (
                  <g key={month._id}>
                    {/* Hoverable Bar Tooltip text */}
                    {month.totalRevenue > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        className={styles.chartText}
                        style={{ fontWeight: '600', fill: 'var(--text-primary)' }}
                      >
                        ${Math.round(month.totalRevenue)}
                      </text>
                    )}

                    {/* SVG Rect bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, height)} // min height 2px to make zero/small values visible
                      rx={4}
                      className={styles.chartBar}
                    />

                    {/* Month Label */}
                    <text
                      x={x + barWidth / 2}
                      y={paddingY + chartHeight + 20}
                      className={styles.chartText}
                    >
                      {formatMonthLabel(month._id)}
                    </text>
                  </g>
                );
              })}

              {/* Axis line */}
              <line 
                x1={paddingX} 
                y1={paddingY + chartHeight} 
                x2={svgWidth - paddingX} 
                y2={paddingY + chartHeight} 
                className={styles.chartAxis} 
              />
            </svg>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      {sortedMonths.length > 0 && (
        <div className={styles.tableCard}>
          <h2>Historical Summary Table</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Completed Services</th>
                  <th>Monthly Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map(month => (
                  <tr key={month._id}>
                    <td style={{ fontWeight: '600' }}>
                      {new Date(month._id + '-02').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </td>
                    <td>{month.serviceCount} service entries logged</td>
                    <td style={{ fontWeight: '700', color: 'var(--color-success)', fontFamily: 'monospace' }}>
                      ${month.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reports;
