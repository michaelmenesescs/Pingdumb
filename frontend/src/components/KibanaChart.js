import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        
        // First, ensure the data view is created
        await axios.post('/api/kibana/setup-dataview');
        
        // Then get the chart URL for this specific site
        const response = await axios.get(`/api/kibana/chart-url/${siteId}?timeRange=${timeRange}`);
        
        if (response.data.success) {
          setChartUrl(response.data.chartUrl);
        } else {
          throw new Error('Failed to get chart URL');
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
            style={{
              border: 'none',
              borderRadius: '4px'
            }}
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        )}
      </div>
      
      <div className="chart-footer">
        <small>Last {timeRange} • Response time and status</small>
      </div>
    </div>
  );
};

export default KibanaChart;
