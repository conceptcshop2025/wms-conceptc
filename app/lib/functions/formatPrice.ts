export function formatPrice(unformattedPrice:number) {
  const price = unformattedPrice / 1000;
  const CADprice = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(price);

  return CADprice;
}