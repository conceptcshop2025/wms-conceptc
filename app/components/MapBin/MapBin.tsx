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
        value === null || value === false
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
  const listOfBins = useBinLocations((state) => state.bins);

  const getLocations = async () => {
    try {
      const response = await fetch("/api/bin-locations");
      const data = await response.json();
      formatBinLocationsList(data);
    } catch (error) {
      console.error("Error fetching bin locations:", error);
    }
  }

  const formatBinLocationsList = (data: { bin_location: string; bin_current_quantity: string; sku: string }[]) => {

    const uniqueBins = setBinListData(data);

    const filterLocations = Array.from(uniqueBins).filter((location) => {
      const parts = location.id.split(".");
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

        const matchA = a.id.match(regex)
        const matchB = b.id.match(regex)

        if (!matchA || !matchB) {
          return a.id.localeCompare(b.id)
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
    

    useBinLocations.setState({
      bins: uniqueBins,
      filteredBins: uniqueBins
    })

    console.log(sortedBins);
    return sortedBins
  }

  const setBinListData = (data: { bin_location: string; bin_current_quantity: string; sku: string }[]) => {
    const binList: BinProps[] = [];

    data.forEach((item) => {
      const hasMoreOneLocation = item.bin_location.split(",");
      if (hasMoreOneLocation.length > 1) {
        hasMoreOneLocation.forEach((location) => {
          binList.push({
            id: location.trim(),
            empty: false,
            products: []
          });
        });
      } else {
        binList.push({
          id: item.bin_location,
          empty: false,
          products: []
        });
      }
    });

    const binListWithoutDuplicatedBins = binList.filter(
      (bin, index, self) => index === self.findIndex((b) => b.id === bin.id)
    );

    binListWithoutDuplicatedBins.forEach((bin) => {
      const findProducts = data.filter((key) => key.bin_location === bin.id);
      findProducts.forEach((product) => {
        bin.products?.push({
          sku: product.sku,
          qty: Number(product.bin_current_quantity)
        });
      });
    });

    // Retorno solo id y empty, donde empty depende de la suma total de qty
    const result = binListWithoutDuplicatedBins.map((bin) => {
      const totalQty = bin.products?.reduce((acc, product) => acc + product.qty, 0) ?? 0;
      return {
        id: bin.id,
        empty: totalQty <= 0
      };
    });
    
    return result;
  };

  const saveLocationList = async () => {
    console.log(listOfBins);

    try {
      const postQuery = fetch(`/api/bin-locations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listOfBins)
      });

      const data = await postQuery;
      console.log(data.json());
    } catch (error) {
      console.error(error);
    }
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
          <div className="save-list !ml-12 flex items-center">
            <button className="action-btn action-btn-confirm" onClick={saveLocationList}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Save list
            </button>
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