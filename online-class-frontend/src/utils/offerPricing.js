export function getOfferPricing(item, defaultPrice = 499) {
  const price = Number(item?.price ?? defaultPrice);
  const originalPrice = Number(item?.original_price ?? price);
  const hasOffer = Boolean(item?.offer_enabled) && originalPrice > price;

  return {
    price,
    originalPrice: hasOffer ? originalPrice : price,
    hasOffer,
    discountPercent: hasOffer ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
  };
}
