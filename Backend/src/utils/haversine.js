// backend/src/utils/haversine.js
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA based on distance and average speed
 * @param {number} distance - Distance in kilometers
 * @param {number} speed - Average speed in km/h (default: 40)
 * @returns {number} ETA in minutes
 */
exports.calculateETA = (distance, speed = 40) => {
  return Math.round((distance / speed) * 60);
};