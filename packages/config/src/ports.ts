export const SERVICE_PORTS = {
  gateway: 4000,
  auth: 4001,
  user: 4002,
  catalog: 4003,
  inventory: 4004,
  cart: 4005,
  order: 4006,
  payment: 4007,
  delivery: 4008,
  notification: 4009,
  cms: 4010,
  promotion: 4011,
  review: 4012,
  analytics: 4013,
} as const;
export type ServiceName = keyof typeof SERVICE_PORTS;
