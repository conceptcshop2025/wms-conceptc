import { useState, useRef } from "react";
import "./MapBin.css";
import { create } from "zustand";
import { type BinLocationsProps, type BinProps } from "@/app/types/types";
import { ArchiveBoxArrowDownIcon, ArchiveBoxXMarkIcon } from "@heroicons/react/24/outline";

const useBinLocations = create<BinLocationsProps>((set) => ({
  bins: [],
  setBin: (bin) =>
    set((state) => ({
      bins: [...state.bins, bin]
    })),
})) 

export default function MapBin() {
  const [bin, setBin] = useState<string>("");
  const addBinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  

  const handleAddBin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const binId = e.target.value;

    setBin(binId);

    if (addBinTimerRef.current) clearTimeout(addBinTimerRef.current);

    addBinTimerRef.current = setTimeout(() => {
      useBinLocations.getState().setBin({ id: binId, empty: false });
      setBin("");
    }, 500);
  }

  return (
    <div className="map-bin block">
      <div className="input-group search-product" style={{ width: "220px" }}>
        <span className="input-icon">
          <ArchiveBoxArrowDownIcon className="size-5" />
        </span>
        <input
          type="text"
          className="form-input"
          placeholder="Ajoute une bin location"
          style={{ width: "100%" }}
          value={bin}
          onChange={handleAddBin}
        />
      </div>
      <div className="bin-list !mt-8">
        <ul className="flex justify-start gap-4">
          {useBinLocations((state) => state.bins).map((bin:BinProps) => (
            <li key={bin.id} className={`border rounded-lg !py-2 !px-4 relative !pr-30 overflow-hidden ${!bin.empty ? "bg-red-300 text-red-900 border-red-900" : "bg-green-300 text-green-900 border-green-900"}`}>
              <span>{bin.id}</span>
              <button className="bg-blue-500 absolute right-0 top-0 h-full !px-2 border-l border-l-blue-900">
                {bin.empty ? <span className="text-neutral-50">Bin occupé</span> : <span className="text-neutral-50">Bin vide</span>}
              </button>
            </li>
          ))}
          <li className={`border rounded-lg !py-2 !px-4 bg-green-300 text-green-900 border-green-900 relative !pr-12 overflow-hidden`}>
            118.01.01.B
            <button className="bg-red-300 absolute right-0 top-0 h-full !px-2 border-l border-l-red-900">
              <ArchiveBoxXMarkIcon className="size-5 text-red-900" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}