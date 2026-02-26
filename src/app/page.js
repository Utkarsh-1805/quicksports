import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Star, ChevronRight, ShieldCheck, Zap, Calendar, Search, Clock, MapPin } from 'lucide-react';

import { QuickSearch } from '@/components/landing/QuickSearch';
import { VenueCard } from '@/components/landing/VenueCard';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';

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

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let popularVenues = [];
  let popularSports = [];
  let stats = { totalVenues: 0, totalCourts: 0, totalBookings: 0, totalUsers: 0 };
  let error = false;

  try {
    // 1. Fetch popular venues
    popularVenues = await prisma.facility.findMany({
      where: { status: 'APPROVED' },
      take: 6,
      include: {
        courts: {
          where: { isActive: true },
          select: { id: true, name: true, sportType: true, pricePerHour: true }
        },
        _count: {
          select: { courts: { where: { isActive: true } } }
        }
      },
      orderBy: [
        { courts: { _count: 'desc' } },
        { createdAt: 'desc' }
      ]
    });

    // 2. Fetch popular sports
    const aggregatedSports = await prisma.court.groupBy({
      by: ['sportType'],
      where: {
        isActive: true,
        facility: { status: 'APPROVED' }
      },
      _count: { sportType: true },
      orderBy: { _count: { sportType: 'desc' } },
      take: 8
    });

    // Map the aggregated sports to include styling/icons using DB enum keys
    const sportConfigs = {
      'BADMINTON': { label: 'Badminton', icon: '🏸', color: 'bg-blue-100 text-blue-600' },
      'TENNIS': { label: 'Tennis', icon: '🎾', color: 'bg-green-100 text-green-600' },
      'BASKETBALL': { label: 'Basketball', icon: '🏀', color: 'bg-orange-100 text-orange-600' },
      'FOOTBALL': { label: 'Football', icon: '⚽', color: 'bg-emerald-100 text-emerald-600' },
      'SWIMMING': { label: 'Swimming', icon: '🏊‍♂️', color: 'bg-cyan-100 text-cyan-600' },
      'CRICKET': { label: 'Cricket', icon: '🏏', color: 'bg-red-100 text-red-600' },
      'TABLE_TENNIS': { label: 'Table Tennis', icon: '🏓', color: 'bg-purple-100 text-purple-600' },
      'VOLLEYBALL': { label: 'Volleyball', icon: '🏐', color: 'bg-yellow-100 text-yellow-600' },
    };

    popularSports = aggregatedSports.map(s => {
      const config = sportConfigs[s.sportType] || { label: s.sportType.replace('_', ' '), icon: '🏅', color: 'bg-slate-100 text-slate-600' };
      return {
        id: s.sportType,
        name: config.label,
        count: s._count.sportType,
        icon: config.icon,
        color: config.color
      };
    });

    // If no sports found in DB, use mock
    if (popularSports.length === 0) {
      popularSports = Object.entries(sportConfigs).map(([key, conf]) => ({ id: key, name: conf.label, icon: conf.icon, color: conf.color, count: 0 }));
    }

    // 3. Get statistics
    stats = {
      totalVenues: await prisma.facility.count({ where: { status: 'APPROVED' } }),
      totalCourts: await prisma.court.count({ where: { isActive: true, facility: { status: 'APPROVED' } } }),
      totalBookings: await prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      totalUsers: await prisma.user.count({ where: { role: 'USER' } })
    };

  } catch (err) {
    console.error('Error fetching home page data:', err);
    error = true;

    // Fallback data if DB is empty or connection fails
    popularSports = [
      { name: 'Badminton', icon: '🏸', color: 'bg-blue-100 text-blue-600' },
      { name: 'Tennis', icon: '🎾', color: 'bg-green-100 text-green-600' },
      { name: 'Basketball', icon: '🏀', color: 'bg-orange-100 text-orange-600' },
      { name: 'Football', icon: '⚽', color: 'bg-emerald-100 text-emerald-600' }
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-500 selection:text-white overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-900 shadow-2xl">
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
            Your Game. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400">
              Your Court. Your Time.
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto mb-12 font-light">
            Discover and book premium sports facilities in your city instantly. Eliminate the hassle of calling venues and secure your playtime seamlessly.
          </p>

          {/* Interactive Search Bar Client Component */}
          <QuickSearch />

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Verified Venues</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Real-time Availability</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> Authentic Reviews</span>
          </div>
        </div>
      </section>

      {/* Statistics Section with Animated Counters */}
      <section className="py-12 bg-slate-900 relative -mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <AnimatedCounter target={Math.max(stats.totalVenues, 150)} label="Verified Venues" suffix="+" />
            <AnimatedCounter target={Math.max(stats.totalCourts, 320)} label="Active Courts" />
            <AnimatedCounter target={Math.max(stats.totalBookings, 8400)} label="Bookings Made" suffix="+" />
            <AnimatedCounter target={Math.max(stats.totalUsers, 12000)} label="Happy Players" suffix="+" />
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

          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {popularSports.map((sport, idx) => (
              <Link
                href={`/venues?sport=${sport.name}`}
                key={idx}
                className="group cursor-pointer flex flex-col items-center min-w-[100px]"
              >
                <div className={`w-20 h-20 rounded-2xl ${sport.color} flex items-center justify-center text-4xl mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif' }}>
                    {sport.icon}
                  </span>
                </div>
                <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors text-center whitespace-nowrap">
                  {sport.name}
                </span>
                {sport.count > 0 && <span className="text-xs text-slate-400">{sport.count} courts</span>}
              </Link>
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

          {popularVenues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Venues Found</h3>
              <p className="text-slate-500">Currently there are no venues in our database. <br /> Check back later or add some!</p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                Focus on the game, <br />
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
                  <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4 hover:scale-[1.02] transition-transform"></div>
                  <div className="w-full h-32 bg-slate-100 rounded-2xl hover:scale-[1.02] transition-transform"></div>
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
                <p className="text-lg text-slate-300 mb-8 font-light">&quot;{t.content}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{t.name}</h4>
                    <p className="text-sm text-green-400">{t.role}</p>
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
                <defs><pattern id="circles" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="currentColor" /></pattern></defs>
                <rect width="100%" height="100%" fill="url(#circles)" />
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
                  <button className="w-full sm:w-auto px-10 py-4 font-bold rounded-2xl bg-white text-green-600 hover:bg-slate-50 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2 text-lg hover:-translate-y-1">
                    Create Free Account
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/owner/dashboard">
                  <button className="w-full sm:w-auto px-10 py-4 font-bold rounded-2xl bg-transparent border-2 border-white/30 text-white hover:bg-white/10 transition-colors flex items-center justify-center text-lg hover:-translate-y-1">
                    I am a Facility Owner
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
