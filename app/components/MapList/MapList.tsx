import { useState, useEffect } from "react";
import {
  getAllBinLocations,
  AllSections,
  BinLocationsSection100,
  BinLocationsSection200,
  BinLocationsSection300,
  BinLocationsSection400,
  BinLocationSection500,
  BinLocationSection600,
  BinLocationSection700,
} from "@/app/lib/data/warehouse_bin_locations";
import { updateBinLocations, updateBinLocationData } from "@/app/lib/data/updateBinLocations";
import { getAllProductsFromNeon } from "@/app/lib/data/getAllProductsFromNeon";
import { type ProductItemProps, type BinLocationProps, type BinRenderProps, type BinSectionsProps, type BinColorStatus, type BinsToModifyProps } from "@/app/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Loading from "../Loading/Loading";
import InfoBinLocation from "../InfoBinLocation/InfoBinLocation";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

export default function MapList() {
  const [loading, setLoading] = useState<boolean>(true);
  const [binLocations, setBinLocations] = useState<BinRenderProps[]>([]);
  const [sections, setSections] = useState<BinSectionsProps[]>([]);

  const syncProductsToBinLocations = (locations:BinLocationProps[], products:ProductItemProps[]) => {
    products.forEach((product:ProductItemProps) => {
      if (product.bin_location !== undefined || product.bin_location !== null) {
        if (!Array.isArray(product.bin_location)) {
          const locationsInProduct = product.bin_location.split(",");
          locationsInProduct.forEach((location:string) => {
            if (location !== '') {
              const locationsFinded = locations.filter((key) => key.id === location);
              locationsFinded.forEach((locationFinded) => {
                if (!Array.isArray(locationFinded.sku)) {
                  locationFinded.sku = [];
                }
                if (!Array.isArray(locationFinded.bin_quantity)) {
                  locationFinded.bin_quantity = [];
                }

                locationFinded.sku.push(product.sku);
                locationFinded.bin_quantity.push(product.bin_current_quantity);
              });
            }
          })
        }
      }
    });
    
    return locations;
  }

  const formatBinItems = (locations: BinLocationProps[]): BinRenderProps[] => {
    const parents = new Map<string, BinRenderProps>();

    const getOrCreateParent = (id: string): BinRenderProps => {
      let parent = parents.get(id);
      if (!parent) {
        parent = { id, sku: [], bin_quantity: [], bins: [] };
        parents.set(id, parent);
      }
      return parent;
    };

    locations.forEach((location) => {
      const segments = location.id.split(".");
      const lastSegment = segments[segments.length - 1] ?? "";
      const isChild = /[a-zA-Z]/.test(lastSegment);

      if (isChild) {
        const parentId = segments.slice(0, -1).join(".");
        getOrCreateParent(parentId).bins.push(location);
      } else {
        const parent = getOrCreateParent(location.id);
        parent.sku = location.sku;
        parent.bin_quantity = location.bin_quantity;
      }
    });

    const sortByIdNumeric = (a: { id: string }, b: { id: string }) =>
      a.id.localeCompare(b.id, undefined, { numeric: true });

    const result = Array.from(parents.values());
    result.forEach((parent) => parent.bins.sort(sortByIdNumeric));

    return result.sort(sortByIdNumeric);
  };

  const binStatus = (bin:BinRenderProps) => {
    const status:BinColorStatus = {
      available: "bg-green-300! text-green-900!",
      partialOccuped: "bg-orange-300! text-orange-900!",
      occuped: "bg-red-300! text-red-900!"
    }

    if (Array.isArray(bin.sku)) {
      return status.occuped;
    } else {
      if (bin.sku === '') {
        const validationOccupationDrader = (drader:BinLocationProps) => draderStatus(drader) === status.available;
        // @TODO: validador cuando los draders ejemplo de la A a la H estan todas ocupadas pero no la bin principal, igual la bin principal deberia ponerse color rojo de totalmente ocupado (validar si aplica para los draders que solo tienen A y B como draders)
        if (bin.bins.every(validationOccupationDrader)) {
          return status.available;
        }
        return status.partialOccuped;
      }
      return status.available;
    }
  }

  const draderStatus = (drader:BinLocationProps) => {
    const status:BinColorStatus = {
      available: "bg-green-300! text-green-900!",
      partialOccuped: "bg-orange-300! text-orange-900!",
      occuped: "bg-red-300! text-red-900!"
    }

    if (Array.isArray(drader.sku)) {
      return status.occuped;
    } else {
      if (drader.sku === '') {
        return status.available;
      }
      return status.occuped;
    }
  }

  const multiplesSkusInSameBinOrDrader = (skus:string[], type: 'bin'| 'drader') => {
    return skus.length > 1 && <div className={`products-count absolute z-4 ${ type === 'bin' ? '-top-1.75 -right-2.25': 'top-0 right-0' }`}>
      <BookmarkIcon className={`text-orange-900 ${ type === 'bin' ? 'size-10' : 'size-8' }`} />
      <span className="absolute w-full text-center top-1 text-neutral-50 font-bold">{ skus.length }</span>
    </div>;
  }

  useEffect(() => {
    getAllBinLocations().then((locations) => {
      getAllProductsFromNeon().then((products) => {
        const syncData = syncProductsToBinLocations(locations, products as ProductItemProps[]);
        setBinLocations(formatBinItems(syncData));
        AllSections().then((data) => {
          setSections(data);
          setLoading(false);
        });
        console.log(formatBinItems(syncData));
      });
    })
  }, [])

  const binDataToChange = async (binData: BinsToModifyProps) => {
    const newQuantity = [Number(binData.bin_quantity)];

    setBinLocations((prev) =>
      prev.map((bin) => {
        if (bin.id === binData.id) {
          return { ...bin, bin_quantity: newQuantity };
        }

        if (bin.bins.some((drader) => drader.id === binData.id)) {
          return {
            ...bin,
            bins: bin.bins.map((drader) =>
              drader.id === binData.id
                ? { ...drader, bin_quantity: newQuantity }
                : drader
            ),
          };
        }

        return bin;
      })
    );

    const response = await updateBinLocationData(binData);
    console.log(response.data.status);
    if (response.data.status === 200) {
      toast.success(`La bin location ${binData.id} est mis à jour avec succès!`, {
        position: 'top-center',
        richColors: true
      });
    } else {
      toast.error(`Il y a un problème avec la mis à jour de la bin ${binData.id} svp, essayez autre fois.`, {
        position: 'top-center',
        richColors: true
      });
    }
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
                        .filter((location: BinRenderProps) => location.id.startsWith(section.initialNumber))
                        .map((bin: BinRenderProps) => (
                          <li
                            key={bin.id}
                            className="relative">
                              <div className="bin-card">
                                <details className={`sub-bins`}>
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
                                    ${ binStatus(bin) }
                                  `}>
                                    <span>{bin.id}</span>
                                    {
                                      multiplesSkusInSameBinOrDrader(bin.sku, 'bin')
                                    }
                                  </summary>
                                  <div className="sub-bin--body bg-neutral-200 rounded-b-lg overflow-hidden">
                                    {
                                      bin.bins.length > 0 ? (
                                        bin.bins.map((drader:BinLocationProps) => (
                                          <div key={drader.id} className={`
                                            px-9!
                                            py-2!
                                            flex
                                            justify-between
                                            relative
                                            ${ draderStatus(drader) }
                                          `}>
                                            <span className="">
                                              {drader.id}
                                              {
                                                multiplesSkusInSameBinOrDrader(drader.sku, 'drader')
                                              }
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
                                      <InfoBinLocation
                                        location={bin}
                                        onBinDataChange={binDataToChange} />
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