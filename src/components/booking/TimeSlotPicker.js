'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2, AlertCircle, CheckCircle2, XCircle, Ban } from 'lucide-react';

/**
 * TimeSlotPicker Component
 * Interactive time slot grid with real-time availability
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

    // Fetch availability when date changes
    useEffect(() => {
        if (!courtId || !selectedDate) {
            setSlots([]);
            return;
        }

        const fetchAvailability = async () => {
            setLoading(true);
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
        };

        fetchAvailability();
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Select Time Slots</h3>
                        <p className="text-sm text-slate-500">Please select a date first</p>
                    </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Select a date to view available time slots</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Select Time Slots</h3>
                        <p className="text-sm text-slate-500">
                            {operatingHours 
                                ? `Open ${formatTime(operatingHours.opening)} - ${formatTime(operatingHours.closing)}`
                                : 'Choose your preferred time'
                            }
                        </p>
                    </div>
                </div>
                
                {selectedSlots.length > 0 && (
                    <div className="text-right">
                        <p className="text-sm text-slate-500">{totalDuration} hour{totalDuration > 1 ? 's' : ''}</p>
                        <p className="text-lg font-bold text-green-600">₹{totalPrice.toLocaleString()}</p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500"></div>
                    <span className="text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-green-600"></div>
                    <span className="text-slate-600">Selected</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
                    <span className="text-slate-600">Booked</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-slate-200"></div>
                    <span className="text-slate-600">Unavailable</span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                    <span className="ml-3 text-slate-600">Loading availability...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-red-700 font-medium">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}  
                            className="text-sm text-red-600 hover:underline mt-1"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {/* Time Slots Grid */}
            {!loading && !error && slots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {slots.map((slot, index) => {
                        const status = getSlotStatus(slot);
                        const selected = isSlotSelected(slot);

                        return (
                            <button
                                key={`${slot.startTime}-${slot.endTime}`}
                                onClick={() => handleSlotClick(slot)}
                                disabled={!status.available}
                                className={`
                                    relative p-3 rounded-xl transition-all duration-200 text-center
                                    ${selected 
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 scale-105 ring-2 ring-green-400 ring-offset-2' 
                                        : status.available 
                                            ? 'bg-green-50 text-green-700 hover:bg-green-100 hover:scale-102 border-2 border-green-200 hover:border-green-400' 
                                            : status.booked 
                                                ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-200' 
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="font-bold text-sm">
                                    {formatTime(slot.startTime)}
                                </div>
                                <div className={`text-[10px] ${selected ? 'text-green-100' : 'opacity-70'}`}>
                                    to {formatTime(slot.endTime)}
                                </div>
                                
                                {/* Status Icons */}
                                {selected && (
                                    <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-white" />
                                )}
                                {status.booked && !selected && (
                                    <XCircle className="absolute top-1 right-1 w-3 h-3 text-red-400" />
                                )}
                                {status.blocked && !selected && (
                                    <Ban className="absolute top-1 right-1 w-3 h-3 text-slate-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && slots.length === 0 && (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No time slots available for this date</p>
                </div>
            )}

            {/* Selection Summary */}
            {selectedSlots.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Selected Time:</span>
                        <span className="font-bold text-slate-900">
                            {formatTime(selectedSlots[0].startTime)} - {formatTime(selectedSlots[selectedSlots.length - 1].endTime)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimeSlotPicker;
