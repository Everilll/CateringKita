import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Seeding database...')

    const adminEmail =
      process.env.ADMIN_EMAIL || 'admin@cateringkita.com'
    const adminPassword =
      process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!@#'

    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    await prisma.users.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN',
      },
    })

    console.log('✅ Admin account ready')
    console.log('   Email:', adminEmail)
    console.log(
      '   Password:',
      adminPassword === 'Admin123!@#'
        ? 'Admin123!@# (DEFAULT)'
        : '****** (from .env)',
    )
    console.log('⚠️  Change password after first login')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(() => process.exit(1))
