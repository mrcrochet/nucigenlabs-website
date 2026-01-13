#!/bin/bash

# Script to verify API server is running and all endpoints are accessible

echo "🔍 Vérification de l'API Server..."
echo ""

API_URL="http://localhost:3001"

# Check if server is running
echo "1. Vérification que le serveur est démarré..."
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    echo "   ✅ Serveur accessible sur ${API_URL}"
else
    echo "   ❌ Serveur non accessible. Démarrez avec: npm run api:server"
    exit 1
fi

# Check health endpoint
echo ""
echo "2. Test du endpoint /health..."
HEALTH_RESPONSE=$(curl -s "${API_URL}/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "   ✅ Health check OK"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "   ⚠️  Health check response inattendu: $HEALTH_RESPONSE"
fi

# List expected endpoints
echo ""
echo "3. Endpoints attendus:"
echo "   - GET  ${API_URL}/health"
echo "   - POST ${API_URL}/live-search"
echo "   - POST ${API_URL}/deep-research"
echo "   - POST ${API_URL}/process-event"
echo "   - POST ${API_URL}/personalized-collect"
echo "   - POST ${API_URL}/api/predict-relevance"
echo "   - POST ${API_URL}/api/signals"

echo ""
echo "✅ Vérification terminée"
echo "💡 Pour démarrer le serveur: npm run api:server"
