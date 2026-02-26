'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Select Date</h3>
                    <p className="text-sm text-slate-500">Choose from available dates</p>
                </div>
            </div>

            {/* Quick Date Selection - Next 7 Days */}
            <div className="grid grid-cols-7 gap-2">
                {availableDates.map((date, index) => (
                    <button
                        key={formatDate(date)}
                        onClick={() => onDateSelect(formatDate(date))}
                        className={`
                            relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
                            ${isSelected(date)
                                ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 scale-105'
                                : 'bg-slate-50 text-slate-700 hover:bg-green-50 hover:text-green-700 hover:scale-102'
                            }
                            ${isToday(date) && !isSelected(date) ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                        `}
                    >
                        <span className={`text-[10px] uppercase font-bold tracking-wider mb-1
                            ${isSelected(date) ? 'text-green-100' : 'text-slate-400'}
                        `}>
                            {getDayName(date)}
                        </span>
                        <span className={`text-xl font-bold
                            ${isSelected(date) ? 'text-white' : 'text-slate-800'}
                        `}>
                            {getDayNumber(date)}
                        </span>
                        <span className={`text-[10px] font-medium
                            ${isSelected(date) ? 'text-green-100' : 'text-slate-500'}
                        `}>
                            {getMonthName(date)}
                        </span>
                        {isToday(date) && (
                            <span className={`absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-full
                                ${isSelected(date) ? 'bg-white text-green-600' : 'bg-green-500 text-white'}
                            `}>
                                TODAY
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Selected Date:</span>
                        <span className="text-sm font-bold text-slate-900">
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
