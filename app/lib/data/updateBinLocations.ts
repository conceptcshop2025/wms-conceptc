

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