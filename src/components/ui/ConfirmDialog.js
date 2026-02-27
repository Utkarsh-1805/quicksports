'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Info, HelpCircle, Loader2, X } from 'lucide-react';

/**
 * ConfirmDialog Component
 * A reusable confirmation dialog that can be used throughout the app
 */
export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning', // 'warning' | 'danger' | 'info'
    loading = false,
}) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, loading]);

    if (!isOpen) return null;

    const variantStyles = {
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            buttonBg: 'bg-amber-600 hover:bg-amber-700',
        },
        danger: {
            icon: AlertTriangle,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
        },
        info: {
            icon: Info,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
        },
    };

    const styles = variantStyles[variant] || variantStyles.warning;
    const Icon = styles.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !loading && onClose()}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 text-center mb-2">
                    {title}
                </h3>
                <p className="text-slate-500 text-center mb-6">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles.buttonBg}`}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * useConfirmDialog hook
 * Provides an easy way to use confirmation dialogs imperatively
 */
export function useConfirmDialog() {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'warning',
        resolve: null,
    });

    const confirm = useCallback(({
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        variant = 'warning',
    } = {}) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                variant,
                resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState((prev) => ({ ...prev, isOpen: false }));
    }, [state.resolve]);

    const handleClose = useCallback(() => {
        state.resolve?.(false);
        setState((prev) => ({ ...prev, isOpen: false }));
    }, [state.resolve]);

    const Dialog = () => (
        <ConfirmDialog
            isOpen={state.isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title={state.title}
            message={state.message}
            confirmText={state.confirmText}
            cancelText={state.cancelText}
            variant={state.variant}
        />
    );

    return { confirm, Dialog };
}
