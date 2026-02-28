import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

/**
 * POST /api/notifications/unsubscribe
 * Remove push notification subscription for a user
 */
export async function POST(request) {
    try {
        const authResult = await verifyAuth(request);
        
        if (!authResult.success) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Remove subscription from user preferences
        const currentPrefs = authResult.user.preferences || {};
        delete currentPrefs.pushSubscription;
        currentPrefs.pushEnabled = false;

        await prisma.user.update({
            where: { id: authResult.user.id },
            data: {
                preferences: currentPrefs
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Unsubscribed successfully' 
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json({ success: false, message: 'Failed to unsubscribe' }, { status: 500 });
    }
}
