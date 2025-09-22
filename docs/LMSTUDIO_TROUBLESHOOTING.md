# Risoluzione Problemi LMStudio

## Errore "Failed to Fetch"

Se ricevi l'errore "failed to fetch" quando provi a usare LMStudio, segui questi passi per risolverlo:

### 1. Verifica che LMStudio sia in esecuzione

- Apri LMStudio sul tuo computer
- Assicurati che sia caricato un modello
- Vai alla scheda "Local Server" o "Developer" 
- Avvia il server locale (solitamente sulla porta 1234)

### 2. Controlla l'URL del server

- L'URL predefinito è `http://localhost:1234`
- Se hai cambiato la porta in LMStudio, aggiorna l'URL nelle impostazioni
- Assicurati che l'URL non abbia una barra finale (es. `http://localhost:1234` non `http://localhost:1234/`)

### 3. Verifica la connessione

- Usa il pulsante "Testa Connessione" nelle impostazioni di FlowAI
- Se il test fallisce, controlla che:
  - LMStudio sia effettivamente in esecuzione
  - Non ci siano firewall che bloccano la porta 1234
  - L'indirizzo IP e la porta siano corretti

### 4. Problemi comuni

#### CORS (Cross-Origin Resource Sharing)
- LMStudio potrebbe non permettere richieste da domini diversi
- Assicurati che LMStudio sia configurato per accettare connessioni dal browser

#### Modelli non caricati
- Verifica che almeno un modello sia caricato in LMStudio
- Il modello deve essere attivo e pronto per generare testo
- Usa il pulsante "Fetch Models" per recuperare automaticamente i modelli disponibili

#### Timeout di connessione
- Se il server è lento, potresti ricevere timeout
- Prova con modelli più piccoli o aumenta le risorse di sistema

### 5. Test manuale

Puoi testare manualmente l'API di LMStudio aprendo il terminale e usando curl:

```bash
# Test per verificare che il server sia raggiungibile
curl http://localhost:1234/v1/models

# Test per una generazione di testo semplice
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model-name",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.7
  }'
```

### 6. Log di debugging

- Apri la console del browser (F12) per vedere eventuali errori dettagliati
- I messaggi di errore specifici ti aiuteranno a identificare il problema esatto

### 7. Configurazione di rete

Se usi LMStudio su un computer diverso:

- Sostituisci `localhost` con l'indirizzo IP del computer che esegue LMStudio
- Assicurati che il firewall permetta connessioni sulla porta utilizzata
- Verifica che LMStudio sia configurato per accettare connessioni esterne

## Contatti per Supporto

Se il problema persiste, fornisci le seguenti informazioni:

- Versione di LMStudio
- Sistema operativo
- Modello utilizzato
- Messaggio di errore completo dalla console del browser
- URL del server configurato