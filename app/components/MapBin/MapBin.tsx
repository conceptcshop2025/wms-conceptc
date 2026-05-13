import { useState, useRef } from "react";
import "./MapBin.css";
import { create } from "zustand";
import { type BinContainerProps, type BinLocationsProps, type BinProps } from "@/app/types/types";
import { ArrowDownTrayIcon, ArchiveBoxArrowDownIcon } from "@heroicons/react/24/outline";

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
        bin.id === binId ? { ...bin, available: !bin.available } : bin),
      filteredBins: state.filteredBins.map((bin) => 
        bin.id === binId ? { ...bin, available: !bin.available } : bin)
    }))
  },
  filterBins: (value: boolean | null) => {
    set((state) => ({
      filteredBins:
        value === null || value === false
          ? state.bins
          : state.bins.filter((bin) => bin.available === value),
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
        useBinLocations.getState().setBin({ id: binId, available: false, bins:[]  });
      } else {
        console.log('Existing Bin in list!');
      }
      setBin("");
    }, 500);
  }

  // const handleUpdateBin = useBinLocations((state) => state.updateBin);
  const filteredBins = useBinLocations((state) => state.filteredBins);
  const filterBins = useBinLocations((state) => state.filterBins);
  const storeBins = useBinLocations((state) => state.bins);

  const getLocations = async () => {
    try {
      const response = await fetch("/api/bin-locations");
      const data = await response.json();
      formatBinLocationsList(data);
    } catch (error) {
      console.error("Error fetching bin locations:", error);
    }
  }

  const formatBinLocationsList = (data: BinProps[]) => {
    const uniqueBins = new Set<string>()

    data.forEach((item) => {
      if (!item.id?.trim()) return

      const locations = item.id
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

    const assignFormatBinList = (locations: string[]) => {
      const baseIds = new Set<string>();
      const withLetter: string[] = [];

      locations.forEach((loc) => {
        if (/[A-Za-z]$/.test(loc)) {
          withLetter.push(loc);
        } else {
          baseIds.add(loc);
        }
      });

      const groups = Array.from(baseIds).map((baseId) => {
        const bins = withLetter
          .filter((loc) => loc.startsWith(baseId))
          .sort((a, b) => {
            const letterA = a.replace(baseId, "").replace(".", "");
            const letterB = b.replace(baseId, "").replace(".", "");
            return letterA.localeCompare(letterB);
          })
          .map((loc) => ({ id: loc, available: false }));

        return { id: baseId, available: false, bins };
      });

      return groups.sort((a, b) => {
        const partsA = a.id.split(".").map(Number);
        const partsB = b.id.split(".").map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
          if (diff !== 0) return diff;
        }
        return 0;
      });
    };

    const orderedData = assignFormatBinList(filterLocations);
    console.log(orderedData);

    useBinLocations.setState({
      bins: orderedData,
      filteredBins: orderedData
    })

    getAvailableBins();

    return orderedData
  }

  const saveLocations = async () => {
    const baseUrl = '/api/bin-locations';

    try {
      const res = await fetch(baseUrl,{
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storeBins)
      });

      const data = await res.json();

      if (data.failedCount > 0) {
        console.warn("Productos que fallaron:", data.failed);
      }
    } catch(error) {
      console.error("Error saving products in DB:", error);
    }
  }

  const getAvailableBins = async () => {
    const baseUrl = '/api/available-bins';

    try {
      const res = await fetch(baseUrl,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storeBins)
      });

      const data = await res.json();
      console.log('Products finded: ', data);

      if (data.failedCount > 0) {
        console.warn("Productos que fallaron:", data.failed);
      }
    } catch(error) {
      console.error("Error saving products in DB:", error);
    }
  }

  return (
    <div className="map-bin block">
      <button className="action-btn action-btn-confirm mb-8!" onClick={getLocations}>
        <ArrowDownTrayIcon className="size-6 text-neutral-50" />
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
          <button className="action-btn action-btn-confirm" onClick={saveLocations}>
            Save Locations
          </button>
        </div>
        <div className="group flex justify-start gap-4 items-center">
          <span className="w-25 p-1! bg-red-300 border border-red-900 rounded-lg text-red-900 text-center">Bin Occupé</span>
          <span className="w-25 p-1! bg-green-300 border border-green-900 rounded-lg text-green-900 text-center">Bin Vide</span>
          <div className="option-group option-group--hide-products-without-stock">
            <div className="container-input">
              <input type="checkbox" id="hide-products-without-stock" name="hide-products-without-stock" onChange={(e) => filterBins(e.target.checked)} />
              <label htmlFor="hide-products-without-stock">Cacher les bins avec stock</label>
            </div>
          </div>
        </div>
      </div>
      <div className="bin-list mt-8!">
        <ul className="flex justify-start items-start gap-4 flex-wrap">
          {filteredBins.map((bin:BinContainerProps) => (
            <li key={bin.id} className={`border rounded-lg py-2! px-4! relative overflow-hidden ${!bin.available ? "bg-red-300 text-red-900 border-red-900" : "bg-green-300 text-green-900 border-green-900"}`}>
              <div className="bin-card">
                {
                  bin.bins.length === 0 ?
                    <p className="flex items-center jsutify-around gap-4 w-full">
                      <span>{bin.id}</span>
                      <span>(100%)</span>
                    </p> :
                    <details className="sub-bins">
                      <summary className="sub-bin--header">
                        <span>{bin.id}</span>
                        <span>(100%)</span>
                      </summary>
                      <div className="sub-bin--body">
                        {
                          bin.bins.map((subBin: BinProps) =>(
                            <p key={subBin.id}>{subBin.id}</p>
                          ))
                        }
                      </div>
                    </details>
                }
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}