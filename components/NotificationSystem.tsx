import React, { useState, useEffect, useCallback } from 'react';
import type { ErrorNotification, NotificationType, ErrorSeverity } from '../types';
import { errorManager } from '../services/errorService';
import { loggingService } from '../services/loggingService';

// Notification Toast Component
interface ToastProps {
    notification: ErrorNotification;
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    
    useEffect(() => {
        // Auto-dismiss non-critical notifications after 5 seconds
        if (notification.severity !== 'critical') {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification.severity]);
    
    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onDismiss(notification.id);
        }, 300);
    }, [notification.id, onDismiss]);
    
    const getSeverityStyles = (severity: ErrorSeverity): string => {
        switch (severity) {
            case 'critical':
                return 'bg-red-600 border-red-700 text-white';
            case 'high':
                return 'bg-red-500 border-red-600 text-white';
            case 'medium':
                return 'bg-yellow-500 border-yellow-600 text-white';
            case 'low':
            default:
                return 'bg-blue-500 border-blue-600 text-white';
        }
    };
    
    const getSeverityIcon = (severity: ErrorSeverity): string => {
        switch (severity) {
            case 'critical':
                return '🚨';
            case 'high':
                return '⚠️';
            case 'medium':
                return '⚡';
            case 'low':
            default:
                return 'ℹ️';
        }
    };
    
    if (!isVisible) return null;
    
    return (
        <div
            className={`
                fixed top-4 right-4 z-50 max-w-md w-full
                transform transition-all duration-300 ease-in-out
                ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
            `}
        >
            <div className={`
                rounded-lg border-2 shadow-lg p-4
                ${getSeverityStyles(notification.severity)}
            `}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <span className="text-xl flex-shrink-0">
                            {getSeverityIcon(notification.severity)}
                        </span>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                                {notification.title}
                            </h4>
                            <p className="text-sm mt-1 opacity-90">
                                {notification.message}
                            </p>
                            {notification.actions && notification.actions.length > 0 && (
                                <div className="mt-3 flex space-x-2">
                                    {notification.actions.map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                action.action();
                                                handleDismiss();
                                            }}
                                            className="
                                                px-3 py-1 text-xs font-medium
                                                bg-white bg-opacity-20 hover:bg-opacity-30
                                                rounded border border-white border-opacity-30
                                                transition-colors duration-200
                                            "
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="
                            flex-shrink-0 ml-2 p-1 rounded
                            hover:bg-white hover:bg-opacity-20
                            transition-colors duration-200
                        "
                        aria-label="Close notification"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal Component for Critical Errors
interface ModalProps {
    notification: ErrorNotification;
    onDismiss: (id: string) => void;
}

const Modal: React.FC<ModalProps> = ({ notification, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);
    
    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            onDismiss(notification.id);
        }, 300);
    }, [notification.id, onDismiss]);
    
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleDismiss();
        }
    };
    
    if (!isVisible) return null;
    
    return (
        <div
            className={`
                fixed inset-0 z-50 flex items-center justify-center
                bg-black bg-opacity-50 transition-opacity duration-300
                ${isVisible ? 'opacity-100' : 'opacity-0'}
            `}
            onClick={handleBackdropClick}
        >
            <div className={`
                bg-white rounded-lg shadow-xl max-w-md w-full mx-4
                transform transition-transform duration-300
                ${isVisible ? 'scale-100' : 'scale-95'}
            `}>
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🚨</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {notification.title}
                            </h3>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-gray-700">
                            {notification.message}
                        </p>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                        {notification.actions && notification.actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    action.action();
                                    handleDismiss();
                                }}
                                className="
                                    px-4 py-2 text-sm font-medium
                                    bg-red-600 text-white rounded-md
                                    hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
                                    transition-colors duration-200
                                "
                            >
                                {action.label}
                            </button>
                        ))}
                        <button
                            onClick={handleDismiss}
                            className="
                                px-4 py-2 text-sm font-medium
                                bg-gray-300 text-gray-700 rounded-md
                                hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500
                                transition-colors duration-200
                            "
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Banner Component for Persistent Notifications
interface BannerProps {
    notification: ErrorNotification;
    onDismiss: (id: string) => void;
}

const Banner: React.FC<BannerProps> = ({ notification, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);
    
    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            onDismiss(notification.id);
        }, 300);
    }, [notification.id, onDismiss]);
    
    const getSeverityStyles = (severity: ErrorSeverity): string => {
        switch (severity) {
            case 'critical':
                return 'bg-red-600 border-red-700';
            case 'high':
                return 'bg-red-500 border-red-600';
            case 'medium':
                return 'bg-yellow-500 border-yellow-600';
            case 'low':
            default:
                return 'bg-blue-500 border-blue-600';
        }
    };
    
    if (!isVisible) return null;
    
    return (
        <div className={`
            fixed top-0 left-0 right-0 z-40
            transform transition-transform duration-300
            ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        `}>
            <div className={`
                border-b-2 text-white p-4
                ${getSeverityStyles(notification.severity)}
            `}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <h4 className="font-semibold">{notification.title}</h4>
                            <p className="text-sm opacity-90">{notification.message}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {notification.actions && notification.actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    action.action();
                                    handleDismiss();
                                }}
                                className="
                                    px-3 py-1 text-sm font-medium
                                    bg-white bg-opacity-20 hover:bg-opacity-30
                                    rounded border border-white border-opacity-30
                                    transition-colors duration-200
                                "
                            >
                                {action.label}
                            </button>
                        ))}
                        <button
                            onClick={handleDismiss}
                            className="
                                p-1 rounded hover:bg-white hover:bg-opacity-20
                                transition-colors duration-200
                            "
                            aria-label="Close banner"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Notification System Component
export const NotificationSystem: React.FC = () => {
    const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
    
    useEffect(() => {
        // Listen for new notifications from error manager
        const unsubscribe = errorManager.onNotification((notification) => {
            setNotifications(prev => {
                // Prevent duplicate notifications
                if (prev.some(n => n.id === notification.id)) {
                    return prev;
                }
                
                // Limit total notifications to prevent UI overflow
                const newNotifications = [...prev, notification];
                if (newNotifications.length > 5) {
                    return newNotifications.slice(-5);
                }
                
                return newNotifications;
            });
            
            // Log notification creation
            loggingService.info(
                `Notification created: ${notification.title}`,
                'notification',
                'system',
                {
                    notificationId: notification.id,
                    type: notification.type,
                    severity: notification.severity
                }
            );
        });
        
        // Listen for custom events
        const handleOpenSettings = () => {
            // Emit event to open settings modal
            window.dispatchEvent(new CustomEvent('open-settings-modal'));
        };
        
        const handleErrorRetry = (event: CustomEvent) => {
            const error = event.detail;
            loggingService.info(
                `Error retry requested: ${error.code}`,
                'error',
                'retry',
                { errorId: error.id, errorCode: error.code }
            );
        };
        
        window.addEventListener('open-settings', handleOpenSettings);
        window.addEventListener('error-retry', handleErrorRetry as EventListener);
        
        return () => {
            unsubscribe();
            window.removeEventListener('open-settings', handleOpenSettings);
            window.removeEventListener('error-retry', handleErrorRetry as EventListener);
        };
    }, []);
    
    const handleDismissNotification = useCallback((id: string) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            if (notification) {
                loggingService.info(
                    `Notification dismissed: ${notification.title}`,
                    'notification',
                    'dismiss',
                    { notificationId: id }
                );
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);
    
    // Separate notifications by type
    const toastNotifications = notifications.filter(n => n.type === 'toast');
    const modalNotifications = notifications.filter(n => n.type === 'modal');
    const bannerNotifications = notifications.filter(n => n.type === 'banner');
    
    return (
        <>
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toastNotifications.map((notification) => (
                    <Toast
                        key={notification.id}
                        notification={notification}
                        onDismiss={handleDismissNotification}
                    />
                ))}
            </div>
            
            {/* Modal Notifications */}
            {modalNotifications.map((notification) => (
                <Modal
                    key={notification.id}
                    notification={notification}
                    onDismiss={handleDismissNotification}
                />
            ))}
            
            {/* Banner Notifications */}
            {bannerNotifications.map((notification) => (
                <Banner
                    key={notification.id}
                    notification={notification}
                    onDismiss={handleDismissNotification}
                />
            ))}
        </>
    );
};

// Hook for programmatic notification management
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
    
    useEffect(() => {
        const unsubscribe = errorManager.onNotification((notification) => {
            setNotifications(prev => [...prev, notification]);
        });
        
        return unsubscribe;
    }, []);
    
    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);
    
    return {
        notifications,
        dismissNotification,
        clearAllNotifications
    };
};

export default NotificationSystem;