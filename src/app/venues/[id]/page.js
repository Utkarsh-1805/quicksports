import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Star, MapPin, Phone, Mail, Globe, Clock, ShieldCheck, Heart, Share2, Calendar } from 'lucide-react';
import { VenueGallery } from '@/components/venues/VenueGallery';
import { VenueReviews } from '@/components/venues/VenueReviews';
import { CourtSelector } from '@/components/booking/CourtSelector';
import { Button } from '@/components/ui/Button';

// Mock utility functions for formatted data (will refactor later)
const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// Fetch single venue data
async function getVenue(id) {
    try {
        const venue = await prisma.facility.findUnique({
            where: { id },
            include: {
                owner: { select: { name: true, phone: true, email: true } },
                courts: { where: { isActive: true } },
                amenities: { include: { amenity: true } },
                photos: true,
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { name: true } } }
                },
                _count: { select: { reviews: true } }
            }
        });
        return venue;
    } catch (err) {
        console.error("Failed to sync venue details", err);
        return null;
    }
}

export default async function VenueDetailsPage({ params }) {
    // Await the params to resolve Next 14 expectations
    const resolvedParams = await params;
    const venue = await getVenue(resolvedParams.id);

    if (!venue) {
        notFound();
    }

    // Derived metrics
    const avgRating = venue.reviews.length > 0
        ? (Math.round((venue.reviews.reduce((acc, curr) => acc + curr.rating, 0) / venue.reviews.length) * 10) / 10).toFixed(1)
        : '4.5'; // Mock fallback for UX if null

    const totalReviews = venue._count.reviews || 0;
    const startingPrice = venue.courts.length > 0 ? Math.min(...venue.courts.map(c => c.pricePerHour)) : null;

    // Unique sport types list
    const sportsList = [...new Set(venue.courts.map(c => c.sportType))];

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-32">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs (Mocked pathing) */}
                <div className="flex items-center text-sm font-medium text-slate-500 mb-6 gap-2">
                    <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/venues" className="hover:text-green-600 transition-colors">Venues</Link>
                    <span>/</span>
                    <span className="text-slate-900 truncate max-w-[200px]">{venue.name}</span>
                </div>

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{venue.name}</h1>
                            {venue.status === 'APPROVED' && (
                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1.5 text-sm font-bold">
                                    <ShieldCheck className="w-4 h-4" /> Verified
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-400" />
                                {venue.address}, {venue.city}, {venue.state}
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-slate-900 font-bold">{avgRating}</span>
                                <span className="text-slate-400">({totalReviews} reviews)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start">
                        <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-all shadow-sm">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 hover:text-green-600 hover:bg-green-50 border border-slate-200 transition-all shadow-sm">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Gallery Area */}
                <div className="mb-12">
                    <VenueGallery photos={venue.photos} name={venue.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* About Section */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">About this facility</h2>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                {venue.description || "No description provided for this venue yet. But it's great!"}
                            </p>
                        </section>

                        {/* Sports Available */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Sports</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {sportsList.map((sport) => {
                                    const count = venue.courts.filter(c => c.sportType === sport).length;
                                    return (
                                        <div key={sport} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-green-300 hover:shadow-md transition-all">
                                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                                                🎾 {/* Generic icon fallback */}
                                            </div>
                                            <span className="font-semibold text-slate-800">{sport.replace('_', ' ')}</span>
                                            <span className="text-xs text-slate-500 mt-1">
                                                {count} Court{count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Amenities Grid */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Amenities & Features</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                {venue.amenities.map(({ amenity }) => (
                                    <div key={amenity.id} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                            <div className="text-lg" style={{ fontFamily: '"Apple Color Emoji"' }}>{amenity.icon || '✨'}</div>
                                        </div>
                                        {amenity.name}
                                    </div>
                                ))}
                                {venue.amenities.length === 0 && <p className="text-slate-500 italic col-span-2">No amenities listed.</p>}
                            </div>
                        </section>

                        {/* Available Courts Section */}
                        <section className="pt-8 mt-8 border-t border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Book a Court</h2>
                                    <p className="text-slate-500">Select a court to check availability and book</p>
                                </div>
                            </div>
                            <CourtSelector 
                                courts={venue.courts} 
                                venueId={venue.id} 
                                venueName={venue.name} 
                            />
                        </section>

                        {/* Reviews Section */}
                        <section className="pt-8 mt-8 border-t border-slate-100">
                            <VenueReviews
                                venueId={venue.id}
                                initialStats={{ total: totalReviews, averageRating: parseFloat(avgRating), distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }}
                            />
                        </section>

                    </div>

                    {/* Sidebar Booking Widget */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl sticky top-32">
                            <div className="mb-6 pb-6 border-b border-slate-100">
                                <p className="text-slate-500 font-medium mb-1 uppercase tracking-wider text-sm">Starting From</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-extrabold text-slate-900">
                                        {startingPrice ? formatCurrency(startingPrice) : 'N/A'}
                                    </span>
                                    <span className="text-slate-500 text-lg mb-1">/ hour</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    <span className="font-medium">Open 6:00 AM - 11:00 PM</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                    <span className="font-medium">{venue.owner?.phone || '+91 99999 00000'}</span>
                                </div>
                            </div>

                            <Button size="lg" fullWidth className="text-lg py-6 shadow-green-500/20 shadow-lg">
                                Check Availability Hub
                            </Button>
                            <p className="text-center text-slate-400 text-sm mt-4">You won&apos;t be charged yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}