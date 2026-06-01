'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

function readCookieToken() {
    if (typeof document === 'undefined') return null;
    return document.cookie.split('; ').find((row) => row.startsWith('quickcourt_token='))?.split('=')[1] || null;
}

const SKILL_LEVELS = [
    { value: 'beginner', label: 'Beginner', icon: 'sentiment_satisfied' },
    { value: 'intermediate', label: 'Intermediate', icon: 'mood' },
    { value: 'advanced', label: 'Advanced', icon: 'local_fire_department' },
];

/**
 * Lets the host of a confirmed booking promote it to a public match — others can
 * see it on /matches and join. Stays on the booking confirmation page.
 */
export default function OpenToOthersCard({ booking }) {
    const [expanded, setExpanded] = useState(false);
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [skillLevel, setSkillLevel] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(Boolean(booking?.isPublic));

    if (!booking?.id) return null;
    if (booking?.status === 'CANCELLED') return null;

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        if (maxPlayers < 2 || maxPlayers > 20) {
            setError('maxPlayers must be between 2 and 20.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const token = readCookieToken();
            const res = await fetch('/api/matches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    maxPlayers,
                    skillLevel: skillLevel || null,
                    matchNotes: notes.trim() || null,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'Could not open match.');
                return;
            }
            setIsOpen(true);
            setExpanded(false);
        } catch (err) {
            console.error('Open-to-others error:', err);
            setError('Network error.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isOpen) {
        return (
            <div className="bg-primary-container border border-primary/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
                        <Icon name="groups" size={22} filled />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-semibold text-on-primary-container">
                            Match opened — others can join you!
                        </h3>
                        <p className="text-sm text-on-primary-container/80">
                            Your booking is now visible on the public matches page.
                        </p>
                    </div>
                </div>
                <Link href="/matches">
                    <Button variant="outline">
                        View matches
                        <Icon name="chevron_right" size={16} />
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between gap-3 p-5 hover:bg-surface-container-low transition-colors"
            >
                <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                        <Icon name="groups" size={22} filled />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-semibold text-on-surface">Looking for more players?</h3>
                        <p className="text-sm text-on-surface-variant">
                            Open this booking to others and split the cost. Show up on the public matches feed.
                        </p>
                    </div>
                </div>
                <Icon name={expanded ? 'expand_less' : 'expand_more'} size={20} className="text-on-surface-variant shrink-0" />
            </button>

            {expanded && (
                <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1">
                            How many players total? (including yourself)
                        </label>
                        <input
                            type="number"
                            min={2}
                            max={20}
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 0)}
                            className="input font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-2">
                            Skill level (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSkillLevel('')}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                    skillLevel === ''
                                        ? 'bg-primary-container text-on-primary-container border-primary-container'
                                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                                }`}
                            >
                                Any level
                            </button>
                            {SKILL_LEVELS.map((s) => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setSkillLevel(s.value)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        skillLevel === s.value
                                            ? 'bg-primary-container text-on-primary-container border-primary-container'
                                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                                    }`}
                                >
                                    <Icon name={s.icon} size={16} />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1">
                            Note for joiners (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="e.g. Casual game, bring your own racket"
                            className="input resize-y"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-error-container text-on-error-container px-3 py-2 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Publishing…' : 'Open to other players'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setExpanded(false)} disabled={submitting}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
