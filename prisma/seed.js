const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

function generateSlots() {
  const slots = []
  const startHour = 6   // 06:00
  const endHour = 22    // 22:00
  let order = 0

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of [0, 30]) {
      const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      const endMinute = minute + 30
      const endHourVal = endMinute >= 60 ? hour + 1 : hour
      const endMinVal = endMinute >= 60 ? endMinute - 60 : endMinute
      const end = `${String(endHourVal).padStart(2, '0')}:${String(endMinVal).padStart(2, '0')}`
      slots.push({ startTime: start, endTime: end, displayOrder: order++ })
    }
  }
  return slots
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.booking.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.table.deleteMany()
  await prisma.user.deleteMany()
  await prisma.venueSettings.deleteMany()

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin@123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ttbookit.com',
      name: 'Admin',
      phone: '9999999999',
      role: 'ADMIN',
      hashedPassword,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create a demo player
  const playerHash = await bcrypt.hash('player@123', 12)
  await prisma.user.create({
    data: {
      email: 'player@ttbookit.com',
      name: 'Demo Player',
      phone: '8888888888',
      role: 'PLAYER',
      hashedPassword: playerHash,
    },
  })
  console.log('✅ Demo player created: player@ttbookit.com')

  // Create 1 table (office setup)
  const table = await prisma.table.create({
    data: {
      name: 'Table 1',
      locationDescription: 'Office Recreation Area',
      isActive: true,
    },
  })
  console.log('✅ Table created:', table.name)

  // Create time slots: 06:00 – 22:00 in 30-min intervals (32 slots)
  const slotData = generateSlots()
  await prisma.slot.createMany({ data: slotData })
  console.log(`✅ ${slotData.length} time slots created (06:00–22:00, 30-min intervals)`)

  // Create venue settings
  await prisma.venueSettings.create({
    data: {
      openTime: '06:00',
      closeTime: '22:00',
      slotDurationMin: 30,
      maxBookingsPerUserPerDay: 3,
      allowCancellationUntilMinsBefore: 120,
    },
  })
  console.log('✅ Venue settings created')

  console.log('\n🎉 Seed complete!')
  console.log('   Admin: admin@ttbookit.com / admin@123')
  console.log('   Player: player@ttbookit.com / player@123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
