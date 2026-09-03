import { z } from "zod";
import { EvidenceTypeSchema, DisputeData, EvidenceItemData, CustomerData, WinnabilityResult } from "../scoring";

export const RebuttalOutputSchema = z.object({
  summary: z
    .string()
    .max(1000, "Summary must not exceed 1000 characters to comply with Razorpay contest API")
    .describe("Concise 1-2 paragraph executive summary for the Razorpay contest dispute API"),
  explanationLetter: z
    .string()
    .min(50, "Explanation letter must be detailed and professional")
    .describe("Full formal representment letter addressed to the acquiring bank / Razorpay dispute operations"),
  citedEvidence: z
    .array(EvidenceTypeSchema)
    .describe("List of evidence types referenced and relied upon in the rebuttal. MUST strictly be evidence that is present"),
  source: z
    .enum(["llm", "fallback"])
    .optional()
    .describe("Whether the rebuttal was drafted by the LLM or generated via deterministic safe fallback"),
});

export type RebuttalOutput = z.infer<typeof RebuttalOutputSchema>;

export interface DraftRebuttalInput {
  dispute: DisputeData;
  evidenceItems: EvidenceItemData[];
  winnability: WinnabilityResult;
  customer?: CustomerData;
  customInstructions?: string;
}

export interface DraftRebuttalOptions {
  model?: string;
  maxRetries?: number;
  apiKey?: string;
  timeoutMs?: number;
  forceFallback?: boolean;
  mockClient?: (prompt: string, system: string) => Promise<RebuttalOutput>;
}
