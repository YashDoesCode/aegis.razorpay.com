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

// =========================================================================
// CUSTOM RAZORPAY NODES (4px radius, Inter typography, clean design tokens)
// =========================================================================

function CustomCustomerNode({ data }: NodeProps) {
  const meta = data.meta as { priorOrders?: number; priorDisputes?: number } | undefined;
  const priorOrders = meta?.priorOrders ?? 0;
  const priorDisputes = meta?.priorDisputes ?? 0;

  return (
    <div className="bg-white border-2 border-[#0D1A48] rounded-[4px] shadow-sm w-56 overflow-hidden text-xs">
      <Handle type="source" position={Position.Right} className="!bg-[#0D1A48] !w-2.5 !h-2.5" />
      <div className="bg-[#0D1A48] text-white px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold">
          <User className="w-3.5 h-3.5 text-blue-300" />
          <span>Customer</span>
        </div>
        {priorDisputes > 0 ? (
          <span className="text-[9px] bg-red-500/30 text-red-200 px-1 py-0.2 rounded font-mono font-bold">
            {priorDisputes} Prior Disp
          </span>
        ) : (
          <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1 py-0.2 rounded font-mono">
            {priorOrders} Orders
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1 bg-white">
        <div className="font-semibold text-slate-900 truncate">{String(data.label || "")}</div>
        <div className="text-[10px] text-slate-500 truncate">{String(data.sublabel || "")}</div>
      </div>
    </div>
  );
}

function CustomOrderNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-[#305EFF] rounded-[4px] shadow-sm w-52 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-[#305EFF] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-[#305EFF] !w-2.5 !h-2.5" />
      <div className="bg-[#305EFF]/10 border-b border-[#305EFF]/20 text-[#305EFF] px-3 py-1.5 flex items-center justify-between font-semibold">
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Order</span>
        </div>
        <span className="text-[10px] font-bold text-slate-900">{String(data.sublabel || "")}</span>
      </div>
      <div className="p-2.5 bg-white">
        <div className="font-semibold text-slate-800 line-clamp-2 leading-tight">
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
    <div className="bg-white border border-slate-300 rounded-[4px] shadow-xs w-48 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-slate-600 !w-2 !h-2" />
      <div className="bg-slate-100 border-b border-slate-200 text-slate-700 px-2.5 py-1 flex items-center justify-between font-semibold text-[11px]">
        <div className="flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-slate-500" />
          <span>Payment Rail</span>
        </div>
        <span className="text-[9px] bg-slate-200 text-slate-800 px-1 rounded uppercase font-bold">
          {network}
        </span>
      </div>
      <div className="p-2 bg-white font-mono text-[10px] text-slate-600 truncate">
        {String(data.sublabel || "")}
      </div>
    </div>
  );
}

function CustomDisputeNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-red-500 rounded-[4px] shadow-sm w-52 overflow-hidden text-xs ring-2 ring-red-500/20">
      <Handle type="target" position={Position.Left} className="!bg-red-500 !w-2.5 !h-2.5" />
      <div className="bg-red-600 text-white px-3 py-1.5 flex items-center justify-between font-semibold">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Dispute Active</span>
        </div>
        <span className="text-[10px] font-bold text-white">{String(data.sublabel || "")}</span>
      </div>
      <div className="p-2.5 bg-red-50/50 space-y-0.5">
        <div className="font-bold text-red-950 truncate">{String(data.label || "")}</div>
        <div className="text-[10px] text-red-700 font-medium">Status: {String(data.status || "open")}</div>
      </div>
    </div>
  );
}

function CustomDeliveryNode({ data }: NodeProps) {
  const meta = data.meta as { signatureCaptured?: boolean } | undefined;
  const isSigned = meta?.signatureCaptured ?? false;

  return (
    <div className="bg-white border border-emerald-500 rounded-[4px] shadow-xs w-48 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2 !h-2" />
      <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-2.5 py-1 flex items-center justify-between font-semibold text-[11px]">
        <div className="flex items-center gap-1">
          <Truck className="w-3 h-3 text-emerald-600" />
          <span>Fulfillment</span>
        </div>
        {isSigned && (
          <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded flex items-center gap-0.5 font-bold">
            <CheckCircle2 className="w-2.5 h-2.5" /> OTP Signed
          </span>
        )}
      </div>
      <div className="p-2 bg-white space-y-0.5">
        <div className="font-semibold text-slate-800 text-[11px] truncate">{String(data.label || "")}</div>
        <div className="font-mono text-[10px] text-slate-500 truncate">{String(data.sublabel || "")}</div>
      </div>
    </div>
  );
}

function CustomCommunicationNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-blue-400 rounded-[4px] shadow-xs w-48 overflow-hidden text-xs">
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />
      <div className="bg-blue-50 border-b border-blue-200 text-blue-800 px-2.5 py-1 flex items-center gap-1 font-semibold text-[11px]">
        <MessageSquare className="w-3 h-3 text-blue-600" />
        <span>Customer Communication</span>
      </div>
      <div className="p-2 bg-white">
        <p className="text-[10px] text-slate-700 line-clamp-2 italic leading-snug">
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
      <div className="w-full h-48 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-500">
        No graph relationship nodes available.
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full bg-[#FAFAFC] border border-slate-200 rounded-[4px] relative overflow-hidden flat-shadow"
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
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E2E8F0" />
        <Controls
          showInteractive={false}
          className="!bg-white !border-slate-200 !shadow-sm !rounded-[4px] !p-0.5"
        />
      </ReactFlow>

      {/* Legend Badge */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs border border-slate-200 px-2.5 py-1 rounded-[3px] text-[10px] font-semibold text-slate-600 flex items-center gap-3 pointer-events-none shadow-2xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#0D1A48]" /> Customer
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#305EFF]" /> Order
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Dispute
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Delivery Proof
        </span>
      </div>
    </div>
  );
}
