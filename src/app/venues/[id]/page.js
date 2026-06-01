import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Icon } from '@/components/ui/Icon';
import { VenueGallery } from '@/components/venues/VenueGallery';
import { VenueReviews } from '@/components/venues/VenueReviews';
import { VenueMap } from '@/components/venues/VenueMap';
import { SimilarVenues } from '@/components/venues/SimilarVenues';
import { CourtSelector } from '@/components/booking/CourtSelector';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

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
          include: { user: { select: { name: true } } },
        },
        _count: { select: { reviews: true } },
      },
    });
    return venue;
  } catch (err) {
    console.error('Failed to fetch venue details', err);
    return null;
  }
}

const AMENITY_ICON = {
  'Locker Rooms': 'shower',
  'Locker Room': 'shower',
  Showers: 'shower',
  Parking: 'local_parking',
  'Free Parking': 'local_parking',
  WiFi: 'wifi',
  'Water Stations': 'water_drop',
  Water: 'water_drop',
  Floodlights: 'lightbulb',
  Lights: 'lightbulb',
  AC: 'ac_unit',
  'Air Conditioning': 'ac_unit',
  'Climate Control': 'ac_unit',
  Scoreboard: 'sports_score',
  'Equipment Rental': 'sports',
};
const iconForAmenity = (name) => AMENITY_ICON[name] || 'check_circle';

export default async function VenueDetailsPage({ params }) {
  const resolvedParams = await params;
  const venue = await getVenue(resolvedParams.id);

  if (!venue) notFound();

  const avgRating =
    venue.reviews.length > 0
      ? (Math.round((venue.reviews.reduce((acc, c) => acc + c.rating, 0) / venue.reviews.length) * 10) / 10).toFixed(1)
      : '4.5';

  const totalReviews = venue._count.reviews || 0;
  const startingPrice = venue.courts.length > 0 ? Math.min(...venue.courts.map((c) => c.pricePerHour)) : null;
  const sportsList = [...new Set(venue.courts.map((c) => c.sportType))];

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <main className="flex-grow w-full max-w-7xl mx-auto px-container-margin py-8">
        {/* Breadcrumbs + actions */}
        <div className="flex justify-between items-center mb-6">
          <nav className="flex items-center gap-2 text-on-surface-variant text-sm">
            <Link href="/" className="hover:text-primary">Home</Link>
            <Icon name="chevron_right" size={16} />
            <Link href="/venues" className="hover:text-primary">Venues</Link>
            <Icon name="chevron_right" size={16} />
            <span className="text-on-surface font-medium truncate max-w-[260px]">{venue.name}</span>
          </nav>
          <div className="flex gap-3">
            <button
              aria-label="Share"
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors flex items-center justify-center border border-outline-variant"
            >
              <Icon name="share" size={20} />
            </button>
            <FavoriteButton
              venueId={venue.id}
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors flex items-center justify-center border border-outline-variant"
            />
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-section-gap rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <VenueGallery photos={venue.photos} name={venue.name} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Header info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="font-display text-on-surface" style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                      {venue.name}
                    </h1>
                    {venue.status === 'APPROVED' && (
                      <Icon name="verified" filled className="text-primary" size={28} />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-on-surface-variant text-sm">
                    <div className="flex items-center gap-1">
                      <Icon name="star" filled className="text-secondary" size={18} />
                      <span className="font-medium text-on-surface">{avgRating}</span>
                      <span>({totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="location_on" size={18} />
                      <span>
                        {venue.address}, {venue.city}, {venue.state}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Sport tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {sportsList.map((s) => (
                  <span key={s} className="pill neutral" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit' }}>
                    {s.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* About */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-on-surface mb-4">About the Venue</h2>
              <p className="text-on-surface-variant leading-relaxed">
                {venue.description || 'No description provided for this venue yet.'}
              </p>
            </section>

            {/* Amenities */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-on-surface mb-4">Amenities</h2>
              {venue.amenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.amenities.map(({ amenity }) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-3 p-4 rounded-lg bg-primary-container/15 text-on-primary-fixed-variant border border-primary-fixed/40"
                    >
                      <Icon name={iconForAmenity(amenity.name)} />
                      <span className="text-sm font-medium">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant italic">No amenities listed.</p>
              )}
            </section>

            {/* Location map */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-on-surface mb-4">Location</h2>
              <div className="rounded-xl overflow-hidden border border-outline-variant">
                <VenueMap
                  address={venue.address}
                  city={venue.city}
                  state={venue.state}
                  latitude={venue.latitude}
                  longitude={venue.longitude}
                  venueName={venue.name}
                />
              </div>
            </section>

            {/* Courts */}
            <section className="pt-8 border-t border-outline-variant">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
                  <Icon name="calendar_today" className="text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-on-surface">Book a Court</h2>
                  <p className="text-on-surface-variant">Select a court to check availability and book</p>
                </div>
              </div>
              <CourtSelector courts={venue.courts} venueId={venue.id} venueName={venue.name} />
            </section>

            {/* Reviews */}
            <section className="pt-8 border-t border-outline-variant">
              <VenueReviews
                venueId={venue.id}
                initialStats={{
                  total: totalReviews,
                  averageRating: parseFloat(avgRating),
                  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                }}
              />
            </section>

            <SimilarVenues venueId={venue.id} limit={4} />
          </div>

          {/* Sticky booking widget */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24 p-6">
              <div className="flex items-end justify-between mb-6 pb-6 border-b border-outline-variant">
                <div>
                  <span className="font-mono text-secondary text-sm uppercase tracking-wider">From</span>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-on-surface" style={{ fontSize: '36px', lineHeight: 1 }}>
                      {startingPrice ? formatCurrency(startingPrice) : '—'}
                    </span>
                  </div>
                  <span className="text-sm text-on-surface-variant">/ hour</span>
                </div>
                <div className="flex items-center gap-2 bg-primary-container px-3 py-1 rounded-full">
                  <span className="live-dot" />
                  <span className="text-xs font-medium text-on-primary-container">Live Availability</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-on-surface">
                  <Icon name="schedule" className="text-on-surface-variant" />
                  <span className="font-medium text-sm">Open 6:00 AM – 11:00 PM</span>
                </div>
                {venue.owner?.phone && (
                  <div className="flex items-center gap-3 text-on-surface">
                    <Icon name="phone" className="text-on-surface-variant" />
                    <span className="font-medium text-sm">{venue.owner.phone}</span>
                  </div>
                )}
              </div>

              {venue.courts.length > 0 && (
                <Link href={`/booking/${venue.courts[0].id}`} className="btn btn-cta btn-lg w-full group">
                  Book Now
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <p className="text-center text-sm text-on-surface-variant mt-4">You won&apos;t be charged yet</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
