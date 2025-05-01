<?php
/**
 * Configuration class for PHP components
 * Provides environment variables and API keys
 */
class Config {
    // Configuration values
    private $config = [];
    
    /**
     * Constructor
     * Loads configuration from environment or .env file
     */
    public function __construct() {
        // Load from .env file if it exists
        $this->loadEnvFile();
        
        // Set default values
        $this->setDefaults();
        
        // Try to load API keys from secure storage
        $this->loadSecureKeys();
        
        // Validate required API keys
        $this->validateApiKeys();
    }
    
    /**
     * Loads environment variables from .env file
     */
    private function loadEnvFile() {
        $envFile = __DIR__ . '/.env';
        
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                // Skip comments
                if (strpos(trim($line), '#') === 0) {
                    continue;
                }
                
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                // Remove quotes if present
                if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                    $value = substr($value, 1, -1);
                } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                    $value = substr($value, 1, -1);
                }
                
                // Set environment variable
                putenv("$name=$value");
                $_ENV[$name] = $value;
            }
        }
    }
    
    /**
     * Sets default configuration values
     */
    private function setDefaults() {
        // RabbitMQ configuration
        $this->config['rabbitmq'] = [
            'host' => getenv('RABBITMQ_HOST') ?: '100.107.33.60',
            'port' => getenv('RABBITMQ_PORT') ?: '5673',
            'user' => getenv('RABBITMQ_USER') ?: 'admin',
            'pass' => getenv('RABBITMQ_PASS') ?: 'admin',
            'maps_request_queue' => 'maps_requests',
            'maps_response_queue' => 'maps_responses',
            'rentcast_request_queue' => 'rentcast_requests',
            'rentcast_response_queue' => 'rentcast_responses',
            'frontend_backend_queue' => 'frontend_to_backend'
        ];
        
        // Database configuration
        $this->config['database'] = [
            'hosts' => getenv('DB_HOSTS') ? explode(',', getenv('DB_HOSTS')) : ['100.82.47.115', '100.82.166.82', '100.107.33.60', '127.0.0.1'],
            'port' => getenv('DB_PORT') ?: '3306',
            'name' => getenv('DB_NAME') ?: 'real_estate',
            'user' => getenv('DB_USER') ?: 'root',
            'pass' => getenv('DB_PASS') ?: 'admin',
            'timeout' => getenv('DB_TIMEOUT') ?: '3'
        ];
        
        // API configuration
        $this->config['api'] = [
            'google_maps_key' => getenv('GOOGLE_MAPS_API_KEY') ?: '',
            'rentcast_key' => getenv('RENTCAST_API_KEY') ?: ''
        ];
        
        // Service URLs
        $this->config['services'] = [
            'php_api_url' => getenv('PHP_API_URL') ?: 'http://100.71.100.5:8000/php',
            'node_api_url' => getenv('NODE_API_URL') ?: 'http://100.82.166.82:8081/api'
        ];
    }
    
    /**
     * Loads API keys from secure storage if available
     */
    private function loadSecureKeys() {
        $secureKeyFile = __DIR__ . '/.secure/api_keys.json';
        
        if (file_exists($secureKeyFile)) {
            $secureKeys = json_decode(file_get_contents($secureKeyFile), true);
            
            if (isset($secureKeys['google_maps_api_key'])) {
                $this->config['api']['google_maps_key'] = $secureKeys['google_maps_api_key'];
            }
            
            if (isset($secureKeys['rentcast_api_key'])) {
                $this->config['api']['rentcast_key'] = $secureKeys['rentcast_api_key'];
            }
            
            error_log('✅ loaded API keys from secure storage');
        } else {
            error_log('⚠️ Secure key file not found, using environment variables');
        }
    }
    
    /**
     * Validates required API keys
     */
    private function validateApiKeys() {
        $missingKeys = [];
        
        if (empty($this->config['api']['google_maps_key'])) {
            $missingKeys[] = 'GOOGLE_MAPS_API_KEY';
        }
        
        if (empty($this->config['api']['rentcast_key'])) {
            $missingKeys[] = 'RENTCAST_API_KEY';
        }
        
        if (!empty($missingKeys)) {
            error_log('⚠️ Missing required API keys: ' . implode(', ', $missingKeys));
            error_log('⚠️ Some functionality may not work correctly');
        }
    }
    
    /**
     * Gets RabbitMQ configuration
     * @return array RabbitMQ configuration
     */
    public function getRabbitMQConfig() {
        return $this->config['rabbitmq'];
    }
    
    /**
     * Gets database configuration
     * @return array Database configuration
     */
    public function getDatabaseConfig() {
        return $this->config['database'];
    }
    
    /**
     * Gets API keys
     * @return array API keys
     */
    public function getApiKeys() {
        return $this->config['api'];
    }
    
    /**
     * Gets service URLs
     * @return array Service URLs
     */
    public function getServiceUrls() {
        return $this->config['services'];
    }
    
    /**
     * Creates configuration for a secure file to store API keys
     * @return string JSON string for secure key file
     */
    public function createSecureKeyConfig() {
        $secureConfig = [
            'google_maps_api_key' => $this->config['api']['google_maps_key'],
            'rentcast_api_key' => $this->config['api']['rentcast_key']
        ];
        
        return json_encode($secureConfig, JSON_PRETTY_PRINT);
    }
}

// Create a global instance
$config = new Config();

/**
 * Get configuration instance
 * @return Config Configuration instance
 */
function getConfig() {
    global $config;
    return $config;
}