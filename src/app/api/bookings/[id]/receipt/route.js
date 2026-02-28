import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/bookings/[id]/receipt
 * Generate PDF receipt for a booking
 */
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const authResult = await verifyAuth(request);
        
        if (!authResult.success) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true, phone: true } },
                court: {
                    include: {
                        facility: {
                            select: { name: true, address: true, city: true, state: true, pincode: true }
                        }
                    }
                },
                payment: true
            }
        });

        if (!booking) {
            return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
        }

        // Verify ownership
        if (booking.userId !== authResult.user.id && authResult.user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        // Generate PDF content as HTML
        const receiptHTML = generateReceiptHTML(booking);
        
        return new NextResponse(receiptHTML, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="QuickCourt-Receipt-${booking.id}.html"`
            }
        });

    } catch (error) {
        console.error('Receipt generation error:', error);
        return NextResponse.json({ success: false, message: 'Failed to generate receipt' }, { status: 500 });
    }
}

function generateReceiptHTML(booking) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const baseAmount = booking.totalAmount || 0;
    const fees = booking.payment ? (booking.payment.totalAmount - baseAmount) : 0;
    const totalPaid = booking.payment?.totalAmount || baseAmount;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Receipt - ${booking.id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f8fafc; 
            padding: 40px 20px;
            color: #1e293b;
        }
        .receipt { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); 
            color: white; 
            padding: 32px; 
            text-align: center;
        }
        .logo { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .logo span { color: #bbf7d0; }
        .header-subtitle { opacity: 0.9; font-size: 14px; }
        .badge { 
            display: inline-block; 
            background: rgba(255,255,255,0.2); 
            padding: 8px 16px; 
            border-radius: 20px; 
            margin-top: 16px;
            font-weight: 600;
        }
        .content { padding: 32px; }
        .section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px dashed #e2e8f0; }
        .section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .section-title { 
            font-size: 12px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            color: #64748b; 
            margin-bottom: 12px;
            font-weight: 600;
        }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .info-item { }
        .info-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
        .info-value { font-weight: 600; font-size: 15px; }
        .venue-name { font-size: 20px; font-weight: 700; color: #16a34a; margin-bottom: 8px; }
        .address { color: #64748b; line-height: 1.5; }
        .payment-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .payment-row.total { 
            border-top: 2px solid #e2e8f0; 
            margin-top: 12px; 
            padding-top: 12px;
            font-weight: 700;
            font-size: 18px;
        }
        .payment-row.total .amount { color: #16a34a; }
        .footer { 
            background: #f8fafc; 
            padding: 24px 32px; 
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text { font-size: 13px; color: #64748b; margin-bottom: 12px; }
        .qr-placeholder { 
            width: 120px; 
            height: 120px; 
            background: #e2e8f0; 
            margin: 0 auto 16px; 
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            font-size: 12px;
        }
        .print-btn {
            display: inline-block;
            background: #16a34a;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
            border: none;
            margin-top: 16px;
        }
        .print-btn:hover { background: #15803d; }
        @media print { 
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; }
            .print-btn { display: none; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">Quick<span>Court</span></div>
            <div class="header-subtitle">Your Sports Booking Partner</div>
            <div class="badge">✓ Payment Confirmed</div>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">Booking Details</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Booking ID</div>
                        <div class="info-value" style="font-family: monospace;">${booking.id.slice(0, 16)}...</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-value" style="color: #16a34a;">${booking.status}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${formatDate(booking.bookingDate)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Time</div>
                        <div class="info-value">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Court & Venue</div>
                <div class="venue-name">${booking.court.name}</div>
                <div style="margin-bottom: 8px; color: #64748b;">
                    ${booking.court.sportType.replace('_', ' ')} Court
                </div>
                <div class="address">
                    <strong>${booking.court.facility.name}</strong><br>
                    ${booking.court.facility.address}<br>
                    ${booking.court.facility.city}, ${booking.court.facility.state} ${booking.court.facility.pincode || ''}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Customer</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Name</div>
                        <div class="info-value">${booking.user.name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">${booking.user.email}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Payment Summary</div>
                <div class="payment-row">
                    <span>Court Charges (${booking.duration || 60} mins)</span>
                    <span>₹${baseAmount.toLocaleString('en-IN')}</span>
                </div>
                ${fees > 0 ? `
                <div class="payment-row">
                    <span>GST & Convenience Fee</span>
                    <span>₹${fees.toLocaleString('en-IN')}</span>
                </div>
                ` : ''}
                <div class="payment-row total">
                    <span>Total Paid</span>
                    <span class="amount">₹${totalPaid.toLocaleString('en-IN')}</span>
                </div>
                ${booking.payment?.razorpayPaymentId ? `
                <div style="margin-top: 12px; font-size: 12px; color: #64748b;">
                    Payment ID: ${booking.payment.razorpayPaymentId}
                </div>
                ` : ''}
            </div>
        </div>

        <div class="footer">
            <div class="qr-placeholder">Scan at Venue</div>
            <div class="footer-text">
                Show this receipt at the venue for entry.<br>
                Thank you for booking with QuickCourt!
            </div>
            <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
        </div>
    </div>
</body>
</html>
    `.trim();
}
