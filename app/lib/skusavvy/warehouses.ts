const baseUrl = process.env.SKUSAVVY_BASE_URL || "";
const apiKey = process.env.SKUSAVVY_API_KEY || "";

const query = `
  query {
    warehouses {
      id
      name
    }
  }
`;

export async function fetchWarehouses() {

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": apiKey,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    const json = await res.json();

    if (json.errors) {
      return json.errors;
    }

    return json.data.warehouses;
  } catch (error) {
    return { error: "Failed to fetch warehouses", data: error };
  }
}