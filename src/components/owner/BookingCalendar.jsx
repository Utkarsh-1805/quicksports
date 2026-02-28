'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    User,
    Loader2,
    Sparkles,
    TrendingUp,
    CircleDot,
    Zap
} from 'lucide-react';

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
    }, [currentDate.getMonth(), currentDate.getFullYear()]);

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

    // Status configurations with gradients
    const statusConfig = {
        CONFIRMED: { 
            bg: 'bg-emerald-500', 
            light: 'bg-emerald-100', 
            text: 'text-emerald-700',
            gradient: 'from-emerald-500 to-green-400',
            glow: 'shadow-emerald-200'
        },
        PENDING: { 
            bg: 'bg-amber-500', 
            light: 'bg-amber-100', 
            text: 'text-amber-700',
            gradient: 'from-amber-500 to-yellow-400',
            glow: 'shadow-amber-200'
        },
        CANCELLED: { 
            bg: 'bg-rose-500', 
            light: 'bg-rose-100', 
            text: 'text-rose-700',
            gradient: 'from-rose-500 to-red-400',
            glow: 'shadow-rose-200'
        },
        COMPLETED: { 
            bg: 'bg-blue-500', 
            light: 'bg-blue-100', 
            text: 'text-blue-700',
            gradient: 'from-blue-500 to-cyan-400',
            glow: 'shadow-blue-200'
        }
    };

    // Get booking intensity (for visual feedback)
    const getBookingIntensity = (count) => {
        if (count === 0) return '';
        if (count <= 2) return 'bg-gradient-to-br from-purple-50 to-violet-50';
        if (count <= 4) return 'bg-gradient-to-br from-purple-100 to-violet-100';
        return 'bg-gradient-to-br from-purple-200 to-violet-200';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Loading calendar...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Booking Calendar</h2>
                            <p className="text-purple-200">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-semibold text-purple-600 bg-white hover:bg-purple-50 rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                            Today
                        </button>
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={goToNextMonth}
                            className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
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
                                    i === 0 || i === 6 ? 'text-purple-500' : 'text-slate-500'
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
                            const confirmedCount = dayBookings.filter(b => b.status === 'CONFIRMED').length;
                            const pendingCount = dayBookings.filter(b => b.status === 'PENDING').length;
                            const dayRevenue = getRevenueForDate(dayObj.date);

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(dayObj.date)}
                                    onMouseEnter={() => setHoveredDate(dayObj.date)}
                                    onMouseLeave={() => setHoveredDate(null)}
                                    className={`h-24 sm:h-28 p-1.5 sm:p-2 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden group ${
                                        isSelected
                                            ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100 scale-[1.02]'
                                            : dayObj.isToday
                                            ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50'
                                            : hasBookings
                                            ? `border-slate-200 ${getBookingIntensity(dayBookings.length)} hover:border-purple-300 hover:shadow-md`
                                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                                    } ${dayObj.isPast && !hasBookings ? 'opacity-50' : ''}`}
                                >
                                    {/* Date number with badge for today */}
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-bold ${
                                            dayObj.isToday 
                                                ? 'w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center' 
                                                : isSelected 
                                                ? 'text-purple-700'
                                                : dayObj.isPast
                                                ? 'text-slate-400'
                                                : 'text-slate-700'
                                        }`}>
                                            {dayObj.day}
                                        </span>
                                        {hasBookings && (
                                            <span className="flex items-center gap-0.5">
                                                <Zap className="w-3 h-3 text-amber-500" />
                                                <span className="text-[10px] font-bold text-slate-600">{dayBookings.length}</span>
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Booking chips */}
                                    {hasBookings && (
                                        <div className="space-y-1">
                                            {/* Show mini booking pills */}
                                            {dayBookings.slice(0, 2).map((booking, i) => (
                                                <div 
                                                    key={i}
                                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate bg-gradient-to-r ${statusConfig[booking.status]?.gradient || 'from-slate-400 to-slate-300'} text-white shadow-sm`}
                                                >
                                                    <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                                    <span className="truncate">{booking.startTime}</span>
                                                </div>
                                            ))}
                                            
                                            {/* Show count if more bookings */}
                                            {dayBookings.length > 2 && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-600 text-white text-[10px] font-semibold">
                                                    <span>+{dayBookings.length - 2} more</span>
                                                </div>
                                            )}

                                            {/* Revenue badge on hover */}
                                            {dayRevenue > 0 && (isHovered || isSelected) && (
                                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold shadow-sm animate-in fade-in duration-200">
                                                    ₹{dayRevenue >= 1000 ? `${(dayRevenue/1000).toFixed(1)}k` : dayRevenue}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Decorative corner for today */}
                                    {dayObj.isToday && (
                                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-purple-500 border-l-[20px] border-l-transparent" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-100">
                        {Object.entries(statusConfig).map(([status, config]) => (
                            <div key={status} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-md bg-gradient-to-r ${config.gradient} shadow-sm`} />
                                <span className="text-xs font-medium text-slate-600 capitalize">{status.toLowerCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Day Details - Enhanced */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                    {/* Selected date header */}
                    <div className="p-4 sm:p-6 border-b border-slate-200 bg-white">
                        {selectedDate ? (
                            <div>
                                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Selected Date</p>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {selectedDate.toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}
                                </h3>
                                {selectedBookings.length > 0 && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="flex items-center gap-1 text-sm text-slate-600">
                                            <CalendarIcon className="w-4 h-4" />
                                            {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm text-emerald-600 font-semibold">
                                            <TrendingUp className="w-4 h-4" />
                                            ₹{getRevenueForDate(selectedDate).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Select a date</p>
                                    <p className="text-sm text-slate-500">Click to view bookings</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bookings list */}
                    <div className="p-4 sm:p-6">
                        {!selectedDate ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500">Select a date from the calendar</p>
                            </div>
                        ) : selectedBookings.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                                    <CircleDot className="w-8 h-8 text-purple-300" />
                                </div>
                                <p className="font-medium text-slate-700 mb-1">No bookings</p>
                                <p className="text-sm text-slate-500">This date has no scheduled bookings</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {selectedBookings.map((booking, index) => (
                                    <div 
                                        key={index}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                    >
                                        {/* Status bar */}
                                        <div className={`h-1 bg-gradient-to-r ${statusConfig[booking.status]?.gradient || 'from-slate-400 to-slate-300'}`} />
                                        
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig[booking.status]?.light} ${statusConfig[booking.status]?.text}`}>
                                                    <CircleDot className="w-3 h-3" />
                                                    {booking.status}
                                                </span>
                                                <span className="text-lg font-bold text-slate-900">
                                                    ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <MapPin className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{booking.courtName}</p>
                                                        <p className="text-slate-500 text-xs">{booking.facilityName}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                        <Clock className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{booking.startTime} - {booking.endTime}</p>
                                                        <p className="text-slate-500 text-xs">{booking.duration || 60} minutes</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{booking.userName}</p>
                                                        <p className="text-slate-500 text-xs">{booking.userPhone || booking.userEmail || 'Customer'}</p>
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
