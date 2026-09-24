export const ROLES = ["customer", "delivery_partner", "staff", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export interface TokenPayload {
  sub: string;
  role: Role;
  permissions?: string[];
}

// TODO(Sprint 1): signAccessToken / verifyToken (jose), requireRole(), requirePermission()
