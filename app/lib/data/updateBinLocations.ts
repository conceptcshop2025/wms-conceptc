import { type BinsToModifyProps } from "@/app/types/types";

export async function updateBinLocations(bins:string[]) {
  try {
    const response = await fetch('/api/wms-bin-locations', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bins),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Failed to update bin locations:', data);
    } else {
      console.log('Bin locations updated successfully:', data);
    }
  } catch (error) {
    console.error('Error updating bin locations:', error);
  }
}

export async function updateBinLocationData(bin:BinsToModifyProps) {
  try {
    const response = await fetch('/api/wms-bin-locations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bin),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating bin locations:', error);
  }
}