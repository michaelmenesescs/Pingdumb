import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { sitesAPI } from '../services/api';
import KibanaChart from '../components/KibanaChart';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSite, setEditingSite] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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

  const onSubmit = async (data) => {
    try {
      console.log('Form data submitted:', data);
      
      // Convert checkInterval from seconds to milliseconds
      const siteData = {
        ...data,
        checkInterval: parseInt(data.checkInterval) * 1000
      };

      console.log('Processed site data:', siteData);

      if (editingSite) {
        console.log('Updating site:', editingSite.id);
        await sitesAPI.update(editingSite.id, siteData);
        setEditingSite(null);
      } else {
        console.log('Creating new site');
        await sitesAPI.create(siteData);
      }
      
      console.log('Site saved successfully');
      reset();
      setShowForm(false);
      loadSites();
    } catch (error) {
      console.error('Error saving site:', error);
      alert('Error saving site: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    // Convert checkInterval from milliseconds to seconds for the form
    const formData = {
      ...site,
      checkInterval: Math.round(site.checkInterval / 1000)
    };
    reset(formData);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await sitesAPI.delete(id);
        loadSites();
      } catch (error) {
        console.error('Error deleting site:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingSite(null);
    setShowForm(false);
    reset();
  };

  const toggleSiteStatus = async (site) => {
    try {
      await sitesAPI.update(site.id, { isActive: !site.isActive });
      loadSites();
    } catch (error) {
      console.error('Error updating site status:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-header">
        <h2>Sites</h2>
        <p>Loading sites...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Sites</h2>
        <p>Manage your uptime monitoring sites</p>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add New Site
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingSite ? 'Edit Site' : 'Add New Site'}</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label>Site Name</label>
              <input
                type="text"
                {...register('name', { required: 'Site name is required' })}
                placeholder="Enter site name"
              />
              {errors.name && <span className="error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                {...register('url', { 
                  required: 'URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL starting with http:// or https://'
                  }
                })}
                placeholder="https://example.com"
              />
              {errors.url && <span className="error">{errors.url.message}</span>}
            </div>

            <div className="form-group">
              <label>Check Interval (seconds)</label>
              <input
                type="number"
                min="1"
                max="300"
                {...register('checkInterval', { 
                  required: 'Check interval is required',
                  min: { value: 1, message: 'Minimum interval is 1 second' },
                  max: { value: 300, message: 'Maximum interval is 5 minutes (300 seconds)' }
                })}
                placeholder="Enter interval in seconds (1-300)"
                defaultValue="60"
              />
              {errors.checkInterval && <span className="error">{errors.checkInterval.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  {...register('isActive')}
                />
                Active
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingSite ? 'Update Site' : 'Add Site'}
              </button>
              <button type="button" className="btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="sites-grid">
        {sites.map(site => (
          <div key={site.id} className="card site-card">
            <div className="site-header">
              <h3>{site.name}</h3>
              <div className="site-actions">
                <button
                  className={`btn ${site.isActive ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => toggleSiteStatus(site)}
                >
                  {site.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="btn"
                  onClick={() => handleEdit(site)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(site.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="site-details">
              <p><strong>URL:</strong> <a href={site.url} target="_blank" rel="noopener noreferrer">{site.url}</a></p>
              <p><strong>Check Interval:</strong> {Math.round(site.checkInterval / 1000)} seconds</p>
              <p><strong>Status:</strong> 
                <span className={`status-indicator ${site.isActive ? 'status-up' : 'status-down'}`}>
                  {site.isActive ? ' Active' : ' Inactive'}
                </span>
              </p>
              <p><strong>Created:</strong> {new Date(site.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Embedded Kibana Chart for this specific site */}
            {site.isActive && (
              <KibanaChart 
                siteId={site.id}
                siteName={site.name}
                checkInterval={site.checkInterval}
                height={250}
                timeRange="24h"
                chartType="line"
              />
            )}
          </div>
        ))}
      </div>

      {sites.length === 0 && (
        <div className="card">
          <p>No sites configured yet. Add your first site to start monitoring!</p>
        </div>
      )}

      {/* Embedded Kibana Dashboard for Real-time Monitoring */}
      <div className="card">
        <h3>Real-time Monitoring Dashboard</h3>
        <p>Live uptime data and performance metrics for your sites</p>
        
        <div className="iframe-container">
          <iframe
            src={`${process.env.REACT_APP_KIBANA_URL}/app/dashboards#/view/uptime-overview`}
            title="Real-time Uptime Dashboard"
            allowFullScreen
            style={{ border: 'none', width: '100%', height: '600px' }}
          />
        </div>
        
        <div className="dashboard-actions">
          <a 
            href={`${process.env.REACT_APP_KIBANA_URL}/app/dashboards`}
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Open Full Kibana
          </a>
          <button 
            className="btn"
            onClick={() => window.location.reload()}
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sites;
