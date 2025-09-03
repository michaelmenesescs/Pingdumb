# Uptime Monitor - ELK Stack Integration

A Pingdom-like uptime monitoring application built with the ELK stack (Elasticsearch, Logstash, Kibana) and modern web technologies.

## Architecture

The application consists of four main components:

1. **Elasticsearch** - Stores uptime check data and site configurations
2. **Kibana** - Provides data visualization and dashboards
3. **API Service** - Node.js/Express backend for CRUD operations
4. **Frontend** - React application with embedded Kibana dashboards
5. **Monitor Service** - Background service that checks site uptime

## Features

- ✅ CRUD operations for monitoring sites
- ✅ Real-time uptime monitoring
- ✅ Embedded Kibana dashboards
- ✅ Response time tracking
- ✅ Uptime percentage calculations
- ✅ Modern, responsive UI
- ✅ Docker-based deployment

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uptime-monitor
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3001
   - API: http://localhost:3000
   - Kibana: http://localhost:5601
   - Elasticsearch: http://localhost:9200

## Service Details

### Elasticsearch
- **Port**: 9200
- **Purpose**: Data storage for sites and uptime checks
- **Indices**:
  - `uptime-sites`: Site configurations
  - `uptime-checks`: Uptime check results

### Kibana
- **Port**: 5601
- **Purpose**: Data visualization and dashboards
- **Features**: Embedded dashboards for uptime monitoring

### API Service
- **Port**: 3000
- **Purpose**: RESTful API for site management
- **Endpoints**:
  - `GET /api/sites` - List all sites
  - `POST /api/sites` - Create new site
  - `PUT /api/sites/:id` - Update site
  - `DELETE /api/sites/:id` - Delete site
  - `GET /api/checks` - Get uptime checks
  - `GET /api/checks/stats/:siteId` - Get site statistics

### Frontend
- **Port**: 3001
- **Purpose**: React application with embedded Kibana dashboards
- **Features**:
  - Site management interface
  - Dashboard overview
  - Embedded Kibana visualizations

### Monitor Service
- **Purpose**: Background service that periodically checks site uptime
- **Features**:
  - Configurable check intervals
  - Response time measurement
  - Automatic data storage in Elasticsearch

## Setup Instructions

### 1. Initial Setup

The application will automatically create the necessary Elasticsearch indices when it starts.

### 2. Create Kibana Dashboards

1. Open Kibana at http://localhost:5601
2. Go to Dashboard → Create Dashboard
3. Add visualizations using these index patterns:
   - `uptime-sites` - for site configuration data
   - `uptime-checks` - for uptime check results

### 3. Recommended Visualizations

- **Uptime Percentage**: Metric visualization showing current uptime
- **Response Time Trends**: Line chart of response times over time
- **Site Status**: Pie chart showing up/down status distribution
- **Check History**: Data table of recent uptime checks

### 4. Save Dashboards

Save your dashboards with these names for automatic embedding:
- `uptime-overview`
- `site-details`
- `response-times`
- `alerts`

## Configuration

### Environment Variables

The application uses the following environment variables:

```bash
# API Service
NODE_ENV=development
ELASTICSEARCH_URL=http://elasticsearch:9200
PORT=3000

# Frontend
REACT_APP_API_URL=http://localhost:3000
REACT_APP_KIBANA_URL=http://localhost:5601

# Monitor Service
ELASTICSEARCH_URL=http://elasticsearch:9200
CHECK_INTERVAL=60000
```

### Check Intervals

Available check intervals:
- 30 seconds
- 1 minute (default)
- 5 minutes
- 10 minutes

## Development

### Hot Reloading Development (Recommended)

For the best development experience with automatic reloading:

```bash
# Start all services with hot reloading
./dev.sh

# Or manually start with hot reloading
docker-compose up -d --build
```

**Hot Reloading Features:**
- ✅ **Frontend**: React development server with fast refresh
- ✅ **API**: Nodemon auto-restart on file changes
- ✅ **Monitor**: Nodemon auto-restart on file changes
- ✅ **Volume mounts**: Source code changes reflect immediately
- ✅ **No rebuilding**: Changes apply instantly

### Manual Development

1. **Install dependencies**
   ```bash
   cd api && npm install
   cd ../frontend && npm install
   cd ../monitor && npm install
   ```

2. **Start services individually**
   ```bash
   # Terminal 1 - API
   cd api && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   
   # Terminal 3 - Monitor
   cd monitor && npm run dev
   ```

### API Development

The API service includes:
- Express.js server with middleware
- Elasticsearch client integration
- RESTful endpoints for CRUD operations
- Automatic index creation
- Error handling and validation

### Frontend Development

The React frontend includes:
- Modern React 18 with hooks
- React Router for navigation
- React Hook Form for form handling
- Recharts for data visualization
- Responsive design with CSS Grid

## Monitoring and Logs

### Viewing Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f monitor
```

### Health Checks

- API Health: http://localhost:3000/health
- Elasticsearch: http://localhost:9200/_cluster/health

## Troubleshooting

### Common Issues

1. **Elasticsearch not starting**
   - Check available memory (requires at least 512MB)
   - Ensure port 9200 is available

2. **Kibana connection issues**
   - Verify Elasticsearch is running
   - Check network connectivity between services

3. **Monitor service not checking sites**
   - Verify Elasticsearch connection
   - Check if sites are marked as active
   - Review monitor service logs

### Reset Data

To reset all data and start fresh:

```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Restart
docker-compose up -d
```

## Production Considerations

### Security
- Enable Elasticsearch security features
- Use environment variables for sensitive data
- Implement proper authentication/authorization
- Use HTTPS in production

### Scaling
- Use Elasticsearch cluster for high availability
- Implement load balancing for API service
- Use Redis for session management
- Consider using message queues for monitoring

### Monitoring
- Implement application monitoring (e.g., Prometheus, Grafana)
- Set up alerting for service failures
- Monitor Elasticsearch cluster health
- Track application performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review service logs
3. Open an issue on GitHub
4. Check Elasticsearch and Kibana documentation
