// Location and distance helpers for YNAB payees

// Haversine formula: returns distance in meters between two lat/lng points
export function haversine(lat1, lng1, lat2, lng2) {
  function toRad(x) { return (x * Math.PI) / 180; }
  const R = 6371e3; // meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get closest location for a payee from a list of locations and a user position
export function getClosestLocation(payeeId, payeeLocations, userPosition) {
  if (!userPosition) return null;
  const locs = payeeLocations.filter(l => l.payee_id === payeeId && l.latitude && l.longitude);
  if (locs.length === 0) return null;
  let minDist = Infinity, closest = null;
  for (const loc of locs) {
    const dist = haversine(userPosition.lat, userPosition.lng, loc.latitude, loc.longitude);
    if (dist < minDist) { minDist = dist; closest = loc; }
  }
  return closest ? { ...closest, distance: minDist } : null;
}
