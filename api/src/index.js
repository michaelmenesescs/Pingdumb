const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await client.ping();
    res.json({ status: 'healthy', elasticsearch: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', elasticsearch: 'disconnected', error: error.message });
  }
});

// Initialize Elasticsearch index
async function initializeIndex() {
  try {
    const indexExists = await client.indices.exists({ index: 'uptime-sites' });
    
    if (!indexExists) {
      await client.indices.create({
        index: 'uptime-sites',
        body: {
          mappings: {
            properties: {
              name: { type: 'text' },
              url: { type: 'keyword' },
              checkInterval: { type: 'integer' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      });
      console.log('Created uptime-sites index');
    }

    const uptimeIndexExists = await client.indices.exists({ index: 'uptime-checks' });
    
    if (!uptimeIndexExists) {
      await client.indices.create({
        index: 'uptime-checks',
        body: {
          mappings: {
            properties: {
              siteId: { type: 'keyword' },
              url: { type: 'keyword' },
              status: { type: 'keyword' },
              responseTime: { type: 'long' },
              statusCode: { type: 'integer' },
              timestamp: { type: 'date' },
              error: { type: 'text' }
            }
          }
        }
      });
      console.log('Created uptime-checks index');
    }
  } catch (error) {
    console.error('Error initializing indices:', error);
  }
}

// Routes
app.use('/api/sites', require('./routes/sites'));
app.use('/api/checks', require('./routes/checks'));
app.use('/api/kibana', require('./routes/kibana'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeIndex();
});
