const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const router = express.Router();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
});

// Get all uptime checks
router.get('/', async (req, res) => {
  try {
    const { siteId, limit = 100, from } = req.query;
    
    let query = { match_all: {} };
    if (siteId) {
      query = { match: { siteId } };
    }

    const searchBody = {
      query,
      sort: [{ timestamp: { order: 'desc' } }],
      size: parseInt(limit)
    };

    if (from) {
      searchBody.from = parseInt(from);
    }

    const result = await client.search({
      index: 'uptime-checks',
      body: searchBody
    });

    const checks = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json({
      checks,
      total: result.hits.total.value
    });
  } catch (error) {
    console.error('Error fetching checks:', error);
    res.status(500).json({ error: 'Failed to fetch checks' });
  }
});

// Get uptime statistics for a site
router.get('/stats/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { days = 7 } = req.query;

    const now = new Date();
    const fromDate = new Date(now.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000));

    console.log(`Fetching stats for siteId: ${siteId}, days: ${days}`);

    const result = await client.search({
      index: 'uptime-checks',
      body: {
        query: {
          bool: {
            must: [
              { term: { 'siteId.keyword': siteId } }, // Use .keyword for exact match
              { range: { timestamp: { gte: fromDate.toISOString() } } }
            ]
          }
        },
        aggs: {
          uptime_percentage: {
            filter: { term: { 'status.keyword': 'up' } }  // Use .keyword for exact match
          },
          downtime_percentage: {
            filter: { term: { 'status.keyword': 'down' } }  // Add downtime for verification
          },
          avg_response_time: {
            avg: { field: 'responseTime' }
          },
          max_response_time: {
            max: { field: 'responseTime' }
          },
          min_response_time: {
            min: { field: 'responseTime' }
          },
          status_distribution: {
            terms: { field: 'status.keyword' }  // Use .keyword for exact match
          },
          hourly_distribution: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: 'hour',
              min_doc_count: 0
            },
            aggs: {
              avg_response_time: {
                avg: { field: 'responseTime' }
              },
              status_count: {
                terms: { field: 'status.keyword' }
              }
            }
          }
        }
      }
    });

    const totalChecks = result.hits.total.value;
    const upChecks = result.aggregations.uptime_percentage.doc_count;
    const downChecks = result.aggregations.downtime_percentage.doc_count;
    const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;
    const avgResponseTime = result.aggregations.avg_response_time.value || 0;
    const maxResponseTime = result.aggregations.max_response_time.value || 0;
    const minResponseTime = result.aggregations.min_response_time.value || 0;

    console.log(`Stats for ${siteId}: Total: ${totalChecks}, Up: ${upChecks}, Down: ${downChecks}, Uptime: ${uptimePercentage.toFixed(2)}%`);

    res.json({
      siteId,
      period: `${days} days`,
      totalChecks,
      upChecks,
      downChecks,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      minResponseTime: Math.round(minResponseTime),
      statusDistribution: result.aggregations.status_distribution.buckets,
      hourlyDistribution: result.aggregations.hourly_distribution.buckets.map(bucket => ({
        timestamp: bucket.key_as_string,
        doc_count: bucket.doc_count,
        avg_response_time: bucket.avg_response_time.value || 0,
        status_distribution: bucket.status_count.buckets
      }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    console.error('Error details:', error.response?.body || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message,
      siteId: req.params.siteId
    });
  }
});

// Get checks for a specific site
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { from = 'now-24h', size = 1000 } = req.query;

    const result = await client.search({
      index: 'uptime-checks',
      body: {
        size: parseInt(size),
        sort: [{ timestamp: { order: 'desc' } }],
        query: {
          bool: {
            must: [
              { term: { 'siteId.keyword': siteId } },
              {
                range: {
                  timestamp: {
                    gte: from
                  }
                }
              }
            ]
          }
        }
      }
    });

    const checks = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json(checks);
  } catch (error) {
    console.error('Error fetching site checks:', error);
    // Return empty array instead of error to prevent chart failures
    res.json([]);
  }
});

// Get recent checks for a site
router.get('/recent/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { limit = 10 } = req.query;

    const result = await client.search({
      index: 'uptime-checks',
      body: {
        query: { match: { siteId } },
        sort: [{ timestamp: { order: 'desc' } }],
        size: parseInt(limit)
      }
    });

    const checks = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json(checks);
  } catch (error) {
    console.error('Error fetching recent checks:', error);
    res.status(500).json({ error: 'Failed to fetch recent checks' });
  }
});

// Debug endpoint to check if data exists for a site
router.get('/debug/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    console.log(`Debugging data for siteId: ${siteId}`);
    
    const result = await client.search({
      index: 'uptime-checks',
      body: {
        query: {
          bool: {
            must: [
              { term: { 'siteId.keyword': siteId } },
              { range: { timestamp: { gte: 'now-24h' } } }
            ]
          }
        },
        sort: [{ timestamp: { order: 'desc' } }],
        size: 10
      }
    });

    const hits = result.hits.hits.map(hit => hit._source);
    
    console.log(`Found ${hits.length} records for site ${siteId}`);
    hits.forEach((hit, i) => {
      console.log(`${i+1}. ${hit.timestamp}: ${hit.responseTime}ms - ${hit.status}`);
    });

    res.json({
      siteId,
      totalFound: result.hits.total.value,
      recentRecords: hits,
      indexExists: result.hits.total.value > 0,
      sampleData: hits.slice(0, 3)
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message,
      siteId: req.params.siteId
    });
  }
});

module.exports = router;
