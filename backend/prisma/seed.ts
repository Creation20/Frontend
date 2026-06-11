/**
 * Prisma seed script — creates a demo user with sample data.
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('lexiaid123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@lexiaid.app' },
    update: {},
    create: {
      name: 'Kofi Agyemang',
      username: 'kofi_reads',
      email: 'demo@lexiaid.app',
      passwordHash,
      level: 3,
      xp: 2750,
      points: 2750,
      streak: 7,
      totalReadingTime: 18600,
      wpmHistory: [110, 115, 125, 122, 130, 135, 138],
      comprehensionHistory: [65, 70, 75, 80, 78, 85, 90],
    },
  });

  // Create settings
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'default',
      fontFamily: 'Lexend',
      fontSize: 18,
      lineHeight: 1.8,
      letterSpacing: 0.5,
    },
  });

  // Create sample documents
  const doc1 = await prisma.document.upsert({
    where: { id: 'seed-doc-1' },
    update: {},
    create: {
      id: 'seed-doc-1',
      userId: user.id,
      title: 'Introduction to Cell Biology',
      subject: 'Biology',
      author: 'Prof. Kwame Mensah',
      category: 'lecture',
      coverColor: '#0B6E6E',
      wordCount: 2400,
      pages: 8,
      estimatedReadingTime: 18,
      progress: 42,
      readingTime: 840,
      content: `Cell biology is the study of cell structure and function, and it revolves around the concept that the cell is the fundamental unit of life. The field is closely related to genetics, biochemistry, molecular biology, immunology, and developmental biology.
      
Cells are the smallest units of life and are responsible for carrying out all the essential functions needed for an organism to survive. There are two main types of cells: prokaryotic cells, which do not have a membrane-bound nucleus, and eukaryotic cells, which do.

The cell membrane, also called the plasma membrane, is a thin semi-permeable membrane that surrounds the cytoplasm of a cell. Its function is to protect the integrity of the interior of the cell by allowing certain substances into the cell while keeping others out.

The nucleus is a membrane-bound organelle found in eukaryotic cells. It contains most of the cell's genetic material, organized as multiple long linear DNA molecules in complex with a large variety of proteins such as histones to form chromosomes.

Mitochondria are often called the powerhouses of the cell. They generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.`,
      simplifiedContent: `Cell biology studies how cells work. It says the cell is the most basic part of life. This area connects to genetics and how our bodies defend themselves.

Cells are the smallest living things. They keep us alive by doing important jobs. There are two kinds of cells: ones without a center (prokaryotic) and ones with a center (eukaryotic).

The cell membrane is like a wall around the cell. It decides what can come in and go out of the cell.

The nucleus is like the brain of the cell. It holds the DNA, which is the instructions for how our body works.

Mitochondria make energy for the cell. We call them the powerhouse of the cell.`,
      chunks: [
        'Cell biology is the study of cell structure and function, and it revolves around the concept that the cell is the fundamental unit of life. The field is closely related to genetics, biochemistry, molecular biology, immunology, and developmental biology.',
        'Cells are the smallest units of life and are responsible for carrying out all the essential functions needed for an organism to survive. There are two main types of cells: prokaryotic cells, which do not have a membrane-bound nucleus, and eukaryotic cells, which do.',
        'The cell membrane, also called the plasma membrane, is a thin semi-permeable membrane that surrounds the cytoplasm of a cell. Its function is to protect the integrity of the interior of the cell by allowing certain substances into the cell while keeping others out.',
        'The nucleus is a membrane-bound organelle found in eukaryotic cells. It contains most of the cell\'s genetic material, organized as multiple long linear DNA molecules.',
        'Mitochondria are often called the powerhouses of the cell. They generate most of the cell\'s supply of adenosine triphosphate (ATP), used as a source of chemical energy.',
      ],
      flashcards: [
        { id: 'f1', front: 'What is the fundamental unit of life?', back: 'The Cell' },
        { id: 'f2', front: 'Difference between Prokaryotic and Eukaryotic?', back: 'Eukaryotic cells have a membrane-bound nucleus; Prokaryotic do not.' },
        { id: 'f3', front: 'Function of the Mitochondria?', back: 'They generate energy (ATP) for the cell — Powerhouse of the cell.' },
      ],
    },
  });

  // Add sample badges
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: user.id, badgeId: 'scholar' } },
    update: {},
    create: { userId: user.id, badgeId: 'scholar' },
  });

  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: user.id, badgeId: '7-day-star' } },
    update: {},
    create: { userId: user.id, badgeId: '7-day-star' },
  });

  // Add sample vocabulary words
  await prisma.vocabularyWord.upsert({
    where: { userId_word: { userId: user.id, word: 'mitochondria' } },
    update: {},
    create: {
      userId: user.id,
      word: 'mitochondria',
      definition: 'Organelles found in eukaryotic cells that generate most of the cell\'s supply of ATP, used as a source of chemical energy.',
      syllables: 'mi-to-chon-dri-a',
      tappedCount: 3,
      mastered: false,
    },
  });

  await prisma.vocabularyWord.upsert({
    where: { userId_word: { userId: user.id, word: 'nucleus' } },
    update: {},
    create: {
      userId: user.id,
      word: 'nucleus',
      definition: 'A membrane-bound organelle that contains the genetic material of a eukaryotic cell.',
      syllables: 'nu-cle-us',
      tappedCount: 5,
      mastered: true,
    },
  });

  console.log('✅ Seed completed!');
  console.log(`👤 Demo user: demo@lexiaid.app / lexiaid123`);
  console.log(`   User ID: ${user.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
