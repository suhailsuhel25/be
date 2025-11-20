#!/bin/bash

# Simple script to validate if the backend service is running on localhost:5000

echo "Validating service on localhost:5000..."
echo

# Check if the service is running
if curl -f -s -o /dev/null http://localhost:5000; then
    echo "✅ Service is running on localhost:5000"
    
    # Get the response
    echo
    echo "Response from /:"
    curl -s http://localhost:5000 | jq .
    echo
    
    echo "Status from /health:"
    curl -s http://localhost:5000/health | jq .
    echo
    
    # Check response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:5000)
    echo "Response time: ${RESPONSE_TIME}s"
    
    echo
    echo "🎉 Service validation successful!"
    exit 0
else
    echo "❌ Service is not accessible on localhost:5000"
    echo "Please make sure the backend service is running."
    exit 1
fi