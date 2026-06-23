import Link from "next/link";
import { type MenuProps } from "../../types/types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import './Menu.css';

export default function Menu({ isOpen, onCloseMenu }: MenuProps) {
  return (
    <div className={`menu bg-green-800 w-0 h-0 ${isOpen && 'open'}`}>
      <div className="menu-content w-full block">
        <div className="close-menu" onClick={onCloseMenu}>
          <XMarkIcon className="size-12 text-neutral-50 cursor-pointer" />
        </div>
        <ul className="w-full flex flex-col gap-6 !mt-8">
          <Link href="/" className="link text-2xl text-neutral-50">Gestion d&apos;entrepôt</Link>
          <Link href="/map-bin" className="link text-2xl text-neutral-50">Localisation des Bins</Link>
          <Link href="/upsell-stats" className="link text-2xl text-neutral-50">Statistiques d&apos;upsell</Link>
          <Link href="/stocky" className="link text-2xl text-neutral-50">Stocky</Link>
        </ul>
      </div>
    </div>
  )
}