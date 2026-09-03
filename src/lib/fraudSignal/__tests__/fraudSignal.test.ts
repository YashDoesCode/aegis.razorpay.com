import { describe, it, expect } from "vitest";
import { computeFraudSignal } from "../computeFraudSignal";

describe("Friendly-Fraud & Repeat-Disputer Signal Engine", () => {
  it("1. Flags repeat disputers with historical disputes and high dispute-to-order ratio", () => {
    const disputeInput = {
      id: "disp_test_repeat",
      reasonCode: "1061",
      network: "upi",
      amount: 420000,
      order: {
        id: "order_test_repeat",
        item: "Mechanical Keyboard",
        amount: 420000,
        customer: {
          id: "cust_priya_nambiar",
          name: "Priya Nambiar",
          email: "priya@example.com",
          priorOrdersCount: 3,
          priorDisputesCount: 1,
        },
      },
    };

    const signal = computeFraudSignal(disputeInput);

    expect(signal.isRepeatDisputer).toBe(true);
    expect(signal.score).toBeGreaterThanOrEqual(30);
    expect(signal.contributingFactors.some((f) => f.type === "repeat_dispute")).toBe(true);
    expect(signal.defenseImpact.defenseAdjustment).toBe("strengthens_contest");
  });

  it("2. Accurately identifies chronic multi-dispute abuse (≥50% ratio)", () => {
    const disputeInput = {
      id: "disp_chronic_01",
      reasonCode: "1064",
      network: "upi",
      amount: 500000,
      order: {
        id: "order_chronic_01",
        item: "Designer Watch",
        amount: 500000,
        customer: {
          id: "cust_serial_abuser",
          name: "Serial Disputer",
          email: "serial@example.com",
          priorOrdersCount: 2,
          priorDisputesCount: 2,
        },
      },
    };

    const signal = computeFraudSignal(disputeInput);

    expect(signal.band).toBe("high");
    expect(signal.score).toBeGreaterThanOrEqual(70);
    expect(signal.disputeToOrderRatio).toBe(1.0);
    expect(signal.contributingFactors.some((f) => f.type === "ratio_anomaly")).toBe(true);
  });

  it("3. Identifies contradictory proof when 'Goods Not Received' is disputed despite signed POD & chat", () => {
    const disputeInput = {
      id: "disp_1064_contradiction",
      reasonCode: "1064",
      network: "upi",
      amount: 2499900,
      order: {
        id: "order_1064",
        item: "Sony Headphones",
        amount: 2499900,
        customer: {
          id: "cust_rohan",
          name: "Rohan Verma",
          email: "rohan@example.com",
          priorOrdersCount: 1,
          priorDisputesCount: 0,
        },
        delivery: {
          courier: "BlueDart",
          trackingId: "BD-982144IN",
          deliveredAt: new Date(),
          deliveredToAddress: "Bangalore",
          signatureCaptured: true,
        },
        communications: [
          {
            id: "comm_01",
            channel: "email",
            direction: "inbound",
            body: "Thanks, package arrived yesterday.",
          },
        ],
      },
    };

    const signal = computeFraudSignal(disputeInput, [
      { id: "ev_1", type: "shipping_proof", present: true },
      { id: "ev_2", type: "customer_communication", present: true },
    ]);

    expect(signal.contributingFactors.some((f) => f.id === "factor_contradictory_delivery")).toBe(true);
    expect(signal.contributingFactors.some((f) => f.id === "factor_post_purchase_engagement")).toBe(true);
    expect(signal.defenseImpact.explanation).toContain("Visa CE3.0");
  });

  it("4. Rewards clean customers with 4+ undisputed orders with score mitigation", () => {
    const disputeInput = {
      id: "disp_clean_cust",
      reasonCode: "108",
      network: "upi",
      amount: 100000,
      order: {
        id: "order_clean",
        item: "Cloud Service",
        customer: {
          id: "cust_clean",
          name: "Loyal Customer",
          priorOrdersCount: 6,
          priorDisputesCount: 0,
        },
      },
    };

    const signal = computeFraudSignal(disputeInput);

    expect(signal.isRepeatDisputer).toBe(false);
    expect(signal.contributingFactors.some((f) => f.type === "clean_history")).toBe(true);
    expect(signal.score).toBeLessThanOrEqual(20);
    expect(signal.band).toBe("low");
  });

  it("5. Honest empty / insufficient signal reporting for first-time buyers with no history", () => {
    const disputeInput = {
      id: "disp_first_time",
      reasonCode: "1084",
      amount: 150000,
      order: {
        id: "order_first_time",
        item: "First Item",
        customer: {
          id: "cust_first",
          name: "New Buyer",
          priorOrdersCount: 0,
          priorDisputesCount: 0,
        },
      },
    };

    const signal = computeFraudSignal(disputeInput);

    expect(signal.band).toBe("insufficient_signal");
    expect(signal.contributingFactors.some((f) => f.type === "insufficient_data")).toBe(true);
    expect(signal.contributingFactors[0].evidence).toContain("insufficient to establish");
  });

  it("6. Constructs accurate server-side relationship graph with genuine data entities", () => {
    const disputeInput = {
      id: "disp_graph_test",
      rzpDisputeId: "disp_rzp_9901",
      reasonCode: "1064",
      network: "upi",
      amount: 2499900,
      order: {
        id: "ord_graph_test",
        rzpPaymentId: "pay_graph_9901",
        item: "Headphones",
        amount: 2499900,
        customer: {
          id: "cust_graph_01",
          name: "Graph Customer",
          email: "graph@example.com",
          priorOrdersCount: 5,
          priorDisputesCount: 0,
        },
        delivery: {
          courier: "BlueDart",
          trackingId: "BD-12345",
          deliveredAt: new Date(),
          deliveredToAddress: "Bangalore",
          signatureCaptured: true,
        },
        communications: [
          { id: "comm_01", channel: "chat", body: "Checking on warranty" },
        ],
      },
    };

    const signal = computeFraudSignal(disputeInput);
    const { nodes, edges } = signal.relationshipGraph;

    expect(nodes.length).toBe(6); // Customer, Order, Payment, Dispute, Delivery, Communication
    expect(nodes.find((n) => n.id === "node_cust_graph_01")).toBeDefined();
    expect(nodes.find((n) => n.id === "node_ord_graph_test")).toBeDefined();
    expect(nodes.find((n) => n.id === "node_pay_graph_9901")).toBeDefined();
    expect(nodes.find((n) => n.id === "node_disp_rzp_9901")).toBeDefined();
    expect(nodes.find((n) => n.id === "node_del_BD-12345")).toBeDefined();
    expect(nodes.find((n) => n.id === "node_comm_01")).toBeDefined();

    expect(edges.length).toBe(5);
    expect(edges.some((e) => e.label === "placed order")).toBe(true);
    expect(edges.some((e) => e.label === "chargeback filed")).toBe(true);
  });
});
