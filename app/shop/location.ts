export type DetectedAddress = {
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

const geoMessage = (e: any) => {
  if (e?.code === 1)
    return "Location permission denied. Allow it in your browser settings and try again.";
  if (e?.code === 2) return "Could not determine your location.";
  if (e?.code === 3) return "Location request timed out. Please try again.";
  return e?.message || "Could not detect your location.";
};

export async function detectCurrentAddress(): Promise<DetectedAddress> {
  let pos: GeolocationPosition;
  try {
    pos = await getPosition();
  } catch (e) {
    throw new Error(geoMessage(e));
  }

  const { latitude, longitude } = pos.coords;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${latitude}&lon=${longitude}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error("Could not look up your address.");

  const data = await res.json();
  const a = data?.address ?? {};

  const out: DetectedAddress = {
    addressLine:
      [a.house_number, a.road].filter(Boolean).join(", ") ||
      String(data?.display_name ?? "").split(",").slice(0, 2).join(",").trim(),
    area: a.suburb || a.neighbourhood || a.city_district || a.quarter || "",
    city: a.city || a.town || a.village || a.state_district || a.county || "",
    state: a.state || "",
    pincode: String(a.postcode ?? "").replace(/\D/g, "").slice(0, 6),
    country: "India",
  };

  if (!out.city && !out.pincode)
    throw new Error("Could not find an address for your location.");
  return out;
}