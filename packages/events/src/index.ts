export const EVENTS = {
  USER_REGISTERED: "user.registered",
  ORDER_CREATED: "order.created",
  ORDER_PAID: "order.paid",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_SHIPPED: "order.shipped",
  ORDER_DELIVERED: "order.delivered",
  PAYMENT_CAPTURED: "payment.captured",
  PAYMENT_FAILED: "payment.failed",
  INVENTORY_LOW: "inventory.low",
  DELIVERY_ASSIGNED: "delivery.assigned",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface EventEnvelope<T = unknown> {
  id: string;
  name: EventName;
  occurredAt: string;
  payload: T;
}

// Implementations: Redis Streams / BullMQ first, Google Pub/Sub later — services only see this interface.
export interface EventBus {
  publish<T>(event: EventEnvelope<T>): Promise<void>;
  subscribe<T>(name: EventName, handler: (event: EventEnvelope<T>) => Promise<void>): void;
}
