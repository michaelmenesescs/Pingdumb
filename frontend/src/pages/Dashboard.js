import React, { useState, useEffect } from 'react';
import { sitesAPI } from '../services/api';
import KibanaChart from '../components/KibanaChart';
import SimpleChart from '../components/SimpleChart';

const Dashboard = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteStats, setSiteStats] = useState({});

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await sitesAPI.getAll();
      console.log('Sites data:', response.data);
      setSites(response.data);
      
      // Load stats for each site
      await loadSiteStats(response.data);
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSiteStats = async (sitesData) => {
    try {
      const statsPromises = sitesData.map(async (site) => {
        try {
          console.log(`Loading stats for site: ${site.name} (ID: ${site.id})`);
          const response = await fetch(`/api/checks/stats/${site.id}?days=1`); // Get last 24 hours
          if (response.ok) {
            const stats = await response.json();
            console.log(`Stats loaded for ${site.name}:`, stats);
            return { siteId: site.id, stats };
          } else {
            const errorText = await response.text();
            console.error(`Failed to load stats for site ${site.id}:`, response.status, errorText);
          }
        } catch (error) {
          console.error(`Error loading stats for site ${site.id}:`, error);
        }
        return { siteId: site.id, stats: null };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ siteId, stats }) => {
        statsMap[siteId] = stats;
      });
      
      setSiteStats(statsMap);
      console.log('All site stats loaded:', statsMap);
    } catch (error) {
      console.error('Error loading site stats:', error);
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
            <span className="stat-label">Avg Uptime</span>
            <span className="stat-value uptime">
              {sites.length > 0 && Object.keys(siteStats).length > 0 ? 
                Math.round(Object.values(siteStats).reduce((sum, stats) => sum + (stats?.uptimePercentage || 0), 0) / Object.keys(siteStats).length) : 0}%
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
                    <span className={`uptime-percentage ${
                      siteStats[site.id]?.uptimePercentage >= 99 ? 'uptime-excellent' :
                      siteStats[site.id]?.uptimePercentage >= 95 ? 'uptime-good' :
                      siteStats[site.id]?.uptimePercentage >= 90 ? 'uptime-warning' : 'uptime-poor'
                    }`}>
                      Uptime: {siteStats[site.id]?.uptimePercentage !== undefined ? 
                        `${siteStats[site.id].uptimePercentage.toFixed(1)}%` : 
                        'Loading...'}
                    </span>
                  </div>
                </div>
                
                <div className="site-chart-container">
                  {/* Dual visualization approach - Enterprise Kibana + Real-time React charts */}
                  <div className="chart-grid">
                    <div className="chart-section">
                      <SimpleChart
                        siteId={site.id}
                        siteName={site.name}
                        height={220}
                        timeRange="24h"
                      />
                    </div>
                    <div className="chart-section">
                      <KibanaChart
                        siteId={site.id}
                        siteName={site.name}
                        checkInterval={site.checkInterval}
                        height={220}
                        timeRange="24h"
                      />
                    </div>
                  </div>
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
