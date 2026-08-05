import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = callbackUrl ?? "/skusavvy";

  const session = await auth();
  if (session?.user) redirect(redirectTo);

  return (
    <div className="login-page flex min-h-screen items-center justify-center p-8!">
      <div className="login-card w-full max-w-md rounded-lg bg-green-400/15 p-8! text-center">
        <h1 className="text-3xl">Connexion</h1>
        <p className="mt-4! text-neutral-600">
          Utilisez votre compte Microsoft de l&apos;entreprise pour continuer.
        </p>

        {
          error &&
            <p className="mt-4! rounded-lg bg-red-100 p-4! text-red-700">
              La connexion a échoué. Essayez à nouveau ou contactez un administrateur.
            </p>
        }

        <form
          className="mt-8!"
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo });
          }}
        >
          <Button type="submit" className="w-full">Se connecter avec Microsoft</Button>
        </form>
      </div>
    </div>
  )
}
