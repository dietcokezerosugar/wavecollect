import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting Clean Production Seed...");

  // 1. Create System Admin
  const adminEmail = "admin@wavecollect.com";
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword, role: "ADMIN" },
    create: { email: adminEmail, password: hashedPassword, name: "System Admin", role: "ADMIN" },
  });
  console.log(`✅ Production Admin Created: ${admin.email}`);

  // 1b. Create Platform Pool Admin Merchant (for pool accounts)
  const poolAdminMerchant = await prisma.merchant.upsert({
    where: { id: "platform-pool-admin" },
    update: { name: "Platform Pool Admin" },
    create: {
      id: "platform-pool-admin",
      name: "Platform Pool Admin",
      email: "pool-admin@wavecollect.com",
      status: "ACTIVE",
      processingMode: "OWN_ACCOUNT",
    }
  });

  // 2. Create Default Merchant Profile & User
  const merchantEmail = "merchant@wavecollect.com";
  const merchantPassword = await bcrypt.hash("merchant123", 10);

  const demoMerchantProfile = await prisma.merchant.upsert({
    where: { id: "demo-merchant-1" },
    update: { name: "Demo Merchant", email: merchantEmail },
    create: {
      id: "demo-merchant-1",
      name: "Demo Merchant",
      email: merchantEmail,
      status: "ACTIVE",
      processingMode: "OWN_ACCOUNT"
    }
  });

  const merchant = await prisma.user.upsert({
    where: { email: merchantEmail },
    update: { password: merchantPassword, role: "MERCHANT", merchantId: demoMerchantProfile.id },
    create: { email: merchantEmail, password: merchantPassword, name: "Demo Merchant", role: "MERCHANT", merchantId: demoMerchantProfile.id },
  });
  console.log(`✅ Production Merchant Created: ${merchant.email}`);

  // 3. Create Default Staff
  const staffEmail = "staff@wavecollect.com";
  const staffPassword = await bcrypt.hash("staff123", 10);

  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: { password: staffPassword, role: "STAFF" },
    create: { email: staffEmail, password: staffPassword, name: "Operations Staff", role: "STAFF" },
  });
  console.log(`✅ Production Staff Created: ${staff.email}`);
  console.log("🚀 Database is now in a clean production state.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
