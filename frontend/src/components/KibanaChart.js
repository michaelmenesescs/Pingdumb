import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const KibanaChart = ({ 
  siteId, 
  siteName, 
  checkInterval, 
  height = 300, 
  timeRange = '24h',
  chartType = 'line'
}) => {
  const [chartUrl, setChartUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentData, setRecentData] = useState([]);
  
  const kibanaBaseUrl = process.env.REACT_APP_KIBANA_URL || 'http://localhost:5601';
  
  // Calculate appropriate time bucket based on check interval
  const getTimeBucket = () => {
    const intervalSeconds = checkInterval / 1000;
    if (intervalSeconds <= 60) return '1m';
    if (intervalSeconds <= 300) return '5m';
    if (intervalSeconds <= 900) return '15m';
    return '30m';
  };

  // Setup Kibana visualization and get chart URL
  useEffect(() => {
    const setupKibanaAndGetUrl = async () => {
      try {
        setLoading(true);
        
        console.log('=== KibanaChart Debug ===');
        console.log('siteId:', siteId);
        console.log('siteName:', siteName);
        console.log('siteId type:', typeof siteId);
        console.log('siteId length:', siteId?.length);
        
        if (!siteId || siteId === 'undefined' || siteId === '') {
          console.error('Invalid siteId:', siteId);
          setError('Invalid site ID');
          setLoading(false);
          return;
        }
        

        try {
          const response = await axios.get(`/api/checks/site/${siteId}?size=20`);
          const recentChecks = response.data || [];
          
          // Store the data to display as a table
          setChartUrl(null); // No iframe needed
          setRecentData(recentChecks);
          
          console.log('=== LOADED RECENT CHECK DATA FOR', siteName, '===');
          console.log('Records:', recentChecks.length);
          
        } catch (fetchError) {
          console.error('Error fetching check data:', fetchError);
          setError('Unable to load monitoring data');
        }
        
      } catch (err) {
        console.error('Error setting up Kibana chart:', err);
        setError(err.message);
        
        // Fallback to basic Discover URL
        const fallbackUrl = `${kibanaBaseUrl}/app/discover#/?embed=true&_g=(time:(from:now-${timeRange},to:now))`;
        setChartUrl(fallbackUrl);
        
      } finally {
        setLoading(false);
      }
    };

    setupKibanaAndGetUrl();
  }, [siteId, timeRange, kibanaBaseUrl, siteName]);

  if (loading) {
    return (
      <div className="kibana-chart-container">
        <div className="chart-header">
          <h4>{siteName} - Response Time Analytics</h4>
          <span className="chart-interval">Check interval: {Math.round(checkInterval / 1000)}s</span>
        </div>
        <div className="chart-iframe-wrapper" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Setting up Kibana visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kibana-chart-container">
      <div className="chart-header">
        <h4>{siteName} - Kibana Data Explorer</h4>
        <span className="chart-interval">Raw monitoring data • Check interval: {Math.round(checkInterval / 1000)}s</span>
      </div>
      
      <div className="chart-data-wrapper" style={{ height: `${height}px`, overflow: 'auto' }}>
        {error && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>{error}</p>
            <p style={{ fontSize: '12px', marginTop: '10px' }}>
              <a href={`http://localhost:5601/app/discover#/?_g=(time:(from:now-${timeRange},to:now))&_a=(query:(language:kuery,query:'siteId:"${siteId}"'))`} target="_blank" rel="noopener noreferrer">
                View {siteName} data in Kibana →
              </a>
            </p>
          </div>
        )}
        {!error && recentData.length > 0 && (
          <div style={{ padding: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e1e5e9', backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#6c757d' }}>Time</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#6c757d' }}>Response Time</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#6c757d' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentData.slice(0, 15).map((check, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '6px 8px', color: '#495057' }}>
                      {new Date(check.timestamp).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: check.responseTime > 1000 ? '#dc3545' : check.responseTime > 500 ? '#fd7e14' : '#28a745' }}>
                      {check.responseTime}ms
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: check.status === 'up' ? '#d4edda' : '#f8d7da',
                        color: check.status === 'up' ? '#155724' : '#721c24'
                      }}>
                        {check.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!error && recentData.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
            <p>No monitoring data available yet.</p>
            <p style={{ fontSize: '12px' }}>Data will appear once monitoring checks begin.</p>
          </div>
        )}
      </div>
      
      <div className="chart-footer">
        <small>Kibana Discover • Last {timeRange} • Enterprise data platform integration</small>
      </div>
    </div>
  );
};

// PropTypes validation
KibanaChart.propTypes = {
  siteId: PropTypes.string.isRequired,
  siteName: PropTypes.string.isRequired,
  checkInterval: PropTypes.number,
  height: PropTypes.number,
  timeRange: PropTypes.string,
  chartType: PropTypes.string
};

KibanaChart.defaultProps = {
  height: 300,
  timeRange: '24h',
  chartType: 'line',
  checkInterval: 60000
};

export default KibanaChart;
