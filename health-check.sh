#!/bin/bash

echo "🔍 Health Check for Uptime Monitor Services"
echo "=========================================="

# Check if services are running
echo "📊 Checking Docker services..."
docker-compose ps

echo ""
echo "🌐 Testing service endpoints..."

# Test Elasticsearch
echo "🔍 Testing Elasticsearch..."
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    echo "✅ Elasticsearch is running on port 9200"
else
    echo "❌ Elasticsearch is not accessible on port 9200"
fi

# Test Kibana
echo "📊 Testing Kibana..."
if curl -s http://localhost:5601 > /dev/null; then
    echo "✅ Kibana is running on port 5601"
else
    echo "❌ Kibana is not accessible on port 5601"
fi

# Test API
echo "🔌 Testing API..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ API is running on port 3000"
else
    echo "❌ API is not accessible on port 3000"
fi

# Test Frontend
echo "🌍 Testing Frontend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Frontend is running on port 3001"
else
    echo "❌ Frontend is not accessible on port 3001"
fi

echo ""
echo "📝 Service URLs:"
echo "Frontend: http://localhost:3001"
echo "API: http://localhost:3000"
echo "Kibana: http://localhost:5601"
echo "Elasticsearch: http://localhost:9200"
echo ""
echo "🔧 To restart services: docker-compose down && docker-compose up -d"
echo "📋 To view logs: docker-compose logs -f [service-name]"
