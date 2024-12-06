// main.ts
// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

import { Board } from "./board.ts";
import { PlayerState } from "./playerstate.ts";
import { createLayerGroup, initializeMap } from "./leafletUtils.ts";
import { DOMManager } from "./domUtils.ts";

// Configuration Settings ---------------------------------------------------------------
const ORIGIN = leaflet.latLng(36.98949379578401, -122.06277128548504);
// oakes: 36.98949379578401, -122.06277128548504
const GAMEPLAY_ZOOM_LEVEL = 19;
const board = new Board();
const playerState = new PlayerState();
playerState.loadSession(); // loads from local storage

// Leaflet Elements ---------------------------------------------------------------

const map = initializeMap(
  document.getElementById("map")!,
  ORIGIN,
  GAMEPLAY_ZOOM_LEVEL,
);

// Player
const playerMarker = leaflet
  .marker(ORIGIN)
  .addTo(map)
  .bindPopup("This is you!")
  .openPopup();

// leaflet layer groups
const cellGroup = createLayerGroup(map);
const polylineGroup = createLayerGroup(map);

const polyline = leaflet.polyline(
  playerState.polyline ? playerState.toLatLng() : [ORIGIN],
  {
    color: "red",
  },
);
polylineGroup.addLayer(polyline);

// Board Display ---------------------------------------------------------------
// Clears the map and generates all current cells + gets coins in caches
function updateCells(newLatLng: leaflet.LatLng) {
  cellGroup.clearLayers();
  board.getCellsNearPoint(newLatLng).forEach((cell) => {
    const rectangle = leaflet
      .rectangle(board.getCellBounds(cell))
      .bindPopup(() =>
        domManager.createPopup(
          cell,
          playerState.getCoinsInCell(cell),
          playerState,
        )
      );
    cellGroup.addLayer(rectangle);
    playerState.getCacheForCell(cell);
  });
}
updateCells(ORIGIN);

// HTML Elements ---------------------------------------------------------------
const domManager = new DOMManager();

domManager.updateCoins(playerState.coins);

domManager.bindResetHandler(() => {
  playerState.clearSession();
  domManager.updateCoins(playerState.coins);
  updateCells(playerMarker.getLatLng());
  polylineGroup.clearLayers();
});

// Geolocation toggle
domManager.bindGeoLocationHandler(() => toggleGeolocation());

// Movement button logic
domManager.bindMovementHandlers((deltaLat, deltaLng) => {
  const currentLatLng = playerMarker.getLatLng();
  const newLatLng = leaflet.latLng(
    currentLatLng.lat + deltaLat,
    currentLatLng.lng + deltaLng,
  );
  playerMarker.setLatLng(newLatLng);
  map.setView(newLatLng);
  drawLine(newLatLng);
  updateCells(newLatLng);
});

// Player Movement ---------------------------------------------------------------
function drawLine(nextPoint: leaflet.LatLng) {
  playerState.addPoint({ i: nextPoint.lat, j: nextPoint.lng });
  polyline.addLatLng(nextPoint);
  playerState.saveSession();
}

// Geolocation
let watchId: number | null = null;
function toggleGeolocation() {
  if (watchId === null && "geolocation" in navigator) {
    console.log("Geolocation enabled");
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLatLng = leaflet.latLng(latitude, longitude);

        playerMarker.setLatLng(newLatLng);
        map.setView(newLatLng);

        updateCells(playerMarker.getLatLng());
        drawLine(newLatLng);
      },
      (error) => {
        console.error("Error watching position:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );
  } else if (watchId !== null) {
    console.log("Geolocation disabled");
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
