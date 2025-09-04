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
  
  const kibanaBaseUrl = process.env.REACT_APP_KIBANA_URL || 'http://localhost:5601';
  
  // Calculate appropriate time bucket based on check interval
  const getTimeBucket = () => {
    const intervalSeconds = checkInterval / 1000;
    if (intervalSeconds <= 60) return '1m';
    if (intervalSeconds <= 300) return '5m';
    if (intervalSeconds <= 900) return '15m';
    return '30m';
  };

  // Setup Kibana data view and get chart URL
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
        
        // Create site-specific filtered URL using correct field name
        const query = `siteId:"${siteId}"`;
        const filteredUrl = `${kibanaBaseUrl}/app/discover#/?embed=true&_g=(time:(from:now-${timeRange},to:now))&_a=(index:uptime-checks,query:(language:kuery,query:'${query}'))`;
        
        console.log('=== FIXED URL FOR', siteName, '===');
        console.log('SiteId:', siteId);
        console.log('Corrected Query:', query);
        console.log('URL:', filteredUrl);
        
        const directUrl = filteredUrl;
        
        setChartUrl(directUrl);
        
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
  }, [siteId, timeRange, kibanaBaseUrl]);

  const iframeUrl = chartUrl;

  if (loading) {
    return (
      <div className="kibana-chart-container">
        <div className="chart-header">
          <h4>{siteName} - Uptime Trend</h4>
          <span className="chart-interval">Check interval: {Math.round(checkInterval / 1000)}s</span>
        </div>
        <div className="chart-iframe-wrapper" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Setting up chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kibana-chart-container">
      <div className="chart-header">
        <h4>{siteName} - Uptime Trend</h4>
        <span className="chart-interval">Check interval: {Math.round(checkInterval / 1000)}s</span>
      </div>
      
      <div className="chart-iframe-wrapper" style={{ height: `${height}px` }}>
        {error && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>Chart setup in progress. Please refresh in a moment.</p>
          </div>
        )}
        {!error && iframeUrl && (
          <iframe
            src={iframeUrl}
            title={`${siteName} Uptime Chart`}
            width="100%"
            height="100%"
            frameBorder="0"
            loading="eager"
            style={{
              border: 'none',
              borderRadius: '4px'
            }}
            allow="fullscreen"
            onLoad={() => console.log('Iframe loaded successfully')}
            onError={() => console.error('Iframe failed to load')}
          />
        )}
      </div>
      
      <div className="chart-footer">
        <small>Last {timeRange} • Response time and status</small>
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
