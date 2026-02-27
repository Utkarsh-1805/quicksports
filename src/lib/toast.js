'use client';

import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/**
 * Custom toast notification utilities
 * Provides consistent styling and API for app-wide notifications
 */

// Custom styled toasts with icons
export const showToast = {
    /**
     * Show a success toast
     * @param {string} message - Toast message
     * @param {object} options - Additional options
     */
    success: (message, options = {}) => {
        return toast.success(message, {
            duration: 4000,
            ...options,
        });
    },

    /**
     * Show an error toast
     * @param {string} message - Toast message  
     * @param {object} options - Additional options
     */
    error: (message, options = {}) => {
        return toast.error(message, {
            duration: 5000,
            ...options,
        });
    },

    /**
     * Show a warning toast
     * @param {string} message - Toast message
     * @param {object} options - Additional options
     */
    warning: (message, options = {}) => {
        return toast(message, {
            duration: 4000,
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
            ...options,
        });
    },

    /**
     * Show an info toast
     * @param {string} message - Toast message
     * @param {object} options - Additional options
     */
    info: (message, options = {}) => {
        return toast(message, {
            duration: 4000,
            icon: <Info className="w-5 h-5 text-blue-500" />,
            ...options,
        });
    },

    /**
     * Show a loading toast that can be updated
     * @param {string} message - Toast message
     * @returns {string} Toast ID for updating
     */
    loading: (message) => {
        return toast.loading(message);
    },

    /**
     * Update a loading toast to success
     * @param {string} id - Toast ID
     * @param {string} message - Success message
     */
    loadingSuccess: (id, message) => {
        toast.success(message, { id });
    },

    /**
     * Update a loading toast to error
     * @param {string} id - Toast ID
     * @param {string} message - Error message
     */
    loadingError: (id, message) => {
        toast.error(message, { id });
    },

    /**
     * Dismiss a specific toast
     * @param {string} id - Toast ID
     */
    dismiss: (id) => {
        toast.dismiss(id);
    },

    /**
     * Dismiss all toasts
     */
    dismissAll: () => {
        toast.dismiss();
    },

    /**
     * Promise-based toast that shows loading, success, and error states
     * @param {Promise} promise - The promise to track
     * @param {object} messages - Messages for each state
     */
    promise: (promise, messages) => {
        return toast.promise(promise, {
            loading: messages.loading || 'Loading...',
            success: messages.success || 'Success!',
            error: (err) => messages.error || err?.message || 'Something went wrong',
        });
    },

    /**
     * Show a custom toast with action button
     * @param {string} message - Toast message
     * @param {object} action - Action configuration { label, onClick }
     * @param {object} options - Additional options
     */
    withAction: (message, action, options = {}) => {
        return toast(
            (t) => (
                <div className="flex items-center gap-3">
                    <span>{message}</span>
                    <button
                        onClick={() => {
                            action.onClick();
                            toast.dismiss(t.id);
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {action.label}
                    </button>
                </div>
            ),
            {
                duration: 6000,
                ...options,
            }
        );
    },
};

// Re-export the raw toast for custom usage
export { toast };
