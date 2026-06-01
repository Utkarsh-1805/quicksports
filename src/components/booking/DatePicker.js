'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * DatePicker Component
 * Beautiful calendar picker for selecting booking dates
 * Shows next 7 days with clear visual indication
 */
export function DatePicker({ selectedDate, onDateSelect, minDate = new Date() }) {
    const [viewMonth, setViewMonth] = useState(new Date());

    // Generate next 7 days from today
    const availableDates = useMemo(() => {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, []);

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getDayNumber = (date) => {
        return date.getDate();
    };

    const getMonthName = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short' });
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        return selectedDate && formatDate(date) === formatDate(new Date(selectedDate));
    };

    const monthLabel = availableDates[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="card p-7">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <span className="eyebrow">Date</span>
                    <h3 className="font-display text-lg font-semibold text-on-surface">Select Date</h3>
                </div>

                {/* Month nav (visual only — kept for parity with viewMonth state) */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                        className="bg-surface-container hover:bg-surface-container-high rounded-lg p-2 text-on-surface transition-colors"
                        aria-label="Previous month"
                    >
                        <Icon name="chevron_left" size={18} />
                    </button>
                    <span className="font-mono text-sm text-on-surface-variant min-w-[8ch] text-center">{monthLabel}</span>
                    <button
                        type="button"
                        onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                        className="bg-surface-container hover:bg-surface-container-high rounded-lg p-2 text-on-surface transition-colors"
                        aria-label="Next month"
                    >
                        <Icon name="chevron_right" size={18} />
                    </button>
                </div>
            </div>

            {/* Quick Date Selection - Next 7 Days */}
            <div className="grid grid-cols-7 gap-2">
                {availableDates.map((date, index) => {
                    const selected = isSelected(date);
                    const today = isToday(date);
                    return (
                        <button
                            key={formatDate(date)}
                            onClick={() => onDateSelect(formatDate(date))}
                            className={`
                                relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150
                                ${selected
                                    ? 'bg-primary text-on-primary border-primary font-bold'
                                    : today
                                        ? 'bg-primary-container border-primary text-on-primary-container font-bold hover:bg-primary-container'
                                        : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container hover:border-primary'
                                }
                            `}
                        >
                            <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 font-mono
                                ${selected ? 'text-on-primary/80' : 'text-on-surface-variant'}
                            `}>
                                {getDayName(date)}
                            </span>
                            <span className="font-mono text-xl font-bold">
                                {getDayNumber(date)}
                            </span>
                            <span className={`text-[10px] font-mono font-medium
                                ${selected ? 'text-on-primary/80' : 'text-on-surface-variant'}
                            `}>
                                {getMonthName(date)}
                            </span>
                            {today && (
                                <span className={`absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono
                                    ${selected ? 'bg-on-primary text-primary' : 'bg-primary text-on-primary'}
                                `}>
                                    TODAY
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
                <div className="mt-6 pt-4 border-t border-outline-variant/40">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-on-surface-variant font-mono uppercase tracking-[0.12em]">Selected:</span>
                        <span className="font-mono text-sm font-bold text-on-surface">
                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DatePicker;
