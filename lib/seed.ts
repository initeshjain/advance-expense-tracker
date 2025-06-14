import { prisma } from './prisma'

async function main() {
  // Create default categories
  const categories = [
    { name: 'Food & Dining', color: '#EF4444', isDefault: true },
    { name: 'Transportation', color: '#3B82F6', isDefault: true },
    { name: 'Shopping', color: '#8B5CF6', isDefault: true },
    { name: 'Entertainment', color: '#F59E0B', isDefault: true },
    { name: 'Bills & Utilities', color: '#10B981', isDefault: true },
    { name: 'Healthcare', color: '#EC4899', isDefault: true },
    { name: 'Travel', color: '#06B6D4', isDefault: true },
    { name: 'Education', color: '#84CC16', isDefault: true },
    { name: 'Personal Care', color: '#F97316', isDefault: true },
    { name: 'Others', color: '#6B7280', isDefault: true },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })