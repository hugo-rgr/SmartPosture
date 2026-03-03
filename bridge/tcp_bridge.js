require('dotenv').config();
const net = require('net');
const mqtt = require('mqtt');

// Configuration
const TCP_HOST = process.env.WOKWI_HOST || '127.0.0.1';
const TCP_PORT = parseInt(process.env.WOKWI_PORT) || 4000;
const MQTT_BROKER = process.env.MQTT_BROKER;
const TOPIC_TEMPLATE = process.env.MQTT_TOPIC_TEMPLATE || 'safewear/{gilet_id}/capteurs';

console.log(`- Connecting to MQTT Broker (${MQTT_BROKER})...`);
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
                    try {
                        const data = JSON.parse(cleanLine);
                        if (!data.id) {
                            console.warn("- Warning: Received data without 'id' field. Ignoring this entry.");
                            return;
                        }
                        const updatedTopic = TOPIC_TEMPLATE.replace('gilet_id', data.id || 'unknown');
                        mqttClient.publish(updatedTopic, cleanLine);
                        console.log("- [TCP -> MQTT] :", cleanLine);
                    } catch (error) {
                        console.error("- Error parsing JSON data:", error.message);
                    }
                    
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
        // Tentative de reconnexion automatique dans 5 secondes
        setTimeout(() => tcpClient.connect(TCP_PORT, TCP_HOST), 5000);
    });
});