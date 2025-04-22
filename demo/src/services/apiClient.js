// src/services/apiClient.js
import axios from 'axios';

// Configure base URLs for API services
const PHP_API_URL = 'http://100.71.100.5:8000/php'; // PHP server on Frontend VM
const NODE_API_URL = 'http://100.82.166.82:8081/api'; // Node.js server on Backend VM

/**
 * API Client for all backend services
 * Handles communication with both PHP and Node.js backends
 */
class ApiClient {
  /**
   * Send a request to the Maps API
   * @param {string} action - The maps action to perform
   * @param {Object} params - The parameters for the action
   * @returns {Promise} - The response from the backend
   */
  static async mapsRequest(action, params) {
    try {
      // Try the PHP client first (which uses RabbitMQ)
      const response = await axios.post(`${PHP_API_URL}/maps_client.php`, {
        action,
        params
      });
      return response.data;
    } catch (error) {
      console.error(`Error in maps request (${action}):`, error);
      
      // Fallback to direct Node.js API if PHP client fails
      try {
        const nodeResponse = await axios.post(`${NODE_API_URL}/maps/${action.toLowerCase()}`, params);
        return nodeResponse.data;
      } catch (fallbackError) {
        console.error(`Fallback error in maps request (${action}):`, fallbackError);
        return {
          status: 'error',
          message: `Service unavailable: ${fallbackError.message || 'Unknown error'}`,
          code: fallbackError.response?.status || 500
        };
      }
    }
  }

  /**
   * Send a request to the RentCast API
   * @param {string} action - The rentcast action to perform
   * @param {Object} params - The parameters for the action
   * @returns {Promise} - The response from the backend
   */
  static async rentcastRequest(action, params) {
    try {
      // Try the PHP client first (which uses RabbitMQ)
      const response = await axios.post(`${PHP_API_URL}/rentcast_client.php`, {
        action,
        params
      });
      return response.data;
    } catch (error) {
      console.error(`Error in rentcast request (${action}):`, error);
      
      // Fallback to direct Node.js API if PHP client fails
      try {
        // Determine the right endpoint based on the action
        let endpoint = '';
        let method = 'post';
        let queryParams = null;
        
        switch (action) {
          case 'searchProperties':
            endpoint = `${NODE_API_URL}/rentcast/search`;
            break;
          case 'getPropertyDetails':
            endpoint = `${NODE_API_URL}/rentcast/property/${params.propertyId}`;
            method = 'get';
            break;
          case 'getRentalEstimate':
            endpoint = `${NODE_API_URL}/rentcast/rental-estimate`;
            break;
          case 'getMarketData':
            endpoint = `${NODE_API_URL}/rentcast/market`;
            method = 'get';
            queryParams = params;
            break;
          default:
            throw new Error(`Unknown rentcast action: ${action}`);
        }
        
        let nodeResponse;
        if (method === 'get') {
          nodeResponse = await axios.get(endpoint, { params: queryParams });
        } else {
          nodeResponse = await axios.post(endpoint, params);
        }
        
        return nodeResponse.data;
      } catch (fallbackError) {
        console.error(`Fallback error in rentcast request (${action}):`, fallbackError);
        return {
          status: 'error',
          message: `Service unavailable: ${fallbackError.message || 'Unknown error'}`,
          code: fallbackError.response?.status || 500
        };
      }
    }
  }

  // Maps API methods
  
  /**
   * Performs geocoding through the backend
   * @param {string} address - The address to geocode
   * @returns {Promise} - The geocoded result
   */
  static async geocodeAddress(address) {
    if (!address) {
      return {
        status: 'error',
        message: 'Address is required'
      };
    }
    return this.mapsRequest('geocode', { address });
  }

  /**
   * Gets a Street View URL for a location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {string} size - Image size
   * @param {number} fov - Field of view
   * @returns {Promise} - The Street View URL
   */
  static async getStreetViewUrl(latitude, longitude, size = '600x300', fov = 90) {
    if (!latitude || !longitude) {
      return {
        status: 'error',
        message: 'Latitude and longitude are required'
      };
    }
    return this.mapsRequest('streetView', { latitude, longitude, size, fov });
  }

  /**
   * Searches for places
   * @param {string} query - Search query
   * @param {Object} location - Location object with lat/lng
   * @param {number} radius - Search radius
   * @returns {Promise} - The places search result
   */
  static async searchPlaces(query, location = null, radius = 5000) {
    if (!query) {
      return {
        status: 'error',
        message: 'Query is required'
      };
    }
    return this.mapsRequest('places', { query, location, radius });
  }

  /**
   * Gets directions between two points
   * @param {string} origin - Starting point
   * @param {string} destination - End point
   * @param {string} mode - Travel mode
   * @returns {Promise} - The directions result
   */
  static async getDirections(origin, destination, mode = 'driving') {
    if (!origin || !destination) {
      return {
        status: 'error',
        message: 'Origin and destination are required'
      };
    }
    return this.mapsRequest('directions', { origin, destination, mode });
  }
  
  // RentCast API methods
  
  /**
   * Search for properties with RentCast API
   * @param {Object} params - Search parameters
   * @returns {Promise} - The property search results
   */
  static async searchProperties(params) {
    if (!params) {
      return {
        status: 'error',
        message: 'Search parameters are required'
      };
    }
    return this.rentcastRequest('searchProperties', params);
  }
  
  /**
   * Get details for a specific property
   * @param {string} propertyId - The property ID
   * @returns {Promise} - The property details
   */
  static async getPropertyDetails(propertyId) {
    if (!propertyId) {
      return {
        status: 'error',
        message: 'Property ID is required'
      };
    }
    return this.rentcastRequest('getPropertyDetails', { propertyId });
  }
  
  /**
   * Get a rental estimate for a property
   * @param {Object} params - Property parameters
   * @returns {Promise} - The rental estimate
   */
  static async getRentalEstimate(params) {
    if (!params || !params.address) {
      return {
        status: 'error',
        message: 'Property address is required'
      };
    }
    return this.rentcastRequest('getRentalEstimate', params);
  }
  
  /**
   * Get market data for a location
   * @param {Object} params - Location parameters
   * @returns {Promise} - The market data
   */
  static async getMarketData(params) {
    if (!params || (!params.zipCode && (!params.city || !params.state))) {
      return {
        status: 'error',
        message: 'Either zipCode or city and state are required'
      };
    }
    return this.rentcastRequest('getMarketData', params);
  }

  /**
   * User signup
   * @param {Object} userData - User signup data
   * @returns {Promise} - The signup result
   */
  static async signup(userData) {
    if (!userData || !userData.name || !userData.email || !userData.password) {
      return {
        status: 'error',
        message: 'Name, email, and password are required'
      };
    }
    
    try {
      // Try multiple times with increasing timeouts
      let attempt = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempt < maxAttempts) {
        try {
          const response = await axios.post(`${PHP_API_URL}/front_to_back_sender.php`, {
            action: 'signup',
            ...userData
          }, {
            timeout: 5000 + (attempt * 2000) // Increase timeout with each attempt
          });
          
          return response.data;
        } catch (error) {
          lastError = error;
          console.error(`Signup attempt ${attempt + 1} failed:`, error);
          attempt++;
          
          if (attempt < maxAttempts) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // All attempts failed
      console.error('All signup attempts failed');
      return {
        status: 'error',
        message: `Signup failed: ${lastError?.message || 'Service unavailable'}`
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        status: 'error',
        message: `Signup error: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * User login
   * @param {Object} credentials - Login credentials
   * @returns {Promise} - The login result
   */
  static async login(credentials) {
    if (!credentials || !credentials.email || !credentials.password) {
      return {
        status: 'error',
        message: 'Email and password are required'
      };
    }
    
    try {
      // Try multiple times with increasing timeouts
      let attempt = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempt < maxAttempts) {
        try {
          const response = await axios.post(`${PHP_API_URL}/front_to_back_sender.php`, {
            action: 'login',
            ...credentials
          }, {
            timeout: 5000 + (attempt * 2000) // Increase timeout with each attempt
          });
          
          return response.data;
        } catch (error) {
          lastError = error;
          console.error(`Login attempt ${attempt + 1} failed:`, error);
          attempt++;
          
          if (attempt < maxAttempts) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // All attempts failed
      console.error('All login attempts failed');
      return {
        status: 'error',
        message: `Login failed: ${lastError?.message || 'Service unavailable'}`
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        status: 'error',
        message: `Login error: ${error.message || 'Unknown error'}`
      };
    }
  }
}

export default ApiClient;