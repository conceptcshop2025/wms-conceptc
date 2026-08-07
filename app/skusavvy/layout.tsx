import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * The middleware already blocks this route, but the check is repeated here so a
 * misconfigured matcher can never expose the page.
 */
export default async function SkusavvyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=/skusavvy");
  if (!session.user.canAccessSkusavvy) redirect("/unauthorized");

  return children;
}
