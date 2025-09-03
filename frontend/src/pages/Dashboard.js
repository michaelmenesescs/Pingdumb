import React, { useState, useEffect } from 'react';
import { sitesAPI } from '../services/api';

const Dashboard = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await sitesAPI.getAll();
      setSites(response.data);
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your uptime monitoring</p>
        <small>Last updated: {new Date().toLocaleTimeString()}</small>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Sites</h3>
          <div className="stat-value">{sites.length}</div>
          <div className="stat-label">Monitored sites</div>
        </div>
        
        <div className="stat-card">
          <h3>Active Sites</h3>
          <div className="stat-value">{sites.filter(site => site.isActive).length}</div>
          <div className="stat-label">Currently monitoring</div>
        </div>
        
        <div className="stat-card">
          <h3>Inactive Sites</h3>
          <div className="stat-value">{sites.filter(site => !site.isActive).length}</div>
          <div className="stat-label">Paused monitoring</div>
        </div>
        
        <div className="stat-card">
          <h3>Monitoring Status</h3>
          <div className="stat-value">{sites.length > 0 ? 'Active' : 'No Sites'}</div>
          <div className="stat-label">System status</div>
        </div>
      </div>

      <div className="card">
        <h3>Site Status Overview</h3>
        {sites.length === 0 ? (
          <p>No sites configured yet. Add your first site to start monitoring!</p>
        ) : (
          <div className="sites-list">
            {sites.map(site => (
              <div key={site.id} className="site-item">
                <div className="site-info">
                  <h4>{site.name}</h4>
                  <p>{site.url}</p>
                  <small>Check interval: {Math.round(site.checkInterval / 1000)} seconds</small>
                </div>
                <div className="site-status">
                  <span className={`status-indicator ${site.isActive ? 'status-up' : 'status-down'}`}>
                    {site.isActive ? '● Active' : '● Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
