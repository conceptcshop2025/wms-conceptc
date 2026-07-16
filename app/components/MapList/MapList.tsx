import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { type WmsBinLocationProps, type BinItem, type BinGroup, type ProductItemProps, type BinsToModifyProps } from "@/app/types/types";
import "../MapBin/MapBin.css";
import { Button } from "@/components/ui/button";
import { BinLocationsSection100, BinLocationsSection200, BinLocationsSection300, BinLocationsSection400, BinLocationSection500, BinLocationSection600, BinLocationSection700 } from "@/app/lib/data/warehouse_bin_locations";
import { updateBinLocations } from "@/app/lib/data/updateBinLocations";
import Loading from "../Loading/Loading";
import { getAllProductsFromNeon } from "@/app/lib/data/getAllProductsFromNeon";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import InfoBinLocation from "../InfoBinLocation/InfoBinLocation";

export default function MapList() {

  const [binLocations, setBinLocations] = useState<BinGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [binsToModify, setBinsToModify] = useState<BinsToModifyProps[]>([]);

  const sections = [
    { id: 'section-100', name: 'Section 100', initialNumber: '1' },
    { id: 'section-200', name: 'Section 200', initialNumber: '2' },
    { id: 'section-300', name: 'Section 300', initialNumber: '3' },
    { id: 'section-400', name: 'Section 400', initialNumber: '4' },
    { id: 'section-500', name: 'Section 500', initialNumber: '5' },
    { id: 'section-600', name: 'Section 600', initialNumber: '6' },
    { id: 'section-700', name: 'Section 700', initialNumber: '7' },
  ];

  const getAllBinLocations = async () => {
    try {
      const response = await fetch('/api/wms-bin-locations');
      
      if (!response.ok) {
        console.error('Failed to fetch bin locations:', response.statusText);
        return [];
      }

      const data = await response.json();

      if (data.length > 0) {
        await synchronizeBinLocations(data);
      }

      return data as WmsBinLocationProps[];
    }
    catch (error) {
      console.error('Error fetching bin locations:', error);
      return [];
    }
  }

  const getBaseId = (id: string) => id.replace(/[A-Za-z]+$/, "").replace(/\.$/, "");

  const formatBinItems = (locations: WmsBinLocationProps[]): BinGroup[] => {
    const baseItems = new Map<string, WmsBinLocationProps>();
    const withLetter: WmsBinLocationProps[] = [];

    locations.forEach((loc) => {
      if (/[A-Za-z]$/.test(loc.id)) {
        withLetter.push(loc);
      } else {
        baseItems.set(loc.id, loc);
      }
    });

    withLetter.forEach((loc) => {
      const baseId = getBaseId(loc.id);
      if (!baseItems.has(baseId)) {
        baseItems.set(baseId, {
          id: baseId,
          sku: loc.sku,
          bin_quantity: 0,
        });
      }
    });

    const groups: BinGroup[] = Array.from(baseItems.values()).map((baseItem) => {
      const bins: BinItem[] = withLetter
        .filter((loc) => getBaseId(loc.id) === baseItem.id)
        .sort((a, b) => {
          const letterA = a.id.replace(baseItem.id, "").replace(".", "");
          const letterB = b.id.replace(baseItem.id, "").replace(".", "");
          return letterA.localeCompare(letterB);
        })
        .map((loc) => {
          return  {
            id: loc.id,
            sku: loc.sku,
            bin_quantity: loc.bin_current_quantity ? loc.bin_current_quantity : 0,
            available: false,
            stock_quantity: 0,
          }
        });

      return {
        id: baseItem.id,
        sku: baseItem.sku,
        bin_quantity: baseItem.bin_current_quantity !== undefined ? baseItem.bin_current_quantity : 0,
        available: false,
        bins,
        stock_quantity: 0,
      };
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

  const synchronizeBinLocations = async (binLocations: WmsBinLocationProps[]) => {
    const products = await getAllProductsFromNeon() as ProductItemProps[];

    products.forEach((product: ProductItemProps) => {
      const productBins = Array.isArray(product.bin_location)
        ? product.bin_location.map(bin => bin.trim())
        : product.bin_location.split(",").map(bin => bin.trim());

      productBins.forEach((binId: string) => {
          const matchBinLocation = binLocations.find((binLocation: WmsBinLocationProps) => binLocation.id === binId);
        if (matchBinLocation) {
          if (matchBinLocation.sku === '') {
            matchBinLocation.sku = product.sku;
            matchBinLocation.bin_current_quantity = [product.bin_current_quantity];
          } else {
            matchBinLocation.sku += ',' + product.sku;
            matchBinLocation.bin_current_quantity?.push(product.bin_current_quantity);
          }
          matchBinLocation.bin_quantity = product.bin_current_quantity;
        }
      });
    });
    
    // finally when end the synchronization with the products
    setLoading(false);
    return products;
  };

  useEffect(() => {
    getAllBinLocations().then((locations) => {
      setBinLocations(formatBinItems(locations));
    });
  },[]);

  const binAvailable = (address: BinGroup) => {
    if (address.sku === '') {
      return true
    }

    return false;
  }

  const productsInSamePrincipalBin = (skus: string) => {
    if (skus !== '') {
      if (skus.split(',').length > 1) {
        return <div className="products-count absolute -top-1.75 -right-2.25 z-4">
          <BookmarkIcon className="size-10 text-orange-900" />
          <span className="absolute w-full text-center top-1 text-neutral-50 font-bold">{skus.split(',').length}</span>
        </div>
      }
    }
    return;
  }

  const draderAvailable = (draderSkus: string) => {
    if (draderSkus === '') {
      return true;
    }

    return false;
  }

  const draderAvailableInBin = (draders: BinItem[]) => {
    const availableDrader = (drader:BinItem) => drader.sku === '';
    return draders.every(availableDrader);
  }

  const handleBinToModify = (binToModify: BinsToModifyProps) => {
    setBinsToModify((prevBins: BinsToModifyProps[]) => {
      const existingIndex = prevBins.findIndex(
        (bin) => bin.id === binToModify.id && bin.sku === binToModify.sku
      );

      const updatedBins = existingIndex !== -1
        ? prevBins.map((bin, index) => (index === existingIndex ? binToModify : bin))
        : [...prevBins, binToModify];

      console.log('Bins to modify: ', updatedBins);
      console.log(binsToModify);
      return updatedBins;
    });
  };

  const productsInSameDrader = (skus: string) => {
    if (skus !== ''){
      if (skus.split(',').length > 1) {
        return <div className="products-count absolute top-0 right-0 z-4">
          <BookmarkIcon className="size-8 text-orange-900" />
          <span className="absolute w-full text-center top-1 text-neutral-50 font-bold text-xs">{skus.split(',').length}</span>
        </div>
      }
    }
    return;
  }

  return (
    <div className="map-list">
      {
        loading ? <Loading /> : 
        <Tabs orientation="vertical" defaultValue="section-100">
          <TabsList className="w-37.5 sticky top-17.5">
            {sections.map((section: { id: string; name: string; initialNumber: string }) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="p-4! text-center cursor-pointer"
              >
                {section.name}
              </TabsTrigger>
            ))}
            <TabsTrigger disabled className="p-4! text-center cursor-pointer hidden!" value="import-locations">
              Import locations
            </TabsTrigger>
          </TabsList>
          {sections.map((section: { id: string; name: string; initialNumber: string }) => (
            <TabsContent key={section.id} value={section.id}>
              <div className="map-section">
                <div className="map-placeholder">
                  <ul className="grid grid-cols-7 gap-4">
                    {
                      binLocations
                        .filter((location: BinGroup) => location.id.startsWith(section.initialNumber))
                        .map((location: BinGroup) => (
                          <li
                            key={location.id}
                            className="relative">
                            <div className="bin-card">
                              <details className={`
                                sub-bins
                              `}>
                                <summary className={`
                                  relative
                                  sub-bin--header
                                  px-4!
                                  py-2!
                                  bg-neutral-200
                                  text-neutral-600
                                  text-lg
                                  font-bold
                                  cursor-pointer
                                  rounded-t-lg
                                  ${ binAvailable(location) ? draderAvailableInBin(location.bins) ? 'bg-green-300! text-green-900!' : 'bg-orange-300! text-orange-900!' : 'bg-red-300 text-red-900!' }
                                `}>
                                  <span>{location.id}</span>
                                  { productsInSamePrincipalBin(location.sku) }
                                </summary>
                                <div className="sub-bin--body bg-neutral-200 rounded-b-lg overflow-hidden">
                                  {
                                    location.bins.length > 0 ? (
                                      location.bins.map((bin: BinItem) => (
                                        <div key={bin.id} className={`
                                          px-9!
                                          py-2!
                                          flex
                                          justify-between
                                          relative
                                          ${ draderAvailable(bin.sku) ? 'bg-green-300 text-green-900!' : 'bg-red-300 text-red-900!' }
                                        `}>
                                          <span className={`${ location.sku !== '' ? 'text-red-900!': '' }`}>
                                            {bin.id}
                                            { productsInSameDrader(bin.sku) }
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="px-9! py-2! text-sm text-neutral-400">
                                        Not sub-bins
                                      </p>
                                    )
                                  }
                                  {
                                    binAvailable(location) ?
                                      draderAvailableInBin(location.bins) ?
                                      '' :
                                      <InfoBinLocation location={location} onBinModify={handleBinToModify} /> :
                                      <InfoBinLocation location={location} onBinModify={handleBinToModify} />
                                  }
                                </div>
                              </details>
                            </div>
                          </li>
                        ))
                    }
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
          <TabsContent value="import-locations">
            <div className="map-section">
              <div className="map-placeholder">
                <Button className="px-4! py-2!" onClick={async () => updateBinLocations(await BinLocationsSection100())}>
                  Import Bin locations for section 100
                </Button>

                <Button className="px-4! py-2! ml-4!" onClick={async () => updateBinLocations(await BinLocationsSection200())}>
                  Import Bin locations for section 200
                </Button>

                <Button className="px-4! py-2! ml-4!" onClick={async () => updateBinLocations(await BinLocationsSection300())}>
                  Import Bin locations for section 300
                </Button>

                <Button className="px-4! py-2! ml-4!" onClick={async () => updateBinLocations(await BinLocationsSection400())}>
                  Import Bin locations for section 400
                </Button>

                <Button className="px-4! py-2! ml-4!" onClick={async () => updateBinLocations(await BinLocationSection500())}>
                  Import Bin locations for section 500
                </Button>

                <Button className="px-4! py-2! mt-4!" onClick={async () => updateBinLocations(await BinLocationSection600())}>
                  Import Bin locations for section 600
                </Button>

                <Button className="px-4! py-2! mt-4! ml-4!" onClick={async () => updateBinLocations(await BinLocationSection700())}>
                  Import Bin locations for section 700
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      }
    </div>
  )
}