import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

/**
 * POST /api/notifications/subscribe
 * Save push notification subscription for a user
 */
export async function POST(request) {
    try {
        const authResult = await verifyAuth(request);
        
        if (!authResult.success) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { subscription } = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ success: false, message: 'Invalid subscription' }, { status: 400 });
        }

        // Store subscription in user preferences
        await prisma.user.update({
            where: { id: authResult.user.id },
            data: {
                preferences: {
                    ...(authResult.user.preferences || {}),
                    pushSubscription: subscription,
                    pushEnabled: true
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Subscription saved successfully' 
        });

    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json({ success: false, message: 'Failed to save subscription' }, { status: 500 });
    }
}
