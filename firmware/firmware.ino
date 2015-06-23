#include <Adafruit_NeoPixel.h>
#define PIN 6

Adafruit_NeoPixel strip = Adafruit_NeoPixel(240, PIN, NEO_GRB + NEO_KHZ800);



void setup() {
  strip.begin();
  strip.show();
}

void loop() {
  for(int i=0; i<240; i++){
    strip.setPixelColor(i, 120, 255, 200);
  }
  strip.show();
}
