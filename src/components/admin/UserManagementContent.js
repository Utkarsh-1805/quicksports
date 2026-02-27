'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    Search,
    Filter,
    Mail,
    Phone,
    Calendar,
    MoreVertical,
    Shield,
    ShieldOff,
    BadgeCheck,
    Building2,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    Clock,
    Loader2,
    UserX,
    UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

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

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-purple-50 text-purple-700';
            case 'FACILITY_OWNER':
                return 'bg-blue-50 text-blue-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                        <div className="h-16 bg-white rounded-xl mb-6"></div>
                        <div className="space-y-2">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-16 bg-white rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Users</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchUsers}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h1>
                        <p className="text-slate-500 mt-1">Manage platform users and permissions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">
                            {pagination?.total || 0} total users
                        </span>
                        <button
                            onClick={fetchUsers}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={filters.search}
                                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters(f => ({ ...f, role: e.target.value, page: 1 }))}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="">All Roles</option>
                            <option value="USER">Users</option>
                            <option value="FACILITY_OWNER">Facility Owners</option>
                            <option value="ADMIN">Admins</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="banned">Banned</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">User</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Contact</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Role</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Status</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Stats</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Joined</th>
                                    <th className="text-right py-4 px-6 font-semibold text-slate-600 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((userItem) => (
                                    <tr key={userItem.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                    {userItem.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{userItem.name}</p>
                                                    <p className="text-sm text-slate-500">#{userItem.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm text-slate-600 flex items-center gap-1">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                {userItem.email}
                                            </p>
                                            {userItem.phone && (
                                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    {userItem.phone}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(userItem.role)}`}>
                                                {userItem.role === 'FACILITY_OWNER' ? 'Owner' : userItem.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                {userItem.isVerified ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm">
                                                        <BadgeCheck className="w-4 h-4" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400 text-sm">
                                                        <Clock className="w-4 h-4" />
                                                        Unverified
                                                    </span>
                                                )}
                                                {userItem.isBanned && (
                                                    <span className="flex items-center gap-1 text-red-600 text-sm">
                                                        <ShieldOff className="w-4 h-4" />
                                                        Banned
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm">
                                                {userItem.role === 'FACILITY_OWNER' ? (
                                                    <p className="text-slate-600">
                                                        <Building2 className="w-4 h-4 inline mr-1" />
                                                        {userItem._count?.facilities || 0} venues
                                                    </p>
                                                ) : (
                                                    <p className="text-slate-600">
                                                        <Calendar className="w-4 h-4 inline mr-1" />
                                                        {userItem._count?.bookings || 0} bookings
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm text-slate-500">{formatDate(userItem.createdAt)}</p>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActionMenu(actionMenu === userItem.id ? null : userItem.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                                </button>
                                                
                                                {actionMenu === userItem.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                                                        {userItem.isBanned ? (
                                                            <button
                                                                onClick={() => handleUserAction(userItem.id, 'unban')}
                                                                disabled={processing}
                                                                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                                            >
                                                                <UserCheck className="w-4 h-4" />
                                                                Unban User
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUserAction(userItem.id, 'ban')}
                                                                disabled={processing || userItem.role === 'ADMIN'}
                                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <UserX className="w-4 h-4" />
                                                                Ban User
                                                            </button>
                                                        )}
                                                        {!userItem.isVerified && (
                                                            <button
                                                                onClick={() => handleUserAction(userItem.id, 'verify')}
                                                                disabled={processing}
                                                                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                            >
                                                                <BadgeCheck className="w-4 h-4" />
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
                    <div className="lg:hidden divide-y divide-slate-100">
                        {users.map((userItem) => (
                            <div key={userItem.id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                            {userItem.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{userItem.name}</p>
                                            <p className="text-sm text-slate-500">{userItem.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(userItem.role)}`}>
                                        {userItem.role === 'FACILITY_OWNER' ? 'Owner' : userItem.role}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        {userItem.isVerified ? (
                                            <><BadgeCheck className="w-4 h-4 text-green-500" /> Verified</>
                                        ) : (
                                            <><Clock className="w-4 h-4" /> Unverified</>
                                        )}
                                    </span>
                                    <span>{formatDate(userItem.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-slate-900 mb-2">No Users Found</h3>
                            <p className="text-slate-500">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                            disabled={filters.page === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                            Page {filters.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            disabled={filters.page === pagination.totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
