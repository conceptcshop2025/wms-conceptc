import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type BinItem, type BinGroup } from "@/app/types/types";

interface InfoBinLocationProps {
  location: BinGroup;
}

export default function InfoBinLocation({location}:InfoBinLocationProps) {
  return (
    <Popover>
      <PopoverTrigger className="text-center bg-sky-400 text-neutral-50 font-bold w-full py-1! cursor-pointer hover:bg-sky-600 transition-all">
        Voir Détails
      </PopoverTrigger>
      <PopoverContent  className="p-4!">
        <PopoverHeader>
          <PopoverTitle className="text-lg">Bin Détails:</PopoverTitle>
          <PopoverDescription>
            <span>
              <span>
                <span className="grid grid-cols-[70px_95px_45px] bg-neutral-100 py-1! px-2!">
                  <span>Location</span>
                  <span className="text-center">SKU</span>
                  <span className="text-right">Bin Qty</span>
                </span>
              </span>
              <span>
                <span className="grid grid-cols-[70px_95px_45px] py-1! px-2! even:bg-neutral-100/50">
                  <span>{ location.id }</span>
                  <span>
                    { 
                      location.sku === '' ?
                        <span className="block text-center">-</span> :
                      location.sku.split(",").length > 1 ?
                          location.sku.split(",").map((loc:string) => <span key={loc} className="block text-center">{loc}</span>) :
                          location.sku
                    }
                  </span>
                  <span className="text-right">
                    {
                      Array.isArray(location.bin_quantity) ?
                        location.bin_quantity.map((qty:number, index:number) => (
                          <span key={index} className="block text-right">{qty}</span>
                        )) :
                        <span>0</span>
                    }
                  </span>
                </span>
                {
                  location.bins.length > 0 &&
                    location.bins.map((drader:BinItem, index:number) => (
                      <span className="grid grid-cols-[70px_95px_45px] py-1! px-2! even:bg-neutral-100/50" key={index}>
                        <span>{ drader.id }</span>
                        <span className="text-center">
                          { 
                            drader.sku === '' ?
                              <span className="block text-center">-</span> :
                            drader.sku.split(",").length > 1 ?
                                drader.sku.split(",").map((loc:string) => <span key={loc} className="block text-center">{loc}</span>) :
                                drader.sku
                          }
                        </span>
                        <span className="text-right">
                          { 
                            Array.isArray(drader.bin_quantity) ?
                              drader.bin_quantity.map((qty:number, index:number) => (
                                <span key={index} className="block text-right">{qty}</span>
                              )) :
                              <span>0</span>
                          }
                        </span>
                      </span>
                    ))
                }
              </span>
            </span>
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}