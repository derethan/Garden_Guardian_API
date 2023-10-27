//Communication
#include <SPI.h>
#include <RPC.h>
#include <WiFi.h>
#include <ArduinoHttpClient.h>

//Connections
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 20, 4); // I2C address 0x27
#include <Wire.h>

//Sensitive Data
#include "arduino_secrets.h" 

//import Directory Files
#include "custom_char.h" 
#include "lcd_functions.h" 
#include "relay_control.h"


//Connection Info
char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;
int status = WL_IDLE_STATUS;
WiFiClient client;

const char* serverAddress = "192.168.0.150";
const int serverPort = 3000;
const char* serverRoute = "/sensors/store";
const char* serverRouteGet = "/sensors/retrieve";

// Defined DHT pins
#define DHTPIN1 2
#define DHTPIN2 3
#define DHTTYPE DHT11
DHT dht1(DHTPIN1, DHTTYPE);
DHT dht2(DHTPIN2, DHTTYPE);

// Defined Relay pins
#define RELAY_PIN 13

// Defined Ambient Temp Sensor
byte NTCPin = A0;
#define SERIESRESISTOR 10000
#define NOMINAL_RESISTANCE 10000
#define NOMINAL_TEMPERATURE 25
#define BCOEFFICIENT 3950

// Define Rotary Encoder pins
#define ROTARY_PIN_A 52 // Change to the actual pin
#define ROTARY_PIN_B 53 // Change to the actual pin
#define ROTARY_BUTTON 51 // Change to the actual pin

//Temperature Variables
float ambientTemp;

// Defined Relay Temp threshold
float targetTemperature = 15.0;

// Define the current page variable and the number of pages
int currentPage = 0;
int numPages = 4; // You have 4 pages - DHT, Relay, Ambient Temp, and Water Flow

//Encoder prositions
volatile int encoderPos = 0;
volatile int lastEncoderPos = 0;

//Track time for Sensor updates
unsigned long previousMillis = 0;
const long interval = 60000; //1000 per second

void setup() {
  Serial.begin(9600);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Initially, turn the relay off

  //Initilaize DHT Sensors
  dht1.begin();
  dht2.begin();

  // Initialize the rotary encoder pins
  initEncoder ();

  //Start LCD Screen --> Show boot Screen
  useLCD ();
  bootScreen ();
  connectWiFi (); // Establish Wifi Connection

  makeGetRequest();
  RPC.begin(); //Enable M4 Core
}
      // DHT Temp
      float temperature1 = dht1.readTemperature();
      float humidity1 = dht1.readHumidity();

void loop() {

    getEncoderPosition ();

    unsigned long currentMillis = millis();

    if (currentMillis - previousMillis >= interval) {
      previousMillis = currentMillis;
      // DHT Temp
      temperature1 = dht1.readTemperature();
      humidity1 = dht1.readHumidity();

      readAmbientTemp ();

      setRelay1 (RELAY_PIN, temperature1, targetTemperature);
        makeGetRequest();

    }

    // Display the appropriate page data based on the current page
    switch (currentPage) {
        case 0:
            displayDHTData(temperature1, humidity1);
            break;
        case 1:
            displayRelayStatus(RELAY_PIN);
            break;
        case 2:
            displayAmbientTemp(ambientTemp);
            break;
        case 3:
            displayWaterFlow();
            break;
        // Add more cases for additional pages if needed.
    }

    // Delay between sensor readings
    delay(2000);


getM4Message ();
}

/*************************************************
*       Functions Below
*
************************************************/
void readAmbientTemp () {

      // Ambient Temp Section
    float ADCvalue;
    float Resistance;

    ADCvalue = analogRead(NTCPin);
    Resistance = (1023.0 / ADCvalue) - 1.0;
    Resistance = SERIESRESISTOR / Resistance;
    ambientTemp = Resistance / NOMINAL_RESISTANCE; // (R/Ro)
    ambientTemp = log(ambientTemp); // ln(R/Ro)
    ambientTemp /= BCOEFFICIENT; // 1/B * ln(R/Ro)
    ambientTemp += 1.0 / (NOMINAL_TEMPERATURE + 273.15); // + (1/To)
    ambientTemp = 1.0 / ambientTemp; // Invert
    ambientTemp -= 273.15; // convert to C

    //Serial.print("Ambient Temperature: ");
    //Serial.println(ambientTemp);

}

void getM4Message () {
    String buffer = "";
    while (RPC.available()) {
      buffer += (char)RPC.read();
    }
    if (buffer.length() > 0) {
      Serial.print(buffer);
    }
}

void initEncoder () {
    // Initialize the rotary encoder pins
  pinMode(ROTARY_PIN_A, INPUT_PULLUP);
  pinMode(ROTARY_PIN_B, INPUT_PULLUP);
  pinMode(ROTARY_BUTTON, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(ROTARY_PIN_A), handleEncoder, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ROTARY_PIN_B), handleEncoder, CHANGE);
}

void  getEncoderPosition () {

      // Handle rotary encoder rotation
    if (encoderPos != lastEncoderPos) {
        if (encoderPos > lastEncoderPos) {
            currentPage = (currentPage + 1) % numPages;
        } else {
            currentPage = (currentPage - 1 + numPages) % numPages;
        }
        lastEncoderPos = encoderPos;
    }

}

// Rotary Encoder Handle
void handleEncoder() {
    static unsigned int lastEncoded = 0;
    static unsigned int newEncoded = 0;

    int MSB = digitalRead(ROTARY_PIN_A);
    int LSB = digitalRead(ROTARY_PIN_B);

    newEncoded = (MSB << 1) | LSB;
    int sum = (lastEncoded << 2) | newEncoded;
    if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
        encoderPos++;
    } else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
        encoderPos--;
    }
    lastEncoded = newEncoded;
}

void connectWiFi() {
  while (!Serial);

  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    lcd.clear ();
    lcd.setCursor(0, 2);
    lcd.print("Wifi");
    lcd.setCursor(0,3);
    lcd.print("Connection Failed");
    delay (2000);
    while (true);
  }

  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to WPA SSID: ");
    Serial.println(ssid);

    lcd.setCursor(0, 2);
    lcd.print("Connecting to");
    lcd.setCursor(0,3);
    lcd.print("Network");
    
    status = WiFi.begin(ssid, pass);
    delay (2000);
  }

  lcd.clear ();
  lcd.setCursor(0, 2);
  lcd.print("Connected to: ");
  lcd.setCursor(0,3);
  lcd.print(String(ssid));
  delay (2000);
  
  Serial.println("You're connected to the network");
  printWifiStatus();
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