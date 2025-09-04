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

// Create a saved visualization in Kibana for a specific site
router.post('/create-visualization/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { siteName } = req.body;
    
    console.log(`Creating Kibana visualization for site: ${siteName} (${siteId})`);
    
    // Create a line chart visualization for this specific site
    const visualizationPayload = {
      attributes: {
        title: `${siteName} - Response Time`,
        type: 'line',
        description: `Response time chart for ${siteName}`,
        visState: JSON.stringify({
          title: `${siteName} - Response Time`,
          type: 'line',
          params: {
            grid: { categoryLines: false, style: { color: '#eee' } },
            categoryAxes: [{
              id: 'CategoryAxis-1',
              type: 'category',
              position: 'bottom',
              show: true,
              labels: { show: true, truncate: 100 }
            }],
            valueAxes: [{
              id: 'ValueAxis-1',
              name: 'LeftAxis-1',
              type: 'value',
              position: 'left',
              show: true,
              labels: { show: true, rotate: 0, filter: false, truncate: 100 },
              title: { text: 'Response Time (ms)' }
            }],
            seriesParams: [{
              show: true,
              type: 'line',
              mode: 'normal',
              data: { label: 'Response Time', id: '1' },
              valueAxis: 'ValueAxis-1',
              drawLinesBetweenPoints: true,
              showCircles: true
            }],
            addTooltip: true,
            addLegend: false,
            legendPosition: 'right',
            times: [],
            addTimeMarker: false
          },
          aggs: [
            {
              id: '1',
              enabled: true,
              type: 'avg',
              schema: 'metric',
              params: { field: 'responseTime' }
            },
            {
              id: '2',
              enabled: true,
              type: 'date_histogram',
              schema: 'segment',
              params: {
                field: 'timestamp',
                interval: 'auto',
                min_doc_count: 1
              }
            }
          ]
        }),
        uiStateJSON: '{}',
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({
            index: 'uptime-checks',
            filter: [{
              meta: {
                alias: null,
                disabled: false,
                key: 'siteId.keyword',
                negate: false,
                params: { query: siteId },
                type: 'phrase'
              },
              query: { match_phrase: { 'siteId.keyword': siteId } }
            }],
            query: { query: '', language: 'kuery' }
          })
        }
      }
    };

    // Save the visualization in Kibana
    const response = await axios.post(
      `${KIBANA_URL}/api/saved_objects/visualization`,
      visualizationPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'kbn-xsrf': 'true'
        }
      }
    );

    console.log('Kibana visualization created successfully');
    res.json({ 
      success: true, 
      message: 'Visualization created successfully',
      visualizationId: response.data.id,
      visualization: response.data 
    });

  } catch (error) {
    console.error('Error creating Kibana visualization:', error.response?.data || error.message);
    
    // If visualization already exists or other recoverable error
    if (error.response?.status === 409) {
      res.json({ 
        success: true, 
        message: 'Visualization already exists' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create visualization',
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
    
    // Use Kibana's Canvas for embedding or simple Discover mode with better visualization
    // Try different approaches based on what works best
    const chartUrl = `${externalKibanaUrl}/app/discover#/?embed=true&_g=(time:(from:now-${timeRange},to:now))&_a=(index:uptime-checks,query:(language:kuery,query:'siteId.keyword:"${siteId}"'))`;
    
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
