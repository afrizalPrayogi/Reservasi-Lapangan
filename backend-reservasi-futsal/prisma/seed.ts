import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    console.log('Seeding Admin Roles...');
    const superAdminRole = await prisma.adminRole.upsert({
      where: { name: 'Super Admin' },
      update: {},
      create: {
        id: 'super-admin-role-id',
        name: 'Super Admin',
        description: 'Super Administrator GOR Tambora',
      },
    });
    console.log('Admin Role created:', superAdminRole.name);

    console.log('Seeding Admin User...');
    const adminEmail = 'admin@gortambora.com';
    const adminPassword = await bcrypt.hash('Qwerty2024$', 10);
    const adminUser = await prisma.admin.upsert({
      where: { email: adminEmail },
      update: { password: adminPassword },
      create: {
        id: 'super-admin-id',
        name: 'Admin GOR Tambora',
        email: adminEmail,
        password: adminPassword,
        roleId: superAdminRole.id,
      },
    });
    console.log('Admin User created:', adminUser.email);

    console.log('Seeding Customer...');
    const customerEmail = 'afrizalprayogi7@gmail.com';
    const customerPassword = await bcrypt.hash('Qwerty2024$', 10);
    const customerUser = await prisma.customer.upsert({
      where: { email: customerEmail },
      update: { password: customerPassword },
      create: {
        id: 'customer-id',
        name: 'Afrizal Prayogi',
        email: customerEmail,
        password: customerPassword,
        phone: '081234567890',
      },
    });
    console.log('Customer created:', customerUser.email);

    console.log('Seeding Default Badminton Court...');
    // Check if field already exists
    const existingField = await prisma.field.findFirst({
      where: { name: 'Lapangan Badminton A' }
    });

    if (!existingField) {
      const field = await prisma.field.create({
        data: {
          id: '882794db-9a84-48e0-a92c-0be96ff48c08',
          name: 'Lapangan Badminton A',
          type: 'VINYL',
          isActive: true,
          lengthMeter: 13.4,
          widthMeter: 6.1,
          prices: {
            create: [
              { dayType: 'WEEKDAY', startHour: 0, endHour: 24, price: 150000 },
              { dayType: 'WEEKEND', startHour: 0, endHour: 24, price: 150000 }
            ]
          },
          openingHours: {
            create: [
              { dayType: 'WEEKDAY', startHour: 6, endHour: 24 },
              { dayType: 'WEEKEND', startHour: 6, endHour: 24 }
            ]
          }
        }
      });
      console.log('Badminton Court created:', field.name);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
