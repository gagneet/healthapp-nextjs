// src/services/GeoLocationService.js
// Comprehensive geo-location service for clinic address management

class GeoLocationService {
  constructor() {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    this.geocodingBaseUrl = 'https://nominatim.openstreetmap.org';
    this.reverseGeocodingBaseUrl = 'https://nominatim.openstreetmap.org/reverse';
  }

  /**
   * Format address object to searchable string
   * @param {Object} address - Address object from clinic
   * @returns {string} - Formatted address string
   */
  formatAddressForSearch(address) {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (address.postal_code) parts.push(address.postal_code);
    
    return parts.join(', ');
  }

  /**
   * Geocode address to get latitude and longitude
   * @param {Object} address - Address object
   * @returns {Promise<Object>} - Geocoding result with coordinates
   */
  async geocodeAddress(address) {
    try {
      const searchQuery = this.formatAddressForSearch(address);
      
      if (!searchQuery.trim()) {
        throw new Error('Address is required for geocoding');
      }

      const url = new URL(`${this.geocodingBaseUrl}/search`);
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '1');
      url.searchParams.set('extratags', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'HealthApp-Clinic-Locator/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Address not found',
          latitude: null,
          longitude: null,
          accuracy: null,
          formatted_address: null
        };
      }

      const result = data[0];
      
      return {
        success: true,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        accuracy: this.getAccuracyLevel(result.type),
        formatted_address: result.display_name,
        place_id: result.place_id,
        bounds: result.boundingbox ? {
          north: parseFloat(result.boundingbox[1]),
          south: parseFloat(result.boundingbox[0]), 
          east: parseFloat(result.boundingbox[3]),
          west: parseFloat(result.boundingbox[2])
        } : null
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        success: false,
        error: error.message,
        latitude: null,
        longitude: null,
        accuracy: null,
        formatted_address: null
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} - Reverse geocoding result
   */
  async reverseGeocode(latitude, longitude) {
    try {
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }

      const url = new URL(this.reverseGeocodingBaseUrl);
      url.searchParams.set('lat', latitude.toString());
      url.searchParams.set('lon', longitude.toString());
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'HealthApp-Clinic-Locator/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        return {
          success: false,
          error: 'Location not found',
          address: null
        };
      }

      const addr = data.address || {};
      
      return {
        success: true,
        address: {
          street: this.extractStreetAddress(addr),
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || addr.region || '',
          country: addr.country || '',
          postal_code: addr.postcode || '',
          formatted_address: data.display_name
        },
        place_id: data.place_id
      };

    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        success: false,
        error: error.message,
        address: null
      };
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Find nearby clinics within specified radius
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude  
   * @param {number} radiusKm - Search radius in kilometers
   * @param {Array} clinics - Array of clinic objects with coordinates
   * @returns {Array} - Sorted array of nearby clinics with distances
   */
  findNearbyClinics(latitude, longitude, radiusKm, clinics) {
    return clinics
      .map(clinic => {
        if (!clinic.latitude || !clinic.longitude) return null;
        
        const distance = this.calculateDistance(
          latitude, longitude,
          parseFloat(clinic.latitude), 
          parseFloat(clinic.longitude)
        );
        
        return {
          ...clinic,
          distance_km: Math.round(distance * 100) / 100, // Round to 2 decimals
          within_radius: distance <= radiusKm
        };
      })
      .filter(clinic => clinic && clinic.within_radius)
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  /**
   * Validate coordinates
   * @param {number} latitude - Latitude to validate
   * @param {number} longitude - Longitude to validate
   * @returns {Object} - Validation result
   */
  validateCoordinates(latitude, longitude) {
    const errors = [];
    
    if (latitude === null || latitude === undefined) {
      errors.push('Latitude is required');
    } else if (typeof latitude !== 'number' || isNaN(latitude)) {
      errors.push('Latitude must be a valid number');
    } else if (latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
    
    if (longitude === null || longitude === undefined) {
      errors.push('Longitude is required');
    } else if (typeof longitude !== 'number' || isNaN(longitude)) {
      errors.push('Longitude must be a valid number');
    } else if (longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Helper methods
  
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  getAccuracyLevel(locationType) {
    const typeMap = {
      'house': 'ROOFTOP',
      'building': 'ROOFTOP', 
      'way': 'RANGE_INTERPOLATED',
      'relation': 'GEOMETRIC_CENTER',
      'city': 'APPROXIMATE',
      'town': 'APPROXIMATE',
      'village': 'APPROXIMATE'
    };
    
    return typeMap[locationType] || 'APPROXIMATE';
  }

  extractStreetAddress(address) {
    const streetParts = [];
    
    if (address.house_number) streetParts.push(address.house_number);
    if (address.road) streetParts.push(address.road);
    if (address.street) streetParts.push(address.street);
    
    return streetParts.join(' ') || '';
  }
}

export default new GeoLocationService();