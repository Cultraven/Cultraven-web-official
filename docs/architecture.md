# Architecture rules

1. **Layers (inside every service module):** routes -> controller -> service -> repository -> model.
   Controllers never touch the DB; services never touch `req/res`.
2. **Ownership:** each service owns its own MongoDB database (`shop_<service>`). No cross-service DB reads —
   call the service's API or react to its events.
3. **Sync vs async:** browser -> gateway -> service is synchronous REST (`/api/v1/<service>/...`).
   Side effects (emails, WhatsApp, stock updates, analytics) go through events (`@shop/events`).
4. **Money** is stored as integer paise. **IDs, roles, events** come from shared packages, never re-declared.
5. **Config as data:** homepage sections, menus, banners, shipping/GST rules, message templates and store
   settings live in `cms-service` so admins change them without a deploy.
6. **Payments:** Razorpay webhook (signature-verified, idempotent) is the source of truth for order paid state.
7. **Provider interfaces:** mailer, whatsapp, storage, database and event bus are interfaces — swap providers
   without touching business code.
8. **Every service** exposes `/health`, validates input with zod, logs with `@shop/logger`, ships a Dockerfile.
