import { prisma } from '../src/lib/prisma.js';

async function generateTimeSlots() {
  try {
    console.log('🕐 Generating time slots for courts...');

    // Get all active courts
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        openingTime: true,
        closingTime: true,
        facility: {
          select: {
            name: true
          }
        }
      }
    });

    if (courts.length === 0) {
      console.log('❌ No active courts found. Create some courts first!');
      return;
    }

    console.log(`📍 Found ${courts.length} courts:`);
    courts.forEach(court => {
      console.log(`  - ${court.facility.name} > ${court.name} (${court.openingTime} - ${court.closingTime})`);
    });

    // Generate slots for today and tomorrow
    const dates = [
      new Date('2026-01-28'), // Today
      new Date('2026-01-29'), // Tomorrow
    ];

    let totalSlots = 0;

    for (const court of courts) {
      for (const date of dates) {
        const slots = generateDailySlots(court, date);
        
        // Insert slots for this court and date
        for (const slot of slots) {
          try {
            await prisma.timeSlot.create({
              data: {
                courtId: court.id,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBlocked: false
              }
            });
            totalSlots++;
          } catch (error) {
            // Skip if slot already exists (unique constraint)
            if (!error.message.includes('Unique constraint')) {
              console.log(`⚠️ Error creating slot: ${error.message}`);
            }
          }
        }
      }
    }

    console.log(`✅ Generated ${totalSlots} time slots successfully!`);
    
    // Show sample slots
    const sampleSlots = await prisma.timeSlot.findMany({
      take: 5,
      include: {
        court: {
          select: {
            name: true,
            facility: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    console.log('\n📅 Sample time slots created:');
    sampleSlots.forEach(slot => {
      const dateStr = slot.date.toISOString().split('T')[0];
      console.log(`  ${dateStr} ${slot.startTime}-${slot.endTime} | ${slot.court.facility.name} > ${slot.court.name}`);
    });

  } catch (error) {
    console.error('❌ Error generating time slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateDailySlots(court, date) {
  const slots = [];
  const [openHour, openMin] = court.openingTime.split(':').map(Number);
  const [closeHour, closeMin] = court.closingTime.split(':').map(Number);
  
  const slotDuration = 60; // 1 hour slots
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    
    // Calculate end time
    let endHour = currentHour;
    let endMin = currentMin + slotDuration;
    
    if (endMin >= 60) {
      endHour++;
      endMin -= 60;
    }
    
    // Don't create slot if it goes beyond closing time
    if (endHour > closeHour || (endHour === closeHour && endMin > closeMin)) {
      break;
    }
    
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    slots.push({
      date: date,
      startTime: startTime,
      endTime: endTime
    });
    
    // Move to next slot
    currentHour = endHour;
    currentMin = endMin;
  }
  
  return slots;
}

// Run the script
generateTimeSlots();