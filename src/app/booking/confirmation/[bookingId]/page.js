import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BookingConfirmation from '@/components/booking/BookingConfirmation';

export const metadata = {
    title: 'Booking Confirmed | QuickCourt',
    description: 'Your court booking has been confirmed. View your booking details and add to calendar.',
};

/**
 * Fetch booking details with all related data
 */
async function getBookingData(bookingId) {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                court: {
                    include: {
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                address: true,
                                city: true,
                                state: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                payment: true
            }
        });

        return booking;
    } catch (err) {
        console.error('Failed to fetch booking:', err);
        return null;
    }
}

export default async function BookingConfirmationPage({ params }) {
    const resolvedParams = await params;
    const { bookingId } = resolvedParams;

    const booking = await getBookingData(bookingId);

    if (!booking) {
        notFound();
    }

    // Only show confirmed bookings on this page
    if (booking.status !== 'CONFIRMED') {
        notFound();
    }

    // Transform booking data for client
    const bookingData = {
        id: booking.id,
        status: booking.status,
        date: booking.bookingDate.toISOString().split('T')[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        court: {
            id: booking.court.id,
            name: booking.court.name,
            sportType: booking.court.sportType,
            pricePerHour: booking.court.pricePerHour,
            facility: booking.court.facility
        },
        user: booking.user,
        createdAt: booking.createdAt
    };

    const paymentData = booking.payment ? {
        id: booking.payment.id,
        paymentId: booking.payment.razorpayPaymentId,
        amount: booking.payment.totalAmount,
        status: booking.payment.status,
        method: booking.payment.method
    } : null;

    return (
        <BookingConfirmation 
            booking={bookingData}
            payment={paymentData}
        />
    );
}
