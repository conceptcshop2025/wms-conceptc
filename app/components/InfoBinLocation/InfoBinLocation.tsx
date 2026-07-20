import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type BinRenderProps, type BinsToModifyProps } from "@/app/types/types";

interface InfoBinLocationProps {
  location: BinRenderProps;
  onBinDataChange: (data: BinsToModifyProps) => void;
}

interface QuantityInputProps {
  id: string;
  sku: string;
  initialQuantity: number;
  onCommit: (data: BinsToModifyProps) => void;
}

const firstSku = (sku: string | string[]) =>
  Array.isArray(sku) ? sku[0] ?? "" : sku;

function QuantityInput({ id, sku, initialQuantity, onCommit }: QuantityInputProps) {
  const [quantity, setQuantity] = useState<string>(String(initialQuantity));

  const handleBlur = () => {
    if (Number(quantity) !== initialQuantity) {
      onCommit({ id, sku, bin_quantity: quantity });
    }
  };

  return (
    <input
      type="number"
      value={quantity}
      onChange={(event) => setQuantity(event.target.value)}
      onBlur={handleBlur}
      className="block w-full hidden!"
    />
  );
}

export default function InfoBinLocation({ location, onBinDataChange }: InfoBinLocationProps) {

  return (
    <Popover>
      <PopoverTrigger className="text-center bg-sky-400 text-neutral-50 font-bold w-full py-1! cursor-pointer hover:bg-sky-600 transition-all">
        Voir Détails
      </PopoverTrigger>
      <PopoverContent className="p-4!" onOpenAutoFocus={(event) => event.preventDefault()}>
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
                        <span key={`${location.id}--${index}`} className="block">{ qty }</span>
                      ))
                      : <>
                          <QuantityInput
                            id={location.id}
                            sku={firstSku(location.sku)}
                            initialQuantity={location.bin_quantity[0] ?? 0}
                            onCommit={onBinDataChange}
                          />
                          <span className="block">{ location.bin_quantity }</span>
                        </>
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
                          : <>
                              <QuantityInput
                                id={drader.id}
                                sku={firstSku(drader.sku)}
                                initialQuantity={drader.bin_quantity[0] ?? 0}
                                onCommit={onBinDataChange}
                              />
                              <span>{drader.bin_quantity}</span>
                            </>
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
