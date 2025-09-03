const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
});

const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 60000; // Default: 1 minute

class UptimeMonitor {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
  }

  async start() {
    console.log('Starting uptime monitor service...');
    this.isRunning = true;
    await this.runChecks();
    
    // Set up periodic checks
    this.checkInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.runChecks();
      }
    }, CHECK_INTERVAL);
  }

  async stop() {
    console.log('Stopping uptime monitor service...');
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async runChecks() {
    try {
      console.log(`Running uptime checks at ${new Date().toISOString()}`);
      
      // Get all active sites
      const sites = await this.getActiveSites();
      
      if (sites.length === 0) {
        console.log('No active sites to monitor');
        return;
      }

      console.log(`Monitoring ${sites.length} active sites`);

      // Check each site
      const checkPromises = sites.map(site => this.checkSite(site));
      await Promise.allSettled(checkPromises);

    } catch (error) {
      console.error('Error running checks:', error);
    }
  }

  async getActiveSites() {
    try {
      const result = await client.search({
        index: 'uptime-sites',
        body: {
          query: { term: { isActive: true } }
        }
      });

      return result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      }));
    } catch (error) {
      console.error('Error fetching active sites:', error);
      return [];
    }
  }

  async checkSite(site) {
    const startTime = Date.now();
    let status = 'down';
    let statusCode = 0;
    let responseTime = 0;
    let error = null;

    try {
      console.log(`Checking ${site.name} (${site.url})`);
      
      const response = await axios.get(site.url, {
        timeout: 30000, // 30 second timeout
        validateStatus: () => true // Accept all status codes
      });

      statusCode = response.status;
      responseTime = Date.now() - startTime;
      
      // Consider 2xx and 3xx status codes as "up"
      if (statusCode >= 200 && statusCode < 400) {
        status = 'up';
      } else {
        status = 'down';
        error = `HTTP ${statusCode}`;
      }

    } catch (error) {
      status = 'down';
      responseTime = Date.now() - startTime;
      error = error.message;
      console.error(`Error checking ${site.name}:`, error.message);
    }

    // Store check result in Elasticsearch
    await this.storeCheckResult(site, status, statusCode, responseTime, error);
    
    console.log(`${site.name}: ${status} (${responseTime}ms)`);
  }

  async storeCheckResult(site, status, statusCode, responseTime, error) {
    try {
      const checkResult = {
        siteId: site.id,
        url: site.url,
        status,
        statusCode,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error || null
      };

      await client.index({
        index: 'uptime-checks',
        body: checkResult
      });

    } catch (error) {
      console.error('Error storing check result:', error);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (monitor) {
    await monitor.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (monitor) {
    await monitor.stop();
  }
  process.exit(0);
});

// Start the monitor
const monitor = new UptimeMonitor();
monitor.start().catch(error => {
  console.error('Failed to start monitor:', error);
  process.exit(1);
});
