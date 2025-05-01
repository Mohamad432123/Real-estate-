// backend/config.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Configuration service for managing environment variables and API keys
 * Provides a centralized way to access configuration values
 */
class Config {
  constructor() {
    // Load environment variables from .env file
    this.env = process.env;
    
    // Define default values for required configurations
    this.defaults = {
      // RabbitMQ Configuration
      rabbitmq: {
        host: '100.107.33.60',
        port: 5673,
        user: 'admin',
        pass: 'admin',
        maps_request_queue: 'maps_requests',
        maps_response_queue: 'maps_responses',
        rentcast_request_queue: 'rentcast_requests',
        rentcast_response_queue: 'rentcast_responses',
        frontend_backend_queue: 'frontend_to_backend'
      },
      
      // Database Configuration
      database: {
        hosts: ['100.82.47.115', '100.82.166.82', '100.107.33.60', '127.0.0.1'],
        port: 3306,
        name: 'real_estate',
        user: 'root',
        pass: 'admin',
        timeout: 3
      },
      
      // API Configuration
      api: {
        google_maps_key: '',
        rentcast_key: ''
      },
      
      // Service URLs
      services: {
        php_api_url: 'http://100.71.100.5:8000/php',
        node_api_url: 'http://100.82.166.82:8081/api'
      },
      
      // Application Settings
      app: {
        port: 8081,
        node_env: 'production'
      }
    };
    
    // Try to load keys from secure storage if available
    this.loadSecureKeys();
  }
  
  /**
   * Attempts to load API keys from a secure location
   * Falls back to environment variables if secure storage is not available
   */
  loadSecureKeys() {
    try {
      // Check for a secure key file
      const keyFilePath = path.join(__dirname, '.secure', 'api_keys.json');
      
      if (fs.existsSync(keyFilePath)) {
        const secureKeys = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
        
        // Override defaults with secure keys
        if (secureKeys.google_maps_api_key) {
          this.defaults.api.google_maps_key = secureKeys.google_maps_api_key;
        }
        
        if (secureKeys.rentcast_api_key) {
          this.defaults.api.rentcast_key = secureKeys.rentcast_api_key;
        }
        
        console.log('✅ Loaded API keys from secure storage');
      } else {
        // Fall back to environment variables
        this.defaults.api.google_maps_key = this.env.GOOGLE_MAPS_API_KEY || '';
        this.defaults.api.rentcast_key = this.env.RENTCAST_API_KEY || '';
        
        console.log('⚠️ Secure key file not found, using environment variables');
      }
    } catch (error) {
      console.error('❌ Error loading secure keys:', error);
      
      // Fall back to environment variables
      this.defaults.api.google_maps_key = this.env.GOOGLE_MAPS_API_KEY || '';
      this.defaults.api.rentcast_key = this.env.RENTCAST_API_KEY || '';
    }
    
    // Validate required API keys
    this.validateApiKeys();
  }
  
  /**
   * Validates that required API keys are present
   * Logs warnings for missing keys
   */
  validateApiKeys() {
    const missingKeys = [];
    
    if (!this.defaults.api.google_maps_key) {
      missingKeys.push('GOOGLE_MAPS_API_KEY');
    }
    
    if (!this.defaults.api.rentcast_key) {
      missingKeys.push('RENTCAST_API_KEY');
    }
    
    if (missingKeys.length > 0) {
      console.warn(`⚠️ Missing required API keys: ${missingKeys.join(', ')}`);
      console.warn('⚠️ Some functionality may not work correctly');
    }
  }
  
  /**
   * Gets RabbitMQ configuration
   * @returns {Object} RabbitMQ configuration
   */
  getRabbitMQConfig() {
    return {
      host: this.env.RABBITMQ_HOST || this.defaults.rabbitmq.host,
      port: parseInt(this.env.RABBITMQ_PORT || this.defaults.rabbitmq.port),
      user: this.env.RABBITMQ_USER || this.defaults.rabbitmq.user,
      pass: this.env.RABBITMQ_PASS || this.defaults.rabbitmq.pass,
      maps_request_queue: this.defaults.rabbitmq.maps_request_queue,
      maps_response_queue: this.defaults.rabbitmq.maps_response_queue,
      rentcast_request_queue: this.defaults.rabbitmq.rentcast_request_queue,
      rentcast_response_queue: this.defaults.rabbitmq.rentcast_response_queue,
      frontend_backend_queue: this.defaults.rabbitmq.frontend_backend_queue
    };
  }
  
  /**
   * Gets database configuration
   * @returns {Object} Database configuration
   */
  getDatabaseConfig() {
    return {
      hosts: this.env.DB_HOSTS ? this.env.DB_HOSTS.split(',') : this.defaults.database.hosts,
      port: parseInt(this.env.DB_PORT || this.defaults.database.port),
      name: this.env.DB_NAME || this.defaults.database.name,
      user: this.env.DB_USER || this.defaults.database.user,
      pass: this.env.DB_PASS || this.defaults.database.pass,
      timeout: parseInt(this.env.DB_TIMEOUT || this.defaults.database.timeout)
    };
  }
  
  /**
   * Gets API keys
   * @returns {Object} API keys
   */
  getApiKeys() {
    return {
      google_maps_key: this.env.GOOGLE_MAPS_API_KEY || this.defaults.api.google_maps_key,
      rentcast_key: this.env.RENTCAST_API_KEY || this.defaults.api.rentcast_key
    };
  }
  
  /**
   * Gets service URLs
   * @returns {Object} Service URLs
   */
  getServiceUrls() {
    return {
      php_api_url: this.env.PHP_API_URL || this.defaults.services.php_api_url,
      node_api_url: this.env.NODE_API_URL || this.defaults.services.node_api_url
    };
  }
  
  /**
   * Gets application settings
   * @returns {Object} Application settings
   */
  getAppSettings() {
    return {
      port: parseInt(this.env.PORT || this.defaults.app.port),
      node_env: this.env.NODE_ENV || this.defaults.app.node_env
    };
  }
  
  /**
   * Creates configuration for a secure file to store API keys
   * This can be used to create a secure key file
   * @returns {String} JSON string for secure key file
   */
  createSecureKeyConfig() {
    const secureConfig = {
      google_maps_api_key: this.defaults.api.google_maps_key || this.env.GOOGLE_MAPS_API_KEY || '',
      rentcast_api_key: this.defaults.api.rentcast_key || this.env.RENTCAST_API_KEY || ''
    };
    
    return JSON.stringify(secureConfig, null, 2);
  }
}

// Export a singleton instance
module.exports = new Config();