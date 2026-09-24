export interface WhatsAppProvider {
  sendTemplate(to: string, template: string, params: string[]): Promise<void>;
}
// Implement with the official WhatsApp Business Cloud API (Meta). Avoid unofficial libraries — accounts get banned.
