"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  User,
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  Truck,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { FraudGraphNode, FraudGraphEdge } from "@/lib/fraudSignal/types";

function CustomCustomerNode({ data }: NodeProps) {
  const meta = data.meta as { priorOrders?: number; priorDisputes?: number } | undefined;
  const priorOrders = meta?.priorOrders ?? 0;
  const priorDisputes = meta?.priorDisputes ?? 0;

  return (
    <div className="bg-card border border-border rounded-lg shadow-2xs w-56 overflow-hidden text-xs">
      <Handle type="source" position={Position.Right} className="!bg-foreground !w-2 !h-2" />
      <div className="bg-muted px-3 py-1.5 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Customer</span>
        </div>
        {priorDisputes > 0 ? (
          <span className="text-[9px] bg-destructive/10 text-destructive px-1 py-0.2 rounded font-mono font-medium">
            {priorDisputes} Prior Disp
          </span>
        ) : (
          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-mono">
            {priorOrders} Orders
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-0.5 bg-card">
        <div className="font-medium text-foreground truncate">{String(data.label || "")}</div>
        <div className="text-[10px] text-muted-foreground truncate">{String(data.sublabel || "")}</div>
      </div>
    </div>
  );
}

function CustomOrderNode({ data }: NodeProps) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-2xs w-52 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
      <div className="bg-primary/5 border-b border-border text-foreground px-3 py-1.5 flex items-center justify-between font-medium">
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-primary" />
          <span>Order</span>
        </div>
        <span className="text-[10px] font-medium text-foreground">{String(data.sublabel || "")}</span>
      </div>
      <div className="p-2.5 bg-card">
        <div className="font-medium text-foreground line-clamp-2 leading-tight">
          {String(data.label || "")}
        </div>
      </div>
    </div>
  );
}

function CustomPaymentNode({ data }: NodeProps) {
  const meta = data.meta as { network?: string } | undefined;
  const network = meta?.network || "UPI";

  return (
    <div className="bg-card border border-border rounded-lg shadow-2xs w-48 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="bg-muted px-2.5 py-1 flex items-center justify-between font-medium text-[11px] border-b border-border">
        <div className="flex items-center gap-1 text-foreground">
          <CreditCard className="w-3 h-3 text-muted-foreground" />
          <span>Payment Rail</span>
        </div>
        <span className="text-[9px] bg-muted-foreground/10 text-foreground px-1 rounded uppercase font-medium">
          {network}
        </span>
      </div>
      <div className="p-2 bg-card font-mono text-[10px] text-muted-foreground truncate">
        {String(data.sublabel || "")}
      </div>
    </div>
  );
}

function CustomDisputeNode({ data }: NodeProps) {
  return (
    <div className="bg-card border border-destructive/40 rounded-lg shadow-2xs w-52 overflow-hidden text-xs ring-1 ring-destructive/20">
      <Handle type="target" position={Position.Left} className="!bg-destructive !w-2 !h-2" />
      <div className="bg-destructive text-destructive-foreground px-3 py-1.5 flex items-center justify-between font-medium">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Dispute Active</span>
        </div>
        <span className="text-[10px] font-medium text-destructive-foreground">{String(data.sublabel || "")}</span>
      </div>
      <div className="p-2.5 bg-destructive/5 space-y-0.5">
        <div className="font-medium text-foreground truncate">{String(data.label || "")}</div>
        <div className="text-[10px] text-destructive font-medium">Status: {String(data.status || "open")}</div>
      </div>
    </div>
  );
}

function CustomDeliveryNode({ data }: NodeProps) {
  const meta = data.meta as { signatureCaptured?: boolean } | undefined;
  const isSigned = meta?.signatureCaptured ?? false;

  return (
    <div className="bg-card border border-border rounded-lg shadow-2xs w-48 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2 !h-2" />
      <div className="bg-emerald-500/10 border-b border-border text-emerald-700 dark:text-emerald-400 px-2.5 py-1 flex items-center justify-between font-medium text-[11px]">
        <div className="flex items-center gap-1">
          <Truck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Fulfillment</span>
        </div>
        {isSigned && (
          <span className="text-[9px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-1 rounded flex items-center gap-0.5 font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" /> Signed
          </span>
        )}
      </div>
      <div className="p-2 bg-card space-y-0.5">
        <div className="font-medium text-foreground text-[11px] truncate">{String(data.label || "")}</div>
        <div className="font-mono text-[10px] text-muted-foreground truncate">{String(data.sublabel || "")}</div>
      </div>
    </div>
  );
}

function CustomCommunicationNode({ data }: NodeProps) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-2xs w-48 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <div className="bg-primary/5 border-b border-border text-foreground px-2.5 py-1 flex items-center gap-1 font-medium text-[11px]">
        <MessageSquare className="w-3 h-3 text-primary" />
        <span>Communication</span>
      </div>
      <div className="p-2 bg-card">
        <p className="text-[10px] text-muted-foreground line-clamp-2 italic leading-snug">
          &ldquo;{String(data.sublabel || "")}&rdquo;
        </p>
      </div>
    </div>
  );
}

const nodeTypes = {
  customerNode: CustomCustomerNode,
  orderNode: CustomOrderNode,
  paymentNode: CustomPaymentNode,
  disputeNode: CustomDisputeNode,
  deliveryNode: CustomDeliveryNode,
  communicationNode: CustomCommunicationNode,
};

interface RelationshipGraphProps {
  nodes: FraudGraphNode[];
  edges: FraudGraphEdge[];
  height?: number | string;
}

export function RelationshipGraph({
  nodes: inputNodes,
  edges: inputEdges,
  height = 340,
}: RelationshipGraphProps) {
  const nodes = useMemo(() => inputNodes as Node[], [inputNodes]);
  const edges = useMemo(() => inputEdges as Edge[], [inputEdges]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-muted/20 border border-border rounded-lg text-xs text-muted-foreground">
        No graph relationship nodes available.
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full bg-card border border-border rounded-lg relative overflow-hidden shadow-2xs"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="currentColor" className="opacity-10 text-foreground" />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !shadow-2xs !rounded-md !p-0.5 text-foreground"
        />
      </ReactFlow>

      <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-xs border border-border px-2.5 py-1 rounded text-[10px] font-medium text-muted-foreground flex items-center gap-3 pointer-events-none shadow-2xs">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground" /> Customer
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Order
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Dispute
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Delivery
        </span>
      </div>
    </div>
  );
}
