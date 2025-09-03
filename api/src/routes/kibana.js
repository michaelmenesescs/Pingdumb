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
    if (error.response?.status === 409) {
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

// Get visualization URL for a specific site
router.get('/chart-url/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { timeRange = '24h' } = req.query;
    
    // Use external Kibana URL for browser access
    const externalKibanaUrl = 'http://localhost:5601';
    
    // Build a URL for a line chart visualization
    const chartUrl = `${externalKibanaUrl}/app/lens#/?embed=true&_g=(time:(from:now-${timeRange},to:now))&_a=(datasourceStates:(indexpattern:(layers:(layer1:(columnOrder:!('timestamp','responseTime'),columns:('timestamp':(dataType:date,isBucketed:!t,label:'@timestamp',operationType:date_histogram,params:(interval:auto),scale:interval,sourceField:'timestamp'),'responseTime':(dataType:number,isBucketed:!f,label:'Average responseTime',operationType:average,scale:ratio,sourceField:responseTime)),incompleteColumns:())))),visualization:(layers:!((accessors:!('responseTime'),layerId:layer1,seriesType:line,xAccessor:'timestamp')),legend:(isVisible:!f),preferredSeriesType:line,title:'Response Time Trend'))`;
    
    res.json({ 
      success: true, 
      chartUrl,
      siteId,
      timeRange 
    });
    
  } catch (error) {
    console.error('Error generating chart URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate chart URL',
      details: error.message 
    });
  }
});

module.exports = router;
