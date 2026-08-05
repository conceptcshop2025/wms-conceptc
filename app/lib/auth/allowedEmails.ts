/**
 * Emails allowed to access the Skusavvy section.
 * While this list is empty nobody has access, even after a successful login.
 */
export const SKUSAVVY_ALLOWED_EMAILS: string[] = [
  "jf.cancino@conceptcshop.com",
  "pascal@conceptcshop.com",
  "maude@conceptcshop.com",
  "g.ouellet@conceptcshop.com"
];

function normalize(email: string) {
  return email.trim().toLowerCase();
}

export function isSkusavvyAllowed(email?: string | null): boolean {
  if (!email) return false;

  const userEmail = normalize(email);
  return SKUSAVVY_ALLOWED_EMAILS.some((allowed) => normalize(allowed) === userEmail);
}
