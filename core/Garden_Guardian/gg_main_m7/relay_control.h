void setRelay1 (int RELAY_PIN, float temperature1, float targetTemperature) {
      // Relay 1
    if (temperature1 <= targetTemperature) {
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Heater Relay is ON");
    } else {
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("Heater Relay is OFF");
    }
}