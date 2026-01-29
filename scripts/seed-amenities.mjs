import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const amenities = [
  { name: 'Parking', icon: '🅿️' },
  { name: 'Changing Rooms', icon: '🚿' },
  { name: 'Washrooms', icon: '🚻' },
  { name: 'Drinking Water', icon: '💧' },
  { name: 'First Aid', icon: '🩹' },
  { name: 'Cafeteria', icon: '☕' },
  { name: 'WiFi', icon: '📶' },
  { name: 'AC', icon: '❄️' },
  { name: 'Lighting', icon: '💡' },
  { name: 'Seating Area', icon: '🪑' },
  { name: 'Lockers', icon: '🔐' },
  { name: 'Equipment Rental', icon: '🎾' },
  { name: 'Coaching Available', icon: '👨‍🏫' },
  { name: 'Pro Shop', icon: '🛒' },
  { name: 'Wheelchair Accessible', icon: '♿' },
  { name: 'Security', icon: '🔒' },
  { name: 'CCTV', icon: '📹' },
  { name: 'Spectator Seating', icon: '🏟️' },
];

async function seedAmenities() {
  console.log('🌱 Seeding amenities...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const amenity of amenities) {
    try {
      const existing = await prisma.amenity.findUnique({
        where: { name: amenity.name }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping "${amenity.name}" (already exists)`);
        skipped++;
      } else {
        await prisma.amenity.create({
          data: amenity
        });
        console.log(`✅ Created "${amenity.name}" ${amenity.icon}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error creating "${amenity.name}":`, error.message);
    }
  }
  
  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
  console.log('✨ Amenities seeding complete!');
}

seedAmenities()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
