'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Calendar, ChevronDown } from 'lucide-react';

// List of sports to populate the dropdown
const SPORTS_LIST = [
    'Badminton', 'Tennis', 'Basketball', 'Football',
    'Cricket', 'Swimming', 'Table Tennis', 'Volleyball'
];

export function QuickSearch() {
    const router = useRouter();
    const [location, setLocation] = useState('');
    const [sport, setSport] = useState('');
    const [date, setDate] = useState('');
    const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();

        // Build query parameters
        const params = new URLSearchParams();
        if (location) params.append('city', location); // Maps to 'city' param in API
        if (sport) params.append('sportType', sport.toUpperCase().replace(' ', '_')); // Maps to 'sportType' ENUM in API
        // if (date) params.append('date', date); // Date filtering not yet supported by search API schema

        const queryString = params.toString();
        router.push(`/venues${queryString ? `?${queryString}` : ''}`);
    };

    return (
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 relative z-20">

            {/* Location Input */}
            <div className="flex-1 flex items-center relative">
                <MapPin className="w-6 h-6 text-slate-400 absolute left-4" />
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where do you want to play?"
                    className="w-full text-slate-800 bg-transparent py-4 pl-12 pr-4 outline-none text-lg placeholder-slate-400 rounded-xl"
                />
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200 my-auto"></div>

            {/* Sport Selector */}
            <div className="flex-1 flex items-center relative">
                <div
                    className="w-full h-full flex items-center cursor-pointer"
                    onClick={() => setIsSportDropdownOpen(!isSportDropdownOpen)}
                    tabIndex={0}
                    onBlur={() => setTimeout(() => setIsSportDropdownOpen(false), 200)}
                >
                    <div className="flex items-center pl-4 w-full h-full text-lg">
                        {!sport ? (
                            <span className="text-slate-400">What sport?</span>
                        ) : (
                            <span className="text-slate-800 font-medium">{sport}</span>
                        )}
                    </div>
                    <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 transition-transform" style={{ transform: isSportDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                </div>

                {/* Sport Dropdown Menu */}
                {isSportDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 max-h-60 overflow-y-auto">
                        <div
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-slate-700 font-medium border-b border-slate-50"
                            onClick={() => {
                                setSport('');
                                setIsSportDropdownOpen(false);
                            }}
                        >
                            Any Sport
                        </div>
                        {SPORTS_LIST.map((s) => (
                            <div
                                key={s}
                                className="px-4 py-3 hover:bg-green-50 hover:text-green-700 cursor-pointer text-slate-600 transition-colors"
                                onClick={() => {
                                    setSport(s);
                                    setIsSportDropdownOpen(false);
                                }}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200 my-auto"></div>

            {/* Date Picker Component */}
            <div className="flex-1 flex items-center relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-4" />
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Can't book in past
                    className="w-full text-slate-800 bg-transparent py-4 pl-12 pr-4 outline-none text-lg rounded-xl focus:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
            </div>

            <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-8 rounded-xl transition-colors flex justify-center items-center gap-2 group shadow-lg shadow-green-500/20"
            >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="md:hidden lg:inline">Find Courts</span>
            </button>
        </form>
    );
}
