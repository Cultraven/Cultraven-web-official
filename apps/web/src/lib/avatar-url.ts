/** URL of the signed-in customer's avatar image for a given version (null = no photo). Safe to import from client code. */
export const avatarUrl = (version: number | null | undefined): string | null => (version ? `/api/account/avatar?v=${version}` : null);
