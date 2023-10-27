#include <SPI.h>
#include <DHT.h>
#define DHTPIN 2
#define DHTTYPE DHT11
#define RELAY_PIN 7
DHT dht(DHTPIN, DHTTYPE);

#include <WiFi.h>
#include <ArduinoHttpClient.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

#include "arduino_secrets.h" 

char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;
const char* serverAddress = "192.168.0.150";
const int serverPort = 80;
const char* serverRoute = "/sensordata";
const char* serverRouteGet = "/test1";
int status = WL_IDLE_STATUS;
WiFiClient client;

void setup() {
  Serial.begin(9600);
  lcd.init();
  lcd.backlight();

  while (!Serial);

  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    while (true);
  }

  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to WPA SSID: ");
    Serial.println(ssid);
    status = WiFi.begin(ssid, pass);
    delay(10000);
  }

  Serial.print("You're connected to the network");
  printWifiStatus();

  Serial.println("\nStarting connection to server...");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  dht.begin();
  makeGetRequest();
}

float targetTemperature = 20.0;
unsigned long previousMillis = 0;
const long interval = 60000;

float temperature = dht.readTemperature();
float humidity = dht.readHumidity();

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    temperature = dht.readTemperature();
    humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Error reading temperature and humidity!");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Error reading temperature and humidity!");
      delay(2000);
    } else {
      Serial.println("BAMF Grow Room Info");
      Serial.println();
      Serial.print("The Current Temperature is: ");
      Serial.println(temperature);
      Serial.print("The Humidity Level: ");
      Serial.print(humidity);
      Serial.println("%");
      Serial.println();
    }

    if (temperature <= targetTemperature) {
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("Heater is on");
    } else {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("Heater is off");
    }

    if (shouldSendData()) {
      sendSensorData(temperature, humidity);
    }
  }

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Temperature: " + String(temperature, 1) + " C");
      lcd.setCursor(0, 1);
      lcd.print("Humidity: " + String(humidity, 1) + "%");
      delay(2000);
}

bool shouldSendData() {
  return true; // Replace with your condition
}

void makeGetRequest() {
  WiFiClient wifiClient;
  HttpClient client(wifiClient, serverAddress, serverPort);

  client.get(serverRouteGet);

  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  if (statusCode > 0) {
    Serial.print("HTTP Response Status Code: ");
    Serial.println(statusCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.println("HTTP Request failed");
  }
}

void sendSensorData(float temperature, float humidity) {
  WiFiClient wifiClient;
  HttpClient client(wifiClient, serverAddress, serverPort);

  String jsonPayload = "{\"temperature\":" + String(temperature, 1) + ", \"humidity\":" + String(humidity, 1) + "}";

  client.post(serverRoute, "application/json", jsonPayload);

  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  if (statusCode > 0) {
    Serial.print("HTTP Response Status Code: ");
    Serial.println(statusCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.println("HTTP Request failed");
  }
}

void printWifiStatus() {
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);
  long rssi = WiFi.RSSI();
  Serial.print("Signal Strength (RSSI): ");
  Serial.print(rssi);
  Serial.println(" dBm");
}
