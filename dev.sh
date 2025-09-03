#!/bin/bash

echo "🚀 Starting Uptime Monitor with Hot Reloading"
echo "============================================="

# Check if docker-compose is running
if docker-compose ps | grep -q "Up"; then
    echo "📋 Current services status:"
    docker-compose ps
    
    echo ""
    echo "🔄 Restarting services for hot reloading..."
    docker-compose down
fi

echo ""
echo "🏗️  Building and starting services with hot reloading..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "📊 Services status:"
docker-compose ps

echo ""
echo "🌐 Service URLs:"
echo "Frontend (Hot Reload): http://localhost:3001"
echo "API (Hot Reload):      http://localhost:3000"
echo "Kibana:                http://localhost:5601"
echo "Elasticsearch:         http://localhost:9200"

echo ""
echo "📝 Development Commands:"
echo "• View logs:           docker-compose logs -f [service-name]"
echo "• Restart service:     docker-compose restart [service-name]"
echo "• Stop all:            docker-compose down"
echo "• Production build:    docker-compose -f docker-compose.yaml up -d --build"

echo ""
echo "✅ Hot reloading is now active!"
echo "💡 Make changes to your source files and they will automatically reload!"
