import { districts, neighborhoods, regions } from "../data/store.js";
import { canonicalDistrictId } from "../data/uzbekistan-districts.js";

export function validateListingLocation(input: { regionId?: unknown; districtId?: unknown; neighborhoodId?: unknown }) {
  const error = (message: string) => ({ ok: false as const, error: "invalid_location", message });
  if (typeof input.regionId !== "string" || !input.regionId || typeof input.districtId !== "string" || !input.districtId) {
    return error("E’lon uchun viloyat va tumanni tanlang.");
  }
  const region = regions.find(item => item.id === input.regionId);
  const districtId = canonicalDistrictId(input.districtId);
  const district = districts.find(item => item.id === districtId && item.selectable !== false);
  if (!region || !district || district.regionId !== region.id) return error("Tanlangan tuman viloyatga mos emas. Hududni qayta tanlang.");
  const neighborhoodId = input.neighborhoodId == null || input.neighborhoodId === "" ? null : input.neighborhoodId;
  if (neighborhoodId !== null && (typeof neighborhoodId !== "string" || !neighborhoods.some(item =>
    item.id === neighborhoodId && canonicalDistrictId(item.districtId) === district.id))) {
    return error("Tanlangan mahalla tumanga mos emas.");
  }
  return { ok: true as const, regionId: region.id, districtId: district.id, neighborhoodId: neighborhoodId as string | null };
}
