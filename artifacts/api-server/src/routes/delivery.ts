import { Router } from "express";
import { districts, calculateDistance, getDistanceColor } from "../data/store.js";

const router = Router();

const PRICE_PER_KM: Record<string, number> = {
  small: 2500,
  medium: 4000,
  large: 6500,
  livestock: 8000,
};

const BASE_PRICE: Record<string, number> = {
  small: 25000,
  medium: 45000,
  large: 75000,
  livestock: 100000,
};

const VEHICLE_NAMES: Record<string, { name: string; nameRu: string }> = {
  small: { name: "Yengil yuk mashinasi", nameRu: "Легкий грузовик" },
  medium: { name: "O'rta yuk mashinasi", nameRu: "Средний грузовик" },
  large: { name: "Katta yuk mashinasi (KAMAZ)", nameRu: "Большой грузовик (КАМАЗ)" },
  livestock: { name: "Hayvon tashuvchi transport", nameRu: "Скотовозка" },
};

// POST /delivery/estimate
router.post("/delivery/estimate", (req, res) => {
  const {
    fromDistrictId,
    toDistrictId,
    fromLat,
    fromLng,
    toLat,
    toLng,
    cargoType,
  } = req.body as {
    fromDistrictId: string;
    toDistrictId: string;
    fromLat?: number;
    fromLng?: number;
    toLat?: number;
    toLng?: number;
    cargoType: "standard" | "livestock" | "heavy";
  };

  const fromDistrict = districts.find((d) => d.id === fromDistrictId);
  const toDistrict = districts.find((d) => d.id === toDistrictId);

  if (!fromDistrict || !toDistrict) {
    res
      .status(400)
      .json({ error: "validation", message: "Invalid district IDs" });
    return;
  }

  const fLat = fromLat ?? fromDistrict.lat;
  const fLng = fromLng ?? fromDistrict.lng;
  const tLat = toLat ?? toDistrict.lat;
  const tLng = toLng ?? toDistrict.lng;

  const distanceKm = calculateDistance(fLat, fLng, tLat, tLng);
  const distanceColor = getDistanceColor(distanceKm);

  // Determine vehicle types based on cargo
  const vehicleTypes: Array<"small" | "medium" | "large" | "livestock"> =
    cargoType === "livestock"
      ? ["livestock"]
      : cargoType === "heavy"
        ? ["medium", "large"]
        : ["small", "medium", "large"];

  const options = vehicleTypes.map((vehicleType) => {
    const total = BASE_PRICE[vehicleType] + PRICE_PER_KM[vehicleType] * distanceKm;
    const platformFee = Math.round(total * 0.15);
    const driverFee = total - platformFee;
    const estimatedMinutes = Math.round((distanceKm / 60) * 60 + 20);

    return {
      vehicleType,
      vehicleName: VEHICLE_NAMES[vehicleType].name,
      vehicleNameRu: VEHICLE_NAMES[vehicleType].nameRu,
      price: total,
      platformFee,
      driverFee,
      estimatedMinutes,
    };
  });

  res.json({ distanceKm, options, distanceColor });
});

export default router;
