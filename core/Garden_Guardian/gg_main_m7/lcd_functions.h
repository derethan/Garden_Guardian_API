//Initialize LCD
void useLCD () {
  lcd.init(); // initialize the LCD
  lcd.backlight();
  lcd.createChar(0, Heart);
  lcd.createChar(1, Cup);
  lcd.createChar(2, Shield);
  lcd.createChar(3, LineTop);
  lcd.createChar(4, arrowleft);
  lcd.createChar(5, arrowright);
}

//Display the Boot Screen
void bootScreen () {

  lcd.clear();
  lcd.setCursor(8, 1);
  lcd.print("BAMF");
  lcd.setCursor(2, 2);
  lcd.print("Garden Guardian");
  lcd.setCursor(17, 2);
  lcd.write(byte(0));
  delay(1000);
  lcd.setCursor(17, 2);
  lcd.write(byte(2));
  delay(1000);
  lcd.setCursor(17, 2);
  lcd.write(byte(0));
  delay(1000);
  lcd.setCursor(17, 2);
  lcd.write(byte(2));
  delay(1000);
  lcd.setCursor(17, 2);
  lcd.write(byte(0));
  delay(1000);
  lcd.setCursor(17, 2);
  lcd.write(byte(2));
  delay(1000);
  lcd.setCursor(17, 2);
  lcd.write(byte(0));
  delay(1000);
  lcd.clear();

}

// Function to display DHT sensor data
void displayDHTData(float temperature, float humidity) {
    // Clear the LCD
    lcd.clear();
    // Display the data on the LCD
    lcd.setCursor(0, 0);
    lcd.write(byte(4));
    lcd.setCursor(1, 0);
    lcd.print("Grow Area Temp. #1");
    lcd.setCursor(19, 0);
    lcd.write(byte(5));
    lcd.setCursor(0, 1);
    for (int i = 0; i < 20; i++) {
        lcd.write(byte(3));  // Display the custom character Line 20 times
    }
    lcd.setCursor(0, 2);
    lcd.print("Temperature: " + String(temperature) + " C");
    lcd.setCursor(0, 3);
    lcd.print("Humidity: " + String(humidity) + " %");
}

// Function to display ambient temperature
void displayAmbientTemp(float ambientTemp) {
    // Clear the LCD
    lcd.clear();
    // Display ambient temperature data on the LCD
    lcd.setCursor(0, 0);
    lcd.write(byte(4));
    lcd.setCursor(2, 0);
    lcd.print("Room Temperature");
    lcd.setCursor(19, 0);
    lcd.write(byte(5));
    lcd.setCursor(0, 1);
    for (int i = 0; i < 20; i++) {
        lcd.write(byte(3));  // Display the custom character Line 20 times
    }
    lcd.setCursor(0, 2);
    lcd.print("Temperature: " + String(ambientTemp) + " C");
}


// Function to display relay status
void displayRelayStatus(int RELAY_PIN) {
    // Clear the LCD
    lcd.clear();
    // Read relay status
    int relayStatus = digitalRead(RELAY_PIN);
    // Display the data on the LCD
    lcd.setCursor(0, 0);
    lcd.write(byte(4));
    lcd.setCursor(2, 0);
    lcd.print("Relay #1  Status");
    lcd.setCursor(19, 0);
    lcd.write(byte(5));
    lcd.setCursor(0, 1);
    for (int i = 0; i < 20; i++) {
        lcd.write(byte(3));  // Display the custom character Line 20 times
    }
    lcd.setCursor(0, 2);
    if (relayStatus == LOW) {
        lcd.print("Heater is ON");
    } else {
        lcd.print("Heater is OFF");
    }
}

// Function to display water flow data
void displayWaterFlow() {
    // Clear the LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.write(byte(4));
    lcd.setCursor(1, 0);
    lcd.print("Water Flow Monitor");
    lcd.setCursor(19, 0);
    lcd.write(byte(5));
    lcd.setCursor(0, 1);
    for (int i = 0; i < 20; i++) {
        lcd.write(byte(3));  // Display the custom character Line 20 times
    }
}