import React, { useState, useEffect, useMemo } from 'react';
import type { EnhancedError, ErrorSeverity, ErrorCategory, LogEntry } from '../types';
import { errorManager } from '../services/errorService';
import { loggingService } from '../services/loggingService';

interface ErrorDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ErrorStats {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    byCode: Record<string, number>;
    recentErrors: number;
}

interface LogStats {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    recentErrors: number;
}

const ErrorDashboard: React.FC<ErrorDashboardProps> = ({ isOpen, onClose }) => {
    const [errorStats, setErrorStats] = useState<ErrorStats>({
        total: 0,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        byCategory: { api: 0, validation: 0, network: 0, file: 0, configuration: 0, processing: 0, ui: 0, system: 0 },
        byCode: {},
        recentErrors: 0
    });
    
    const [logStats, setLogStats] = useState<LogStats>({
        total: 0,
        byLevel: {},
        byCategory: {},
        recentErrors: 0
    });
    
    const [errorLog, setErrorLog] = useState<any[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'errors' | 'logs' | 'performance'>('overview');
    const [filterSeverity, setFilterSeverity] = useState<ErrorSeverity | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<ErrorCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            refreshData();
            const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [isOpen]);
    
    const refreshData = () => {
        // Get error statistics
        const errorStatsData = errorManager.getErrorStats();
        setErrorStats(errorStatsData);
        
        // Get error log
        const errorLogData = errorManager.getErrorLog();
        setErrorLog(errorLogData);
        
        // Get logging statistics
        const logStatsData = loggingService.getLogStats();
        setLogStats(logStatsData);
        
        // Get recent logs
        const recentLogs = loggingService.getLogs({
            startTime: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
        });
        setLogs(recentLogs);
    };
    
    const filteredErrors = useMemo(() => {
        return errorLog.filter(entry => {
            const error = entry.error;
            const matchesSeverity = filterSeverity === 'all' || error.severity === filterSeverity;
            const matchesCategory = filterCategory === 'all' || error.category === filterCategory;
            const matchesSearch = searchTerm === '' || 
                error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                error.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                error.context.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesSeverity && matchesCategory && matchesSearch;
        });
    }, [errorLog, filterSeverity, filterCategory, searchTerm]);
    
    const getSeverityColor = (severity: ErrorSeverity): string => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-red-500 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    
    const getCategoryColor = (category: ErrorCategory): string => {
        const colors = {
            api: 'text-purple-600 bg-purple-100',
            validation: 'text-orange-600 bg-orange-100',
            network: 'text-green-600 bg-green-100',
            file: 'text-indigo-600 bg-indigo-100',
            configuration: 'text-pink-600 bg-pink-100',
            processing: 'text-teal-600 bg-teal-100',
            ui: 'text-cyan-600 bg-cyan-100',
            system: 'text-gray-600 bg-gray-100'
        };
        return colors[category] || 'text-gray-600 bg-gray-100';
    };
    
    const formatTimestamp = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString('it-IT');
    };
    
    const exportErrorData = () => {
        const exportData = {
            timestamp: new Date().toISOString(),
            errorStats,
            logStats,
            errorLog: errorLog.slice(0, 100), // Last 100 errors
            logs: logs.slice(0, 500) // Last 500 logs
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowai-error-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const clearErrorLog = () => {
        if (confirm('Are you sure you want to clear all error logs?')) {
            errorManager.clearErrorLog();
            loggingService.clearLogs();
            refreshData();
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Error Dashboard and Monitoring</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={exportErrorData}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                            Export Data
                        </button>
                        <button
                            onClick={clearErrorLog}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Clear Logs
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'errors', label: 'Errors' },
                        { id: 'logs', label: 'Logs' },
                        { id: 'performance', label: 'Performance' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                selectedTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {selectedTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-red-800">Total Errors</h3>
                                    <p className="text-3xl font-bold text-red-600">{errorStats.total}</p>
                                    <p className="text-sm text-red-600">Recent errors: {errorStats.recentErrors}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-yellow-800">Critical Errors</h3>
                                    <p className="text-3xl font-bold text-yellow-600">{errorStats.bySeverity.critical}</p>
                                    <p className="text-sm text-yellow-600">Require immediate attention</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-800">Total Logs</h3>
                                    <p className="text-3xl font-bold text-blue-600">{logStats.total}</p>
                                    <p className="text-sm text-blue-600">Last 24h</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-green-800">System Status</h3>
                                    <p className="text-3xl font-bold text-green-600">
                                        {errorStats.bySeverity.critical === 0 ? '✓' : '⚠'}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        {errorStats.bySeverity.critical === 0 ? 'Operational' : 'Attention required'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Errors by Severity */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-4">Errors by Severity</h3>
                                    <div className="space-y-2">
                                        {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                                            <div key={severity} className="flex items-center justify-between">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    getSeverityColor(severity as ErrorSeverity)
                                                }`}>
                                                    {severity.toUpperCase()}
                                                </span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Errors by Category */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-4">Errors by Category</h3>
                                    <div className="space-y-2">
                                        {Object.entries(errorStats.byCategory).map(([category, count]) => (
                                            <div key={category} className="flex items-center justify-between">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    getCategoryColor(category as ErrorCategory)
                                                }`}>
                                                    {category.toUpperCase()}
                                                </span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Top Error Codes */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4">Most Frequent Error Codes</h3>
                                <div className="space-y-2">
                                    {Object.entries(errorStats.byCode)
                                        .sort(([,a], [,b]) => Number(b) - Number(a))
                                        .slice(0, 10)
                                        .map(([code, count]) => (
                                            <div key={code} className="flex items-center justify-between">
                                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {code}
                                                </span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {selectedTab === 'errors' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                    <select
                                        value={filterSeverity}
                                        onChange={(e) => setFilterSeverity(e.target.value as any)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="all">All</option>
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value as any)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="all">All</option>
                                        <option value="api">API</option>
                                        <option value="validation">Validation</option>
                                        <option value="network">Network</option>
                                        <option value="file">File</option>
                                        <option value="configuration">Configuration</option>
                                        <option value="processing">Processing</option>
                                        <option value="ui">UI</option>
                                        <option value="system">System</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by message, code or context..."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            
                            {/* Error List */}
                            <div className="space-y-2">
                                {filteredErrors.map((entry, index) => {
                                    const error = entry.error;
                                    return (
                                        <div key={error.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            getSeverityColor(error.severity)
                                                        }`}>
                                                            {error.severity.toUpperCase()}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            getCategoryColor(error.category)
                                                        }`}>
                                                            {error.category.toUpperCase()}
                                                        </span>
                                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {error.code}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatTimestamp(error.timestamp)}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900 mb-1">{error.message}</h4>
                                                    {error.details && (
                                                        <p className="text-sm text-gray-600 mb-2">{error.details}</p>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        Context: {error.context}
                                                        {error.retryable && (
                                             <span className="ml-2 text-blue-600">• Retryable</span>
                                         )}
                                                    </div>
                                                    {error.userAction && (
                                                        <div className="mt-2 text-sm text-blue-600">
                                                            💡 {error.userAction}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {filteredErrors.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No errors found with the selected filters.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {selectedTab === 'logs' && (
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4">Recent Logs</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {logs.slice(0, 100).map((log, index) => (
                                        <div key={log.id} className="text-sm border-b border-gray-100 pb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    log.level === 'error' || log.level === 'critical' ? 'text-red-600 bg-red-100' :
                                                    log.level === 'warn' ? 'text-yellow-600 bg-yellow-100' :
                                                    'text-blue-600 bg-blue-100'
                                                }`}>
                                                    {log.level.toUpperCase()}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {formatTimestamp(log.timestamp)}
                                                </span>
                                                <span className="text-gray-600 text-xs">
                                                    [{log.category}]
                                                </span>
                                            </div>
                                            <p className="mt-1 text-gray-800">{log.message}</p>
                                            {log.context && (
                                                <p className="text-xs text-gray-500">Context: {log.context}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {selectedTab === 'performance' && (
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-blue-800">Logs by Level</h4>
                                        <div className="mt-2 space-y-1">
                                            {Object.entries(logStats.byLevel).map(([level, count]) => (
                                                <div key={level} className="flex justify-between text-sm">
                                                    <span>{level}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-green-800">Logs by Category</h4>
                                        <div className="mt-2 space-y-1">
                                            {Object.entries(logStats.byCategory).slice(0, 5).map(([category, count]) => (
                                                <div key={category} className="flex justify-between text-sm">
                                                    <span>{category}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-purple-800">System Status</h4>
                                        <div className="mt-2 space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Recent errors</span>
                                                <span className="font-medium">{logStats.recentErrors}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Status</span>
                                                <span className={`font-medium ${
                                                    logStats.recentErrors === 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {logStats.recentErrors === 0 ? 'Stable' : 'Unstable'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorDashboard;