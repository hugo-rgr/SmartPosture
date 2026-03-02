#include <Adafruit_MPU6050.h>
// #include <Adafruit_Sensor.h>
#include <Wire.h>

Adafruit_MPU6050 mpu;

void setup(void) {
  Serial.begin(115200);

  while (!mpu.begin()) {
    Serial.println("MPU6050 not connected!");
    delay(1000);
  }
  Serial.println("MPU6050 ready!");
}

sensors_event_t event;

void loop() {
  sensors_event_t event;
  mpu.getAccelerometerSensor()->getEvent(&event);

  // On construit une chaîne JSON propre
  Serial.print("{\"timestamp\":");
  Serial.print(millis());
  Serial.print(",\"ax\":");
  Serial.print(event.acceleration.x);
  Serial.print(",\"ay\":");
  Serial.print(event.acceleration.y);
  Serial.print(",\"az\":");
  Serial.print(event.acceleration.z);
  Serial.println("}"); // Fin du JSON et retour à la ligne
  
  delay(500);
}