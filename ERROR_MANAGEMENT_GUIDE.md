# FlowAI Error Management System Guide

This document describes the advanced error management system implemented in FlowAI, which provides unique identification, structured logging, and real-time notifications for all types of errors.

## System Overview

The FlowAI error management system consists of three main components:

1. **Error Manager** - Centralized error management with unique codes
2. **Logging Service** - Structured logging system with performance metrics
3. **Notification System** - Real-time notifications for critical errors
4. **Error Dashboard** - Monitoring dashboard for analysis and debugging

## Key Features

### 🔍 Unique Error Identification

Each error is classified with:
- **Unique code** (e.g. `API_001`, `FILE_002`)
- **Category** (api, validation, network, file, configuration, processing, ui, system)
- **Severity** (low, medium, high, critical)
- **Context** (specific stage where the error occurred)
- **Timestamp** and **session ID** for tracking

### 📊 Structured Logging

The system records:
- **Detailed logs** with contextual metadata
- **Performance metrics** for critical operations
- **Analytics events** for usage monitoring
- **Stack traces** for critical errors

### 🚨 Real-time Notifications

Three types of notifications:
- **Toast** - For non-critical errors (auto-dismiss)
- **Modal** - For critical errors requiring attention
- **Banner** - For persistent system notifications

### 📈 Monitoring Dashboard

The dashboard provides:
- **Real-time error statistics**
- **Charts by category and severity**
- **Detailed logs** with advanced filters
- **System performance metrics**
- **Data export** for external analysis

## System Usage

### For Developers

#### Basic Error Handling

```typescript
import { errorManager, createApiError, createValidationError } from './services/errorService';

// API Error
const apiError = createApiError(
    'Failed to connect to Gemini API',
    originalError,
    { provider: 'gemini', endpoint: '/generate' }
);

// Validation Error
const validationError = createValidationError(
    'Input text is required',
    'setup',
    { inputLength: 0, fieldName: 'rawText' }
);
```

#### Advanced Logging

```typescript
import { loggingService, logUserAction, logPerformanceMetric } from './services/loggingService';

// Basic logging
loggingService.info('User started pipeline', 'pipeline', 'execution', {
    userId: 'user123',
    inputLength: 1500,
    provider: 'gemini'
});

// Performance tracking
loggingService.startPerformanceTracking('pipeline_execution');
// ... operation ...
loggingService.endPerformanceTracking('pipeline_execution');

// Log user actions
logUserAction('generate_title', 'user_interaction', {
    provider: 'gemini',
    inputLength: 500
});
```

#### Gestione Errori nelle Funzioni

```typescript
try {
    const result = await someApiCall();
    return result;
} catch (error) {
    const enhancedError = createApiError(
        'API call failed',
        error,
        {
            operation: 'generateText',
            provider: settings.provider,
            retryAttempt: 1
        }
    );
    throw error; // L'errore viene automaticamente tracciato
}
```

### For Users

#### Dashboard Access

1. Click the dashboard icon in the top bar
2. Navigate between sections:
   - **Overview** - General statistics
   - **Errors** - Detailed error list
   - **Logs** - System logs
   - **Performance** - Performance metrics

#### Notification Interpretation

- **🚨 Critical Errors** - Require immediate action (e.g. missing API key)
- **⚠️ Important Errors** - Significant issues (e.g. service unavailable)
- **⚡ Warnings** - Minor issues (e.g. temporary rate limit)
- **ℹ️ Information** - Informational notifications

## Error Codes

### API Errors (API_xxx)
- `API_001` - Missing API key
- `API_002` - Invalid API key
- `API_003` - Rate limit reached
- `API_004` - API quota exceeded
- `API_005` - Service unavailable
- `API_006` - API timeout
- `API_007` - Invalid API response

### Network Errors (NET_xxx)
- `NET_001` - Connection failed
- `NET_002` - Network timeout
- `NET_003` - DNS error

### File Processing Errors (FILE_xxx)
- `FILE_001` - File too large
- `FILE_002` - Unsupported file format
- `FILE_003` - Corrupted file
- `FILE_004` - Read error
- `FILE_005` - Upload failed

### Validation Errors (VAL_xxx)
- `VAL_001` - Empty input
- `VAL_002` - Input too long
- `VAL_003` - Invalid format
- `VAL_004` - Required field

### Configuration Errors (CFG_xxx)
- `CFG_001` - Missing setting
- `CFG_002` - Invalid value
- `CFG_003` - Save failed

### Processing Errors (PROC_xxx)
- `PROC_001` - Pipeline failed
- `PROC_002` - Stage failed
- `PROC_003` - Processing timeout
- `PROC_004` - Memory error

### UI Errors (UI_xxx)
- `UI_001` - Component error
- `UI_002` - Rendering error
- `UI_003` - State error

### System Errors (SYS_xxx)
- `SYS_001` - Unknown error
- `SYS_002` - Insufficient memory
- `SYS_003` - Storage full

## Configuration

### Log Levels

The system supports different log levels:
- `debug` - Detailed information for development
- `info` - General information
- `warn` - Warnings
- `error` - Errors
- `critical` - Critical errors

To change the log level:
```typescript
loggingService.setLogLevel('debug'); // For development
loggingService.setLogLevel('warn');  // For production
```

### Custom User Actions

You can customize suggested actions for each error type:

```typescript
const USER_ACTION_MAP: Record<string, string> = {
    'API_001': 'Configure your API key in settings',
    'API_002': 'Verify that your API key is correct',
    // ... other mappings
};
```

## Monitoring and Analysis

### Key Metrics

1. **Error Rate** - Percentage of operations that fail
2. **Response Time** - API call performance
3. **Errors by Category** - Error distribution
4. **Critical Errors** - Number of errors requiring immediate attention

### Data Export

The dashboard allows exporting:
- **Complete report** in JSON format
- **Error statistics** for external analysis
- **Structured logs** for debugging

### External Service Integration

The system is prepared for integration with:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Custom Analytics** - Custom endpoints

## Best Practices

### For Developers

1. **Always use appropriate error codes**
2. **Include contextual metadata** in errors
3. **Log critical operations** with performance tracking
4. **Test error handling** in all scenarios
5. **Regularly monitor** the error dashboard

### For Production

1. **Configure appropriate log level**
2. **Monitor critical errors** in real-time
3. **Analyze patterns** of recurring errors
4. **Regularly export** data for analysis
5. **Keep logs clean** by periodically clearing

## Troubleshooting

### Common Issues

**Q: Notifications don't appear**
A: Verify that the `NotificationSystem` component is included in the app

**Q: Logs are not being saved**
A: Check the log level configuration

**Q: Dashboard is empty**
A: Make sure there are errors/logs to display

**Q: Slow performance**
A: Reduce the number of logs kept in memory

### Advanced Debugging

To enable full debugging:
```javascript
// In browser console
localStorage.setItem('flowai-log-level', 'debug');
// Reload the page
```

## Support

For issues or questions about the error management system:

1. Check this documentation
2. Check the error dashboard
3. Examine console logs
4. Contact the development team

---

*This error management system is designed to provide complete visibility and control over all aspects of the FlowAI application, facilitating debugging and improving user experience.*