'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, Wallet, Loader2, CheckCircle2, AlertCircle, Shield, Lock } from 'lucide-react';

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
        { id: 'UPI', label: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
        { id: 'CARD', label: 'Card', icon: CreditCard, desc: 'Credit/Debit Card' },
        { id: 'NET_BANKING', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
        { id: 'WALLET', label: 'Wallet', icon: Wallet, desc: 'Paytm, Mobikwik' },
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
                    color: '#16a34a' // Green theme
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Payment Method</h3>
                    <p className="text-sm text-slate-500">Choose how you'd like to pay</p>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {paymentMethods.map((method) => (
                    <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`
                            relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                            ${selectedMethod === method.id
                                ? 'border-green-500 bg-green-50 shadow-md'
                                : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                            }
                        `}
                    >
                        <method.icon className={`w-6 h-6 mb-2 ${selectedMethod === method.id ? 'text-green-600' : 'text-slate-500'}`} />
                        <span className={`font-semibold text-sm ${selectedMethod === method.id ? 'text-green-700' : 'text-slate-700'}`}>
                            {method.label}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{method.desc}</span>
                        
                        {selectedMethod === method.id && (
                            <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Pay Button */}
            <button
                onClick={handlePayment}
                disabled={loading || !booking}
                className={`
                    w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-200
                    flex items-center justify-center gap-2
                    ${loading || !booking
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30 hover:shadow-green-500/40'
                    }
                `}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Lock className="w-5 h-5" />
                        Pay Securely
                    </>
                )}
            </button>

            {/* Security Badges */}
            <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Lock className="w-4 h-4 text-green-500" />
                        <span>256-bit SSL</span>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-3">
                    <img src="https://cdn.razorpay.com/logo/razorpay-logo.svg" alt="Razorpay" className="h-5 opacity-60" />
                    <span className="text-[10px] text-slate-400">Powered by Razorpay</span>
                </div>
            </div>
        </div>
    );
}

export default PaymentForm;
