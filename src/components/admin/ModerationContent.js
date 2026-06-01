'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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

    const formatRelativeTime = (date) => {
        const now = new Date();
        const then = new Date(date);
        const diff = (now - then) / 1000;
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    const getPriorityAccent = (priority) => {
        switch (priority) {
            case 'CRITICAL':
            case 'HIGH':
                return { bar: 'bg-error', label: 'text-error' };
            case 'MEDIUM':
                return { bar: 'bg-secondary', label: 'text-secondary' };
            default:
                return { bar: 'bg-outline', label: 'text-on-surface-variant' };
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 w-64 bg-surface-container rounded mb-8"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            ))}
                        </div>
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
                    <h2 className="font-display text-xl text-on-surface mb-2">Error Loading</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={fetchReports}>
                        <Icon name="refresh" size={16} className="mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-outline-variant">
                    <div>
                        <div className="eyebrow mb-3">Admin Console</div>
                        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-on-surface">Moderation queue</h1>
                        <p className="text-base text-on-surface-variant mt-1">Review flagged content and maintain community safety.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
                            <Icon name="warning" className="text-secondary" size={20} />
                            <span className="font-mono text-sm text-on-surface">
                                {stats?.byStatus?.PENDING || 0} Flagged Items
                            </span>
                        </div>
                        <button
                            onClick={fetchReports}
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors"
                        >
                            <Icon name="refresh" />
                        </button>
                    </div>
                </header>

                {/* Status Tabs / Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { key: 'PENDING', label: 'Pending', icon: 'schedule', color: 'secondary' },
                            { key: 'INVESTIGATING', label: 'Investigating', icon: 'visibility', color: 'tertiary' },
                            { key: 'RESOLVED', label: 'Resolved', icon: 'check_circle', color: 'primary' },
                            { key: 'CRITICAL', label: 'Critical', icon: 'error', color: 'error', priorityKey: true }
                        ].map(tab => {
                            const isActive = !tab.priorityKey && filters.status === tab.key;
                            const value = tab.priorityKey ? stats.byPriority?.CRITICAL || 0 : stats.byStatus?.[tab.key] || 0;
                            const ringColor =
                                tab.color === 'primary' ? 'ring-primary border-primary' :
                                tab.color === 'tertiary' ? 'ring-tertiary border-tertiary' :
                                tab.color === 'error' ? 'ring-error border-error' :
                                'ring-secondary border-secondary';
                            const iconColor =
                                tab.color === 'primary' ? 'text-primary' :
                                tab.color === 'tertiary' ? 'text-tertiary' :
                                tab.color === 'error' ? 'text-error' :
                                'text-secondary';
                            const iconBg =
                                tab.color === 'primary' ? 'bg-primary-container/20' :
                                tab.color === 'tertiary' ? 'bg-tertiary-fixed' :
                                tab.color === 'error' ? 'bg-error-container' :
                                'bg-secondary-container/20';

                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => !tab.priorityKey && setFilters(f => ({ ...f, status: tab.key, page: 1 }))}
                                    disabled={tab.priorityKey}
                                    className={`card p-5 text-left transition-all ${
                                        isActive ? `ring-2 ${ringColor}` : 'card-hover'
                                    } ${tab.priorityKey ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                                            <Icon name={tab.icon} className={iconColor} />
                                        </div>
                                        <div>
                                            <p className="font-display text-2xl text-on-surface">{value}</p>
                                            <p className="text-sm text-on-surface-variant">{tab.label}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Filters */}
                <div className="card p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))}
                            className="input"
                            style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
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
                            className="input"
                            style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
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
                    <div className="card p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
                            <Icon name="check_circle" className="text-on-primary-container" size={32} filled />
                        </div>
                        <h3 className="font-display text-lg text-on-surface mb-2">No Reports</h3>
                        <p className="text-on-surface-variant">
                            {filters.status === 'PENDING'
                                ? 'All caught up! No pending reports to review.'
                                : `No ${filters.status.toLowerCase()} reports found.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reports.map((report) => {
                            const accent = getPriorityAccent(report.priority);
                            const expanded = expandedReport === report.id;
                            const canAct = report.status === 'PENDING' || report.status === 'INVESTIGATING';

                            return (
                                <article
                                    key={report.id}
                                    className="card card-hover overflow-hidden flex flex-col md:flex-row group"
                                >
                                    {/* Priority Color Bar */}
                                    <div className={`w-full h-2 md:w-3 md:h-auto ${accent.bar} shrink-0`}></div>

                                    <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Icon name="flag" className={accent.label} size={16} />
                                                    <span className={`font-mono text-xs uppercase tracking-wider ${accent.label}`}>
                                                        {report.reason || 'Report'} · {report.priority}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-on-surface-variant">{formatRelativeTime(report.createdAt)}</span>
                                            </div>

                                            <div className="p-4 rounded-xl text-base text-on-surface italic" style={{ background: 'color-mix(in oklab, var(--error) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--error) 18%, var(--outline-variant))' }}>
                                                &ldquo;{expanded ? report.description : `${report.description?.slice(0, 200)}${report.description?.length > 200 ? '...' : ''}`}&rdquo;
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                                <div className="flex items-center gap-1 text-on-surface-variant">
                                                    <Icon name="person" size={16} />
                                                    <span>Reporter: <strong className="text-on-surface">{report.reporter?.name || 'Anonymous'}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1 text-on-surface-variant">
                                                    <Icon name={report.targetType === 'venue' ? 'domain' : 'person'} size={16} />
                                                    <span>Target: <strong className="text-on-surface">{report.target?.name || report.targetId}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1 text-on-surface-variant">
                                                    <Icon name="forum" size={16} />
                                                    <span>Type: <strong className="text-on-surface capitalize">{report.targetType}</strong></span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setExpandedReport(expanded ? null : report.id)}
                                                className="text-sm text-primary font-medium hover:underline"
                                            >
                                                {expanded ? 'Show Less' : 'View Full Details'}
                                            </button>

                                            {expanded && (
                                                <div className="grid md:grid-cols-2 gap-4 pt-2">
                                                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant">
                                                        <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-1">Reporter</p>
                                                        <p className="font-medium text-on-surface">{report.reporter?.name}</p>
                                                        <p className="text-sm text-on-surface-variant">{report.reporter?.email}</p>
                                                    </div>
                                                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant">
                                                        <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-1">Status</p>
                                                        <p className="font-medium text-on-surface">{report.status}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions Column */}
                                        {canAct ? (
                                            <div className="md:w-64 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-6 flex flex-col justify-center gap-3">
                                                <button
                                                    onClick={() => setActionModal({ ...report, type: 'resolve' })}
                                                    className="btn btn-sm w-full"
                                                    style={{ background: 'var(--error)', color: 'var(--on-error)' }}
                                                >
                                                    <Icon name="delete" size={16} />
                                                    Resolve & Remove
                                                </button>
                                                {report.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => setActionModal({ ...report, type: 'investigate' })}
                                                        className="btn btn-outline btn-sm w-full"
                                                    >
                                                        <Icon name="visibility" size={16} />
                                                        Start Investigation
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setActionModal({ ...report, type: 'dismiss' })}
                                                    className="btn btn-outline btn-sm w-full mt-auto"
                                                >
                                                    <Icon name="check" size={16} />
                                                    Dismiss
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="md:w-64 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                                                <span className={`pill ${report.status === 'RESOLVED' ? '' : 'neutral'} justify-center`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </article>
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
                            className="btn btn-outline btn-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm font-mono text-on-surface-variant">
                            Page {filters.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            disabled={filters.page === pagination.totalPages}
                            className="btn btn-outline btn-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6 shadow-2xl anim-slide-up">
                        <h3 className="font-display text-2xl text-on-surface mb-4">
                            {actionModal.type === 'investigate' && 'Start Investigation'}
                            {actionModal.type === 'resolve' && 'Resolve Report'}
                            {actionModal.type === 'dismiss' && 'Dismiss Report'}
                        </h3>

                        <div className="mb-4">
                            <label className="block font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                                {actionModal.type === 'investigate' ? 'Investigation Notes' : 'Resolution Notes'}
                            </label>
                            <textarea
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                placeholder="Add notes about the action taken..."
                                rows={4}
                                className="input"
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionModal(null);
                                    setResolution('');
                                }}
                                className="btn btn-outline flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleResolve(actionModal.type)}
                                disabled={processing}
                                className={`btn flex-1 disabled:opacity-50 ${actionModal.type === 'investigate' ? 'btn-primary' : actionModal.type === 'dismiss' ? 'btn-outline' : ''}`}
                                style={actionModal.type === 'resolve' ? { background: 'var(--error)', color: 'var(--on-error)' } : undefined}
                            >
                                {processing && <Icon name="progress_activity" size={16} className="animate-spin" />}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
