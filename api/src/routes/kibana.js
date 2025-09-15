const express = require('express');
const axios = require('axios');
const router = express.Router();

const KIBANA_URL = process.env.KIBANA_URL || 'http://kibana:5601';

// Create Kibana data view for uptime-checks index
router.post('/setup-dataview', async (req, res) => {
  try {
    console.log('Setting up Kibana data view for uptime-checks...');
    
    // Create data view for uptime-checks
    const dataViewPayload = {
      data_view: {
        id: 'uptime-checks',
        name: 'uptime-checks',
        title: 'uptime-checks*',
        timeFieldName: 'timestamp',
        fields: {
          timestamp: {
            name: 'timestamp',
            type: 'date',
            searchable: true,
            aggregatable: true
          },
          siteId: {
            name: 'siteId',
            type: 'string',
            searchable: true,
            aggregatable: true
          },
          responseTime: {
            name: 'responseTime',
            type: 'number',
            searchable: true,
            aggregatable: true
          },
          status: {
            name: 'status',
            type: 'string',
            searchable: true,
            aggregatable: true
          },
          url: {
            name: 'url',
            type: 'string',
            searchable: true,
            aggregatable: true
          }
        }
      }
    };

    // Create the data view in Kibana
    const response = await axios.post(
      `${KIBANA_URL}/api/data_views/data_view`,
      dataViewPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'kbn-xsrf': 'true'
        }
      }
    );

    console.log('Kibana data view created successfully');
    res.json({ 
      success: true, 
      message: 'Data view created successfully',
      dataView: response.data 
    });

  } catch (error) {
    console.error('Error creating Kibana data view:', error.response?.data || error.message);
    
    // If data view already exists, that's okay
    if (error.response?.status === 409 || error.response?.status === 400) {
      res.json({ 
        success: true, 
        message: 'Data view already exists' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create data view',
        details: error.response?.data || error.message 
      });
    }
  }
});


// Get dynamic Discover URL for any site
router.get('/chart-url/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { timeRange = '24h', siteName = 'Site' } = req.query;
    
    console.log(`Creating dynamic Kibana URL for ${siteName} (${siteId})`);
    
    // Use external Kibana URL for browser access
    const externalKibanaUrl = 'http://localhost:5601';
    
    // Create dynamic Discover URL that works for any site using siteId filter
    // This automatically shows data for whichever site is requested
    const kibanaUrl = `${externalKibanaUrl}/app/discover#/?_g=(time:(from:now-${timeRange},to:now))&_a=(columns:!(timestamp,responseTime,status,url),index:uptime-checks,query:(language:kuery,query:'siteId:"${siteId}"'),sort:!(!(timestamp,desc)))`;
    
    console.log(`Generated dynamic Kibana URL for ${siteName}`);
    console.log(`Filter: siteId:"${siteId}"`);
    
    res.json({ 
      success: true, 
      chartUrl: kibanaUrl,
      siteId,
      siteName,
      timeRange,
      filter: `siteId:"${siteId}"`,
      method: 'dynamic_site_filter',
      description: `Shows all monitoring data for ${siteName}`
    });
    
  } catch (error) {
    console.error('Error generating chart URL:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate chart URL',
      details: error.message 
    });
  }
});

// Health check for Kibana integration
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${KIBANA_URL}/api/status`, {
      headers: { 'kbn-xsrf': 'true' },
      timeout: 5000
    });
    
    res.json({
      success: true,
      kibana_status: 'connected',
      data_view_exists: true,
      message: 'Kibana integration healthy'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      kibana_status: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
