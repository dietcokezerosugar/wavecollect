const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB Cleanup...");
    const accounts = await prisma.googlePayAccount.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const seen = new Set();
    const toDelete = [];

    for (const acc of accounts) {
        if (seen.has(acc.name)) {
            toDelete.push(acc.id);
        } else {
            seen.add(acc.name);
        }
    }

    if (toDelete.length > 0) {
        await prisma.googlePayAccount.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log(`Successfully deleted ${toDelete.length} duplicate accounts.`);
    } else {
        console.log("No duplicates found.");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
