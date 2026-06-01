'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const DEFAULT_PREFS = {
    emailNotifications: true,
    smsNotifications: false,
    promotionalEmails: false,
    bookingReminders: true,
};

/**
 * UserProfilePage Component
 * Profile management with avatar upload, info update, and password change
 */
export default function UserProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const { user: userApi, notification: notificationApi } = useApi();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    // Payment history state
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [paymentsError, setPaymentsError] = useState(null);
    const [paymentsPagination, setPaymentsPagination] = useState({ page: 1, totalPages: 1 });

    // Profile form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: ''
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Avatar upload state
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Notification preferences
    const [preferences, setPreferences] = useState(DEFAULT_PREFS);
    const [preferencesLoading, setPreferencesLoading] = useState(false);
    const [savingPreferences, setSavingPreferences] = useState(false);

    // Account deactivation
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivateReason, setDeactivateReason] = useState('');
    const [deactivatePassword, setDeactivatePassword] = useState('');
    const [deactivating, setDeactivating] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/dashboard/profile');
            return;
        }

        fetchProfile();
    }, [user, authLoading]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to view profile');
            }

            const res = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                const profileData = data.data.profile;
                setProfile(profileData);
                setFormData({
                    name: profileData.name || '',
                    email: profileData.email || '',
                    phone: profileData.phone || '',
                    bio: profileData.bio || ''
                });
                setAvatarPreview(profileData.avatar);
            } else {
                throw new Error(data.message || 'Failed to load profile');
            }
        } catch (err) {
            console.error('Fetch profile error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async (page = 1) => {
        setPaymentsLoading(true);
        setPaymentsError(null);

        try {
            const { success, data, error: apiError } = await userApi.getPaymentHistory({ page, limit: 10 });

            if (success && data) {
                setPayments(data.payments || []);
                setPaymentsPagination({
                    page: data.pagination?.page || 1,
                    totalPages: data.pagination?.totalPages || 1
                });
            } else {
                throw new Error(apiError || 'Failed to load payments');
            }
        } catch (err) {
            console.error('Fetch payments error:', err);
            setPaymentsError(err.message);
        } finally {
            setPaymentsLoading(false);
        }
    };

    // Fetch payments when tab changes to payments
    useEffect(() => {
        if (activeTab === 'payments' && payments.length === 0 && !paymentsLoading) {
            fetchPayments();
        }
    }, [activeTab]);

    const fetchPreferences = async () => {
        setPreferencesLoading(true);
        try {
            const res = await notificationApi.getPreferences();
            if (res.success && res.data?.preferences) {
                setPreferences({ ...DEFAULT_PREFS, ...res.data.preferences });
            }
        } catch (err) {
            console.error('Fetch preferences error:', err);
        } finally {
            setPreferencesLoading(false);
        }
    };

    // Lazy-load preferences when the notifications tab is opened
    useEffect(() => {
        if (activeTab === 'notifications' && !preferencesLoading) {
            fetchPreferences();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleSavePreferences = async () => {
        setSavingPreferences(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await notificationApi.updatePreferences(preferences);
            if (res.success) {
                setSuccess('Notification preferences saved!');
            } else {
                setError(res.error || 'Failed to save preferences');
            }
        } catch (err) {
            setError(err.message || 'Failed to save preferences');
        } finally {
            setSavingPreferences(false);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivatePassword) {
            setError('Please enter your password to confirm.');
            return;
        }
        setDeactivating(true);
        setError(null);
        try {
            const res = await userApi.deactivateAccount(deactivateReason, deactivatePassword);

            if (res.success) {
                setShowDeactivateModal(false);
                logout();
                router.push('/');
            } else {
                const fieldErrors = res.errors && typeof res.errors === 'object'
                    ? Object.values(res.errors).flat().filter(Boolean).join(' ')
                    : '';
                setError(fieldErrors || res.error || 'Failed to deactivate account');
            }
        } catch (err) {
            setError(err.message || 'Failed to deactivate account');
        } finally {
            setDeactivating(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    bio: formData.bio
                })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Profile updated successfully!');
                setProfile(data.profile);
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setSavingPassword(true);
        setError(null);
        setSuccess(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch('/api/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                    confirmPassword: passwordData.confirmPassword
                })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Password changed successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                throw new Error(data.message || 'Failed to change password');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target.result);
        reader.readAsDataURL(file);

        // Upload
        setUploadingAvatar(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (data.success && data.url) {
                // Update profile with new avatar URL
                const updateRes = await fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ avatar: data.url })
                });

                const updateData = await updateRes.json();
                if (updateData.success) {
                    setSuccess('Avatar updated successfully!');
                }
            } else {
                throw new Error(data.message || 'Failed to upload avatar');
            }
        } catch (err) {
            setError(err.message);
            setAvatarPreview(profile?.avatar);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: 'person' },
        { id: 'payments', label: 'Payments', icon: 'credit_card' },
        { id: 'security', label: 'Security', icon: 'lock' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications' }
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-28 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <Icon name="progress_activity" size={40} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-on-surface-variant">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-24 pb-16 page-enter">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">

                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                        <Icon name="chevron_right" size={16} />
                        <span className="text-on-surface">Profile</span>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-semibold text-on-surface tracking-tight">Profile &amp; settings</h1>
                    <p className="text-on-surface-variant mt-2">Manage your account, security, and preferences.</p>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-primary-container/20 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
                        <Icon name="check_circle" size={20} className="text-primary shrink-0" />
                        <p className="text-on-primary-container">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="bg-error-container border border-error/20 rounded-xl p-4 flex items-center gap-3">
                        <Icon name="error" size={20} className="text-error shrink-0" />
                        <p className="text-on-error-container">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
                {/* Left vertical tab nav */}
                <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-sm text-left whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-surface-container text-on-surface font-semibold'
                                        : 'text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-low'
                                }`}
                            >
                                <Icon name={tab.icon} size={18} filled={active} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Tab panels */}
                <div>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 anim-fade">
                        {/* Left Column: Personal Details */}
                        <section className="xl:col-span-2 card p-8">
                            <h3 className="font-display text-2xl font-semibold text-on-surface mb-6 border-b border-outline-variant pb-4">Account</h3>

                            {/* Avatar Section */}
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative">
                                    <div
                                        onClick={handleAvatarClick}
                                        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center cursor-pointer overflow-hidden group border-2 border-surface"
                                    >
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt={profile?.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-on-primary">
                                                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {uploadingAvatar ? (
                                                <Icon name="progress_activity" size={24} className="text-on-primary animate-spin" />
                                            ) : (
                                                <Icon name="photo_camera" size={24} className="text-on-primary" />
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAvatarClick}
                                        className="btn btn-outline btn-sm self-start"
                                    >
                                        <Icon name="upload" size={14} />
                                        Change photo
                                    </button>
                                    <p className="text-sm text-on-surface-variant">JPG, GIF or PNG. Max size 2MB.</p>
                                </div>
                            </div>

                            {/* Form Grid */}
                            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">Full name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">Email address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="input font-mono bg-surface-container cursor-not-allowed truncate"
                                    />
                                    <p className="text-xs text-on-surface-variant">Email cannot be changed</p>
                                </div>

                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">Phone number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input font-mono"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        rows={4}
                                        className="input resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div className="md:col-span-2 flex justify-end mt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <>
                                                <Icon name="progress_activity" size={16} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Icon name="save" size={16} />
                                                Save changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Right Column: Identity Card */}
                        <div className="flex flex-col gap-8">
                            <section className="card p-8 text-center">
                                <div
                                    onClick={handleAvatarClick}
                                    className="w-28 h-28 mx-auto rounded-full bg-primary-container flex items-center justify-center cursor-pointer overflow-hidden mb-4"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt={profile?.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-display text-4xl font-semibold text-on-primary-container">
                                            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-display font-semibold text-lg text-on-surface">{profile?.name}</h3>
                                <p className="text-sm text-on-surface-variant truncate font-mono">{profile?.email}</p>
                                {profile?.role && (
                                    <div className="mt-3">
                                        <span className="pill" style={{ textTransform: 'none', letterSpacing: 0 }}>
                                            {profile.role}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-6 pt-6 border-t border-outline-variant">
                                    <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.1em]">Member since</p>
                                    <p className="text-sm text-on-surface mt-1 font-mono">
                                        {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                {profile?.stats && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                                        <div className="p-3 bg-surface-container rounded-xl">
                                            <p className="font-display text-xl font-semibold text-on-surface">{profile.stats.bookings || 0}</p>
                                            <p className="text-xs text-on-surface-variant">Bookings</p>
                                        </div>
                                        <div className="p-3 bg-surface-container rounded-xl">
                                            <p className="font-display text-xl font-semibold text-on-surface">{profile.stats.reviews || 0}</p>
                                            <p className="text-xs text-on-surface-variant">Reviews</p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <section className="card p-8 anim-fade">
                        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant pb-4">
                            <Icon name="receipt_long" className="text-primary" />
                            <h3 className="font-display text-2xl font-semibold text-on-surface">Payment history</h3>
                        </div>

                        {paymentsLoading ? (
                            <div className="text-center py-12">
                                <Icon name="progress_activity" size={32} className="text-primary animate-spin mx-auto mb-3" />
                                <p className="text-on-surface-variant">Loading payments...</p>
                            </div>
                        ) : paymentsError ? (
                            <div className="bg-error-container border border-error/20 rounded-xl p-4 flex items-center gap-3">
                                <Icon name="error" size={20} className="text-error shrink-0" />
                                <p className="text-on-error-container">{paymentsError}</p>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-12 bg-surface-container rounded-xl">
                                <Icon name="credit_card" size={48} className="text-on-surface-variant mx-auto mb-3" />
                                <h4 className="font-medium text-on-surface mb-1">No payments yet</h4>
                                <p className="text-sm text-on-surface-variant">Your payment history will appear here</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="bg-surface rounded-xl p-4 border border-outline-variant hover:bg-surface-container-low transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h4 className="font-medium text-on-surface truncate">
                                                            {payment.booking?.venue?.name || 'Court Booking'}
                                                        </h4>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            payment.status === 'COMPLETED' || payment.status === 'SUCCESS'
                                                                ? 'bg-primary-container text-on-primary-container'
                                                                : payment.status === 'PENDING'
                                                                ? 'bg-secondary-fixed text-on-secondary-fixed'
                                                                : payment.status === 'FAILED'
                                                                ? 'bg-error-container text-on-error-container'
                                                                : payment.status === 'REFUNDED'
                                                                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                                                : 'bg-surface-container-high text-on-surface'
                                                        }`}>
                                                            {payment.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-on-surface-variant flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Icon name="calendar_today" size={14} />
                                                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        <span className="text-outline-variant">|</span>
                                                        <span>{payment.paymentMethod || 'Online'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-on-surface">
                                                        {new Intl.NumberFormat('en-IN', {
                                                            style: 'currency',
                                                            currency: 'INR',
                                                            maximumFractionDigits: 0
                                                        }).format(payment.amount)}
                                                    </p>
                                                    {payment.transactionId && (
                                                        <p className="text-xs text-on-surface-variant mt-1 font-mono">
                                                            #{payment.transactionId.slice(-8)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {paymentsPagination.totalPages > 1 && (
                                    <div className="flex justify-center gap-2 pt-6 mt-6 border-t border-outline-variant">
                                        <button
                                            onClick={() => fetchPayments(paymentsPagination.page - 1)}
                                            disabled={paymentsPagination.page === 1}
                                            className="px-4 py-2 text-sm font-medium rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-4 py-2 text-sm text-on-surface-variant">
                                            Page {paymentsPagination.page} of {paymentsPagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => fetchPayments(paymentsPagination.page + 1)}
                                            disabled={paymentsPagination.page >= paymentsPagination.totalPages}
                                            className="px-4 py-2 text-sm font-medium rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="flex flex-col gap-6 anim-fade">
                        {/* Change Password */}
                        <section className="card p-8">
                            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant pb-4">
                                <Icon name="lock" className="text-on-surface" />
                                <h3 className="font-display text-2xl font-semibold text-on-surface">Change password</h3>
                            </div>

                            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 max-w-md">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">Current password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="input pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                                        >
                                            <Icon name={showPasswords.current ? 'visibility_off' : 'visibility'} size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">New password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="input pr-12"
                                            placeholder="At least 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                                        >
                                            <Icon name={showPasswords.new ? 'visibility_off' : 'visibility'} size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">Confirm new password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="input pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                                        >
                                            <Icon name={showPasswords.confirm ? 'visibility_off' : 'visibility'} size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-start mt-2">
                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className="btn btn-primary disabled:opacity-60"
                                    >
                                        {savingPassword ? (
                                            <>
                                                <Icon name="progress_activity" size={16} className="animate-spin" />
                                                Changing...
                                            </>
                                        ) : (
                                            'Update password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Danger Zone */}
                        <section className="card p-8 border-error" style={{ background: 'color-mix(in oklab, var(--error) 5%, var(--surface-container-lowest))' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Icon name="warning" size={20} className="text-error" />
                                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-error font-semibold">Danger zone</span>
                            </div>
                            <h3 className="font-display text-xl font-semibold text-on-surface mb-1">Deactivate account</h3>
                            <p className="text-sm text-on-surface-variant mb-6 max-w-2xl">
                                Once you delete your account, there is no going back. Please be certain. This will remove all your booking history and preferences.
                            </p>
                            <button
                                onClick={() => setShowDeactivateModal(true)}
                                className="btn"
                                style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}
                            >
                                Deactivate my account
                            </button>
                        </section>
                    </div>
                )}

                {/* Deactivate Account Modal */}
                {showDeactivateModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm"
                        onClick={() => !deactivating && setShowDeactivateModal(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="card anim-slide-up max-w-md w-full p-7"
                        >
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center shrink-0">
                                    <Icon name="warning" className="text-error" />
                                </div>
                                <div>
                                    <h3 className="font-display text-xl font-semibold text-error mb-1">Deactivate your account?</h3>
                                    <p className="text-sm text-on-surface-variant">
                                        This is permanent. All your bookings, reviews, and preferences will be removed and you&apos;ll be logged out.
                                    </p>
                                </div>
                            </div>

                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">Why are you leaving? (optional)</label>
                            <textarea
                                rows={3}
                                value={deactivateReason}
                                onChange={(e) => setDeactivateReason(e.target.value)}
                                placeholder="Help us improve — why are you leaving?"
                                className="input resize-none"
                            />

                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5 mt-4">Confirm your password</label>
                            <input
                                type="password"
                                value={deactivatePassword}
                                onChange={(e) => setDeactivatePassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="input"
                            />

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(''); }}
                                    disabled={deactivating}
                                    className="btn btn-outline flex-1 disabled:opacity-60"
                                >
                                    Never mind
                                </button>
                                <button
                                    onClick={handleDeactivate}
                                    disabled={deactivating}
                                    className="btn flex-1 bg-error text-on-error disabled:opacity-60"
                                >
                                    {deactivating ? (
                                        <>
                                            <Icon name="progress_activity" size={16} className="animate-spin" />
                                            Deactivating…
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="delete_forever" size={16} />
                                            Yes, deactivate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <section className="card p-8 anim-fade">
                        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant pb-4">
                            <Icon name="notifications" className="text-on-surface" />
                            <h3 className="font-display text-2xl font-semibold text-on-surface">Notifications</h3>
                        </div>

                        <div className="flex flex-col">
                            {preferencesLoading ? (
                                <div className="flex items-center justify-center py-8 text-on-surface-variant">
                                    <Icon name="progress_activity" className="animate-spin mr-2" />
                                    Loading preferences…
                                </div>
                            ) : (
                                <>
                                    <ToggleRow
                                        title="Email Notifications"
                                        description="Receive booking confirmations and updates via email"
                                        checked={preferences.emailNotifications}
                                        onChange={(v) => setPreferences(p => ({ ...p, emailNotifications: v }))}
                                    />
                                    <ToggleRow
                                        title="SMS Notifications"
                                        description="Get text messages for important updates"
                                        checked={preferences.smsNotifications}
                                        onChange={(v) => setPreferences(p => ({ ...p, smsNotifications: v }))}
                                    />
                                    <ToggleRow
                                        title="Promotional Emails"
                                        description="Receive offers and promotions from QuickCourt"
                                        checked={preferences.promotionalEmails}
                                        onChange={(v) => setPreferences(p => ({ ...p, promotionalEmails: v }))}
                                    />
                                    <ToggleRow
                                        title="Booking Reminders"
                                        description="Get reminded before your upcoming bookings"
                                        checked={preferences.bookingReminders}
                                        onChange={(v) => setPreferences(p => ({ ...p, bookingReminders: v }))}
                                    />

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleSavePreferences}
                                            disabled={savingPreferences}
                                            className="btn btn-primary disabled:opacity-60"
                                        >
                                            <Icon name={savingPreferences ? 'progress_activity' : 'save'} size={16} className={savingPreferences ? 'animate-spin' : ''} />
                                            {savingPreferences ? 'Saving…' : 'Save preferences'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                )}
                </div>
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ title, description, checked, onChange, defaultChecked = false }) {
    const isControlled = checked !== undefined && typeof onChange === 'function';
    return (
        <div className="flex items-center justify-between py-4 border-t border-outline-variant">
            <div>
                <h4 className="font-semibold text-on-surface">{title}</h4>
                <p className="text-sm text-on-surface-variant mt-0.5">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                {isControlled ? (
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className="sr-only peer"
                    />
                ) : (
                    <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
                )}
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
    );
}
