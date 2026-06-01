'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * BookingCalendar Component
 * Shows bookings in a calendar grid view for facility owners
 */
export function BookingCalendar({ bookings = [], loading = false }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [hoveredDate, setHoveredDate] = useState(null);

    // Get the start of the month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get day of week for the first day (0 = Sunday)
    const startDay = startOfMonth.getDay();

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const days = [];

        // Add empty cells for days before the month starts
        for (let i = 0; i < startDay; i++) {
            days.push({ date: null, isCurrentMonth: false });
        }

        // Add each day of the month
        for (let day = 1; day <= endOfMonth.getDate(); day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            days.push({
                date,
                day,
                isCurrentMonth: true,
                isToday: isSameDay(date, new Date()),
                isPast: date < new Date(new Date().setHours(0,0,0,0))
            });
        }

        // Fill the remaining cells
        const remaining = 42 - days.length; // 6 rows * 7 days
        for (let i = 0; i < remaining; i++) {
            days.push({ date: null, isCurrentMonth: false });
        }

        return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    // Get bookings for a specific date
    const getBookingsForDate = (date) => {
        if (!date || !bookings.length) return [];
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.bookingDate);
            return isSameDay(bookingDate, date);
        });
    };

    // Calculate total revenue for a date
    const getRevenueForDate = (date) => {
        const dayBookings = getBookingsForDate(date);
        return dayBookings.reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
    };

    // Helper to check if two dates are the same day
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // Navigation functions
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

    // Status configurations using M3 tokens
    const statusConfig = {
        CONFIRMED: {
            pill: 'pill',
            chip: 'bg-primary-container text-on-primary-container'
        },
        PENDING: {
            pill: 'pill secondary',
            chip: 'bg-secondary-container/40 text-on-secondary-container'
        },
        CANCELLED: {
            pill: 'pill error',
            chip: 'bg-error-container text-on-error-container'
        },
        COMPLETED: {
            pill: 'pill tertiary',
            chip: 'bg-tertiary-container text-on-tertiary-container'
        }
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Icon name="progress_activity" size={40} className="text-primary animate-spin mx-auto mb-3" />
                        <p className="text-sm text-on-surface-variant">Loading calendar...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="bg-inverse-surface p-4 sm:p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-inverse-on-surface/15 backdrop-blur-sm flex items-center justify-center">
                            <Icon name="calendar_today" size={24} className="text-inverse-on-surface" />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-semibold text-inverse-on-surface">Booking calendar</h2>
                            <p className="text-inverse-on-surface/80 text-sm font-mono">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-semibold text-inverse-surface bg-inverse-on-surface hover:opacity-90 rounded-full transition-all shadow-sm"
                        >
                            Today
                        </button>
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2.5 hover:bg-inverse-on-surface/15 rounded-full transition-colors"
                            aria-label="Previous month"
                        >
                            <Icon name="chevron_left" size={20} className="text-inverse-on-surface" />
                        </button>
                        <button
                            onClick={goToNextMonth}
                            className="p-2.5 hover:bg-inverse-on-surface/15 rounded-full transition-colors"
                            aria-label="Next month"
                        >
                            <Icon name="chevron_right" size={20} className="text-inverse-on-surface" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row">
                {/* Calendar Grid */}
                <div className="flex-1 p-4 sm:p-6">
                    {/* Day Names */}
                    <div className="grid grid-cols-7 mb-3">
                        {dayNames.map((day, i) => (
                            <div
                                key={day}
                                className={`text-center py-3 text-xs font-bold uppercase tracking-wider ${
                                    i === 0 || i === 6 ? 'text-primary' : 'text-on-surface-variant'
                                }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1.5">
                        {calendarDays.map((dayObj, index) => {
                            if (!dayObj.date) {
                                return <div key={index} className="h-24 sm:h-28" />;
                            }

                            const dayBookings = getBookingsForDate(dayObj.date);
                            const isSelected = selectedDate && isSameDay(dayObj.date, selectedDate);
                            const isHovered = hoveredDate && isSameDay(dayObj.date, hoveredDate);
                            const hasBookings = dayBookings.length > 0;
                            const dayRevenue = getRevenueForDate(dayObj.date);

                            // Cell base classes per state
                            let cellClasses = 'bg-surface-container-lowest border border-outline-variant';
                            let dayNumClasses = 'text-on-surface';

                            if (isSelected) {
                                cellClasses = 'bg-primary text-on-primary border-primary shadow-md scale-[1.02]';
                                dayNumClasses = 'text-on-primary';
                            } else if (dayObj.isToday) {
                                cellClasses = 'bg-primary-container/30 border-primary text-primary';
                                dayNumClasses = 'text-primary font-bold';
                            } else if (hasBookings) {
                                cellClasses = 'bg-surface-container-low border-outline-variant hover:border-primary/40';
                            } else {
                                cellClasses = 'bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low';
                            }

                            if (!dayObj.isCurrentMonth) {
                                dayNumClasses = 'text-on-surface-variant/40';
                            } else if (dayObj.isPast && !hasBookings && !isSelected && !dayObj.isToday) {
                                dayNumClasses = 'text-on-surface-variant/60';
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(dayObj.date)}
                                    onMouseEnter={() => setHoveredDate(dayObj.date)}
                                    onMouseLeave={() => setHoveredDate(null)}
                                    className={`h-24 sm:h-28 p-1.5 sm:p-2 rounded-xl transition-all duration-200 text-left relative overflow-hidden group ${cellClasses}`}
                                >
                                    {/* Date number */}
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-bold ${dayNumClasses} ${
                                            dayObj.isToday && !isSelected ? 'w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center' : ''
                                        }`}>
                                            {dayObj.day}
                                        </span>
                                        {hasBookings && (
                                            <span className={`flex items-center gap-0.5 ${isSelected ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                                                <Icon name="bolt" size={12} className={isSelected ? 'text-on-primary' : 'text-secondary'} />
                                                <span className="text-[10px] font-bold font-mono">{dayBookings.length}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Booking chips */}
                                    {hasBookings && (
                                        <div className="space-y-1">
                                            {dayBookings.slice(0, 2).map((booking, i) => {
                                                const chipClass = isSelected
                                                    ? 'bg-on-primary/20 text-on-primary'
                                                    : 'bg-secondary-container/40 text-on-secondary-container';
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-1 rounded-md text-xs px-1 py-0.5 truncate font-medium ${chipClass}`}
                                                    >
                                                        <Icon name="schedule" size={10} className="flex-shrink-0" />
                                                        <span className="truncate">{booking.startTime}</span>
                                                    </div>
                                                );
                                            })}

                                            {/* Show count if more bookings */}
                                            {dayBookings.length > 2 && (
                                                <div className={`flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-semibold ${
                                                    isSelected ? 'bg-on-primary/30 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                                                }`}>
                                                    <span>+{dayBookings.length - 2} more</span>
                                                </div>
                                            )}

                                            {/* Revenue badge on hover */}
                                            {dayRevenue > 0 && (isHovered || isSelected) && (
                                                <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shadow-sm ${
                                                    isSelected ? 'bg-on-primary text-primary' : 'bg-primary text-on-primary'
                                                }`}>
                                                    ₹{dayRevenue >= 1000 ? `${(dayRevenue/1000).toFixed(1)}k` : dayRevenue}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-4 border-t border-outline-variant/40">
                        {Object.entries(statusConfig).map(([status, config]) => (
                            <span key={status} className={config.pill}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                {status.toLowerCase()}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Selected Day Details */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-outline-variant/40 bg-surface-container-low/40">
                    {/* Selected date header */}
                    <div className="p-4 sm:p-6 border-b border-outline-variant/40 bg-surface-container-lowest">
                        {selectedDate ? (
                            <div>
                                <p className="eyebrow mb-1">Selected Date</p>
                                <h3 className="font-display text-xl font-semibold text-on-surface">
                                    {selectedDate.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </h3>
                                {selectedBookings.length > 0 && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                                            <Icon name="calendar_today" size={16} />
                                            <span className="font-mono">{selectedBookings.length}</span> booking{selectedBookings.length > 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm text-primary font-semibold">
                                            <Icon name="trending_up" size={16} />
                                            <span className="font-mono">₹{getRevenueForDate(selectedDate).toLocaleString()}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center">
                                    <Icon name="auto_awesome" size={20} className="text-primary" />
                                </div>
                                <div>
                                    <p className="font-display font-semibold text-on-surface">Select a date</p>
                                    <p className="text-sm text-on-surface-variant">Click to view bookings</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bookings list */}
                    <div className="p-4 sm:p-6">
                        {!selectedDate ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                                    <Icon name="calendar_today" size={32} className="text-on-surface-variant/60" />
                                </div>
                                <p className="text-on-surface-variant">Select a date from the calendar</p>
                            </div>
                        ) : selectedBookings.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-primary-container/30 flex items-center justify-center mx-auto mb-4">
                                    <Icon name="circle" size={32} className="text-primary/60" />
                                </div>
                                <p className="font-display font-semibold text-on-surface mb-1">No bookings</p>
                                <p className="text-sm text-on-surface-variant">This date has no scheduled bookings</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {selectedBookings.map((booking, index) => (
                                    <div
                                        key={index}
                                        className="card overflow-hidden"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={statusConfig[booking.status]?.pill || 'pill neutral'}>
                                                    <Icon name="circle" size={10} />
                                                    {booking.status}
                                                </span>
                                                <span className="font-display text-lg font-semibold text-on-surface font-mono">
                                                    ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center flex-shrink-0">
                                                        <Icon name="location_on" size={16} className="text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-on-surface truncate">{booking.courtName}</p>
                                                        <p className="text-on-surface-variant text-xs truncate">{booking.facilityName}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center flex-shrink-0">
                                                        <Icon name="schedule" size={16} className="text-tertiary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-on-surface font-mono">{booking.startTime} - {booking.endTime}</p>
                                                        <p className="text-on-surface-variant text-xs">{booking.duration || 60} minutes</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-container/30 flex items-center justify-center flex-shrink-0">
                                                        <Icon name="group" size={16} className="text-secondary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-on-surface truncate">{booking.userName}</p>
                                                        <p className="text-on-surface-variant text-xs truncate">{booking.userPhone || booking.userEmail || 'Customer'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookingCalendar;
