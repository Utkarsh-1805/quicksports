'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';

const BLOCK_TYPES = [
    { value: 'maintenance', label: 'Maintenance', icon: 'build' },
    { value: 'renovation', label: 'Renovation', icon: 'construction' },
    { value: 'event', label: 'Event', icon: 'event' },
    { value: 'emergency', label: 'Emergency', icon: 'warning' },
    { value: 'other', label: 'Other', icon: 'more_horiz' }
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');

function readCookieToken() {
    if (typeof document === 'undefined') return null;
    return document.cookie
        .split('; ')
        .find((row) => row.startsWith('quickcourt_token='))
        ?.split('=')[1] || null;
}

export default function BlockSlotsManager({ courts = [] }) {
    const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || '');
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return {
            date: `${yyyy}-${mm}-${dd}`,
            startTime: '08:00',
            endTime: '10:00',
            reason: '',
            blockType: 'maintenance',
            allowOverride: false,
        };
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (!selectedCourtId && courts.length > 0) {
            setSelectedCourtId(courts[0].id);
        }
    }, [courts, selectedCourtId]);

    const fetchBlocked = useCallback(async (courtId) => {
        if (!courtId) return;
        setLoadingList(true);
        try {
            const res = await fetch(`/api/courts/${courtId}/block-slots`);
            const data = await res.json();
            if (res.ok && data.success) {
                setBlockedSlots(data.data?.blockedSlots || []);
            } else {
                setBlockedSlots([]);
            }
        } catch (err) {
            console.error('Fetch blocked slots error:', err);
            setBlockedSlots([]);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        if (selectedCourtId) fetchBlocked(selectedCourtId);
    }, [selectedCourtId, fetchBlocked]);

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        setError(null);
        setSuccess(null);

        if (!selectedCourtId) {
            setError('Please pick a court first.');
            return;
        }
        if (form.startTime >= form.endTime) {
            setError('End time must be after start time.');
            return;
        }
        if (form.reason.trim().length < 5) {
            setError('Reason must be at least 5 characters.');
            return;
        }

        setSubmitting(true);
        try {
            const token = readCookieToken();
            const res = await fetch(`/api/courts/${selectedCourtId}/block-slots`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    dates: [form.date],
                    timeSlots: [{ startTime: form.startTime, endTime: form.endTime }],
                    reason: form.reason.trim(),
                    blockType: form.blockType,
                    notifyUsers: false,
                    allowOverride: form.allowOverride,
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                if (res.status === 409 && data.conflicts) {
                    setError(
                        `Existing bookings overlap this slot. ${data.conflicts.length} conflict(s). Toggle "Force cancel existing bookings" to override.`
                    );
                } else {
                    setError(data.message || 'Failed to block slots.');
                }
                return;
            }
            setSuccess(`Blocked ${data.data?.blockedSlots ?? 1} slot(s).`);
            setShowForm(false);
            setForm((prev) => ({ ...prev, reason: '' }));
            await fetchBlocked(selectedCourtId);
        } catch (err) {
            console.error('Block slot error:', err);
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnblock = async (slot) => {
        if (!confirm(`Unblock ${slot.startTime}–${slot.endTime} on ${formatDate(slot.date)}?`)) return;
        try {
            const token = readCookieToken();
            const dateStr = String(slot.date).split('T')[0];
            const res = await fetch(`/api/courts/${selectedCourtId}/block-slots`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    dates: [dateStr],
                    timeSlots: [{ startTime: slot.startTime, endTime: slot.endTime }],
                    reason: 'Manually unblocked by owner'
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'Failed to unblock slot.');
                return;
            }
            setSuccess('Slot unblocked.');
            await fetchBlocked(selectedCourtId);
        } catch (err) {
            console.error('Unblock slot error:', err);
            setError('Network error. Please try again.');
        }
    };

    if (courts.length === 0) {
        return (
            <div className="card p-10 text-center">
                <Icon name="block" size={32} className="text-on-surface-variant mx-auto mb-2" />
                <p className="text-on-surface-variant">Add a court first to manage blocked slots.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header + Court Picker */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h3 className="font-display text-xl font-semibold text-on-surface tracking-tight">Blocked slots</h3>
                    <p className="text-on-surface-variant text-sm mt-1">
                        Block slots for maintenance, events, or emergencies — they won&apos;t be bookable by users.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedCourtId}
                        onChange={(e) => setSelectedCourtId(e.target.value)}
                        className="input w-auto text-sm"
                    >
                        {courts.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setShowForm((v) => !v)} className="btn btn-primary btn-sm">
                        <Icon name={showForm ? 'close' : 'add'} size={18} />
                        {showForm ? 'Close' : 'Block New Slot'}
                    </button>
                </div>
            </div>

            {/* Block Form */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="card p-5 space-y-4 anim-slide-up"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">Start Time</label>
                            <select
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                className="input"
                            >
                                {HOURS.map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">End Time</label>
                            <select
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                className="input"
                            >
                                {HOURS.map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-2">Block Type</label>
                        <div className="flex flex-wrap gap-2">
                            {BLOCK_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, blockType: t.value })}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                                        form.blockType === t.value
                                            ? 'bg-primary-container text-on-primary-container border-primary'
                                            : 'bg-transparent text-on-surface border-outline-variant hover:border-primary'
                                    }`}
                                >
                                    <Icon name={t.icon} size={16} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">Reason</label>
                        <input
                            type="text"
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            placeholder="e.g. Floor resurfacing"
                            maxLength={200}
                            className="input"
                            required
                            minLength={5}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.allowOverride}
                            onChange={(e) => setForm({ ...form, allowOverride: e.target.checked })}
                            className="w-4 h-4 accent-error"
                        />
                        <span>
                            <strong className="text-error">Force cancel existing bookings</strong> in this slot (use sparingly)
                        </span>
                    </label>

                    {error && (
                        <div className="rounded-xl bg-error-container/50 text-on-error-container px-3 py-2 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
                            {submitting ? 'Blocking…' : 'Block This Slot'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="btn btn-outline disabled:opacity-50">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {success && (
                <div className="rounded-xl bg-primary-container/50 text-on-primary-container px-3 py-2 text-sm">
                    {success}
                </div>
            )}

            {/* Existing Blocked Slots List */}
            <div>
                <h4 className="font-display font-semibold text-on-surface mb-3">Currently Blocked (next 30 days)</h4>
                {loadingList ? (
                    <div className="flex items-center justify-center py-10">
                        <Icon name="progress_activity" size={28} className="text-primary animate-spin" />
                    </div>
                ) : blockedSlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center text-on-surface-variant text-sm">
                        No blocked slots for this court.
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-mono font-semibold">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Time</th>
                                    <th className="px-4 py-3 text-left">Reason</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blockedSlots.map((slot) => (
                                    <tr key={slot.id} className="border-t border-outline-variant">
                                        <td className="px-4 py-3 font-mono text-on-surface">{formatDate(slot.date)}</td>
                                        <td className="px-4 py-3 font-mono text-on-surface">
                                            {slot.startTime}–{slot.endTime}
                                        </td>
                                        <td className="px-4 py-3 text-on-surface-variant">{slot.blockReason || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleUnblock(slot)}
                                                className="btn btn-outline btn-sm"
                                            >
                                                Unblock
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatDate(d) {
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return String(d);
    }
}
