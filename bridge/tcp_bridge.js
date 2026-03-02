const net = require('net');
const mqtt = require('mqtt');

// Configuration
const TCP_HOST = '127.0.0.1';
const TCP_PORT = 4000;
const MQTT_BROKER = 'mqtt://test.mosquitto.org'; 
const TOPIC = 'safewear/gilet_01/capteurs';

const mqttClient = mqtt.connect(MQTT_BROKER);
let buffer = "";

mqttClient.on('connect', () => {
    console.log("--- Successfully connected to MQTT Broker.");

    // Une fois MQTT prêt, on se connecte au flux TCP de Wokwi
    const tcpClient = new net.Socket();

    console.log(`- Connecting to Wokwi flow (TCP ${TCP_PORT})...`);

    tcpClient.connect(TCP_PORT, TCP_HOST, () => {
        console.log("--- Successfully connected to Wokwi RFC2217 server.");
    });

    tcpClient.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // On découpe par ligne
        if (buffer.includes('\n')) {
            const lines = buffer.split('\n');
            buffer = lines.pop(); // On garde le morceau incomplet

            lines.forEach(line => {
                const cleanLine = line.trim();
                // On vérifie si c'est bien notre JSON
                if (cleanLine.startsWith('{') && cleanLine.endsWith('}')) {
                    mqttClient.publish(TOPIC, cleanLine);
                    console.log("- [TCP -> MQTT] :", cleanLine);
                }
            });
        }
    });

    tcpClient.on('error', (err) => {
        console.error("- Error while connecting to TCP server :", err.message);
        // Tentative de reconnexion automatique dans 5 secondes
        setTimeout(() => tcpClient.connect(TCP_PORT, TCP_HOST), 5000);
    });

    tcpClient.on('close', () => {
        console.log("- Connection to TCP server closed. Attempting to reconnect...");
    });
});