import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const merchantId = "local-dev";
  
  const merchant = await prisma.merchant.upsert({
    where: { id: merchantId },
    update: {},
    create: {
      id: merchantId,
      name: "Wave Collect Dev",
      businessName: "Wave Collect Payments",
      email: "admin@wavecollect.com",
      redirectUrl: "http://localhost:3000/callback",
      webhookUrl: "http://localhost:3000/api/webhook-test",
    },
  });

  const apiKey = await prisma.apiKey.upsert({
    where: { key: "wc_test_12345" },
    update: {},
    create: {
      key: "wc_test_12345",
      merchantId: merchant.id,
      monthlyLimit: 1000000,
    },
  });

  const gpayAccount = await prisma.googlePayAccount.upsert({
    where: { id: "test-gpay-1" },
    update: {},
    create: {
      id: "test-gpay-1",
      merchantId: merchant.id,
      name: "Sonal GPay",
      email: "sonal@example.com",
      upiId: "sonal@okaxis",
      status: "ACTIVE",
    },
  });

  // Create Admin User
  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@wavecollect.com" },
    update: {},
    create: {
      email: "admin@wavecollect.com",
      password: hashedPassword,
      name: "System Admin",
      role: "ADMIN",
    },
  });

  const merchantUser = await prisma.user.upsert({
    where: { email: "merchant@wavecollect.com" },
    update: {},
    create: {
      email: "merchant@wavecollect.com",
      password: hashedPassword,
      name: "Test Merchant",
      role: "MERCHANT",
      merchantId: merchant.id,
    },
  });

  console.log({ merchant, apiKey, gpayAccount, adminUser, merchantUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
