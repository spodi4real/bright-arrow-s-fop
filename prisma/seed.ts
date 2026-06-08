import { PrismaClient, Role, ContractorName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BrightArrow database...');

  // Clear existing users (cascades to sessions, memberships, etc.)
  await prisma.user.deleteMany();

  const users: Array<{ username: string; password: string; role: Role; displayName: string }> = [
    { username: 'majed',   password: 'admin',  role: 'admin',      displayName: 'Majed'   },
    { username: 'ali',     password: '123123', role: 'engineer',   displayName: 'Ali'     },
    { username: 'jbore',   password: 'asdasd', role: 'engineer',   displayName: 'Jbore'   },
    { username: 'khiamy',  password: 'mk123',  role: 'supervisor', displayName: 'Khiamy'  },
    { username: 'awny',    password: 'asd123', role: 'iskra',      displayName: 'Awny'    },
    { username: 'karim',   password: 'asd123', role: 'iskra',      displayName: 'Karim'   },
    { username: 'saaed',   password: 'asd123', role: 'iskra',      displayName: 'Saaed'   },
    { username: 'zendar',  password: 'zd123',  role: 'accountant', displayName: 'Zendar'  },
    { username: 'muhanad', password: 'md123',  role: 'engineer',   displayName: 'Muhanad' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: {
        username: u.username,
        displayName: u.displayName,
        passwordHash: hash,
        role: u.role,
      },
    });
    console.log(`  user: ${u.username} (${u.role})`);
  }

  const contractors: Array<{ name: ContractorName; displayName: string }> = [
    { name: 'bim',       displayName: 'BIM'       },
    { name: 'broadcast', displayName: 'Broadcast' },
    { name: 'shandez',   displayName: 'Shandez'   },
  ];
  for (const c of contractors) {
    await prisma.contractor.upsert({
      where: { name: c.name },
      update: { displayName: c.displayName },
      create: { name: c.name, displayName: c.displayName },
    });
    console.log(`  contractor: ${c.displayName}`);
  }

  const defaultRate = String(Number(process.env.DEFAULT_EXCHANGE_RATE || 1500));
  await prisma.setting.upsert({
    where: { key: 'iqd_per_usd' },
    update: {},
    create: { key: 'iqd_per_usd', value: defaultRate },
  });
  console.log(`  setting: iqd_per_usd = ${defaultRate}`);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
