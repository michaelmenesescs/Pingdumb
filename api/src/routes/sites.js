const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const router = express.Router();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
});

// Get all sites
router.get('/', async (req, res) => {
  try {
    const result = await client.search({
      index: 'uptime-sites',
      body: {
        query: { match_all: {} },
        sort: [{ createdAt: { order: 'desc' } }]
      }
    });

    const sites = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Get site by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await client.get({
      index: 'uptime-sites',
      id: req.params.id
    });

    res.json({
      id: result._id,
      ...result._source
    });
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: 'Site not found' });
    } else {
      console.error('Error fetching site:', error);
      res.status(500).json({ error: 'Failed to fetch site' });
    }
  }
});

// Create new site
router.post('/', async (req, res) => {
  try {
    const { name, url, checkInterval = 60000, isActive = true } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    const now = new Date().toISOString();
    const site = {
      name,
      url,
      checkInterval,
      isActive,
      createdAt: now,
      updatedAt: now
    };

    const result = await client.index({
      index: 'uptime-sites',
      body: site
    });

    res.status(201).json({
      id: result._id,
      ...site
    });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// Update site
router.put('/:id', async (req, res) => {
  try {
    const { name, url, checkInterval, isActive } = req.body;
    
    const updateBody = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const result = await client.update({
      index: 'uptime-sites',
      id: req.params.id,
      body: { doc: updateBody }
    });

    if (result.result === 'updated') {
      res.json({ message: 'Site updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update site' });
    }
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: 'Site not found' });
    } else {
      console.error('Error updating site:', error);
      res.status(500).json({ error: 'Failed to update site' });
    }
  }
});

// Delete site
router.delete('/:id', async (req, res) => {
  try {
    const result = await client.delete({
      index: 'uptime-sites',
      id: req.params.id
    });

    if (result.result === 'deleted') {
      res.json({ message: 'Site deleted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to delete site' });
    }
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: 'Site not found' });
    } else {
      console.error('Error deleting site:', error);
      res.status(500).json({ error: 'Failed to delete site' });
    }
  }
});

module.exports = router;
