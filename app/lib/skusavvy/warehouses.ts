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

  if (!res.ok) {
    throw new Error(`Skusavvy HTTP ${res.status}: ${await res.text()}`);
  }
  if (json.errors) {
    throw new Error(`Skusavvy GraphQL: ${JSON.stringify(json.errors)}`);
  }

  return json.data.warehouses;
}