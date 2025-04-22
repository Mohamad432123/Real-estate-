<?php
require_once __DIR__ . '/vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;


$RABBITMQ_HOST = "100.107.33.60";
$RABBITMQ_PORT = 5673;
$RABBITMQ_USER = "admin";
$RABBITMQ_PASS = "admin";
$RABBITMQ_QUEUE = "frontend_to_backend";


$DB_HOSTS = ['100.82.47.115', '100.82.166.82', '100.107.33.60', '127.0.0.1'];
$DB_PORT = 3306;
$DB_NAME = "real_estate";
$DB_USER = "root";
$DB_PASS = "admin";
$DB_TIMEOUT = 3; 

try {
    echo "🔄 Connecting to RabbitMQ...\n";
    $connection = new AMQPStreamConnection($RABBITMQ_HOST, $RABBITMQ_PORT, $RABBITMQ_USER, $RABBITMQ_PASS);
    $channel = $connection->channel();
    $channel->queue_declare($RABBITMQ_QUEUE, false, true, false, false);
    echo "✅ Waiting for messages on queue: $RABBITMQ_QUEUE\n";

    $callback = function ($msg) use ($DB_HOSTS, $DB_PORT, $DB_NAME, $DB_USER, $DB_PASS, $DB_TIMEOUT) {
        echo "📩 Received message: {$msg->body}\n";

        $data = json_decode($msg->body, true);
        $channel = $msg->getChannel();
        $replyTo = $msg->get('reply_to');
        $corrId = $msg->get('correlation_id');

        $response = [
            "status" => "error",
            "message" => "Unknown error"
        ];

        if (!$data || !isset($data['action'])) {
            echo "❌ Invalid message format: 'action' missing\n";
            return;
        }

        try {
            $pdo = null;
            foreach ($DB_HOSTS as $host) {
                echo "🔌 Attempting to connect to $host:$DB_PORT...\n";
                
                try {
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_TIMEOUT => $DB_TIMEOUT
                    ];
                    
                    $pdo = new PDO("mysql:host=$host;port=$DB_PORT;dbname=$DB_NAME;charset=utf8", 
                                   $DB_USER, $DB_PASS, $options);
                    
                    echo "✅ Connected to MySQL on $host\n";
                    break;
                } catch (PDOException $e) {
                    echo "❌ Failed to connect to $host: " . $e->getMessage() . "\n";
                    $pdo = null;
                }
            }
            
            if (!$pdo) {
                throw new Exception("❌ All DB nodes failed. Cannot process request.");
            }

            if ($data['action'] === 'signup') {
                $name = $data['name'] ?? ($data['username'] ?? '');
                $email = $data['email'] ?? '';
                $password = $data['password'] ?? '';

                if (!$name || !$email || !$password) {
                    $response = ["status" => "error", "message" => "Missing signup fields"];
                } else {
                    $hash = password_hash($password, PASSWORD_BCRYPT);
                    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
                    $stmt->execute([$name, $email, $hash]);
                    $response = ["status" => "success", "message" => "Signup successful"];
                    echo "✅ User registered: $email\n";
                }

            } elseif ($data['action'] === 'login') {
                $email = $data['email'] ?? '';
                $password = $data['password'] ?? '';

                $stmt = $pdo->prepare("SELECT id, name, password FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();

                if ($user && password_verify($password, $user['password'])) {
                    $response = [
                        "status" => "success",
                        "message" => "Login successful",
                        "user" => [
                            "id" => $user['id'],
                            "name" => $user['name'],
                            "email" => $email
                        ]
                    ];
                    echo "✅ Login success: {$user['name']}\n";
                } else {
                    $response = ["status" => "error", "message" => "Invalid credentials"];
                    echo "❌ Login failed for $email\n";
                }

            } else {
                $response = ["status" => "error", "message" => "Unknown action: " . $data['action']];
            }

            if ($replyTo && $corrId) {
                $replyMsg = new AMQPMessage(json_encode($response), [
                    'correlation_id' => $corrId
                ]);
                $channel->basic_publish($replyMsg, '', $replyTo);
                echo "📤 Replied to $replyTo with correlation_id $corrId\n";
            }

        } catch (Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
            // Send error response if we have reply info
            if ($replyTo && $corrId) {
                $errorResponse = [
                    "status" => "error",
                    "message" => "Server error: " . $e->getMessage()
                ];
                $replyMsg = new AMQPMessage(json_encode($errorResponse), [
                    'correlation_id' => $corrId
                ]);
                $channel->basic_publish($replyMsg, '', $replyTo);
            }
        }
    };

    $channel->basic_consume($RABBITMQ_QUEUE, '', false, true, false, false, $callback);

    while ($channel->is_consuming()) {
        $channel->wait();
    }

    $channel->close();
    $connection->close();

} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
}