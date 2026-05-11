import { useState, useRef } from "react";
import "./MapBin.css";
import { create } from "zustand";
import { type BinLocationsProps, type BinProps } from "@/app/types/types";
import { ArchiveBoxArrowDownIcon, ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";

const useBinLocations = create<BinLocationsProps>((set) => ({
  bins: [],
  filteredBins: [],
  setBin: (bin) =>
    set((state) => ({
      bins: [...state.bins, bin],
      filteredBins: [...state.bins, bin]
    })),
  updateBin: (binId:string) => {
    set((state) => ({
      bins: state.bins.map((bin) => 
        bin.id === binId ? { ...bin, empty: !bin.empty } : bin),
      filteredBins: state.filteredBins.map((bin) => 
        bin.id === binId ? { ...bin, empty: !bin.empty } : bin)
    }))
  },
  filterBins: (value: boolean | null) => {
    set((state) => ({
      filteredBins:
        value === null
          ? state.bins
          : state.bins.filter((bin) => bin.empty === value),
    }));
  },
}));

export default function MapBin() {
  const [bin, setBin] = useState<string>("");
  const addBinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddBin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const binId = e.target.value;

    setBin(binId);

    if (addBinTimerRef.current) clearTimeout(addBinTimerRef.current);

    addBinTimerRef.current = setTimeout(() => {
      const arrayOfBins = useBinLocations.getState().bins;
      const existingBin = arrayOfBins.find(key => binId === key.id);
      if (!existingBin) {
        useBinLocations.getState().setBin({ id: binId, empty: false });
      } else {
        console.log('Existing Bin in list!');
      }
      setBin("");
    }, 500);
  }

  const handleUpdateBin = useBinLocations((state) => state.updateBin);
  const filteredBins = useBinLocations((state) => state.filteredBins);
  const filterBins = useBinLocations((state) => state.filterBins);

  const getLocations = async () => {
    try {
      const response = await fetch("/api/bin-locations");
      const data = await response.json();
      formatBinLocationsList(data);
    } catch (error) {
      console.error("Error fetching bin locations:", error);
    }
  }

  const formatBinLocationsList = (data: { bin_location: string; bin_current_quantity: string }[]) => {
    const uniqueBins = new Set<string>()

    data.forEach((item) => {
      if (!item.bin_location?.trim()) return

      const locations = item.bin_location
        .split(',')
        .map((location) => location.trim())

      locations.forEach((location) => {
        if (!location) return

        if (uniqueBins.has(location)) return

        uniqueBins.add(location)
      })
    })

    const filterLocations = Array.from(uniqueBins).filter((location) => {
      const parts = location.split(".");
      if (parts.length > 1) {
        const stage = parts[1]?.trim();
        const zone = parts[0]?.trim();
        if (Number(stage) <= 4 && Number(zone) <= 500) {
          return location;
        }
      }
      return;
    });

    const sortedBins = filterLocations.sort(
      (a, b) => {
        const regex = /^(\d+)([A-Za-z]*)$/

        const matchA = a.match(regex)
        const matchB = b.match(regex)

        if (!matchA || !matchB) {
          return a.localeCompare(b)
        }

        const numberA = parseInt(matchA[1] ?? "0", 10)
        const numberB = parseInt(matchB[1] ?? "0", 10)

        if (numberA !== numberB) {
          return numberA - numberB
        }

        const letterA = matchA[2] ?? ""
        const letterB = matchB[2] ?? ""

        return letterA.localeCompare(letterB)
      }
    );
    const formattedBins = sortedBins.map((location, index) => ({
      id: location,
      empty: Number(data[index]?.bin_current_quantity) > 0 ? false : true
    }))

    useBinLocations.setState({
      bins: formattedBins,
      filteredBins: formattedBins
    })

    return formattedBins
  }

  return (
    <div className="map-bin block">
      <button className="action-btn action-btn-confirm !mb-8" onClick={getLocations}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Get Locations
      </button>
      <div className="group-heading flex justify-start items-center gap-8">
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
        <div className="group flex justify-start gap-4 items-center">
          <span className="w-[100px] !p-1 bg-red-300 border border-red-900 rounded-lg text-red-900 text-center">Bin Occupé</span>
          <span className="w-[100px] !p-1 bg-green-300 border border-green-900 rounded-lg text-green-900 text-center">Bin Vide</span>
          <div className="option-group option-group--hide-products-without-stock">
            <div className="container-input">
              <input type="checkbox" id="hide-products-without-stock" name="hide-products-without-stock" onChange={(e) => filterBins(e.target.checked)} />
              <label htmlFor="hide-products-without-stock">Cacher les produits non actives</label>
            </div>
          </div>
        </div>
      </div>
      <div className="bin-list !mt-8">
        <ul className="flex justify-start gap-4 flex-wrap">
          {filteredBins.map((bin:BinProps) => (
            <li key={bin.id} className={`border rounded-lg !py-2 !px-4 relative !pr-[40px] overflow-hidden ${!bin.empty ? "bg-red-300 text-red-900 border-red-900" : "bg-green-300 text-green-900 border-green-900"}`}>
              <span>{bin.id}</span>
              <button className="bg-sky-500 absolute right-0 top-0 h-full !px-2 border-l border-l-sky-900 cursor-pointer" onClick={() => handleUpdateBin(bin.id)}>
                <ArrowPathRoundedSquareIcon className="size-5 text-neutral-50" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}