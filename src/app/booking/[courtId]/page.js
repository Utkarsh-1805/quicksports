import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BookingPage from '@/components/booking/BookingPage';

export const metadata = {
    title: 'Book Court | QuickCourt',
    description: 'Book your sports court in just a few clicks. Select time, confirm details, and pay securely.',
};

/**
 * Fetch court details with facility info
 */
async function getCourtData(courtId) {
    try {
        const court = await prisma.court.findUnique({
            where: { id: courtId },
            include: {
                facility: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        state: true,
                        status: true,
                        owner: {
                            select: {
                                name: true,
                                phone: true
                            }
                        }
                    }
                }
            }
        });

        if (!court || !court.isActive) {
            return null;
        }

        if (court.facility.status !== 'APPROVED') {
            return null;
        }

        return court;
    } catch (err) {
        console.error('Failed to fetch court data:', err);
        return null;
    }
}

export default async function BookingCourtPage({ params }) {
    const resolvedParams = await params;
    const { courtId } = resolvedParams;

    const court = await getCourtData(courtId);

    if (!court) {
        notFound();
    }

    // Transform data for client component
    const courtData = {
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        pricePerHour: court.pricePerHour,
        description: court.description,
        openingTime: court.openingTime || '06:00',
        closingTime: court.closingTime || '22:00'
    };

    const venueData = {
        id: court.facility.id,
        name: court.facility.name,
        address: court.facility.address,
        city: court.facility.city,
        state: court.facility.state
    };

    return (
        <BookingPage
            courtId={courtId}
            courtData={courtData}
            venueData={venueData}
        />
    );
}
