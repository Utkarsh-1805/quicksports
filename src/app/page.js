import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { HeroSearch } from '@/components/landing/HeroSearch';
import { Icon } from '@/components/ui/Icon';

export const revalidate = 60;

// Drop a 1920x1080 hero image at public/hero/landing-hero.jpg (see public/hero/README.md)
const HERO_IMAGE = '/hero/landing-hero.jpg';

const SPORT_META = {
  BADMINTON: { name: 'Badminton', icon: '🏸' },
  TENNIS: { name: 'Tennis', icon: '🎾' },
  BASKETBALL: { name: 'Basketball', icon: '🏀' },
  FOOTBALL: { name: 'Football', icon: '⚽' },
  CRICKET: { name: 'Cricket', icon: '🏏' },
  SWIMMING: { name: 'Swimming', icon: '🏊' },
  TABLE_TENNIS: { name: 'Table Tennis', icon: '🏓' },
  VOLLEYBALL: { name: 'Volleyball', icon: '🏐' },
};

const formatStat = (value, fallback) => {
  const n = Math.max(value || 0, fallback);
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return `${n}+`;
};

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default async function Home() {
  let stats = { totalVenues: 0, totalBookings: 0, totalCities: 0 };
  let popularSports = [];
  let featuredVenues = [];

  try {
    const [totalVenues, totalBookings, cityRows, sportGroups, venues] = await Promise.all([
      prisma.facility.count({ where: { status: 'APPROVED' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.facility.findMany({ where: { status: 'APPROVED' }, select: { city: true }, distinct: ['city'] }),
      prisma.court.groupBy({
        by: ['sportType'],
        where: { isActive: true, facility: { status: 'APPROVED' } },
        _count: { sportType: true },
        orderBy: { _count: { sportType: 'desc' } },
        take: 6,
      }),
      prisma.facility.findMany({
        where: { status: 'APPROVED' },
        take: 4,
        orderBy: [{ courts: { _count: 'desc' } }, { createdAt: 'desc' }],
        include: {
          photos: { take: 1, select: { url: true } },
          courts: { where: { isActive: true }, select: { sportType: true, pricePerHour: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ]);

    stats = { totalVenues, totalBookings, totalCities: cityRows.filter((r) => r.city).length };
    popularSports = sportGroups.map((g) => ({
      key: g.sportType,
      ...(SPORT_META[g.sportType] || { name: g.sportType, icon: '🏟️' }),
      count: g._count.sportType,
    }));
    featuredVenues = venues.map((v) => {
      const prices = v.courts.map((c) => c.pricePerHour);
      const ratings = v.reviews.map((r) => r.rating);
      const sports = [...new Set(v.courts.map((c) => SPORT_META[c.sportType]?.name || c.sportType))];
      return {
        id: v.id,
        name: v.name,
        city: v.city,
        cover: v.photos[0]?.url || null,
        startingPrice: prices.length ? Math.min(...prices) : null,
        rating: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null,
        sports: sports.slice(0, 3),
      };
    });
  } catch (err) {
    console.error('Error fetching home page data:', err);
  }

  return (
    <div className="page-enter">
      {/* ============ HERO ============ */}
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: 'calc(100vh - 72px)' }}>
        <div className="absolute inset-0 z-0">
          <img
            alt="Badminton player mid-smash in a professional indoor stadium"
            className="w-full h-full object-cover"
            src={HERO_IMAGE}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,20,16,0.55) 0%, rgba(15,20,16,0.35) 35%, rgba(15,20,16,0.78) 100%)',
            }}
          />
        </div>

        <div className="container-x relative z-[2] text-white" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="eyebrow anim-fade" style={{ color: '#7ffc97', marginBottom: 18 }}>
            ◍ Book in under 60 seconds
          </div>
          <h1
            className="font-display anim-slide-up"
            style={{ fontSize: 'clamp(48px, 8vw, 104px)', fontWeight: 600, margin: 0, maxWidth: 920, lineHeight: 0.98, letterSpacing: '-0.035em', color: '#fff' }}
          >
            Own the court.
            <br />
            <span style={{ color: '#7ffc97', fontStyle: 'italic', fontWeight: 500 }}>Faster.</span>
          </h1>
          <p
            className="anim-slide-up"
            style={{ fontSize: 'clamp(16px, 1.4vw, 19px)', maxWidth: 560, marginTop: 24, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)', animationDelay: '.05s' }}
          >
            Discover premium sports venues near you, see real-time availability, and join open matches with
            players at your level — all in one place.
          </p>

          <div className="anim-slide-up mt-10" style={{ animationDelay: '.1s' }}>
            <HeroSearch />
          </div>

          {/* Stats strip */}
          <div className="grid gap-8 mt-16 max-w-3xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {[
              { n: formatStat(stats.totalBookings, 10000), l: 'Matches played' },
              { n: formatStat(stats.totalVenues, 500), l: 'Premium venues' },
              { n: formatStat(stats.totalCities, 50), l: 'Cities live' },
              { n: '4.8★', l: 'Avg rating' },
            ].map((s) => (
              <div key={s.l} style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20 }}>
                <div className="font-display" style={{ fontSize: 38, fontWeight: 600, color: '#7ffc97', lineHeight: 1 }}>
                  {s.n}
                </div>
                <div className="font-mono" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="stripe-divider" />

      {/* ============ POPULAR SPORTS ============ */}
      {popularSports.length > 0 && (
        <section className="container-x" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div className="flex items-end justify-between flex-wrap gap-5 mb-9">
            <div>
              <div className="eyebrow mb-3">What&apos;s open right now</div>
              <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', margin: 0, maxWidth: 640 }}>
                Pick a sport, take the court.
              </h2>
            </div>
            <Link href="/venues" className="text-primary font-semibold inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
              Browse all venues <Icon name="arrow_forward" size={16} />
            </Link>
          </div>

          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {popularSports.map((s) => (
              <Link
                key={s.key}
                href={`/venues?sportType=${s.key}`}
                className="card card-hover group relative flex flex-col justify-between overflow-hidden"
                style={{ padding: 22, aspectRatio: '1 / 1.05' }}
              >
                <div style={{ fontSize: 40, lineHeight: 1 }}>{s.icon}</div>
                <div>
                  <div className="font-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {s.name}
                  </div>
                  <div className="font-mono text-on-surface-variant" style={{ fontSize: 12, marginTop: 6 }}>
                    {s.count} {s.count === 1 ? 'court' : 'courts'}
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <Icon name="arrow_outward" size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ FEATURED VENUES ============ */}
      {featuredVenues.length > 0 && (
        <section style={{ background: 'var(--surface-container-low)', paddingTop: 96, paddingBottom: 96 }}>
          <div className="container-x">
            <div className="flex items-end justify-between flex-wrap gap-5 mb-9">
              <div>
                <div className="eyebrow mb-3">Featured this week</div>
                <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', margin: 0 }}>
                  Top-rated venues near you.
                </h2>
              </div>
              <Link href="/venues" className="btn btn-outline btn-sm">
                View all <Icon name="arrow_forward" size={16} />
              </Link>
            </div>

            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {featuredVenues.map((v) => (
                <Link key={v.id} href={`/venues/${v.id}`} className="card card-hover overflow-hidden flex flex-col">
                  <div className="relative" style={{ aspectRatio: '16 / 11' }}>
                    {v.cover ? (
                      <img src={v.cover} alt={v.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="court-tile w-full h-full" />
                    )}
                    {v.rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-lowest text-xs font-semibold">
                        <Icon name="star" filled size={14} className="text-secondary-container" />
                        <span className="font-mono">{v.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-[18px] flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display truncate" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
                          {v.name}
                        </div>
                        <div className="flex items-center gap-1 text-on-surface-variant text-sm mt-1">
                          <Icon name="location_on" size={14} />
                          <span>{v.city}</span>
                        </div>
                      </div>
                      {v.startingPrice != null && (
                        <div className="text-right shrink-0">
                          <div className="font-mono font-semibold" style={{ fontSize: 18 }}>
                            {formatCurrency(v.startingPrice)}
                          </div>
                          <div className="font-mono text-on-surface-variant" style={{ fontSize: 11, marginTop: 2 }}>
                            /hr
                          </div>
                        </div>
                      )}
                    </div>
                    {v.sports.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {v.sports.map((s) => (
                          <span key={s} className="pill neutral" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', fontSize: 11 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ HOW IT WORKS ============ */}
      <section className="container-x" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <div className="text-center mb-16">
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="font-display mx-auto" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, maxWidth: 720 }}>
            Three taps. You&apos;re on the court.
          </h2>
        </div>
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {[
            { n: '01', icon: 'travel_explore', title: 'Find your court', body: 'Filter by sport, distance, price and amenities. See live availability before you book.' },
            { n: '02', icon: 'event_available', title: 'Lock your slot', body: 'Pick the hour, pay with Razorpay, and your court is yours. No phone calls, no waiting.' },
            { n: '03', icon: 'groups', title: 'Open it to others', body: 'Need a fourth for doubles? Open the booking to other players and fill the court together.' },
          ].map((step) => (
            <div key={step.n} className="relative">
              <div className="font-mono mb-5" style={{ fontSize: 12, letterSpacing: '0.2em', color: 'var(--primary)', fontWeight: 600 }}>
                {step.n}
              </div>
              <div className="mb-5 flex items-center justify-center rounded-2xl bg-primary-container text-on-primary-container" style={{ width: 56, height: 56 }}>
                <Icon name={step.icon} size={28} />
              </div>
              <div className="font-display mb-2.5" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {step.title}
              </div>
              <p className="text-muted m-0" style={{ fontSize: 15, lineHeight: 1.6 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ OWNER CTA ============ */}
      <section style={{ padding: '0 24px 96px' }}>
        <div className="container-x" style={{ padding: 0 }}>
          <div
            className="relative overflow-hidden grid items-center gap-12"
            style={{ borderRadius: 28, padding: '64px 56px', background: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)' }}
          >
            <div>
              <div className="eyebrow mb-3.5" style={{ color: '#7ffc97' }}>For facility owners</div>
              <h3 className="font-display" style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', margin: 0, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                Your courts are sitting empty.
                <br />
                <span style={{ color: '#7ffc97', fontStyle: 'italic' }}>Let&apos;s fix that.</span>
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', maxWidth: 520, marginTop: 18 }}>
                Onboard in 24 hours. Manage pricing, photos and maintenance windows in one dashboard. We handle
                payments, refunds, and players.
              </p>
              <div className="flex gap-3 flex-wrap" style={{ marginTop: 28 }}>
                <Link href="/auth/register" className="btn btn-cta btn-lg">
                  List your venue <Icon name="arrow_forward" size={16} />
                </Link>
                <Link href="/about" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', background: 'transparent' }}>
                  Learn more
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-6" style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 40 }}>
              {[
                { k: 'Avg occupancy gain', v: '+47%' },
                { k: 'Days to go live', v: '< 1' },
                { k: 'Owner satisfaction', v: '4.9 ★' },
              ].map((s) => (
                <div key={s.k} className="flex items-baseline justify-between gap-4">
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{s.k}</span>
                  <span className="font-display" style={{ fontSize: 32, fontWeight: 600, color: '#fff' }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
