/**
 * FOR TESTING PURPOSES ONLY
 */
require('dotenv').config();
const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER;
const GILET_ID = process.env.TEST_GILET_ID || 'gilet_01';
const TOPIC = process.env.MQTT_TOPIC_TEMPLATE.replace('gilet_id', GILET_ID);

console.log(`- Connexion au broket MQTT (${BROKER_URL})...`);
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log("--- En écoute du gilet sur le topic...");
    // Abonnement au topic pour recevoir les messages publiés par le gilet
    client.subscribe(TOPIC); 
});

client.on('message', (topic, message) => {
    console.log(`- ${message.toString()}`);
});