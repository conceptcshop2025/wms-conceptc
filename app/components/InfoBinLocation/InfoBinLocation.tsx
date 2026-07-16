import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type BinItem, type BinGroup, type BinsToModifyProps } from "@/app/types/types";

interface InfoBinLocationProps {
  location: BinGroup;
  onBinModify: (binToModify: BinsToModifyProps) => void;
}

export default function InfoBinLocation({location, onBinModify}:InfoBinLocationProps) {

  const handleQuantityChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    id: string,
    sku: string,
  ) => {
    const binToModify: BinsToModifyProps = {
      id,
      sku,
      bin_quantity: event.target.value,
    };
    onBinModify(binToModify);
  };

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
                  <span className="text-left">Bin Qty</span>
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
                  <span className="text-left">
                    {
                      Array.isArray(location.bin_quantity) ?
                        location.bin_quantity.map((qty:number, index:number) => (
                          location.sku === '' ?
                          <span key={`${location.id}-${index}`} className="block text-left">{qty}</span> :
                            location.sku.split(',').length > 1 ?
                              <span key={`${location.id}-${index}`} className="block text-left">{qty}</span> :
                            <input
                              key={`${location.id}-${index}`}
                              type="number"
                              className="text-left block w-full"
                              id={`qty-input--${location.id}-${index}`}
                              defaultValue={qty}
                              onChange={(event) => handleQuantityChange(event, location.id, location.sku)}
                            />
                        )) :
                        <span className="block text-left">0</span>
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
                        <span className="text-left">
                          { 
                            Array.isArray(drader.bin_quantity) ?
                              drader.bin_quantity.map((qty:number, index:number) => (
                                Array.isArray(drader.bin_quantity) && drader.bin_quantity.length > 1 ?
                                <span key={`${drader.id}-${index}`} className="block text-left">{qty}</span> :
                                <input
                                  key={`${drader.id}-${index}`}
                                  type="number"
                                  className="text-left block w-full"
                                  id={`qty-input--${drader.id}-${index}`}
                                  defaultValue={qty}
                                  onChange={(event) => handleQuantityChange(event, drader.id, drader.sku)}
                                />
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