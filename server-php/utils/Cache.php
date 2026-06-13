<?php
namespace Utils;

class Cache {
    private static $redis = null;
    private static $enabled = null;

    private static function init() {
        if (self::$enabled !== null) {
            return self::$enabled;
        }

        if (!class_exists('Redis')) {
            self::$enabled = false;
            return false;
        }

        $host = $_ENV['REDIS_HOST'] ?? getenv('REDIS_HOST') ?: '127.0.0.1';
        $port = (int)($_ENV['REDIS_PORT'] ?? getenv('REDIS_PORT') ?: 6379);
        $password = $_ENV['REDIS_PASSWORD'] ?? getenv('REDIS_PASSWORD') ?: null;

        try {
            self::$redis = new \Redis();
            // Connect with a 1.0 second timeout to prevent blocking page loads if Redis is down
            $connected = @self::$redis->connect($host, $port, 1.0);
            if ($connected) {
                if ($password !== null && $password !== '') {
                    @self::$redis->auth($password);
                }
                // Option prefix to prevent namespace collisions
                @self::$redis->setOption(\Redis::OPT_PREFIX, 'ksubzone:');
                self::$enabled = true;
            } else {
                error_log("Failed to connect to Redis server at {$host}:{$port}");
                self::$enabled = false;
            }
        } catch (\Exception $e) {
            error_log("Redis connection error: " . $e->getMessage());
            self::$enabled = false;
        }

        return self::$enabled;
    }

    /**
     * Get a cached value.
     * 
     * @param string $key
     * @return mixed|false The decoded cached value or false on failure/miss.
     */
    public static function get($key) {
        if (!self::init()) {
            return false;
        }
        try {
            $val = self::$redis->get($key);
            if ($val === false) {
                return false;
            }
            return json_decode($val, true);
        } catch (\Exception $e) {
            error_log("Redis get error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Set a cached value.
     * 
     * @param string $key
     * @param mixed $val Value to cache (serializable to JSON)
     * @param int $ttl Time-to-live in seconds (default 1 hour)
     * @return bool
     */
    public static function set($key, $val, $ttl = 3600) {
        if (!self::init()) {
            return false;
        }
        try {
            $jsonVal = json_encode($val);
            return self::$redis->setex($key, $ttl, $jsonVal);
        } catch (\Exception $e) {
            error_log("Redis set error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a cached value.
     * 
     * @param string $key
     * @return bool
     */
    public static function delete($key) {
        if (!self::init()) {
            return false;
        }
        try {
            return self::$redis->del($key) > 0;
        } catch (\Exception $e) {
            error_log("Redis delete error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Flush all prefix keys or clear all databases.
     * 
     * @return bool
     */
    public static function flush() {
        if (!self::init()) {
            return false;
        }
        try {
            return self::$redis->flushAll();
        } catch (\Exception $e) {
            error_log("Redis flush error: " . $e->getMessage());
            return false;
        }
    }
}
