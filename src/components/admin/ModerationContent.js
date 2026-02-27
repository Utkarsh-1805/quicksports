'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    AlertTriangle,
    Search,
    Filter,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Building2,
    Flag,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    RefreshCw,
    Eye,
    AlertOctagon,
    Loader2,
    ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

/**
 * ModerationContent Component
 * Admin interface for handling user reports
 */
export default function ModerationContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [expandedReport, setExpandedReport] = useState(null);
    const [actionModal, setActionModal] = useState(null);
    const [resolution, setResolution] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const [filters, setFilters] = useState({
        status: 'PENDING',
        priority: '',
        type: '',
        page: 1
    });

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push('/auth/login?redirect=/admin/moderation');
            return;
        }

        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchReports();
    }, [user, authLoading, filters]);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const params = new URLSearchParams({
                status: filters.status,
                page: filters.page,
                limit: 10,
                ...(filters.priority && { priority: filters.priority }),
                ...(filters.type && { type: filters.type })
            });

            const res = await fetch(`/api/admin/moderation?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await res.json();

            if (result.success) {
                setReports(result.data.reports || []);
                // Map statistics to expected stats structure with uppercase keys
                const statistics = result.data.statistics || {};
                setStats({
                    byStatus: {
                        PENDING: statistics.byStatus?.pending || 0,
                        INVESTIGATING: statistics.byStatus?.investigating || 0,
                        RESOLVED: statistics.byStatus?.resolved || 0,
                        DISMISSED: statistics.byStatus?.dismissed || 0
                    },
                    byPriority: {
                        HIGH: statistics.byPriority?.high || 0,
                        MEDIUM: statistics.byPriority?.medium || 0,
                        LOW: statistics.byPriority?.low || 0,
                        CRITICAL: statistics.byPriority?.critical || 0
                    },
                    total: statistics.total || 0
                });
                setPagination(result.data.pagination);
            } else {
                throw new Error(result.message || 'Failed to load reports');
            }
        } catch (err) {
            console.error('Fetch reports error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (action) => {
        if (!actionModal) return;
        
        setProcessing(true);
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch('/api/admin/moderation', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportId: actionModal.id,
                    action: action,
                    resolution: resolution || undefined
                })
            });

            const result = await res.json();

            if (result.success) {
                fetchReports();
                setActionModal(null);
                setResolution('');
            } else {
                throw new Error(result.message || 'Action failed');
            }
        } catch (err) {
            console.error('Resolve error:', err);
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'CRITICAL':
                return { bg: 'bg-red-50', text: 'text-red-700', icon: AlertOctagon };
            case 'HIGH':
                return { bg: 'bg-orange-50', text: 'text-orange-700', icon: AlertTriangle };
            case 'MEDIUM':
                return { bg: 'bg-amber-50', text: 'text-amber-700', icon: Flag };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-700', icon: Flag };
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-50 text-amber-700';
            case 'INVESTIGATING':
                return 'bg-blue-50 text-blue-700';
            case 'RESOLVED':
                return 'bg-green-50 text-green-700';
            case 'DISMISSED':
                return 'bg-slate-100 text-slate-600';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-white rounded-xl"></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-white rounded-xl"></div>
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
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchReports}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reports & Moderation</h1>
                        <p className="text-slate-500 mt-1">Review and resolve user reports</p>
                    </div>
                    <button
                        onClick={fetchReports}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 self-start"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <button
                            onClick={() => setFilters(f => ({ ...f, status: 'PENDING', page: 1 }))}
                            className={`bg-white rounded-xl border p-4 text-left transition-all ${filters.status === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.byStatus?.PENDING || 0}</p>
                                    <p className="text-sm text-slate-500">Pending</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setFilters(f => ({ ...f, status: 'INVESTIGATING', page: 1 }))}
                            className={`bg-white rounded-xl border p-4 text-left transition-all ${filters.status === 'INVESTIGATING' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.byStatus?.INVESTIGATING || 0}</p>
                                    <p className="text-sm text-slate-500">Investigating</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setFilters(f => ({ ...f, status: 'RESOLVED', page: 1 }))}
                            className={`bg-white rounded-xl border p-4 text-left transition-all ${filters.status === 'RESOLVED' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.byStatus?.RESOLVED || 0}</p>
                                    <p className="text-sm text-slate-500">Resolved</p>
                                </div>
                            </div>
                        </button>

                        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-xl p-4 text-white">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertOctagon className="w-5 h-5" />
                                <span className="text-sm font-medium">Critical</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.byPriority?.CRITICAL || 0}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="">All Priorities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>

                        <select
                            value={filters.type}
                            onChange={(e) => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="venue">Venue Reports</option>
                            <option value="user">User Reports</option>
                            <option value="review">Review Reports</option>
                            <option value="booking">Booking Issues</option>
                        </select>
                    </div>
                </div>

                {/* Reports List */}
                {reports.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Reports</h3>
                        <p className="text-slate-500">
                            {filters.status === 'PENDING' 
                                ? 'All caught up! No pending reports to review.'
                                : `No ${filters.status.toLowerCase()} reports found.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => {
                            const priorityStyle = getPriorityStyles(report.priority);
                            const PriorityIcon = priorityStyle.icon;
                            
                            return (
                                <div key={report.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                    {/* Report Header */}
                                    <div 
                                        className="p-6 cursor-pointer"
                                        onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Priority Icon */}
                                            <div className={`w-12 h-12 rounded-xl ${priorityStyle.bg} flex items-center justify-center shrink-0`}>
                                                <PriorityIcon className={`w-6 h-6 ${priorityStyle.text}`} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{report.reason || 'Report'}</h3>
                                                        <p className="text-sm text-slate-500 mt-1">{report.description?.slice(0, 100)}...</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
                                                            {report.priority}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(report.status)}`}>
                                                            {report.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {report.reporter?.name || 'Anonymous'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        {report.targetType === 'venue' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                        {report.targetType}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {formatDate(report.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Expand Toggle */}
                                            <div className="hidden sm:flex items-center">
                                                {expandedReport === report.id ? (
                                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedReport === report.id && (
                                        <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                                            {/* Full Description */}
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-slate-900 mb-2">Report Details</h4>
                                                <div className="bg-white rounded-xl p-4 border border-slate-200">
                                                    <p className="text-slate-600 whitespace-pre-wrap">{report.description}</p>
                                                </div>
                                            </div>

                                            {/* Reporter & Target Info */}
                                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        Reporter
                                                    </h4>
                                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                                        <p className="font-medium text-slate-900">{report.reporter?.name}</p>
                                                        <p className="text-sm text-slate-500">{report.reporter?.email}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                                        {report.targetType === 'venue' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                        Target
                                                    </h4>
                                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                                        <p className="font-medium text-slate-900">{report.target?.name || report.targetId}</p>
                                                        <p className="text-sm text-slate-500 capitalize">{report.targetType}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {(report.status === 'PENDING' || report.status === 'INVESTIGATING') && (
                                                <div className="flex flex-wrap gap-3">
                                                    {report.status === 'PENDING' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActionModal({ ...report, type: 'investigate' });
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Start Investigation
                                                        </button>
                                                    )}
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionModal({ ...report, type: 'resolve' });
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Resolve
                                                    </Button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionModal({ ...report, type: 'dismiss' });
                                                        }}
                                                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Dismiss
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                            disabled={filters.page === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                            Page {filters.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            disabled={filters.page === pagination.totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                            {actionModal.type === 'investigate' && 'Start Investigation'}
                            {actionModal.type === 'resolve' && 'Resolve Report'}
                            {actionModal.type === 'dismiss' && 'Dismiss Report'}
                        </h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {actionModal.type === 'investigate' ? 'Investigation Notes' : 'Resolution Notes'}
                            </label>
                            <textarea
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                placeholder="Add notes about the action taken..."
                                rows={4}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionModal(null);
                                    setResolution('');
                                }}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <Button
                                onClick={() => handleResolve(actionModal.type)}
                                disabled={processing}
                                className={`flex-1 ${
                                    actionModal.type === 'resolve' ? 'bg-green-600 hover:bg-green-700' :
                                    actionModal.type === 'dismiss' ? 'bg-slate-600 hover:bg-slate-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
