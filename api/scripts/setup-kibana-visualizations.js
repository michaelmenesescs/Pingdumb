#!/usr/bin/env node

const axios = require('axios');

const KIBANA_URL = process.env.KIBANA_URL || 'http://kibana:5601';
const ES_URL = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';

async function setupKibanaVisualizationsAndDashboard() {
  try {
    console.log('Setting up Kibana index pattern, visualizations, and dashboard...');

    // 1. Create index pattern
    console.log('1. Creating index pattern...');
    const indexPatternPayload = {
      attributes: {
        title: 'uptime-checks*',
        timeFieldName: 'timestamp'
      }
    };

    let indexPatternId;
    try {
      const indexResponse = await axios.post(
        `${KIBANA_URL}/api/saved_objects/index-pattern`,
        indexPatternPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'kbn-xsrf': 'true'
          }
        }
      );
      indexPatternId = indexResponse.data.id;
      console.log('Index pattern created:', indexPatternId);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('Index pattern already exists');
        // Find existing index pattern
        const searchResponse = await axios.get(
          `${KIBANA_URL}/api/saved_objects/_find?type=index-pattern&search_fields=title&search=uptime-checks*`,
          {
            headers: {
              'Content-Type': 'application/json',
              'kbn-xsrf': 'true'
            }
          }
        );
        indexPatternId = searchResponse.data.saved_objects[0]?.id;
        console.log('Using existing index pattern:', indexPatternId);
      } else {
        throw error;
      }
    }

    // 2. Create response time line chart visualization
    console.log('2. Creating response time visualization...');
    const visualizationPayload = {
      attributes: {
        title: 'Response Time Trend',
        type: 'line',
        description: 'Response time over time',
        visState: JSON.stringify({
          title: 'Response Time Trend',
          type: 'line',
          params: {
            grid: { categoryLines: false, style: { color: '#eee' } },
            categoryAxes: [{
              id: 'CategoryAxis-1',
              type: 'category',
              position: 'bottom',
              show: true,
              labels: { show: true }
            }],
            valueAxes: [{
              id: 'ValueAxis-1',
              name: 'LeftAxis-1',
              type: 'value',
              position: 'left',
              show: true,
              labels: { show: true },
              title: { text: 'Response Time (ms)' }
            }],
            seriesParams: [{
              show: true,
              type: 'line',
              mode: 'normal',
              data: { label: 'Average Response Time', id: '1' },
              valueAxis: 'ValueAxis-1',
              drawLinesBetweenPoints: true,
              showCircles: true
            }],
            addTooltip: true,
            addLegend: false
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
            index: indexPatternId,
            query: { query: '', language: 'kuery' },
            filter: []
          })
        }
      }
    };

    let visualizationId;
    try {
      const visResponse = await axios.post(
        `${KIBANA_URL}/api/saved_objects/visualization`,
        visualizationPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'kbn-xsrf': 'true'
          }
        }
      );
      visualizationId = visResponse.data.id;
      console.log('Visualization created:', visualizationId);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('Visualization already exists');
        visualizationId = 'response-time-chart'; // Use a known ID
      } else {
        throw error;
      }
    }

    // 3. Create dashboard
    console.log('3. Creating dashboard...');
    const dashboardPayload = {
      attributes: {
        title: 'Uptime Monitoring Dashboard',
        description: 'Real-time uptime monitoring dashboard',
        panelsJSON: JSON.stringify([
          {
            version: '8.0.0',
            type: 'visualization',
            gridData: { x: 0, y: 0, w: 48, h: 20, i: '1' },
            panelIndex: '1',
            embeddableConfig: {},
            panelRefName: 'panel_1'
          }
        ]),
        optionsJSON: JSON.stringify({
          useMargins: true,
          syncColors: false,
          hidePanelTitles: false
        }),
        timeRestore: false,
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({
            query: { query: '', language: 'kuery' },
            filter: []
          })
        }
      },
      references: [
        {
          name: 'panel_1',
          type: 'visualization',
          id: visualizationId
        }
      ]
    };

    try {
      const dashResponse = await axios.post(
        `${KIBANA_URL}/api/saved_objects/dashboard`,
        dashboardPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'kbn-xsrf': 'true'
          }
        }
      );
      console.log('Dashboard created:', dashResponse.data.id);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('Dashboard already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ Kibana setup completed successfully!');
    console.log(`📊 You can now access the dashboard at: ${KIBANA_URL}/app/dashboards`);
    
    return {
      indexPatternId,
      visualizationId,
      success: true
    };

  } catch (error) {
    console.error('❌ Error setting up Kibana:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  setupKibanaVisualizationsAndDashboard()
    .then(result => {
      if (result.success) {
        console.log('Setup completed successfully');
        process.exit(0);
      } else {
        console.error('Setup failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { setupKibanaVisualizationsAndDashboard };
