import { useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type DatePickerProps } from "@/app/types/types";

export default function DatePicker({ onPickerDate }:DatePickerProps) { 
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  useEffect(() => {
    if (!date?.from || !date?.to) return; // guard para evitar undefined

    const initialDate = date.from.toISOString();
    const finalDate = date.to.toISOString();
    onPickerDate(initialDate, finalDate);
  }, [date?.from, date?.to, onPickerDate]);

  return (
    <Field className="mx-auto w-60">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className="justify-start font-normal p-5!"
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={new Date()}
            selected={date}
            onSelect={setDate}
            disabled={{
              before: new Date(2026, 4, 26),
              after: new Date(),
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}