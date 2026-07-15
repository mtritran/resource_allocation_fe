import React, { useEffect, useState } from 'react';
import { api, UtilizationResponse, AvailableResponse, OverloadedResponse } from '../services/api';
import { Users, Briefcase, Activity, AlertTriangle, Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [utilization, setUtilization] = useState<UtilizationResponse[]>([]);
  const [available, setAvailable] = useState<AvailableResponse[]>([]);
  const [overloaded, setOverloaded] = useState<OverloadedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [utilRes, availRes, overloadRes] = await Promise.all([
          api.getUtilizationReport(),
          api.getAvailableReport(),
          api.getOverloadedReport(),
        ]);
        setUtilization(utilRes);
        setAvailable(availRes);
        setOverloaded(overloadRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <Loader2 className="spinner" />
        <span style={{ marginLeft: '1rem' }}>Loading Dashboard Metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle className="empty-state-icon" style={{ color: 'var(--color-danger)' }} />
        <div className="empty-state-title">Dashboard Error</div>
        <p>{error}</p>
      </div>
    );
  }

  // Calculate statistics
  const totalEmployees = utilization.length;
  const avgUtilization = totalEmployees > 0
    ? Math.round(utilization.reduce((acc, curr) => acc + curr.totalAllocation, 0) / totalEmployees)
    : 0;
  const overloadedCount = overloaded.length;
  const availableCount = available.filter(a => a.available > 0).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview Dashboard</h1>
          <p className="page-subtitle">Real-time resource utilization metrics and capacity monitoring.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Employees</h3>
            <div className="metric-value">{totalEmployees}</div>
          </div>
          <div className="metric-icon-box">
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Avg Utilization</h3>
            <div className="metric-value">{avgUtilization}%</div>
          </div>
          <div className="metric-icon-box" style={{ color: 'var(--color-accent)' }}>
            <Activity size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Overloaded Staff</h3>
            <div className="metric-value" style={{ color: overloadedCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {overloadedCount}
            </div>
          </div>
          <div className="metric-icon-box" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Available Resources</h3>
            <div className="metric-value">{availableCount}</div>
          </div>
          <div className="metric-icon-box" style={{ color: 'var(--color-success)' }}>
            <Briefcase size={24} />
          </div>
        </div>
      </div>

      {/* Charts & Details Grid */}
      <div className="charts-grid">
        {/* Utilization Bar Chart */}
        <div className="card-container">
          <div className="card-header">
            <h2 className="card-title">Employee Allocation Breakdown</h2>
          </div>
          <div className="bar-chart-container">
            {utilization.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No allocation data available.</p>
            ) : (
              utilization.map(item => {
                const isOverloaded = item.totalAllocation > 90;
                return (
                  <div key={item.employeeId} className="bar-row">
                    <div className="bar-label" title={item.employeeName}>{item.employeeName}</div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${isOverloaded ? 'overloaded' : ''}`}
                        style={{ width: `${Math.min(item.totalAllocation, 100)}%` }}
                      ></div>
                    </div>
                    <div className={`bar-value ${isOverloaded ? 'badge-completed' : ''}`} style={{ padding: '0 0.25rem', borderRadius: '4px' }}>
                      {item.totalAllocation}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Overloaded Resource Alert Panel */}
        <div className="card-container">
          <div className="card-header">
            <h2 className="card-title">Critical Overload Alerts</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '350px' }}>
            {overloaded.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                🎉 Excellent! No staff is currently overloaded (&gt;90%).
              </div>
            ) : (
              overloaded.map(item => (
                <div
                  key={item.employeeId}
                  style={{
                    background: 'var(--color-danger-bg)',
                    border: '1px solid rgba(244, 63, 94, 0.15)',
                    padding: '1rem',
                    borderRadius: 'var(--border-radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{item.employeeName}</span>
                    <span style={{ color: 'var(--color-danger)' }}>{item.totalAllocation}% Allocated</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Exceeds critical capacity threshold of 90%. Adjust allocations immediately.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
