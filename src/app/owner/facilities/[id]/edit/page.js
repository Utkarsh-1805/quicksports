'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';

function readToken() {
    if (typeof document === 'undefined') return null;
    return document.cookie.split('; ').find((r) => r.startsWith('quickcourt_token='))?.split('=')[1] || null;
}

const FIELDS = [
    { key: 'name', label: 'Facility name', icon: 'stadium', type: 'text', required: true },
    { key: 'address', label: 'Street address', icon: 'location_on', type: 'text', required: true },
    { key: 'city', label: 'City', icon: 'location_city', type: 'text', required: true },
    { key: 'state', label: 'State', icon: 'map', type: 'text', required: true },
    { key: 'pincode', label: 'Pincode', icon: 'pin', type: 'text', required: true },
];

export default function EditFacilityPage() {
    const router = useRouter();
    const params = useParams();
    const facilityId = params?.id;
    const { user, loading: authLoading } = useAuth();

    const [form, setForm] = useState({ name: '', description: '', address: '', city: '', state: '', pincode: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push(`/auth/login?redirect=/owner/facilities/${facilityId}/edit`);
            return;
        }
        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        if (facilityId) loadFacility();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, facilityId]);

    const loadFacility = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = readToken();
            const res = await fetch(`/api/venues/${facilityId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to load facility');
            const v = data.data?.venue || data.venue || data.data;
            setForm({
                name: v?.name || '',
                description: v?.description || '',
                address: v?.address || '',
                city: v?.city || '',
                state: v?.state || '',
                pincode: v?.pincode || '',
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const token = readToken();
            const res = await fetch(`/api/venues/${facilityId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    description: form.description.trim() || null,
                    address: form.address.trim(),
                    city: form.city.trim(),
                    state: form.state.trim(),
                    pincode: form.pincode.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update facility');
            setSuccess(true);
            setTimeout(() => router.push(`/owner/facilities/${facilityId}`), 1200);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-24 flex items-center justify-center">
                <Icon name="progress_activity" size={40} className="text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-24 pb-16 page-enter">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
                    <Link href="/owner/facilities" className="hover:text-primary">Facilities</Link>
                    <Icon name="chevron_right" size={14} />
                    <Link href={`/owner/facilities/${facilityId}`} className="hover:text-primary">Detail</Link>
                    <Icon name="chevron_right" size={14} />
                    <span className="text-on-surface">Edit</span>
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-semibold text-on-surface tracking-tight mb-1">
                    Edit facility
                </h1>
                <p className="text-on-surface-variant mb-8">
                    Update your venue details. Saving will resubmit it for admin approval.
                </p>

                {error && (
                    <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 mb-5 flex items-center gap-2 text-sm">
                        <Icon name="error" size={18} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-primary-container text-on-primary-container rounded-2xl px-4 py-3 mb-5 flex items-center gap-2 text-sm">
                        <Icon name="check_circle" size={18} filled />
                        Saved! Redirecting…
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card p-6 space-y-5">
                    {FIELDS.map((f) => (
                        <div key={f.key}>
                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                                {f.label}{f.required ? ' *' : ''}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                                    <Icon name={f.icon} size={20} />
                                </span>
                                <input
                                    type={f.type}
                                    value={form[f.key]}
                                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                    className="input pl-10"
                                    required={f.required}
                                />
                            </div>
                        </div>
                    ))}

                    <div>
                        <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                            Description
                        </label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="input resize-none"
                            placeholder="Describe your facility, sports offered, unique features…"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving} className="btn btn-cta flex-1 disabled:opacity-60">
                            {saving ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="save" size={18} />}
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                        <Link href={`/owner/facilities/${facilityId}`} className="btn btn-outline">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
