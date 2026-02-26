'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Star, 
  Search,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  Menu,
  X
} from 'lucide-react';

// Mock Data for UI
const SPORTS = [
  { name: 'Badminton', icon: '🏸', color: 'bg-blue-100 text-blue-600' },
  { name: 'Tennis', icon: '🎾', color: 'bg-green-100 text-green-600' },
  { name: 'Basketball', icon: '🏀', color: 'bg-orange-100 text-orange-600' },
  { name: 'Football', icon: '⚽', color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Swimming', icon: '🏊‍♂️', color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Cricket', icon: '🏏', color: 'bg-red-100 text-red-600' },
  { name: 'Table Tennis', icon: '🏓', color: 'bg-purple-100 text-purple-600' },
  { name: 'Volleyball', icon: '🏐', color: 'bg-yellow-100 text-yellow-600' },
];

const POPULAR_VENUES = [
  {
    id: 1,
    name: 'Smash Arena',
    location: 'Downtown Sports Complex',
    rating: 4.8,
    reviews: 124,
    price: '$25',
    sport: 'Badminton',
    image: 'bg-gradient-to-tr from-blue-400 to-emerald-400'
  },
  {
    id: 2,
    name: 'Grand Slam Courts',
    location: 'Westside Park',
    rating: 4.9,
    reviews: 89,
    price: '$35',
    sport: 'Tennis',
    image: 'bg-gradient-to-tr from-green-400 to-cyan-500'
  },
  {
    id: 3,
    name: 'Hoops Factory',
    location: 'North Avenue',
    rating: 4.7,
    reviews: 210,
    price: '$40',
    sport: 'Basketball',
    image: 'bg-gradient-to-tr from-orange-400 to-red-500'
  },
  {
    id: 4,
    name: 'Green Field Turf',
    location: 'East District',
    rating: 4.6,
    reviews: 156,
    price: '$60',
    sport: 'Football',
    image: 'bg-gradient-to-tr from-emerald-500 to-green-700'
  },
  {
    id: 5,
    name: 'Aqua Center',
    location: 'City Square',
    rating: 4.9,
    reviews: 342,
    price: '$15',
    sport: 'Swimming',
    image: 'bg-gradient-to-tr from-cyan-400 to-blue-600'
  },
  {
    id: 6,
    name: 'The Racket Club',
    location: 'South View',
    rating: 4.5,
    reviews: 78,
    price: '$20',
    sport: 'Table Tennis',
    image: 'bg-gradient-to-tr from-purple-400 to-pink-500'
  }
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'Regular Player',
    content: "QuickCourt made finding and booking courts extremely easy. The interface is intuitive, and I love the real-time availability updates!",
    avatar: 'A'
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Fitness Enthusiast',
    content: "I used to spend hours calling different venues. Now, everything is just a click away. It's a game-changer for my weekly tennis matches.",
    avatar: 'S'
  },
  {
    id: 3,
    name: 'Michael Chen',
    role: 'Facility Owner',
    content: "As a venue owner, this platform has boosted our bookings by over 50%. The management dashboard is a lifesaver.",
    avatar: 'M'
  }
];

export default function Home() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'} transition-colors duration-300`}>
                Quick<span className={isScrolled ? 'text-green-600' : 'text-green-400'}>Court</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className={`hidden md:flex items-center gap-8 font-medium ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>
              <Link href="/venues" className="hover:text-green-500 transition-colors">Find Venues</Link>
              <Link href="/sports" className="hover:text-green-500 transition-colors">Sports</Link>
              <Link href="/about" className="hover:text-green-500 transition-colors">How it Works</Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Link 
                    href={user?.role === 'FACILITY_OWNER' ? '/owner/dashboard' : '/dashboard'}
                    className={`flex items-center gap-2 font-medium hover:opacity-80 transition-opacity ${isScrolled ? 'text-slate-700' : 'text-white'}`}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md text-white">
                      {user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                    <span>{user?.name?.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className={`p-2 rounded-lg transition-colors ${
                      isScrolled ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <button className={`px-5 py-2.5 font-medium rounded-xl transition-colors ${
                      isScrolled 
                        ? 'text-slate-700 hover:bg-slate-100' 
                        : 'text-white hover:bg-white/10'
                    }`}>
                      Log in
                    </button>
                  </Link>
                  <Link href="/auth/register">
                    <button className="px-5 py-2.5 font-medium bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5">
                      Sign Up Free
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg ${isScrolled ? 'text-slate-800' : 'text-white'}`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl py-4 flex flex-col border-t border-slate-100">
            <Link href="/venues" className="px-6 py-3 text-slate-700 font-medium hover:bg-slate-50">Find Venues</Link>
            <Link href="/sports" className="px-6 py-3 text-slate-700 font-medium hover:bg-slate-50">Sports</Link>
            <Link href="/about" className="px-6 py-3 text-slate-700 font-medium hover:bg-slate-50 mb-4">How it Works</Link>
            
            <div className="px-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link 
                    href={user?.role === 'FACILITY_OWNER' ? '/owner/dashboard' : '/dashboard'}
                    className="w-full text-center py-3 bg-slate-100 rounded-xl text-slate-800 font-medium"
                  >
                    Go to Dashboard
                  </Link>
                  <button onClick={logout} className="w-full text-center py-3 text-red-600 font-medium">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="w-full text-center py-3 bg-slate-100 rounded-xl text-slate-800 font-medium">
                    Log in
                  </Link>
                  <Link href="/auth/register" className="w-full text-center py-3 bg-green-500 rounded-xl text-white font-medium">
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 blur-3xl" />
          <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-slate-900 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-8 text-sm font-medium text-green-300">
            <Zap className="w-4 h-4" />
            <span>Over 10,000+ courts booked this month</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Your Game. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400">
              Your Court. Your Time.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto mb-12 font-light">
            Discover and book premium sports facilities in your city instantly. Eliminate the hassle of calling venues and secure your playtime seamlessly.
          </p>

          {/* Search Bar Component */}
          <div className="max-w-4xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center relative">
              <MapPin className="w-6 h-6 text-slate-400 absolute left-4" />
              <input 
                type="text" 
                placeholder="Where do you want to play?" 
                className="w-full text-slate-800 bg-transparent py-4 pl-12 pr-4 outline-none text-lg placeholder-slate-400 rounded-xl"
              />
            </div>
            <div className="hidden md:block w-px h-10 bg-slate-200 my-auto"></div>
            <div className="flex-1 flex items-center relative">
              <Star className="w-6 h-6 text-slate-400 absolute left-4" />
              <input 
                type="text" 
                placeholder="What sport?" 
                className="w-full text-slate-800 bg-transparent py-4 pl-12 pr-4 outline-none text-lg placeholder-slate-400 rounded-xl"
              />
            </div>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-8 rounded-xl transition-colors flex justify-center items-center gap-2 group">
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="md:hidden lg:inline">Find Courts</span>
            </button>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Verified Venues</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Real-time Availability</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4"/> Authentic Reviews</span>
          </div>
        </div>
      </section>

      {/* Popular Sports Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Explore Sports</h2>
            <p className="text-slate-500">Find courts for your favorite activities</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {SPORTS.map((sport, idx) => (
              <div key={idx} className="group cursor-pointer flex flex-col items-center">
                <div className={`w-20 h-20 rounded-2xl ${sport.color} flex items-center justify-center text-4xl mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  {sport.icon}
                </div>
                <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {sport.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Venues Showcase */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Trending Venues</h2>
              <p className="text-slate-500 max-w-2xl">Highly rated courts and facilities recommended by our community.</p>
            </div>
            <Link href="/venues" className="flex items-center gap-1 text-green-600 font-medium hover:text-green-700 group">
              View all venues <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {POPULAR_VENUES.map((venue) => (
              <div key={venue.id} className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow border border-slate-100 group cursor-pointer flex flex-col h-full">
                {/* Image Placeholder */}
                <div className={`h-56 w-full ${venue.image} relative overflow-hidden`}>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {venue.rating} ({venue.reviews})
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                    {venue.sport}
                  </div>
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-green-600 transition-colors">{venue.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 mb-4 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{venue.location}</span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-sm">Starts from</span>
                      <div className="text-lg font-bold text-slate-900">{venue.price} <span className="text-sm font-normal text-slate-500">/hr</span></div>
                    </div>
                    <button className="bg-slate-100 hover:bg-green-50 text-slate-900 hover:text-green-700 font-medium py-2 px-4 rounded-xl transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                Focus on the game, <br/>
                <span className="text-green-600">we handle the rest.</span>
              </h2>
              <p className="text-lg text-slate-500 mb-8">
                QuickCourt transforms the way you play sports. Experience a frictionless journey from finding a court to making the winning shot.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Smart Discovery</h4>
                    <p className="text-slate-500">Filter venues by location, sport, price, and amenities. Find the exact court you need.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Instant Confirmations</h4>
                    <p className="text-slate-500">See real-time availability and book your slot instantly. No waiting for callbacks.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Secure Payments</h4>
                    <p className="text-slate-500">Pay securely through our platform. Split payments with friends and get immediate invoices.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual Element */}
            <div className="relative">
              <div className="aspect-[4/5] bg-gradient-to-tr from-slate-100 to-slate-200 rounded-3xl overflow-hidden relative shadow-2xl">
                {/* Abstract shape representing app UI */}
                <div className="absolute inset-x-8 top-12 bottom-0 bg-white rounded-t-3xl shadow-xl flex flex-col p-6">
                  <div className="w-1/3 h-4 bg-slate-200 rounded-full mb-8"></div>
                  <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                  <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4"></div>
                  <div className="w-full h-32 bg-slate-100 rounded-2xl"></div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute top-1/4 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce hover:animate-none transition-all">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Star className="w-6 h-6 fill-green-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">4.9/5 Rating</div>
                  <div className="text-sm text-slate-500">Based on 10k+ reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Loved by players and partners</h2>
            <p className="text-slate-400">Join the thousands who have improved their sporting experience with us.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg text-slate-300 mb-8 font-light">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{t.name}</h4>
                    <p className="text-sm text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-green-500/20">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="circles" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="currentColor"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#circles)"/>
              </svg>
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                Ready to step onto the court?
              </h2>
              <p className="text-green-50 text-xl mb-10 font-light">
                Sign up for free and book your first game in under 2 minutes. Facility owners, join us to skyrocket your bookings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <button className="w-full sm:w-auto px-10 py-4 font-bold rounded-2xl bg-white text-green-600 hover:bg-slate-50 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2 text-lg">
                    Create Free Account
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/owner/dashboard"> {/* Should probably link to a partner landing page theoretically */}
                  <button className="w-full sm:w-auto px-10 py-4 font-bold rounded-2xl bg-transparent border-2 border-white/30 text-white hover:bg-white/10 transition-colors flex items-center justify-center text-lg">
                    I am a Facility Owner
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2 pr-8">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">QuickCourt</span>
              </Link>
              <p className="text-sm leading-relaxed mb-6 max-w-sm">
                The modern platform for sports enthusiasts to discover, book, and play at premium facilities everywhere.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Discover</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="/venues" className="hover:text-green-400 transition-colors">Venues</Link></li>
                <li><Link href="/sports" className="hover:text-green-400 transition-colors">Sports</Link></li>
                <li><Link href="/cities" className="hover:text-green-400 transition-colors">Cities</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-green-400 transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-green-400 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-green-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Partners</h4>
              <ul className="space-y-4 text-sm">
                <li><Link href="/partners" className="hover:text-green-400 transition-colors">List Your Court</Link></li>
                <li><Link href="/owner-app" className="hover:text-green-400 transition-colors">Owner App</Link></li>
                <li><Link href="/pricing" className="hover:text-green-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} QuickCourt Technologies. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
