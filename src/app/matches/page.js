'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';

const SPORTS = [
    { value: '', label: 'All sports' },
    { value: 'BADMINTON', label: 'Badminton', emoji: '🏸' },
    { value: 'TENNIS', label: 'Tennis', emoji: '🎾' },
    { value: 'BASKETBALL', label: 'Basketball', emoji: '🏀' },
    { value: 'FOOTBALL', label: 'Football', emoji: '⚽' },
    { value: 'CRICKET', label: 'Cricket', emoji: '🏏' },
    { value: 'SWIMMING', label: 'Swimming', emoji: '🏊' },
    { value: 'TABLE_TENNIS', label: 'Table Tennis', emoji: '🏓' },
    { value: 'VOLLEYBALL', label: 'Volleyball', emoji: '🏐' },
];

const SPORT_EMOJI = Object.fromEntries(SPORTS.filter((s) => s.value).map((s) => [s.value, s.emoji]));

function readCookieToken() {
    if (typeof document === 'undefined') return null;
    return document.cookie.split('; ').find((row) => row.startsWith('quickcourt_token='))?.split('=')[1] || null;
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(t) {
    const [h, m] = t.split(':');
    const hh = parseInt(h, 10);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${hh % 12 || 12}:${m} ${ampm}`;
}

function MatchCard({ match, currentUserId, onJoinChange }) {
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);
    const isHost = match.host?.id === currentUserId;
    const alreadyJoined = match.participants.some((p) => p.id === currentUserId);

    const handleJoin = async () => {
        if (!currentUserId) return;
        setJoining(true);
        setError(null);
        try {
            const token = readCookieToken();
            const res = await fetch(`/api/matches/${match.id}/join`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'Could not join match');
                return;
            }
            onJoinChange?.(match.id, 'joined');
        } catch (err) {
            console.error('Join error:', err);
            setError('Network error.');
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!currentUserId) return;
        setJoining(true);
        setError(null);
        try {
            const token = readCookieToken();
            const res = await fetch(`/api/matches/${match.id}/join`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'Could not leave match');
                return;
            }
            onJoinChange?.(match.id, 'left');
        } catch (err) {
            console.error('Leave error:', err);
            setError('Network error.');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="card card-hover p-[22px] flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-[28px]">
                        {SPORT_EMOJI[match.sportType] || '🏟️'}
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-semibold tracking-tight text-on-surface">
                            {match.sportType.replace('_', ' ')} · {match.court.name}
                        </h3>
                        <p className="text-sm text-on-surface-variant mt-0.5">
                            {match.facility.name} · {match.facility.city}
                        </p>
                    </div>
                </div>
                <span
                    className={`pill ${
                        match.skillLevel === 'advanced'
                            ? 'error'
                            : match.skillLevel === 'intermediate'
                            ? 'secondary'
                            : 'tertiary'
                    }`}
                    style={{ textTransform: 'none', letterSpacing: 0 }}
                >
                    {match.skillLevel || 'any level'}
                </span>
            </div>

            <div className="flex items-center gap-4 px-3.5 py-2.5 bg-surface-container-low rounded-xl text-[13px]">
                <span className="font-mono inline-flex items-center gap-1.5 text-on-surface">
                    <Icon name="event" size={14} className="text-on-surface-variant" />
                    {formatDate(match.bookingDate)}
                </span>
                <span className="text-outline-variant">·</span>
                <span className="font-mono inline-flex items-center gap-1.5 text-on-surface">
                    <Icon name="schedule" size={14} className="text-on-surface-variant" />
                    {formatTime(match.startTime)} – {formatTime(match.endTime)}
                </span>
            </div>

            {match.matchNotes && (
                <p className="text-[13px] leading-relaxed text-on-surface-variant italic">
                    &ldquo;{match.matchNotes}&rdquo;
                </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                <div className="flex items-center gap-3">
                    <div className="flex items-center">
                        <div
                            className="avatar bg-primary text-on-primary"
                            title={`${match.host?.name} (host)`}
                        >
                            {match.host?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {match.participants.slice(0, 4).map((p) => (
                            <div
                                key={p.id}
                                className="avatar bg-primary-container text-on-primary-container -ml-2.5"
                                title={p.name}
                            >
                                {p.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        ))}
                        {match.participants.length > 4 && (
                            <div className="avatar bg-surface-container text-on-surface-variant -ml-2.5">
                                +{match.participants.length - 4}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-mono text-sm font-semibold text-on-surface">
                            {match.accepted + 1}<span className="text-on-surface-variant font-normal">/{match.maxPlayers}</span>
                        </div>
                        <div className={`font-mono text-[11px] uppercase tracking-[0.08em] font-semibold ${match.seatsRemaining === 0 ? 'text-error' : 'text-primary'}`}>
                            {match.seatsRemaining === 0 ? 'Full' : `${match.seatsRemaining} seat${match.seatsRemaining === 1 ? '' : 's'} open`}
                        </div>
                    </div>
                </div>

                {isHost ? (
                    <span className="text-xs text-on-surface-variant font-mono uppercase tracking-[0.08em]">You&apos;re hosting</span>
                ) : !currentUserId ? (
                    <Link
                        href={`/auth/login?redirect=/matches`}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        Log in to join
                    </Link>
                ) : alreadyJoined ? (
                    <button className="btn btn-outline btn-sm" disabled={joining} onClick={handleLeave}>
                        {joining ? 'Leaving…' : <><Icon name="check" size={14} /> Leave match</>}
                    </button>
                ) : (
                    <button className="btn btn-primary btn-sm disabled:opacity-60 disabled:cursor-not-allowed" disabled={joining || match.seatsRemaining === 0} onClick={handleJoin}>
                        {joining ? 'Joining…' : match.seatsRemaining === 0 ? 'Full' : 'Join match'}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
    );
}

export default function MatchesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sportFilter, setSportFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    const fetchMatches = useMemo(
        () => async (sport, city) => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (sport) params.set('sportType', sport);
                if (city) params.set('city', city);
                const res = await fetch(`/api/matches?${params.toString()}`);
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Failed to load');
                setMatches(data.data.matches || []);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchMatches(sportFilter, cityFilter);
    }, [sportFilter, cityFilter, fetchMatches]);

    const onJoinChange = () => fetchMatches(sportFilter, cityFilter);

    return (
        <div className="min-h-screen bg-surface pt-24 pb-16 page-enter">
            <div className="container-x">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="eyebrow mb-2.5">Match-making</div>
                        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-on-surface leading-[1.05]">Find a Match</h1>
                        <p className="text-muted mt-3 max-w-xl">
                            Jump into an open booking and split the cost, or open your own court to find players at your level.
                        </p>
                    </div>
                    <Link href="/dashboard/bookings">
                        <button className="btn btn-cta btn-lg">
                            <Icon name="add" size={18} />
                            Open your own match
                        </button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-7">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                        {SPORTS.map((s) => (
                            <button
                                key={s.value || 'all'}
                                onClick={() => setSportFilter(s.value)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] border transition-colors ${
                                    sportFilter === s.value
                                        ? 'bg-primary-container text-on-surface border-primary font-semibold'
                                        : 'bg-transparent text-on-surface border-outline-variant font-medium hover:bg-surface-container'
                                }`}
                            >
                                {s.emoji && <span>{s.emoji}</span>}
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant sm:w-60">
                        <Icon name="location_on" size={18} className="text-on-surface-variant" />
                        <input
                            type="text"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            placeholder="City…"
                            className="bg-transparent border-0 outline-none text-sm text-on-surface w-full placeholder:text-on-surface-variant/70"
                        />
                    </div>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-48 rounded-[20px] bg-surface-container-low animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-xl bg-error-container text-on-error-container p-4">{error}</div>
                ) : matches.length === 0 ? (
                    <div className="card text-center py-16 px-6">
                        <Icon name="groups" size={48} className="text-on-surface-variant mx-auto mb-3" />
                        <h3 className="font-display text-xl font-semibold text-on-surface mb-1">No open matches right now</h3>
                        <p className="text-on-surface-variant mb-5">Be the first — book a court and open it to others.</p>
                        <Link href="/venues">
                            <button className="btn btn-primary">Browse venues</button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                        {matches.map((m) => (
                            <MatchCard
                                key={m.id}
                                match={m}
                                currentUserId={user?.id || null}
                                onJoinChange={onJoinChange}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
