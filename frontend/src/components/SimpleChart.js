import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const SimpleChart = ({ 
  siteId, 
  siteName, 
  height = 300, 
  timeRange = '24h'
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch uptime check data for this specific site
        const response = await axios.get(`/api/checks/site/${siteId}`);
        
        if (response.data && response.data.length > 0) {
          // Process the data for the chart
          const chartData = response.data
            .slice(-100) // Get last 100 data points
            .map(check => ({
              time: new Date(check.timestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              responseTime: check.responseTime,
              status: check.status === 'up' ? 1 : 0,
              timestamp: check.timestamp
            }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          setData(chartData);
        } else {
          setData([]);
        }
        
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (siteId) {
      fetchChartData();
    }
  }, [siteId, timeRange]);

  if (loading) {
    return (
      <div style={{ 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#666', margin: 0 }}>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#dc2626', margin: 0, textAlign: 'center' }}>
          Unable to load chart data<br/>
          <small>Check if monitoring data is available</small>
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#0369a1', margin: 0, textAlign: 'center' }}>
          No monitoring data yet<br/>
          <small>Chart will appear once data is collected</small>
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: '0 0 4px', color: '#374151', fontSize: '16px' }}>
          {siteName} - Response Time Trend
        </h4>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
          Last {data.length} checks • Average: {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.responseTime, 0) / data.length) : 0}ms
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#d1d5db"
            label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value, name) => [
              `${value}ms`, 
              'Response Time'
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="responseTime" 
            stroke="#6366f1" 
            strokeWidth={2}
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleChart;
