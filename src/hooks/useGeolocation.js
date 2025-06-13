import { useState, useEffect } from "react";

/**
 * useGeolocation - React hook for getting the user's current geolocation (lat/lng).
 * Returns null if not available or permission denied.
 * @param {Object} options - Geolocation API options
 * @returns {{lat: number, lng: number} | null}
 */
export function useGeolocation(
  options = { enableHighAccuracy: true, timeout: 5000 },
) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPosition(null),
      options,
    );
    // Only run once on mount
  }, []);

  return position;
}
