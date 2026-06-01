import { Icon } from '@/components/ui/Icon';

export const metadata = {
    title: 'About | QuickCourt',
    description: 'QuickCourt started as a frustration. Three friends, four cities, one shared spreadsheet. We built the platform we wanted to use.',
};

const STATS = [
    { n: '10,247', l: 'Matches played this week' },
    { n: '500+', l: 'Premium venues onboarded' },
    { n: '50', l: 'Cities live across India' },
    { n: '₹3.2 Cr', l: 'Paid out to owners (2025)' },
];

const VALUES = [
    { n: '01', t: 'Honest pricing.', b: 'What you see is what you pay. No surge, no hidden fees. Razorpay handles the rails.' },
    { n: '02', t: 'Owners are partners.', b: "They keep 92% of every booking. We don't skim, we don't hide. The dashboard shows everything." },
    { n: '03', t: 'Real availability, in real time.', b: 'SSE-backed slot updates. If you see it open, it’s open. We never double-book.' },
    { n: '04', t: 'Players are not data.', b: 'No selling, no third-party trackers. Your match history is yours.' },
];

const TEAM = [
    { n: 'Vikram Mehta', r: 'Co-founder, CEO', s: 'Played district-level cricket. Built two startups before this.' },
    { n: 'Anika Roy', r: 'Co-founder, CTO', s: 'Ex-staff engineer. Plays Sunday badminton at Smash Arena.' },
    { n: 'Joel Ferreira', r: 'Head of Design', s: 'Designed for Razorpay. Now picks the green for our buttons.' },
    { n: 'Sneha Iyer', r: 'Head of Owners', s: 'Onboarded 320 of our 500 venues. Knows them all by name.' },
];

const CONTACTS = [
    { i: 'mail', l: 'hello@quickcourt.in', s: 'General' },
    { i: 'storefront', l: 'partners@quickcourt.in', s: 'For owners' },
    { i: 'support_agent', l: '+91 80 4567 8901', s: '9 AM – 9 PM IST' },
];

/**
 * About Page
 * Static marketing page: story, stats, values, team, and contact CTA.
 */
export default function AboutPage() {
    return (
        <div className="page-enter bg-surface text-on-surface min-h-screen pt-20">
            {/* Hero */}
            <section className="container-x" style={{ padding: '96px 24px 64px', maxWidth: 920 }}>
                <div className="eyebrow" style={{ marginBottom: 18 }}>Our story</div>
                <h1 className="font-display" style={{ fontSize: 'clamp(48px, 6vw, 88px)', margin: 0, lineHeight: 1.02, letterSpacing: '-0.03em' }}>
                    We&apos;re tired of <span className="text-primary" style={{ fontStyle: 'italic', fontWeight: 500 }}>calling venues</span> at 6 AM to see if a court is free.
                </h1>
                <p className="text-on-surface-variant" style={{ fontSize: 19, lineHeight: 1.55, maxWidth: 680, marginTop: 28 }}>
                    QuickCourt started as a frustration. Three friends, four cities, one shared spreadsheet of &ldquo;which venue answers their phone.&rdquo;
                    We built the platform we wanted to use &mdash; and along the way, helped 500+ owners triple their occupancy.
                </p>
            </section>

            {/* Photo strip */}
            <section style={{ padding: '0 0 64px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                    {[
                        { label: 'Badminton', mt: 0 },
                        { label: 'Basketball', mt: 32 },
                        { label: 'Turf', mt: 0 },
                        { label: 'Tennis', mt: 32 },
                    ].map((p) => (
                        <div key={p.label} className="court-tile photo-ph" style={{ aspectRatio: '4/5', marginTop: p.mt }}>
                            {p.label}
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats row */}
            <section className="container-x" style={{ padding: '32px 24px 96px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, padding: '48px 0', borderTop: '1px solid var(--outline-variant)', borderBottom: '1px solid var(--outline-variant)' }}>
                    {STATS.map((s) => (
                        <div key={s.l}>
                            <div className="font-display text-primary" style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 600, letterSpacing: '-0.025em' }}>{s.n}</div>
                            <div className="font-mono text-on-surface-variant" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 8 }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Values */}
            <section className="container-x" style={{ padding: '0 24px 96px' }}>
                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]" style={{ gap: 64 }}>
                    <div>
                        <div className="eyebrow" style={{ marginBottom: 14 }}>What we believe</div>
                        <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: 0, letterSpacing: '-0.025em' }}>
                            Sport is the original social network.
                        </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        {VALUES.map((v) => (
                            <div key={v.n} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 20, alignItems: 'flex-start', paddingBottom: 28, borderBottom: '1px solid var(--outline-variant)' }}>
                                <div className="font-mono text-primary" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.1em' }}>{v.n}</div>
                                <div>
                                    <h3 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.015em' }}>{v.t}</h3>
                                    <p className="text-on-surface-variant" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>{v.b}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section style={{ background: 'var(--surface-container-low)', padding: '96px 0' }}>
                <div className="container-x" style={{ padding: '0 24px' }}>
                    <div className="eyebrow" style={{ marginBottom: 14 }}>The team</div>
                    <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: 0, letterSpacing: '-0.025em' }}>Built by players, for players.</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginTop: 48 }}>
                        {TEAM.map((p) => (
                            <div key={p.n} className="card" style={{ padding: 22 }}>
                                <div className="font-display text-primary" style={{ width: '100%', aspectRatio: '1', borderRadius: 14, background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontWeight: 600, marginBottom: 16 }}>
                                    {p.n.split(' ').map(w => w[0]).join('')}
                                </div>
                                <div className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>{p.n}</div>
                                <div className="font-mono text-primary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{p.r}</div>
                                <p className="text-on-surface-variant" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 10, marginBottom: 0 }}>{p.s}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact strip */}
            <section className="container-x" style={{ padding: '96px 24px' }}>
                <div className="card grid grid-cols-1 md:grid-cols-[1.4fr_1fr]" style={{ padding: '48px 56px', background: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)', borderColor: 'transparent', gap: 48, alignItems: 'center' }}>
                    <div>
                        <div className="eyebrow" style={{ color: 'var(--primary-fixed)', marginBottom: 14 }}>Get in touch</div>
                        <h3 className="font-display" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                            Have a venue, an idea, or a complaint? <span style={{ color: 'var(--primary-fixed)', fontStyle: 'italic' }}>Tell us.</span>
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {CONTACTS.map((c) => (
                            <a key={c.l} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, background: 'color-mix(in oklab, var(--inverse-on-surface) 8%, transparent)', color: 'var(--inverse-on-surface)', textDecoration: 'none', cursor: 'pointer' }}>
                                <Icon name={c.i} size={20} style={{ color: 'var(--primary-fixed)' }} />
                                <div>
                                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 600 }}>{c.l}</div>
                                    <div style={{ fontSize: 12, color: 'color-mix(in oklab, var(--inverse-on-surface) 60%, transparent)' }}>{c.s}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
