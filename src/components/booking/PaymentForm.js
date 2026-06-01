'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * PaymentForm Component
 * Handles payment method selection and Razorpay integration
 */
export function PaymentForm({
    booking,
    user,
    totalWithFees,
    onPaymentSuccess,
    onPaymentError
}) {
    const [selectedMethod, setSelectedMethod] = useState('UPI');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    // Load Razorpay script
    useEffect(() => {
        const loadRazorpay = () => {
            if (window.Razorpay) {
                setRazorpayLoaded(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => setRazorpayLoaded(true);
            script.onerror = () => setError('Failed to load payment gateway');
            document.body.appendChild(script);
        };

        loadRazorpay();
    }, []);

    const paymentMethods = [
        { id: 'UPI', label: 'UPI', iconName: 'smartphone', desc: 'Google Pay, PhonePe, Paytm' },
        { id: 'CARD', label: 'Card', iconName: 'credit_card', desc: 'Credit/Debit Card' },
        { id: 'NET_BANKING', label: 'Net Banking', iconName: 'account_balance', desc: 'All major banks' },
        { id: 'WALLET', label: 'Wallet', iconName: 'wallet', desc: 'Paytm, Mobikwik' },
    ];

    const handlePayment = async () => {
        if (!booking?.id) {
            setError('Invalid booking details');
            return;
        }

        if (!razorpayLoaded) {
            setError('Payment gateway not loaded. Please refresh the page.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get token from cookies
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to continue with payment');
            }

            // Step 1: Create payment order
            const orderRes = await fetch(`/api/bookings/${booking.id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paymentMethod: selectedMethod,
                    totalAmount: totalWithFees, // Send the total including fees
                    notes: {
                        source: 'web_booking'
                    }
                })
            });

            const orderData = await orderRes.json();

            if (!orderData.success) {
                throw new Error(orderData.error || 'Failed to create payment order');
            }

            // Step 2: Open Razorpay checkout
            const options = {
                key: orderData.data.razorpayConfig.key,
                amount: orderData.data.razorpayConfig.amount,
                currency: orderData.data.razorpayConfig.currency,
                name: 'QuickCourt',
                description: orderData.data.razorpayConfig.description,
                order_id: orderData.data.razorpayOrderId,
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#006b2c' // M3 primary green
                },
                handler: async function(response) {
                    // Step 3: Verify payment
                    try {
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            onPaymentSuccess?.({
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                bookingId: booking.id,
                                ...verifyData
                            });
                        } else {
                            throw new Error(verifyData.error || 'Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        setError(err.message);
                        onPaymentError?.(err.message);
                    }
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                        setError('Payment was cancelled');
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function(response) {
                setError(response.error.description || 'Payment failed');
                onPaymentError?.(response.error.description);
            });
            razorpay.open();

        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message);
            onPaymentError?.(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card p-7">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
                    <Icon name="credit_card" size={20} className="text-primary" />
                </div>
                <div>
                    <h3 className="font-display text-lg font-semibold text-on-surface">Payment Method</h3>
                    <p className="text-sm text-on-surface-variant">Choose how you&apos;d like to pay</p>
                </div>
            </div>

            {/* Method Tabs */}
            <label className="font-mono text-[11px] text-on-surface-variant mb-1.5 block uppercase tracking-[0.12em]">Method</label>
            <div className="bg-surface-container rounded-lg p-1 grid grid-cols-2 sm:grid-cols-4 gap-1 mb-6">
                {paymentMethods.map((method) => {
                    const active = selectedMethod === method.id;
                    return (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`
                                relative flex flex-col items-center justify-center px-3 py-3 rounded-lg transition-all duration-200
                                ${active
                                    ? 'bg-surface-container-lowest shadow-sm text-primary'
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                                }
                            `}
                        >
                            <Icon name={method.iconName} size={20} className={active ? 'text-primary' : 'text-on-surface-variant'} />
                            <span className={`font-semibold text-sm mt-1 ${active ? 'text-primary' : 'text-on-surface'}`}>
                                {method.label}
                            </span>
                            <span className="text-[10px] text-on-surface-variant mt-0.5 text-center">{method.desc}</span>

                            {active && (
                                <Icon name="check_circle" filled size={14} className="absolute top-1.5 right-1.5 text-primary" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-lg flex items-center gap-2">
                    <Icon name="error" size={20} className="text-error shrink-0" />
                    <p className="text-sm text-on-error-container">{error}</p>
                </div>
            )}

            {/* Pay Button */}
            <button
                onClick={handlePayment}
                disabled={loading || !booking}
                className={`btn btn-lg w-full ${
                    loading || !booking
                        ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                        : 'btn-cta'
                }`}
            >
                {loading ? (
                    <>
                        <Icon name="progress_activity" size={20} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Icon name="lock" size={20} />
                        Pay Securely
                    </>
                )}
            </button>

            {/* Security Badges */}
            <div className="mt-6 pt-4 border-t border-outline-variant/40">
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Icon name="shield" size={16} className="text-primary" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Icon name="lock" size={16} className="text-primary" />
                        <span className="font-mono">256-bit SSL</span>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-3">
                    <img src="https://cdn.razorpay.com/logo/razorpay-logo.svg" alt="Razorpay" className="h-5 opacity-60" />
                    <span className="text-[10px] text-on-surface-variant font-mono">Powered by Razorpay</span>
                </div>
            </div>
        </div>
    );
}

export default PaymentForm;
