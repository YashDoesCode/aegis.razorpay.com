export {
  CanonicalShipmentStatusSchema,
  NormalizedShipmentWebhookEventSchema,
  type CanonicalShipmentStatus,
  type NormalizedShipmentEvent,
  type NormalizedShipment,
  type NormalizedShipmentWebhookEvent,
  type CourierAdapter,
  type CourierWebhookProcessResult,
} from "./types";

export {
  DelhiveryAdapter,
  mapDelhiveryStatus,
} from "./adapters/delhivery";

export {
  MockCourierAdapter,
} from "./adapters/mock";

export {
  getCourierAdapter,
  registerCourierAdapter,
  getRegisteredProviders,
} from "./registry";

export {
  processCourierWebhook,
  syncTrackingForDispute,
  computeCourierPayloadHash,
  type ProcessCourierWebhookParams,
} from "./service";
