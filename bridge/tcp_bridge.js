require('dotenv').config();
const net = require('net');
const mqtt = require('mqtt');

// Configuration
const TCP_HOST = process.env.WOKWI_HOST || '127.0.0.1';
const TCP_PORT_1 = parseInt(process.env.WOKWI_PORT_1) || 4000;
const TCP_PORT_2 = parseInt(process.env.WOKWI_PORT_2) || 4001;
const MQTT_BROKER = process.env.MQTT_BROKER;
const TOPIC_TEMPLATE = process.env.MQTT_TOPIC_TEMPLATE || 'safewear/{gilet_id}/capteurs';

console.log(`- Connecting to MQTT Broker (${MQTT_BROKER})...`);
const mqttClient = mqtt.connect(MQTT_BROKER);

// Helper function to set up a TCP client
function setupTcpClient(tcpPort) {
    let buffer = "";
    const tcpClient = new net.Socket();
    console.log(`- Connecting to Wokwi flow (TCP ${tcpPort})...`);

    tcpClient.connect(tcpPort, TCP_HOST, () => {
        console.log(`--- Successfully connected to Wokwi RFC2217 server (port ${tcpPort}).`);
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
                            console.warn(`- Warning: Received data without 'id' field from port ${tcpPort}. Ignoring this entry.`);
                            return;
                        }
                        const updatedTopic = TOPIC_TEMPLATE.replace('gilet_id', data.id || 'unknown');
                        mqttClient.publish(updatedTopic, cleanLine);
                        console.log(`- [TCP ${tcpPort} -> MQTT] :`, cleanLine);
                    } catch (error) {
                        console.error(`- Error parsing JSON data from port ${tcpPort}:`, error.message);
                    }
                    
                }
            });
        }
    });

    tcpClient.on('error', (err) => {
        console.error(`- Error while connecting to TCP server (port ${tcpPort}):`, err.message);
        // Tentative de reconnexion automatique dans 5 secondes
        setTimeout(() => tcpClient.connect(tcpPort, TCP_HOST), 5000);
    });

    tcpClient.on('close', () => {
        console.log(`- Connection to TCP server (port ${tcpPort}) closed. Attempting to reconnect...`);
        // Tentative de reconnexion automatique dans 5 secondes
        setTimeout(() => tcpClient.connect(tcpPort, TCP_HOST), 5000);
    });

    return tcpClient;
}

mqttClient.on('connect', () => {
    console.log("--- Successfully connected to MQTT Broker.");

    // Une fois MQTT prêt, on se connecte aux flux TCP de Wokwi (port 4000 et 4001)
    setupTcpClient(TCP_PORT_1);
    setupTcpClient(TCP_PORT_2);
});