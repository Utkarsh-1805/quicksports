'use client';

import { Toaster as ReactHotToaster } from 'react-hot-toast';

export function ToastProvider() {
    return (
        <ReactHotToaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#ffffff',
                    color: '#0f172a', // slate-900
                    border: '1px solid #f1f5f9', // slate-100
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    borderRadius: '0.75rem', // rounded-xl
                    fontWeight: 500,
                },
                success: {
                    iconTheme: {
                        primary: '#22c55e', // green-500
                        secondary: '#ffffff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444', // red-500
                        secondary: '#ffffff',
                    },
                },
            }}
        />
    );
}
