import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Razorpay Aegis database seed...");

  // Clean existing tables in reverse dependency order
  await prisma.evidenceItem.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();

  console.log("🧹 Cleaned existing database tables.");

  // 1. Create Default Merchant
  const merchant = await prisma.merchant.create({
    data: {
      id: "merch_aegis_tech_001",
      name: "Apex Electronics & Cloud Technologies Pvt Ltd",
      rzpMerchantId: "rzp_merch_apex_live_891",
      mode: "test",
    },
  });
  console.log(`✅ Seeded Merchant: ${merchant.name} (${merchant.rzpMerchantId})`);

  // Helper date generators
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // -------------------------------------------------------------
  // DISPUTE 1: UPI 1064 (Goods Not Received) — Score: ~94 (HIGH / CONTEST)
  // -------------------------------------------------------------
  const customer1 = await prisma.customer.create({
    data: {
      id: "cust_rohan_verma_01",
      name: "Rohan Verma",
      email: "rohan.verma@example.com",
      address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru, KA 560103",
      priorOrdersCount: 5,
      priorDisputesCount: 0,
    },
  });

  const order1 = await prisma.order.create({
    data: {
      id: "order_upi_1064_001",
      rzpPaymentId: "pay_O1064UPI0001",
      customerId: customer1.id,
      item: "Sony WH-1000XM5 Noise-Cancelling Headphones",
      amount: 2499900, // ₹24,999.00
      currency: "INR",
      status: "captured",
      createdAt: daysAgo(5),
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order1.id,
      courier: "BlueDart",
      trackingId: "BD-982144321IN",
      deliveredAt: daysAgo(3),
      deliveredToAddress: "Flat 402, Green Glen Layout, Bellandur, Bengaluru, KA 560103",
      signatureCaptured: true,
    },
  });

  await prisma.communication.createMany({
    data: [
      {
        orderId: order1.id,
        direction: "inbound",
        channel: "email",
        body: "Hi, received the package yesterday. Where can I find the official Sony warranty card registration link?",
        sentAt: daysAgo(2),
      },
      {
        orderId: order1.id,
        direction: "outbound",
        channel: "email",
        body: "Hello Rohan, thanks for confirming receipt! The warranty card is enclosed inside the main box and can also be activated online at sony.co.in/warranty.",
        sentAt: daysAgo(2),
      },
    ],
  });

  const dispute1 = await prisma.dispute.create({
    data: {
      id: "disp_1064_goods_not_received",
      rzpDisputeId: "disp_rzp_1064_001",
      orderId: order1.id,
      paymentId: order1.rzpPaymentId,
      reasonCode: "1064",
      network: "upi",
      amount: 2499900,
      currency: "INR",
      phase: "chargeback",
      status: "open",
      respondBy: daysAhead(3),
      createdAt: daysAgo(1),
      evidenceItems: {
        create: [
          {
            type: "shipping_proof",
            present: true,
            documentRef: "docs/proof_of_delivery_BD9821.pdf",
            note: "BlueDart Proof of Delivery signed by Rohan Verma with GPS tag matching customer address",
          },
          {
            type: "billing_proof",
            present: true,
            documentRef: "docs/tax_invoice_INV8821.pdf",
            note: "GST compliant Tax Invoice matching order amount ₹24,999.00",
          },
          {
            type: "customer_communication",
            present: true,
            documentRef: "docs/email_thread_acknowledgement.pdf",
            note: "Customer email acknowledging receipt of package and asking for warranty registration",
          },
          {
            type: "term_and_conditions",
            present: true,
            documentRef: "docs/terms_and_conditions.pdf",
            note: "Merchant terms of service and delivery policy",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // DISPUTE 2: UPI 108 (Beneficiary Not Credited) — Score: ~82 (HIGH / CONTEST)
  // -------------------------------------------------------------
  const customer2 = await prisma.customer.create({
    data: {
      id: "cust_ananya_sharma_02",
      name: "Ananya Sharma",
      email: "ananya.sharma@example.com",
      address: "Tower 2, Apt 12B, Hiranandani Estate, Thane, MH 400607",
      priorOrdersCount: 2,
      priorDisputesCount: 0,
    },
  });

  const order2 = await prisma.order.create({
    data: {
      id: "order_upi_108_002",
      rzpPaymentId: "pay_O108UPI0002",
      customerId: customer2.id,
      item: "AWS Cloud Architecture Consultation (1 hr)",
      amount: 850000, // ₹8,500.00
      currency: "INR",
      status: "captured",
      createdAt: daysAgo(4),
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order2.id,
      courier: "Digital Service",
      trackingId: "DIGI-CAL-SESSION-8841",
      deliveredAt: daysAgo(2),
      deliveredToAddress: "ananya.sharma@example.com",
      signatureCaptured: false,
    },
  });

  await prisma.communication.createMany({
    data: [
      {
        orderId: order2.id,
        direction: "inbound",
        channel: "chat",
        body: "Thanks for the consultation session today, the VPC peering and IAM roadmap was super clear!",
        sentAt: daysAgo(2),
      },
      {
        orderId: order2.id,
        direction: "outbound",
        channel: "email",
        body: "Hi Ananya, attached is your session recording, architecture diagram PDF, and invoice for your records.",
        sentAt: daysAgo(2),
      },
    ],
  });

  const dispute2 = await prisma.dispute.create({
    data: {
      id: "disp_108_beneficiary_not_credited",
      rzpDisputeId: "disp_rzp_108_002",
      orderId: order2.id,
      paymentId: order2.rzpPaymentId,
      reasonCode: "108",
      network: "upi",
      amount: 850000,
      currency: "INR",
      phase: "chargeback",
      status: "open",
      respondBy: daysAhead(4),
      createdAt: daysAgo(1),
      evidenceItems: {
        create: [
          {
            type: "proof_of_service",
            present: true,
            documentRef: "docs/service_session_audit_log.pdf",
            note: "Zoom meeting metadata & completed calendar event confirmation with participant login timestamp",
          },
          {
            type: "billing_proof",
            present: true,
            documentRef: "docs/tax_invoice_INV8822.pdf",
            note: "Invoice generated upon successful payment capture and settlement",
          },
          {
            type: "customer_communication",
            present: true,
            documentRef: "docs/chat_log_session_completion.pdf",
            note: "Customer sent thank-you chat note confirming attendance and delivery",
          },
          {
            type: "explanation_letter",
            present: false,
            documentRef: null,
            note: "Explanation letter pending representment staging",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // DISPUTE 3: Card 4837 (No Cardholder Auth) — Score: ~68 (NEEDS_EVIDENCE)
  // -------------------------------------------------------------
  const customer3 = await prisma.customer.create({
    data: {
      id: "cust_vikram_malhotra_03",
      name: "Vikram Aditya Malhotra",
      email: "vikram.malhotra@example.com",
      address: "B-14, Vasant Vihar, New Delhi, DL 110057",
      priorOrdersCount: 1,
      priorDisputesCount: 0,
    },
  });

  const order3 = await prisma.order.create({
    data: {
      id: "order_card_4837_003",
      rzpPaymentId: "pay_O4837CARD0003",
      customerId: customer3.id,
      item: "Ergonomic High-Back Executive Mesh Chair",
      amount: 1450000, // ₹14,500.00
      currency: "INR",
      status: "captured",
      createdAt: daysAgo(6),
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order3.id,
      courier: "Delhivery",
      trackingId: "DEL-847291039IN",
      deliveredAt: daysAgo(4),
      deliveredToAddress: "B-14, Vasant Vihar, New Delhi, DL 110057",
      signatureCaptured: true,
    },
  });

  await prisma.communication.create({
    data: {
      orderId: order3.id,
      direction: "outbound",
      channel: "sms",
      body: "Your ergonomic chair has been dispatched via Delhivery (AWB DEL-847291039IN). OTP for delivery will be required.",
      sentAt: daysAgo(5),
    },
  });

  const dispute3 = await prisma.dispute.create({
    data: {
      id: "disp_4837_no_cardholder_auth",
      rzpDisputeId: "disp_rzp_4837_003",
      orderId: order3.id,
      paymentId: order3.rzpPaymentId,
      reasonCode: "4837",
      network: "card",
      amount: 1450000,
      currency: "INR",
      phase: "chargeback",
      status: "open",
      respondBy: daysAhead(5),
      createdAt: daysAgo(1),
      evidenceItems: {
        create: [
          {
            type: "access_activity_log",
            present: true,
            documentRef: "docs/3ds_authentication_log.pdf",
            note: "3D-Secure 2.0 liability shift authenticated with bank OTP and matching device fingerprint",
          },
          {
            type: "shipping_proof",
            present: true,
            documentRef: "docs/delhivery_pod_signature.pdf",
            note: "OTP verified physical delivery at cardholder billing address in Vasant Vihar",
          },
          {
            type: "billing_proof",
            present: false,
            documentRef: null,
            note: "Invoice missing matching GST breakdown",
          },
          {
            type: "explanation_letter",
            present: false,
            documentRef: null,
            note: "Formal rebuttal letter pending generation",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // DISPUTE 4: UPI 1062 (Goods Not As Described) — Score: ~45 (LOW / ACCEPT)
  // -------------------------------------------------------------
  const customer4 = await prisma.customer.create({
    data: {
      id: "cust_sneha_kulkarni_06",
      name: "Sneha Kulkarni",
      email: "sneha.kulkarni@example.com",
      address: "Flat 501, Pride World City, Charholi Budruk, Pune, MH 412105",
      priorOrdersCount: 2,
      priorDisputesCount: 0,
    },
  });

  const order4 = await prisma.order.create({
    data: {
      id: "order_upi_1062_006",
      rzpPaymentId: "pay_O1062UPI0006",
      customerId: customer4.id,
      item: "Handcrafted Italian Leather Messenger Bag (Tan Brown)",
      amount: 650000, // ₹6,500.00
      currency: "INR",
      status: "captured",
      createdAt: daysAgo(6),
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order4.id,
      courier: "BlueDart",
      trackingId: "BD-481920381IN",
      deliveredAt: daysAgo(4),
      deliveredToAddress: "Flat 501, Pride World City, Charholi Budruk, Pune, MH 412105",
      signatureCaptured: true,
    },
  });

  const dispute4 = await prisma.dispute.create({
    data: {
      id: "disp_1062_goods_not_as_described",
      rzpDisputeId: "disp_rzp_1062_006",
      orderId: order4.id,
      paymentId: order4.rzpPaymentId,
      reasonCode: "1062",
      network: "upi",
      amount: 650000,
      currency: "INR",
      phase: "chargeback",
      status: "open",
      respondBy: daysAhead(4),
      createdAt: daysAgo(1),
      evidenceItems: {
        create: [
          {
            type: "billing_proof",
            present: true,
            documentRef: "docs/tax_invoice_INV8826.pdf",
            note: "Invoice specifies item SKU LEATHER-MSG-TAN-01",
          },
          {
            type: "refund_cancellation_policy",
            present: true,
            documentRef: "docs/replacement_policy.pdf",
            note: "Merchant terms require inspection photos before dispute filing",
          },
          {
            type: "shipping_proof",
            present: false,
            documentRef: null,
            note: "Delivery note lacks detailed condition inspection sign-off",
          },
          {
            type: "customer_communication",
            present: false,
            documentRef: null,
            note: "Buyer filed chargeback before sharing defective item photos with support",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // DISPUTE 5: UPI 1061 (Credit Not Processed) — Score: ~23 (LOW / ACCEPT)
  // -------------------------------------------------------------
  const customer5 = await prisma.customer.create({
    data: {
      id: "cust_priya_nambiar_04",
      name: "Priya Nambiar",
      email: "priya.nambiar@example.com",
      address: "A-304, Palm Meadows, Whitefield, Bengaluru, KA 560066",
      priorOrdersCount: 3,
      priorDisputesCount: 1,
    },
  });

  const order5 = await prisma.order.create({
    data: {
      id: "order_upi_1061_004",
      rzpPaymentId: "pay_O1061UPI0004",
      customerId: customer5.id,
      item: "Custom Mechanical Keyboard (Returned Item)",
      amount: 420000, // ₹4,200.00
      currency: "INR",
      status: "paid",
      createdAt: daysAgo(12),
    },
  });

  const dispute5 = await prisma.dispute.create({
    data: {
      id: "disp_1061_credit_not_processed",
      rzpDisputeId: "disp_rzp_1061_004",
      orderId: order5.id,
      paymentId: order5.rzpPaymentId,
      reasonCode: "1061",
      network: "upi",
      amount: 420000,
      currency: "INR",
      phase: "chargeback",
      status: "open",
      respondBy: daysAhead(2),
      createdAt: daysAgo(1),
      evidenceItems: {
        create: [
          {
            type: "refund_confirmation",
            present: false,
            documentRef: null,
            note: "CRITICAL: No refund transaction ARN or bank UTR exists in gateway records",
          },
          {
            type: "refund_cancellation_policy",
            present: true,
            documentRef: "docs/return_policy.pdf",
            note: "Merchant 7-day return policy stating refund upon warehouse receipt",
          },
          {
            type: "customer_communication",
            present: true,
            documentRef: "docs/return_acknowledgement_email.pdf",
            note: "Merchant email promised refund but banking settlement was never initiated",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // DISPUTE 6: UPI 1084 (Duplicate Processing) — Score: ~12 (LOW / ACCEPT)
  // -------------------------------------------------------------
  const customer6 = await prisma.customer.create({
    data: {
      id: "cust_amitav_ghosh_05",
      name: "Amitav Ghosh",
      email: "amitav.ghosh@example.com",
      address: "Flat 7C, Salt Lake Sector V, Kolkata, WB 700091",
      priorOrdersCount: 8,
      priorDisputesCount: 0,
    },
  });

  const order6 = await prisma.order.create({
    data: {
      id: "order_upi_1084_005",
      rzpPaymentId: "pay_O1084UPI0005B",
      customerId: customer6.id,
      item: "Annual Cloud Workspace Subscription (Duplicate Debit)",
      amount: 299900, // ₹2,999.00
      currency: "INR",
      status: "paid",
      createdAt: daysAgo(4),
    },
  });

  const dispute6 = await prisma.dispute.create({
    data: {
      id: "disp_1084_duplicate_processing",
      rzpDisputeId: "disp_rzp_1084_005",
      orderId: order6.id,
      paymentId: order6.rzpPaymentId,
      reasonCode: "1084",
      network: "upi",
      amount: 299900,
      currency: "INR",
      phase: "chargeback",
      status: "open",
      respondBy: daysAhead(3),
      createdAt: daysAgo(1),
      evidenceItems: {
        create: [
          {
            type: "billing_proof",
            present: true,
            documentRef: "docs/invoice_primary_order.pdf",
            note: "Primary charge invoice verified; duplicate second charge confirmed unlinked to second order.",
          },
          {
            type: "explanation_letter",
            present: false,
            documentRef: null,
            note: "Merchant error - duplicate charge confirmed on payment gateway telemetry. Recommend accept.",
          },
        ],
      },
    },
  });

  console.log("✅ Seeded 6 Disputes with realistic winnability spread (94, 82, 68, 45, 23, 12):");
  console.log([dispute1.id, dispute2.id, dispute3.id, dispute4.id, dispute5.id, dispute6.id]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🎉 Database seeding completed successfully!");
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
