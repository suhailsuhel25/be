#!/bin/bash

# Comprehensive hosting validation script

URL=${1:-"http://localhost:5000"}
TIMEOUT=${2:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header() {
    echo "🌐 Comprehensive Hosting Validation"
    printf '=%.0s' {1..50}
    echo
    echo "URL: $URL"
    echo "Timeout: ${TIMEOUT}s"
    echo "Time: $(date)"
    printf '=%.0s' {1..50}
    echo
}

validate_single_endpoint() {
    local endpoint=$1
    local name=$2
    local full_url="${URL}${endpoint}"
    
    local start_time=$(date +%s.%N)
    
    # Use curl to test the endpoint
    local http_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time $TIMEOUT "$full_url")
    local end_time=$(date +%s.%N)
    local response_time=$(echo "$end_time - $start_time" | bc -l | xargs printf "%.3f")
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo "✅ $name ($endpoint): HTTP $http_code - ${response_time}s"
        return 0
    elif [ "$http_code" -ge 300 ] && [ "$http_code" -lt 500 ]; then
        echo "⚠️  $name ($endpoint): HTTP $http_code (Redirection/Client Error) - ${response_time}s"
        return 1
    else
        echo "❌ $name ($endpoint): HTTP $http_code (Server Error) - ${response_time}s"
        return 1
    fi
}

run_comprehensive_validation() {
    print_header
    
    # Test basic connectivity
    if ! curl -f -s --max-time $TIMEOUT "$URL" > /dev/null; then
        echo "❌ Service is not accessible on $URL"
        printf '=%.0s' {1..50}
        echo
        return 1
    fi
    
    echo "✅ Service is accessible on $URL"
    echo
    
    # List of endpoints to validate
    endpoints=(
        "/|Home"
        "/health|Health Check"
        "/api/status|API Status"
        "/api/health|API Health"
        "/status|Status"
        "/api|API Root"
    )
    
    success_count=0
    total_count=${#endpoints[@]}
    
    echo "Testing endpoints:"
    echo
    
    for endpoint_pair in "${endpoints[@]}"; do
        IFS='|' read -r endpoint name <<< "$endpoint_pair"
        if validate_single_endpoint "$endpoint" "$name"; then
            ((success_count++))
        fi
    done
    
    echo
    printf '=%.0s' {1..50}
    echo
    echo "Validation Summary:"
    echo "  Total endpoints tested: $total_count"
    echo "  Successful: $success_count"
    echo "  Failed: $((total_count - success_count))"
    success_rate=$((success_count * 100 / total_count))
    echo "  Success rate: ${success_rate}%"

    if [ $success_rate -eq 100 ]; then
        echo "  Status: 🟢 HEALTHY"
        overall_status="HEALTHY"
    elif [ $success_rate -ge 50 ]; then
        echo "  Status: 🟡 DEGRADED"
        overall_status="DEGRADED"
    else
        echo "  Status: 🔴 UNHEALTHY"
        overall_status="UNHEALTHY"
    fi

    printf '=%.0s' {1..50}
    echo

    if [ $success_rate -eq 100 ]; then
        return 0
    else
        return 1
    fi
}

# Additional diagnostics for hosting environment
run_diagnostics() {
    echo
    echo "🔧 Additional Diagnostics:"
    
    # Check DNS resolution
    host_part=$(echo $URL | sed -e 's|^[^/]*//||' -e 's|/.*$||')
    host_part=$(echo $host_part | cut -d':' -f1)
    
    if ping -c 1 -W 5 "$host_part" &>/dev/null; then
        echo "  ✅ Host $host_part is reachable"
    else
        echo "  ❌ Host $host_part is not reachable"
    fi
    
    # Check specific port connectivity
    port_part=$(echo $URL | sed -e 's|^[^:]*://||' -e 's|/.*$||' -e 's|.*:||')
    if [ -z "$port_part" ] || [ "$port_part" = "$host_part" ]; then
        port_part=80
        if [[ $URL == https* ]]; then
            port_part=443
        fi
    fi
    
    if timeout 5 bash -c "echo > /dev/tcp/$host_part/$port_part" 2>/dev/null; then
        echo "  ✅ Port $port_part on $host_part is open"
    else
        echo "  ❌ Port $port_part on $host_part is closed or filtered"
    fi
}

# Main execution
if [ "$#" -gt 0 ] && [ "$1" = "--diagnostics" ]; then
    URL=${2:-"http://localhost:5000"}
    run_diagnostics
elif [ "$#" -gt 0 ] && [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [URL] [TIMEOUT]"
    echo "       $0 --diagnostics URL"
    echo ""
    echo "URL: The URL to validate (default: http://localhost:5000)"
    echo "TIMEOUT: Request timeout in seconds (default: 10)"
    echo ""
    echo "Examples:"
    echo "  $0 http://localhost:5000          # Validate default local service"
    echo "  $0 https://myhost.com:8080        # Validate remote service"
    echo "  $0 https://myhost.com 15          # Validate with 15s timeout"
    echo "  $0 --diagnostics myhost.com       # Run network diagnostics"
else
    run_comprehensive_validation
    validation_result=$?
    
    # Run diagnostics if validation failed
    if [ $validation_result -ne 0 ]; then
        echo
        echo "💡 Running diagnostics for failed validation..."
        run_diagnostics
    fi
    
    exit $validation_result
fi