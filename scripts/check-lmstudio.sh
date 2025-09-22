#!/bin/bash

# Script di diagnosi per LMStudio
echo "🔍 Diagnosi LMStudio Server"
echo "=========================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LMSTUDIO_URL="http://localhost:1234"

echo -e "\n1. Verifica connettività di base..."
if ping -c 1 localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Localhost raggiungibile"
else
    echo -e "${RED}✗${NC} Problema con localhost"
    exit 1
fi

echo -e "\n2. Verifica se la porta 1234 è in ascolto..."
if command -v netstat > /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":1234 "; then
        echo -e "${GREEN}✓${NC} Porta 1234 in ascolto"
    else
        echo -e "${RED}✗${NC} Porta 1234 non in ascolto"
        echo -e "${YELLOW}ℹ${NC} Assicurati che LMStudio sia avviato e il server locale sia attivo"
    fi
elif command -v ss > /dev/null; then
    if ss -tuln 2>/dev/null | grep -q ":1234 "; then
        echo -e "${GREEN}✓${NC} Porta 1234 in ascolto"
    else
        echo -e "${RED}✗${NC} Porta 1234 non in ascolto"
    fi
else
    echo -e "${YELLOW}⚠${NC} Impossibile verificare le porte (netstat/ss non disponibili)"
fi

echo -e "\n3. Test connessione HTTP..."
if curl -s --connect-timeout 5 -I "$LMSTUDIO_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Server HTTP risponde"
else
    echo -e "${RED}✗${NC} Server HTTP non risponde"
    echo -e "${YELLOW}ℹ${NC} Verifica che LMStudio sia in esecuzione"
    exit 1
fi

echo -e "\n4. Test endpoint models (native API)..."
MODELS_RESPONSE=$(curl -s --connect-timeout 10 "$LMSTUDIO_URL/api/v0/models" 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$MODELS_RESPONSE" ]; then
    echo -e "${GREEN}✓${NC} Native API endpoint raggiungibile"
    
    # Controlla se la risposta contiene modelli
    if echo "$MODELS_RESPONSE" | grep -q '"data"'; then
        MODEL_COUNT=$(echo "$MODELS_RESPONSE" | grep -o '"id"' | wc -l)
        LOADED_COUNT=$(echo "$MODELS_RESPONSE" | grep -o '"state":"loaded"' | wc -l)
        echo -e "${GREEN}ℹ${NC} Trovati $MODEL_COUNT modelli ($LOADED_COUNT caricati)"
        
        # Mostra i modelli con stato
        echo -e "\n📋 Modelli disponibili (Native API):"
        echo "$MODELS_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for model in data.get('data', [])[:5]:
        status = '🟢' if model.get('state') == 'loaded' else '⚪'
        model_type = f\" ({model.get('type', 'unknown')})\" if model.get('type') else ''
        quant = f\" [{model.get('quantization', 'unknown')}]\" if model.get('quantization') else ''
        print(f\"  {status} {model.get('id', 'unknown')}{model_type}{quant}\")
except:
    pass
        " 2>/dev/null || echo "$MODELS_RESPONSE" | grep -o '"id":"[^"]*"' | head -5 | sed 's/"id":"\([^"]*\)"/  - \1/'
        
        USE_NATIVE_API=true
    else
        echo -e "${YELLOW}⚠${NC} Nessun modello nella native API"
        USE_NATIVE_API=false
    fi
else
    echo -e "${YELLOW}⚠${NC} Native API non disponibile, test OpenAI API..."
    USE_NATIVE_API=false
    
    # Fallback to OpenAI compatible API
    MODELS_RESPONSE=$(curl -s --connect-timeout 10 "$LMSTUDIO_URL/v1/models" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$MODELS_RESPONSE" ]; then
        echo -e "${GREEN}✓${NC} OpenAI API endpoint raggiungibile"
        
        if echo "$MODELS_RESPONSE" | grep -q '"data"'; then
            MODEL_COUNT=$(echo "$MODELS_RESPONSE" | grep -o '"id"' | wc -l)
            echo -e "${GREEN}ℹ${NC} Trovati $MODEL_COUNT modelli"
            
            echo -e "\n📋 Modelli disponibili (OpenAI API):"
            echo "$MODELS_RESPONSE" | grep -o '"id":"[^"]*"' | head -5 | sed 's/"id":"\([^"]*\)"/  - \1/'
        else
            echo -e "${YELLOW}⚠${NC} Nessun modello trovato - carica un modello in LMStudio"
        fi
    else
        echo -e "${RED}✗${NC} Tutti gli endpoint models non rispondono"
    fi
fi

echo -e "\n5. Test generazione semplice..."
if [ -n "$MODELS_RESPONSE" ] && echo "$MODELS_RESPONSE" | grep -q '"id"'; then
    # Extract first model name (clean it if it has status indicators)
    if [ "$USE_NATIVE_API" = true ]; then
        FIRST_MODEL=$(echo "$MODELS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
        API_ENDPOINT="/api/v0/chat/completions"
    else
        FIRST_MODEL=$(echo "$MODELS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
        API_ENDPOINT="/v1/chat/completions"
    fi
    
    if [ -n "$FIRST_MODEL" ]; then
        echo -e "${YELLOW}ℹ${NC} Test con modello: $FIRST_MODEL"
        echo -e "${YELLOW}ℹ${NC} Usando API: $API_ENDPOINT"
        
        TEST_RESPONSE=$(curl -s --connect-timeout 15 \
            -X POST "$LMSTUDIO_URL$API_ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "{
                \"model\": \"$FIRST_MODEL\",
                \"messages\": [{\"role\": \"user\", \"content\": \"Hi\"}],
                \"max_tokens\": 10,
                \"temperature\": 0.1,
                \"stream\": false
            }" 2>/dev/null)
        
        if [ $? -eq 0 ] && echo "$TEST_RESPONSE" | grep -q '"content"'; then
            echo -e "${GREEN}✓${NC} Generazione testo funzionante"
            RESPONSE_TEXT=$(echo "$TEST_RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"\([^"]*\)"/\1/')
            echo -e "${GREEN}ℹ${NC} Risposta test: \"$RESPONSE_TEXT\""
            
            # Show native API stats if available
            if [ "$USE_NATIVE_API" = true ] && echo "$TEST_RESPONSE" | grep -q '"stats"'; then
                TPS=$(echo "$TEST_RESPONSE" | grep -o '"tokens_per_second":[0-9.]*' | cut -d: -f2 | head -1)
                TTFT=$(echo "$TEST_RESPONSE" | grep -o '"time_to_first_token":[0-9.]*' | cut -d: -f2 | head -1)
                if [ -n "$TPS" ] && [ -n "$TTFT" ]; then
                    echo -e "${GREEN}📊${NC} Stats: ${TPS} tokens/sec, TTFT: ${TTFT}s"
                fi
            fi
        else
            echo -e "${RED}✗${NC} Generazione testo fallita"
            echo -e "${YELLOW}ℹ${NC} Verifica che il modello sia caricato correttamente"
            if [ -n "$TEST_RESPONSE" ]; then
                echo -e "${YELLOW}ℹ${NC} Risposta: $(echo "$TEST_RESPONSE" | head -c 200)..."
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} Saltato - nessun modello disponibile per il test"
fi

echo -e "\n6. Verifica processi LMStudio..."
if command -v pgrep > /dev/null; then
    if pgrep -i lmstudio > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Processo LMStudio in esecuzione"
    else
        echo -e "${RED}✗${NC} Processo LMStudio non trovato"
    fi
elif ps aux 2>/dev/null | grep -i lmstudio | grep -v grep > /dev/null; then
    echo -e "${GREEN}✓${NC} Processo LMStudio in esecuzione"
else
    echo -e "${RED}✗${NC} Processo LMStudio non trovato"
fi

echo -e "\n🎯 Riepilogo:"
echo -e "URL LMStudio: $LMSTUDIO_URL"
echo -e "API Supportate:"
echo -e "  • Native REST API: $LMSTUDIO_URL/api/v0/* (statistiche avanzate)"
echo -e "  • OpenAI Compatible: $LMSTUDIO_URL/v1/* (compatibilità)"
echo -e "Per aprire LMStudio: avvia l'applicazione e vai su 'Local Server'"
echo -e "Per testare manualmente:"
echo -e "  Native API: curl $LMSTUDIO_URL/api/v0/models"
echo -e "  OpenAI API: curl $LMSTUDIO_URL/v1/models"

echo -e "\n✅ Diagnosi completata!"