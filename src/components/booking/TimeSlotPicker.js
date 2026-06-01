'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * TimeSlotPicker Component
 * Interactive time slot grid with real-time availability (SSE-backed)
 */
export function TimeSlotPicker({
    courtId,
    selectedDate,
    selectedSlots = [],
    onSlotSelect,
    pricePerHour = 0
}) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operatingHours, setOperatingHours] = useState(null);
    const [liveStatus, setLiveStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'live'
    const [lastLiveUpdate, setLastLiveUpdate] = useState(null);
    const [flashUpdate, setFlashUpdate] = useState(false);
    const eventSourceRef = useRef(null);

    const fetchAvailability = useCallback(async () => {
        if (!courtId || !selectedDate) {
            setSlots([]);
            return;
        }
        setLoading((prev) => (slots.length === 0 ? true : prev));
        setError(null);
        try {
            const res = await fetch(`/api/courts/${courtId}/availability?date=${selectedDate}`);
            const data = await res.json();
            if (data.success) {
                setSlots(data.slots || []);
                setOperatingHours(data.operatingHours);
            } else {
                setError(data.message || 'Failed to load availability');
                setSlots([]);
            }
        } catch (err) {
            console.error('Availability fetch error:', err);
            setError('Failed to load availability. Please try again.');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courtId, selectedDate]);

    // Initial REST fetch + refetch when date/court changes
    useEffect(() => {
        if (!courtId || !selectedDate) {
            setSlots([]);
            return;
        }
        fetchAvailability();
    }, [courtId, selectedDate, fetchAvailability]);

    // Real-time SSE subscription — re-fetches REST availability when the server reports a change
    useEffect(() => {
        if (!courtId || !selectedDate || typeof window === 'undefined' || !('EventSource' in window)) return;

        setLiveStatus('connecting');
        const es = new EventSource(`/api/courts/${courtId}/availability/stream?date=${selectedDate}`);
        eventSourceRef.current = es;

        es.addEventListener('snapshot', () => {
            setLiveStatus('live');
        });

        es.addEventListener('update', () => {
            setLiveStatus('live');
            setLastLiveUpdate(new Date());
            setFlashUpdate(true);
            setTimeout(() => setFlashUpdate(false), 1500);
            // Re-query REST so the slot grid reflects the same data the rest of the booking flow uses
            fetchAvailability();
        });

        es.addEventListener('ping', () => {
            if (liveStatus !== 'live') setLiveStatus('live');
        });

        es.onerror = () => {
            setLiveStatus('disconnected');
            // EventSource auto-reconnects; we'll surface as "connecting" until the next event arrives
            setTimeout(() => setLiveStatus((cur) => (cur === 'disconnected' ? 'connecting' : cur)), 500);
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
            setLiveStatus('disconnected');
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courtId, selectedDate]);

    const handleSlotClick = (slot) => {
        if (slot.status !== 'available') return;

        const slotKey = `${slot.startTime}-${slot.endTime}`;
        const isSelected = selectedSlots.some(s => `${s.startTime}-${s.endTime}` === slotKey);

        if (isSelected) {
            // Deselect
            onSlotSelect(selectedSlots.filter(s => `${s.startTime}-${s.endTime}` !== slotKey));
        } else {
            // Check if we can add this slot (must be consecutive)
            if (selectedSlots.length === 0) {
                onSlotSelect([slot]);
            } else {
                // Check if slot is consecutive with existing selection
                const sortedSlots = [...selectedSlots].sort((a, b) =>
                    a.startTime.localeCompare(b.startTime)
                );

                const firstSlot = sortedSlots[0];
                const lastSlot = sortedSlots[sortedSlots.length - 1];

                // Can add before first or after last
                if (slot.endTime === firstSlot.startTime) {
                    onSlotSelect([slot, ...sortedSlots]);
                } else if (slot.startTime === lastSlot.endTime) {
                    onSlotSelect([...sortedSlots, slot]);
                } else {
                    // Not consecutive - start new selection
                    onSlotSelect([slot]);
                }
            }
        }
    };

    const getSlotStatus = (slot) => {
        return {
            available: slot.status === 'available',
            booked: slot.status === 'booked',
            blocked: slot.status === 'blocked',
            past: slot.status === 'past'
        };
    };

    const isSlotSelected = (slot) => {
        return selectedSlots.some(s =>
            s.startTime === slot.startTime && s.endTime === slot.endTime
        );
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Calculate total duration and price
    const totalDuration = selectedSlots.length; // hours
    const totalPrice = totalDuration * pricePerHour;

    if (!selectedDate) {
        return (
            <div className="card p-7">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                        <Icon name="schedule" size={20} className="text-on-surface-variant" />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-semibold text-on-surface">Select Time Slots</h3>
                        <p className="text-sm text-on-surface-variant">Please select a date first</p>
                    </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-8 text-center">
                    <Icon name="schedule" size={48} className="text-on-surface-variant mx-auto mb-3" />
                    <p className="text-on-surface-variant">Select a date to view available time slots</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-7">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-display text-lg font-semibold text-on-surface">Pick your time</h3>
                    <p className="text-sm text-on-surface-variant">
                        {operatingHours
                            ? `Open ${formatTime(operatingHours.opening)} - ${formatTime(operatingHours.closing)}`
                            : 'Choose your preferred time'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live indicator — proves SSE is wired */}
                    <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                            liveStatus === 'live'
                                ? `bg-primary-container/50 border-primary/40 text-on-primary-container ${flashUpdate ? 'ring-2 ring-primary animate-pulse' : ''}`
                                : liveStatus === 'connecting'
                                ? 'bg-secondary-fixed border-outline-variant text-on-secondary-fixed-variant'
                                : 'bg-surface-container border-outline-variant text-on-surface-variant'
                        }`}
                        title={
                            liveStatus === 'live'
                                ? lastLiveUpdate
                                    ? `Live · last change at ${lastLiveUpdate.toLocaleTimeString()}`
                                    : 'Live availability stream active'
                                : liveStatus === 'connecting'
                                ? 'Connecting to live availability…'
                                : 'Live updates unavailable'
                        }
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                liveStatus === 'live'
                                    ? 'bg-primary animate-pulse'
                                    : liveStatus === 'connecting'
                                    ? 'bg-on-surface-variant'
                                    : 'bg-on-surface-variant/50'
                            }`}
                        />
                        {liveStatus === 'live' ? 'Live' : liveStatus === 'connecting' ? 'Sync…' : 'Offline'}
                    </div>

                    {selectedSlots.length > 0 && (
                        <div className="text-right">
                            <p className="text-sm text-on-surface-variant font-mono">{totalDuration} hour{totalDuration > 1 ? 's' : ''}</p>
                            <p className="text-lg font-mono font-bold text-primary">₹{totalPrice.toLocaleString()}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Group label / Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-surface-container-low rounded-xl">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant mr-2">Legend</span>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-surface-container-lowest border border-outline-variant"></div>
                    <span className="text-on-surface-variant">Available</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-primary border border-primary"></div>
                    <span className="text-on-surface-variant">Selected</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-surface-container border border-dashed border-outline-variant"></div>
                    <span className="text-on-surface-variant">Booked</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded border border-dotted border-outline-variant"></div>
                    <span className="text-on-surface-variant">Unavailable</span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Icon name="progress_activity" size={32} className="text-primary animate-spin" />
                    <span className="ml-3 text-on-surface-variant">Loading availability...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-error-container border border-error/30 rounded-xl p-4 flex items-center gap-3">
                    <Icon name="error" size={20} className="text-error shrink-0" />
                    <div>
                        <p className="text-on-error-container font-medium">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-sm text-error hover:underline mt-1"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {/* Time Slots Grid */}
            {!loading && !error && slots.length > 0 && (
                <>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant mb-2">Time Slots</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                            const status = getSlotStatus(slot);
                            const selected = isSlotSelected(slot);
                            const slotClass = selected
                                ? 'slot selected'
                                : status.booked
                                    ? 'slot booked'
                                    : status.blocked
                                        ? 'slot blocked'
                                        : status.past
                                            ? 'slot past'
                                            : 'slot';

                            return (
                                <button
                                    key={`${slot.startTime}-${slot.endTime}`}
                                    onClick={() => handleSlotClick(slot)}
                                    disabled={!status.available}
                                    className={`${slotClass} relative !py-3`}
                                >
                                    <div className="font-bold text-sm leading-tight">
                                        {formatTime(slot.startTime)}
                                    </div>
                                    <div className="text-[10px] opacity-70">
                                        to {formatTime(slot.endTime)}
                                    </div>

                                    {/* Status Icons */}
                                    {selected && (
                                        <Icon name="check_circle" size={16} className="absolute top-1 right-1 text-on-primary" filled />
                                    )}
                                    {status.booked && !selected && (
                                        <Icon name="close" size={14} className="absolute top-1 right-1 text-on-surface-variant/50" />
                                    )}
                                    {status.blocked && !selected && (
                                        <Icon name="block" size={14} className="absolute top-1 right-1 text-error/70" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Empty State */}
            {!loading && !error && slots.length === 0 && (
                <div className="bg-surface-container-low rounded-xl p-8 text-center">
                    <Icon name="schedule" size={48} className="text-on-surface-variant mx-auto mb-3" />
                    <p className="text-on-surface-variant">No time slots available for this date</p>
                </div>
            )}

            {/* Selection Summary */}
            {selectedSlots.length > 0 && (
                <div className="mt-6 pt-4 border-t border-outline-variant/40">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant font-mono uppercase tracking-[0.12em] text-xs">Selected Time:</span>
                        <span className="font-mono font-bold text-on-surface">
                            {formatTime(selectedSlots[0].startTime)} - {formatTime(selectedSlots[selectedSlots.length - 1].endTime)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimeSlotPicker;
