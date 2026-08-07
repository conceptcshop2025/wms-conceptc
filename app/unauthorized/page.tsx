import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="unauthorized-page flex min-h-screen items-center justify-center p-8!">
      <div className="unauthorized-card w-full max-w-md rounded-lg bg-red-400/15 p-8! text-center">
        <h1 className="text-3xl">Accès refusé</h1>
        <p className="mt-4! text-neutral-600">
          Votre compte n&apos;a pas accès à la section Skusavvy.
        </p>

        {
          session?.user?.email &&
            <p className="mt-2! text-neutral-600">
              Connecté en tant que <span className="font-medium">{session.user.email}</span>
            </p>
        }

        <div className="mt-8! flex flex-col gap-4">
          <Link href="/">
            <Button variant="outline" className="w-full">Retour à l&apos;accueil</Button>
          </Link>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full">Se déconnecter</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
