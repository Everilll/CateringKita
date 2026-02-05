import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========== CREATE ADMIN ONLY ==========
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cateringkita.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!@#';

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create or update admin
  const admin = await prisma.users.upsert({
    where: { email: adminEmail },
    update: {},  // Kalau udah ada, skip (gak di-update)
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin account created:');
  console.log('   Email:', adminEmail);
  console.log('   Password:', adminPassword === 'Admin123!@#' ? 'Admin123!@# (DEFAULT)' : '****** (from .env)');
  console.log('\n⚠️  IMPORTANT: Change password after first login!');
  console.log('   Endpoint: PATCH /auth/change-password\n');

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    console.error('Error details:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });