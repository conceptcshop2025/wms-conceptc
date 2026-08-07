"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { type MenuProps } from "../../types/types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import './Menu.css';

export default function Menu({ isOpen, onCloseMenu }: MenuProps) {
  const { data: session } = useSession();

  return (
    <div className={`menu bg-green-800 w-0 h-0 ${isOpen && 'open'}`}>
      <div className="menu-content w-full block">
        <div className="close-menu" onClick={onCloseMenu}>
          <XMarkIcon className="size-12 text-neutral-50 cursor-pointer" />
        </div>
        <ul className="w-full flex flex-col gap-6 mt-8!">
          <Link href="/" className="link text-2xl text-neutral-50">Gestion d&apos;entrepôt</Link>
          <Link href="/map-bin" className="link text-2xl text-neutral-50">Localisation des Bins</Link>
          <Link href="/upsell-stats" className="link text-2xl text-neutral-50">Statistiques d&apos;upsell</Link>
          <Link href="/exports" className="link text-2xl text-neutral-50">Exports des données</Link>
          {
            session?.user?.canAccessSkusavvy &&
              <Link href="/skusavvy" className="link text-2xl text-neutral-50">Skusavvy</Link>
          }
          {
            session
              ? <button
                  type="button"
                  onClick={() => signOut({ redirectTo: "/" })}
                  className="link text-2xl text-neutral-50 text-left cursor-pointer"
                >
                  Se déconnecter
                </button>
              : <Link href="/login" className="link text-2xl text-neutral-50">Connexion</Link>
          }
        </ul>
      </div>
    </div>
  )
}
