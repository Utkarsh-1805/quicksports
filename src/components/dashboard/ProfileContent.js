'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    User,
    Mail,
    Phone,
    Camera,
    Lock,
    Bell,
    Shield,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    Save,
    AlertTriangle,
    LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

/**
 * UserProfilePage Component
 * Profile management with avatar upload, info update, and password change
 */
export default function UserProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const fileInputRef = useRef(null);
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    
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
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900">Profile</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Profile Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your account settings and preferences</p>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <p className="text-green-700">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Sidebar - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center sticky top-28">
                            {/* Avatar */}
                            <div className="relative inline-block mb-4">
                                <div 
                                    onClick={handleAvatarClick}
                                    className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center cursor-pointer overflow-hidden group"
                                >
                                    {avatarPreview ? (
                                        <img 
                                            src={avatarPreview} 
                                            alt={profile?.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">
                                            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {uploadingAvatar ? (
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-white" />
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

                            <h3 className="font-bold text-lg text-slate-900">{profile?.name}</h3>
                            <p className="text-sm text-slate-500">{profile?.email}</p>

                            {profile?.role && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        {profile.role}
                                    </span>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <p className="text-xs text-slate-400">Member since</p>
                                <p className="text-sm text-slate-600">
                                    {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            {/* Stats */}
                            {profile?.stats && (
                                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-lg font-bold text-slate-900">{profile.stats.bookings || 0}</p>
                                        <p className="text-xs text-slate-500">Bookings</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-lg font-bold text-slate-900">{profile.stats.reviews || 0}</p>
                                        <p className="text-xs text-slate-500">Reviews</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Tabs */}
                        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
                            <div className="flex border-b border-slate-200">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all ${
                                                activeTab === tab.id
                                                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-6">
                                {/* Profile Tab */}
                                {activeTab === 'profile' && (
                                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative overflow-hidden">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed truncate"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Bio
                                            </label>
                                            <textarea
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={saving}>
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {/* Security Tab */}
                                {activeTab === 'security' && (
                                    <div className="space-y-8">
                                        {/* Change Password */}
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <Lock className="w-5 h-5 text-green-600" />
                                                Change Password
                                            </h3>
                                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Current Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.current ? 'text' : 'password'}
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all pr-12"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        New Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.new ? 'text' : 'password'}
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all pr-12"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Confirm New Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.confirm ? 'text' : 'password'}
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all pr-12"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <Button type="submit" disabled={savingPassword}>
                                                        {savingPassword ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Changing...
                                                            </>
                                                        ) : (
                                                            'Change Password'
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="pt-6 border-t border-slate-200">
                                            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5" />
                                                Danger Zone
                                            </h3>
                                            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                                <h4 className="font-medium text-red-800 mb-1">Deactivate Account</h4>
                                                <p className="text-sm text-red-600 mb-4">
                                                    Once you deactivate your account, you won't be able to access your bookings and data.
                                                </p>
                                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                                                    Deactivate Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notifications Tab */}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <h4 className="font-medium text-slate-900">Email Notifications</h4>
                                                <p className="text-sm text-slate-500">Receive booking confirmations and updates via email</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <h4 className="font-medium text-slate-900">SMS Notifications</h4>
                                                <p className="text-sm text-slate-500">Get text messages for important updates</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <h4 className="font-medium text-slate-900">Promotional Emails</h4>
                                                <p className="text-sm text-slate-500">Receive offers and promotions from QuickCourt</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <h4 className="font-medium text-slate-900">Booking Reminders</h4>
                                                <p className="text-sm text-slate-500">Get reminded before your upcoming bookings</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Preferences
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
