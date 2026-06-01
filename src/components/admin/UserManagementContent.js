'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * UserManagementContent Component
 * Admin interface for managing platform users
 */
export default function UserManagementContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedUser, setSelectedUser] = useState(null);
    const [actionMenu, setActionMenu] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [filters, setFilters] = useState({
        role: '',
        status: '',
        search: '',
        page: 1
    });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/admin/users');
            return;
        }

        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
    }, [user, authLoading, filters]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const params = new URLSearchParams({
                page: filters.page,
                limit: 15,
                ...(filters.role && { role: filters.role }),
                ...(filters.status && { status: filters.status }),
                ...(filters.search && { search: filters.search })
            });

            const res = await fetch(`/api/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await res.json();

            if (result.success) {
                setUsers(result.data.users || []);
                setPagination(result.data.pagination);
            } else {
                throw new Error(result.message || 'Failed to load users');
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUserAction = async (userId, action) => {
        setProcessing(true);
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    action
                })
            });

            const result = await res.json();

            if (result.success) {
                fetchUsers();
                setActionMenu(null);
            } else {
                throw new Error(result.message || 'Action failed');
            }
        } catch (err) {
            console.error('User action error:', err);
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const roleChips = [
        { key: '', label: 'All' },
        { key: 'USER', label: 'User' },
        { key: 'FACILITY_OWNER', label: 'Owner' },
        { key: 'ADMIN', label: 'Admin' }
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 w-64 bg-surface-container rounded mb-8"></div>
                        <div className="h-16 bg-surface-container-lowest rounded-xl mb-6"></div>
                        <div className="h-96 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="error" className="text-on-error-container" size={32} />
                    </div>
                    <h2 className="font-display text-xl text-on-surface mb-2">Error Loading Users</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={fetchUsers}>
                        <Icon name="refresh" size={16} className="mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="eyebrow mb-3">Admin Console</div>
                        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-on-surface mb-2">User management</h1>
                        <p className="text-base text-on-surface-variant max-w-2xl">
                            Manage accounts, roles, and administrative access for the QuickCourt platform.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-on-surface-variant">
                            {pagination?.total || 0} users
                        </span>
                        <button
                            onClick={fetchUsers}
                            className="btn btn-primary btn-sm"
                        >
                            <Icon name="refresh" size={18} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" size={20} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                            className="input"
                            style={{ paddingLeft: 40 }}
                        />
                    </div>

                    {/* Role Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {roleChips.map(chip => (
                            <button
                                key={chip.key}
                                onClick={() => setFilters(f => ({ ...f, role: chip.key, page: 1 }))}
                                className={`whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                                    filters.role === chip.key
                                        ? 'bg-secondary-container text-on-secondary-container border-transparent'
                                        : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                                }`}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                        className="input"
                        style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="card overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
                                    <th className="p-4 font-mono">Name</th>
                                    <th className="p-4 font-mono">Role</th>
                                    <th className="p-4 font-mono">Status</th>
                                    <th className="p-4 font-mono">Joined</th>
                                    <th className="p-4 font-mono text-right">Bookings / Venues</th>
                                    <th className="p-4 font-mono w-12 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {users.map((userItem) => (
                                    <tr key={userItem.id} className="hover:bg-surface-container-low transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-on-secondary-container font-bold border border-outline-variant ${
                                                    userItem.role === 'ADMIN' ? 'bg-primary-container/20 text-primary' :
                                                    userItem.role === 'FACILITY_OWNER' ? 'bg-secondary-container' :
                                                    'bg-tertiary-fixed text-on-tertiary-fixed'
                                                }`}>
                                                    {userItem.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-on-surface">{userItem.name}</p>
                                                    <p className="text-sm text-on-surface-variant">{userItem.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`pill ${userItem.role === 'ADMIN' ? 'tertiary' : userItem.role === 'FACILITY_OWNER' ? 'secondary' : 'neutral'}`}>
                                                {userItem.role === 'FACILITY_OWNER' ? 'Owner' : userItem.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${userItem.isBanned ? 'bg-error' : 'bg-primary-fixed-dim'}`}></div>
                                                    <span className={`text-sm ${userItem.isBanned ? 'text-error font-medium' : 'text-on-surface'}`}>
                                                        {userItem.isBanned ? 'Suspended' : 'Active'}
                                                    </span>
                                                </div>
                                                {userItem.isVerified && (
                                                    <span className="flex items-center gap-1 text-primary text-xs">
                                                        <Icon name="verified" size={14} filled />
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-on-surface-variant">
                                            {formatDate(userItem.createdAt)}
                                        </td>
                                        <td className="p-4 font-mono text-sm text-on-surface text-right">
                                            {userItem.role === 'FACILITY_OWNER'
                                                ? `${userItem._count?.facilities || 0} venues`
                                                : `${userItem._count?.bookings || 0} bookings`
                                            }
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActionMenu(actionMenu === userItem.id ? null : userItem.id)}
                                                    className="text-outline hover:text-on-surface transition-colors p-1"
                                                >
                                                    <Icon name="more_vert" size={20} />
                                                </button>

                                                {actionMenu === userItem.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-48 card shadow-lg z-10 py-1">
                                                        {userItem.isBanned ? (
                                                            <button
                                                                onClick={() => handleUserAction(userItem.id, 'unban')}
                                                                disabled={processing}
                                                                className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary-container/10 flex items-center gap-2"
                                                            >
                                                                <Icon name="check" size={16} />
                                                                Unban User
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUserAction(userItem.id, 'ban')}
                                                                disabled={processing || userItem.role === 'ADMIN'}
                                                                className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error-container flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <Icon name="block" size={16} />
                                                                Ban User
                                                            </button>
                                                        )}
                                                        {!userItem.isVerified && (
                                                            <button
                                                                onClick={() => handleUserAction(userItem.id, 'verify')}
                                                                disabled={processing}
                                                                className="w-full px-4 py-2 text-left text-sm text-tertiary hover:bg-tertiary-fixed flex items-center gap-2"
                                                            >
                                                                <Icon name="verified" size={16} />
                                                                Verify User
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List */}
                    <div className="lg:hidden divide-y divide-outline-variant">
                        {users.map((userItem) => (
                            <div key={userItem.id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border border-outline-variant ${
                                            userItem.role === 'ADMIN' ? 'bg-primary-container/20 text-primary' :
                                            userItem.role === 'FACILITY_OWNER' ? 'bg-secondary-container text-on-secondary-container' :
                                            'bg-tertiary-fixed text-on-tertiary-fixed'
                                        }`}>
                                            {userItem.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-on-surface">{userItem.name}</p>
                                            <p className="text-sm text-on-surface-variant">{userItem.email}</p>
                                        </div>
                                    </div>
                                    <span className={`pill ${userItem.role === 'ADMIN' ? 'tertiary' : userItem.role === 'FACILITY_OWNER' ? 'secondary' : 'neutral'}`}>
                                        {userItem.role === 'FACILITY_OWNER' ? 'Owner' : userItem.role}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-sm text-on-surface-variant">
                                    <span className="flex items-center gap-1">
                                        {userItem.isVerified ? (
                                            <><Icon name="verified" size={14} className="text-primary" filled /> Verified</>
                                        ) : (
                                            <><Icon name="schedule" size={14} /> Unverified</>
                                        )}
                                    </span>
                                    <span className="font-mono">{formatDate(userItem.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="p-12 text-center">
                            <Icon name="group" className="text-outline mx-auto mb-4" size={48} />
                            <h3 className="font-display text-on-surface mb-2">No Users Found</h3>
                            <p className="text-on-surface-variant">Try adjusting your search or filters</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between text-sm text-on-surface-variant">
                            <div>Showing page {filters.page} of {pagination.totalPages} ({pagination.total} users)</div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                    disabled={filters.page === 1}
                                    className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant disabled:opacity-50"
                                >
                                    <Icon name="chevron_left" size={20} />
                                </button>
                                <span className="font-mono px-3 py-1 rounded-lg bg-secondary-container text-on-secondary-container font-medium">
                                    {filters.page}
                                </span>
                                <button
                                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                    disabled={filters.page === pagination.totalPages}
                                    className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant disabled:opacity-50"
                                >
                                    <Icon name="chevron_right" size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
