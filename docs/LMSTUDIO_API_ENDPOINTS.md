# LMStudio API Endpoints Supportati in FlowAI

FlowAI supporta entrambe le API di LMStudio per fornire la migliore esperienza possibile.

## 🚀 **API Nativa LMStudio** (Preferita)

### Endpoint: `/api/v0/*`
**Richiede**: LMStudio 0.3.6+
**Vantaggi**: Statistiche avanzate, informazioni dettagliate sui modelli

#### 1. Lista Modelli
```bash
GET /api/v0/models
```
**Risposta include**:
- Stato del modello (loaded/not-loaded)
- Tipo di modello (llm, vlm, embeddings)
- Architettura e quantizzazione
- Lunghezza massima del contesto

#### 2. Informazioni Modello Specifico
```bash
GET /api/v0/models/{model-id}
```

#### 3. Chat Completions
```bash
POST /api/v0/chat/completions
```
**Statistiche extra**:
- `tokens_per_second`: Velocità di generazione
- `time_to_first_token`: Latenza iniziale
- `generation_time`: Tempo totale di generazione
- `model_info`: Dettagli architettura e runtime

## 🔄 **API Compatibile OpenAI** (Fallback)

### Endpoint: `/v1/*`
**Sempre disponibile**
**Uso**: Quando l'API nativa non è disponibile

#### 1. Lista Modelli
```bash
GET /v1/models
```

#### 2. Chat Completions
```bash
POST /v1/chat/completions
```

## 🎯 **Comportamento di FlowAI**

### Strategia di Fallback Automatico
1. **Prima prova**: API nativa (`/api/v0/*`)
2. **Se fallisce**: API OpenAI (`/v1/*`)
3. **Logging**: Indica quale API è stata utilizzata

### Gestione Modelli
- **API Nativa**: Mostra indicatori di stato
  - 🟢 = Modello caricato
  - ⚪ = Modello non caricato
  - Tipo di modello tra parentesi
- **API OpenAI**: Lista semplice di modelli

### Logging Avanzato
Quando disponibile, FlowAI logga:
- Velocità di generazione (tokens/sec)
- Tempo al primo token
- Informazioni sul runtime
- Dettagli architettura modello

## 📊 **Esempi di Utilizzo**

### Test Connessione
```bash
# Test API nativa
curl http://localhost:1234/api/v0/models

# Test API OpenAI (fallback)
curl http://localhost:1234/v1/models
```

### Test Generazione con Statistiche
```bash
# API Nativa (statistiche avanzate)
curl -X POST http://localhost:1234/api/v0/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model",
    "messages": [{"role": "user", "content": "Test"}],
    "temperature": 0.7,
    "stream": false
  }'

# Risposta include stats: { tokens_per_second, time_to_first_token, ... }
```

## 🛠️ **Configurazione in FlowAI**

1. **URL Base**: `http://localhost:1234` (default)
2. **Auto-detection**: FlowAI rileva automaticamente l'API disponibile
3. **Fetch Models**: Utilizza l'API migliore disponibile
4. **Streaming**: Supportato su entrambe le API

## 🔍 **Troubleshooting**

### Se solo l'API OpenAI funziona
- Aggiorna LMStudio alla versione 0.3.6+
- Riavvia il server locale in LMStudio

### Se nessuna API funziona
- Verifica che LMStudio sia in esecuzione
- Controlla che il server locale sia attivo
- Usa lo script di diagnosi: `./scripts/check-lmstudio.sh`

## 📝 **Note di Implementazione**

- **Model Name Cleaning**: FlowAI rimuove automaticamente gli indicatori di stato dai nomi dei modelli prima di fare richieste
- **Timeout**: 30 secondi per generazione, 10 secondi per fetch modelli
- **Error Handling**: Messaggi di errore specifici in italiano
- **Performance**: Preferenza per API nativa quando disponibile