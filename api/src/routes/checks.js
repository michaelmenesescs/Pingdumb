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

    const result = await client.search({
      index: 'uptime-checks',
      body: {
        query: {
          bool: {
            must: [
              { match: { siteId } },
              { range: { timestamp: { gte: fromDate.toISOString() } } }
            ]
          }
        },
        aggs: {
          uptime_percentage: {
            filter: { term: { status: 'up' } }
          },
          avg_response_time: {
            avg: { field: 'responseTime' }
          },
          status_distribution: {
            terms: { field: 'status' }
          },
          hourly_distribution: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: 'hour'
            }
          }
        }
      }
    });

    const totalChecks = result.hits.total.value;
    const upChecks = result.aggregations.uptime_percentage.doc_count;
    const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;
    const avgResponseTime = result.aggregations.avg_response_time.value || 0;

    res.json({
      siteId,
      period: `${days} days`,
      totalChecks,
      upChecks,
      downChecks: totalChecks - upChecks,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      statusDistribution: result.aggregations.status_distribution.buckets,
      hourlyDistribution: result.aggregations.hourly_distribution.buckets
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
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

module.exports = router;
