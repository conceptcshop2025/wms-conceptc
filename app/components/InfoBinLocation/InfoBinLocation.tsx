import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type BinRenderProps } from "@/app/types/types";

interface InfoBinLocationProps {
  location: BinRenderProps;
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
            <span className="grid grid-cols-[70px_95px_45px] bg-neutral-100 py-1! px-2! gap-1">
              <span>Bin Location</span>
              <span className="text-center">SKU</span>
              <span>QTY</span>
            </span>
            <span className="grid grid-cols-[70px_95px_45px] py-1! px-2! even:bg-neutral-100/50 gap-1">
              <span>{ location.id }</span>
              <span>
                {
                  !Array.isArray(location.sku)
                    ? <span>{ location.sku }</span> 
                    : location.sku.map((sku, index) => (
                        <span key={`loc-${sku}--${index}`} className="block">{sku}</span>
                      ))
                }
              </span>
              <span>
                {
                  !Array.isArray(location.bin_quantity)
                    ? <span className="block">{ location.bin_quantity }</span>
                    : location.bin_quantity.length > 1
                      ? location.bin_quantity.map((qty, index) => (
                        <span key={`${location}--${index}`} className="block">{ qty }</span>
                      ))
                      : <input type="number" defaultValue={location.bin_quantity[0]} className="block w-full" />
                }
              </span>
            </span>
            {
              location.bins.map((drader) => (
                <span className="grid grid-cols-[70px_95px_45px] py-1! px-2! even:bg-neutral-100/50 gap-1" key={drader.id}>
                  <span>{ drader.id }</span>
                  <span>
                    {
                      !Array.isArray(drader.sku) ? <span>{ drader.sku }</span> : drader.sku.map((sku) => (
                        <span key={sku} className="block">{ sku }</span>
                      ))
                    }
                  </span>
                  <span>
                    {
                      !Array.isArray(drader.bin_quantity)
                        ? <span>{drader.bin_quantity}</span>
                        : drader.bin_quantity.length > 1
                          ? drader.bin_quantity.map((qty, index) => (
                            <span key={index} className="block">{qty}</span>
                          ))
                          : <input type="number" defaultValue={drader.bin_quantity[0]} className="block w-full" />
                    }
                  </span>
                </span>
              ))
            }
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}