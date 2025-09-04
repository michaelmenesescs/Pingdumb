import React, { useState, useEffect } from 'react';
import { sitesAPI } from '../services/api';
import KibanaChart from '../components/KibanaChart';

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
      console.log('Sites data:', response.data);
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
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Uptime Monitor Dashboard</h2>
        <p>Real-time monitoring and analytics for all your sites</p>
        <small>Last updated: {new Date().toLocaleTimeString()}</small>
      </div>

      {/* Quick Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Total Sites</span>
          <span className="stat-value">{sites.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value active">{sites.filter(site => site.isActive).length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Inactive</span>
          <span className="stat-value inactive">{sites.filter(site => !site.isActive).length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Uptime</span>
          <span className="stat-value uptime">
            {sites.length > 0 ? Math.round((sites.filter(site => site.isActive).length / sites.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Site Cards with Individual Charts */}
      {sites.length === 0 ? (
        <div className="empty-state">
          <h3>No sites configured yet</h3>
          <p>Add your first site to start monitoring uptime and performance!</p>
          <a href="/sites" className="btn btn-primary">Add Your First Site</a>
        </div>
      ) : (
        <div className="sites-dashboard-grid">
          {sites.map(site => {
            console.log('Rendering site:', site.name, 'with ID:', site.id);
            return (
              <div key={site.id} className="site-dashboard-card">
                <div className="site-card-header">
                  <div className="site-info">
                    <h3>{site.name}</h3>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="site-url">
                      {site.url}
                    </a>
                  </div>
                  <div className="site-status-info">
                    <span className={`status-badge ${site.isActive ? 'status-up' : 'status-down'}`}>
                      {site.isActive ? 'Online' : 'Offline'}
                    </span>
                    <span className="check-interval">
                      Every {Math.round(site.checkInterval / 1000)}s
                    </span>
                  </div>
                </div>
                
                <div className="site-chart-container">
                  <KibanaChart
                    siteId={site.id}
                    siteName={site.name}
                    checkInterval={site.checkInterval}
                    height={250}
                    timeRange="24h"
                  />
                </div>
            </div>
                        );
            })}
          </div>
      )}
    </div>
  );
};

export default Dashboard;
