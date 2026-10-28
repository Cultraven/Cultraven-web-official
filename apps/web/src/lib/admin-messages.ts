/** Plain-language messages for failed admin saves. */
export function friendlySaveError(status: number, serverMessage?: string): string {
  if (status === 401) return "Your admin sign-in has expired, so nothing was saved. Sign in again in another tab, come back and press Save changes (your edits are still here).";
  if (status === 403) return "This page was refused by the server. Reload it and try again.";
  if (status === 413) return "There is too much content to save at once. Remove something or split it up.";
  if (status === 429) return "Too many saves in a short time. Wait a minute and try again.";
  if (status >= 500) return "The website's database did not answer, so nothing was saved. Your edits are still here. Press Save changes again in a moment.";
  return serverMessage || `Could not save (error ${status}). Please try again.`;
}
