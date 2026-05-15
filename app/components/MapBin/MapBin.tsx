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
  updateBin: (binId:string, available: boolean, stock_quantity: number) => {
    set((state) => ({
      bins: state.bins.map((bin) => 
        bin.id === binId ? { ...bin, available, stock_quantity } : bin),
      filteredBins: state.filteredBins.map((bin) => 
        bin.id === binId ? { ...bin, available, stock_quantity } : bin)
    }))
  },
  updateSubBin: (parentBinId:string, subBinId:string, available: boolean, stock_quantity: number) => {
    set((state) => ({
      bins: state.bins.map((bin) => {
        if (bin.id === parentBinId) {
          return {
            ...bin,
            bins: bin.bins.map((subBin) =>
              subBin.id === subBinId ? { ...subBin, available, stock_quantity } : subBin
            ),
          };
        }
        return bin;
      }),
      filteredBins: state.filteredBins.map((bin) => {
        if (bin.id === parentBinId) {
          return {
            ...bin,
            bins: bin.bins.map((subBin) =>
              subBin.id === subBinId ? { ...subBin, available, stock_quantity } : subBin
            ),
          };
        }
        return bin;
      }),
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
        useBinLocations.getState().setBin({ id: binId, available: false, bins:[], stock_quantity: 0 });
      } else {
        console.info('Existing Bin in list!');
      }
      setBin("");
    }, 500);
  }

  const getLocations = async () => {
    try {
      const response = await fetch("/api/bin-locations");
      const data = await response.json();
      formatBinLocationsList(data);
    } catch (error) {
      console.error("Error fetching bin locations:", error);
    }
  }

  const formatBinLocationsList = async (data: BinProps[]) => {
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
          .map((loc) => ({ id: loc, available: false, stock_quantity: 0 }));

        return { id: baseId, available: false, bins, stock_quantity: 0 };
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

    useBinLocations.setState({
      bins: orderedData,
      filteredBins: orderedData
    })

    await getAvailableBins(filterLocations);

    return orderedData
  }

  const filteredBins = useBinLocations((state) => state.filteredBins);
  const filterBins = useBinLocations((state) => state.filterBins);
  const storeBins = useBinLocations((state) => state.bins);

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

  const getAvailableBins = async (binList: string[]) => {
    const baseUrl = '/api/available-bins';
    try {
      const res = await fetch(baseUrl,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(binList)
      });

      const data = await res.json();

      const binInStore = useBinLocations.getState().bins;

      binInStore.forEach((bin) => {
       if (bin.bins.length > 0) {
          //console.log("bins:", bin.bins);
          
          bin.bins.forEach((subBin) => {
            const found = data.data.find((item: { bin_location: string }) => item.bin_location.includes(subBin.id));
            //console.log("Found subBin:", found, "for subBin ID:", subBin.id);
            if (found === undefined) {
              useBinLocations.getState().updateSubBin(bin.id, subBin.id, true, 0);
            } else if (found) {
              useBinLocations.getState().updateSubBin(bin.id, subBin.id, false, Number(found.bin_current_quantity));
            }
          })
       } else {
          const found = data.data.find((item: { bin_location: string }) => item.bin_location.includes(bin.id)); 
          if (found === undefined) {
            useBinLocations.getState().updateBin(bin.id, true, 0);
          } else if (found) {
            useBinLocations.getState().updateBin(bin.id, false, Number(found.bin_current_quantity));
          }
        }

      });

      // console.log("all bins after update:", useBinLocations.getState().bins);

      if (data.failedCount > 0) {
        console.warn("Productos que fallaron:", data.failed);
      }
    } catch(error) {
      console.error("Error saving products in DB:", error);
    }
  }

  function binStatus(available:boolean, stock_quantity:number) {
    if (available) {
      return "bg-green-300 text-green-900 border-green-900";
    } else {
      if (stock_quantity > 0) {
        return "bg-red-300 text-red-900 border-red-900";
      }
      return "bg-sky-300 text-sky-900 border-sky-900";
    }
  }

  return (
    <div className="map-bin block">
      <button className="action-btn action-btn-confirm mb-8!" onClick={getLocations}>
        <ArrowDownTrayIcon className="size-6 text-neutral-50" />
        Get Locations
      </button>
      <div className="group-heading flex justify-start items-center gap-8">
        <div className="input-group search-product hidden!" style={{ width: "220px" }}>
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
        <div className="group flex justify-start gap-4 items-center hidden!">
          <button className="action-btn action-btn-confirm" onClick={saveLocations}>
            Save Locations
          </button>
        </div>
        <div className="group flex justify-start gap-4 items-center">
          <span className="w-25 p-1! bg-red-300 border border-red-900 rounded-lg text-red-900 text-center">Bin Occupé</span>
          <span className="w-25 p-1! bg-green-300 border border-green-900 rounded-lg text-green-900 text-center">Bin Vide</span>
          <span className="w-50 p-1! bg-sky-300 border border-sky-900 rounded-lg text-sky-900 text-center">Bin Occupé sans Stock</span>
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
            <li
              key={bin.id}
              className={`border rounded-lg relative overflow-hidden `}>
              <div className="bin-card">
                {
                  bin.bins.length === 0 ?
                    <p className="flex items-center jsutify-around gap-4 w-full px-4! py-2!">
                      <span>{bin.id}</span>
                    </p> :
                    <details className="sub-bins">
                      <summary
                        className={`
                          sub-bin--header
                          px-4!
                          py-2!
                          bg-neutral-200
                          text-neutral-900
                          border-neutral-200
                          ${ bin.bins.every(key => key.available === false) && "bg-red-300 text-red-900 border-red-900" }
                          ${ bin.bins.every(key => key.available === true) && "bg-green-300 text-green-900 border-green-900" }`}>
                        <span>{bin.id}</span>
                        <span> ({100 - Math.floor((bin.bins.filter((b) => b.available).length / bin.bins.length) * 100)}%)</span>
                      </summary>
                      <div className="sub-bin--body">
                        {
                          bin.bins.map((subBin: BinProps) =>(
                            <p
                              key={subBin.id}
                              className={
                                `px-4! py-2! ${binStatus(subBin.available, subBin.stock_quantity)} `}>{subBin.id}</p>
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