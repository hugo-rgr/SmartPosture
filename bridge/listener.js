/**
 * FOR TESTING PURPOSES ONLY
 */
const mqtt = require('mqtt');
const BROKER_URL = 'mqtt://test.mosquitto.org';
const TOPIC = 'safewear/gilet_01/capteurs';

const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log("--- En écoute du gilet sur le topic...");
    // Abonnement au topic pour recevoir les messages publiés par le gilet
    client.subscribe(TOPIC); 
});

client.on('message', (topic, message) => {
    console.log(`- ${message.toString()}`);
});