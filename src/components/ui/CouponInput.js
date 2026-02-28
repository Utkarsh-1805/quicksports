'use client';

import { useState } from 'react';
import { Tag, Check, X, Loader2, Percent } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * CouponInput Component
 * Input field for applying discount coupons during checkout
 * 
 * @param {number} bookingAmount - The original booking amount
 * @param {string} sportType - The sport type (optional, for validation)
 * @param {function} onCouponApplied - Callback when coupon is applied (couponData, discount, finalAmount)
 * @param {function} onCouponRemoved - Callback when coupon is removed
 */
export function CouponInput({ 
    bookingAmount = 0, 
    sportType = null, 
    onCouponApplied, 
    onCouponRemoved 
}) {
    const { token } = useAuth();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const applyCoupon = async () => {
        if (!code.trim() || !token) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/coupons/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: code.trim(),
                    bookingAmount,
                    sportType
                })
            });

            const data = await response.json();

            if (data.success) {
                setAppliedCoupon(data.data);
                onCouponApplied?.(data.data.coupon, data.data.discount, data.data.finalAmount);
            } else {
                setError(data.error || 'Failed to apply coupon');
            }
        } catch (err) {
            setError('Failed to apply coupon');
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCode('');
        setError(null);
        onCouponRemoved?.();
    };

    if (appliedCoupon) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-800 dark:text-green-300">
                                    {appliedCoupon.coupon.code}
                                </span>
                                <span className="flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    Applied
                                </span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400">
                                {appliedCoupon.coupon.description || `${appliedCoupon.coupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.coupon.discountValue}% off` : `₹${appliedCoupon.coupon.discountValue} off`}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={removeCoupon}
                        className="p-2 text-green-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove coupon"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Discount Summary */}
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 flex items-center justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">You save</span>
                    <span className="font-bold text-green-700 dark:text-green-300">-₹{appliedCoupon.discount}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Have a coupon code?
            </label>
            
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError(null);
                        }}
                        placeholder="Enter coupon code"
                        className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors ${
                            error 
                                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-200' 
                                : 'border-slate-200 dark:border-slate-700 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900'
                        } focus:outline-none focus:ring-2`}
                        disabled={loading}
                    />
                    {code && !loading && (
                        <button
                            onClick={() => { setCode(''); setError(null); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={applyCoupon}
                    disabled={!code.trim() || loading}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Percent className="w-4 h-4" />
                            Apply
                        </>
                    )}
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
                    <X className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    );
}

export default CouponInput;
