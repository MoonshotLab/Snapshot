#include <Adafruit_NeoPixel.h>
#define PIN 6

Adafruit_NeoPixel strip = Adafruit_NeoPixel(46, PIN, NEO_GRB + NEO_KHZ800);



void setup() {
  strip.begin();
  strip.show();
}

void loop() {
  for(int i=0; i<45; i++){
    strip.setPixelColor(i, 255, 200, 0);
  }

  strip.show();
  delay(10);
}
