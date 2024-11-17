// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

import { Board, Cell, Coin } from "./board.ts";

// Prompt
/*
Your program MUST:
- Allow the player to turn on automatic position updating based on their device’s current geolocation (pressing the 🌐 button).
- Use a persistent data storage mechanism to allow the player to continue a gameplay session even after they have closed the game’s browser window.
- Use a polyline to render the player’s movement history.
- Allow the player to reset the game’s state (pressing the 🚮button), effectively returning all coins to their home caches and erasing their (potentially sensitive) location history.

Your game SHOULD:
- Use prompt() to ask the user if they are sure they want to erase their game state before setting.
- Allow users to click a coin identifier to center the map on the location of the coin’s home cache (even if it is very from the current location).

Your game MAY:
- Use an alternate user interface layout is adapted to the use case where most users will control their movement using sensor data. (Direction buttons MUST still be available, but they can be hidden by default until revealed by an additional click.)
*/

// Configuration Settings ---------------------------------------------------------------
const ORIGIN = leaflet.latLng(36.98949379578401, -122.06277128548504);
// oakes: 36.98949379578401, -122.06277128548504
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_WIDTH = 1e-4;
const VISIBILITY_RADIUS = 8;

// HTML Elements ---------------------------------------------------------------
const statusPanel = document.querySelector<HTMLDivElement>("#status-panel")!;
statusPanel.innerHTML = "No points yet...";

const geoLocationButton = document.querySelector<HTMLButtonElement>("#sensor")!;

const resetButton = document.querySelector<HTMLButtonElement>("#reset")!;

const movementButtons = {
  north: document.getElementById("north")!,
  south: document.getElementById("south")!,
  west: document.getElementById("west")!,
  east: document.getElementById("east")!,
};

// Leaflet Elements ---------------------------------------------------------------
const map = leaflet.map(document.getElementById("map")!, {
  center: ORIGIN,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL - 2,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: true,
  scrollWheelZoom: false,
});

// Background
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Player
const playerMarker = leaflet
  .marker(ORIGIN)
  .addTo(map)
  .bindPopup("This is you!")
  .openPopup();

// Leaflet Cell Generation ---------------------------------------------------------------
const board = new Board(TILE_WIDTH, VISIBILITY_RADIUS);

board.loadSession();
statusPanel.innerHTML = displayCoins(board.coins);
let currentCells: Cell[] = board.getCellsNearPoint(ORIGIN);
const cellGroup = leaflet.layerGroup([]).addTo(map);
const polylineGroup = leaflet.layerGroup([]).addTo(map);
let polyline: leaflet.Polyline;

if (board.points) {
  polyline = leaflet.polyline(board.toLatLng(), { color: "red" });
} else {
  polyline = leaflet.polyline([ORIGIN], { color: "red" });
}
polylineGroup.addLayer(polyline);

resetButton.addEventListener("click", () => {
  const confirmation = confirm(
    "Are you sure you want to erase your game state?",
  );
  if (confirmation) {
    board.clearSession();
    statusPanel.innerHTML = displayCoins(board.coins);
    updateCells();
    polylineGroup.clearLayers();
  }
});

let watchId: number;
let geolocationFlag = false;

geoLocationButton.addEventListener("click", () => {
  geolocationFlag = !geolocationFlag;
  toggleGeolocation(geolocationFlag);
});

function toggleGeolocation(flag: boolean) {
  if (flag && "geolocation" in navigator) {
    console.log("Geolocation enabled");
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log(position.coords.latitude, position.coords.longitude);
        const { latitude, longitude } = position.coords;
        const newLatLng = leaflet.latLng(latitude, longitude);

        playerMarker.setLatLng(newLatLng);
        map.setView(newLatLng);

        currentCells.forEach((cell) => {
          board.getCacheForCell(cell);
        });
        currentCells = board.getCellsNearPoint(newLatLng);
        updateCells();
        board.addPoint({ i: newLatLng.lat, j: newLatLng.lng });
        drawLine(newLatLng);
        board.savePolyline();
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
  } else {
    console.log("Geolocation disabled");
    navigator.geolocation.clearWatch(watchId);
  }
}

// Clears the map and generates all current cells
function updateCells() {
  cellGroup.clearLayers();
  currentCells.forEach((cell) => {
    const rectangle = leaflet
      .rectangle(board.getCellBounds(cell))
      .bindPopup(() => createPopup(cell, board.getCoinsInCell(cell)));
    cellGroup.addLayer(rectangle);
  });
}

updateCells();

// Function Defintions ---------------------------------------------------------------
function coinToString(coin: Coin): string {
  return `🪙 ${coin.i}:${coin.j}#${coin.serial}`;
}

function createPopup(cell: Cell, coins: Coin[]): HTMLElement {
  const popupDiv = document.createElement("div");
  popupDiv.innerHTML = displayDescription(cell, coins);

  const pokeButton = popupDiv.querySelector<HTMLButtonElement>("#poke")!;
  const coinDisplay = popupDiv.querySelector<HTMLSpanElement>("#coin-display")!;

  pokeButton.addEventListener("click", () => {
    const cache = board.getCacheForCell(cell);
    if (cache.numCoins > 0) {
      cache.numCoins -= 1;
      board.saveCacheState(cell, cache);
      const collectedCoin = { ...cell, serial: cache.numCoins };
      board.coins.push(collectedCoin);
      coinDisplay.innerHTML = displayCoins(board.getCoinsInCell(cell));
      statusPanel.innerHTML = displayCoins(board.coins);
      board.saveSession();
    }
  });

  return popupDiv;
}

function displayCoins(coins: Coin[]): string {
  return `Coins:<br>${coins.map((coin) => coinToString(coin)).join(" ")}`;
}

function displayDescription(cell: Cell, coins: Coin[]): string {
  return `
    <div>There is a cache here at "${cell.i},${cell.j}".
      <div id="coin-display"> ${displayCoins(coins)} </div>
    </div>
    <button id="poke">poke</button>`;
}

// Player Movement ---------------------------------------------------------------
function movePlayer(deltaLat: number, deltaLng: number) {
  const currentLatLng = playerMarker.getLatLng();
  const newLatLng = leaflet.latLng(
    currentLatLng.lat + deltaLat,
    currentLatLng.lng + deltaLng,
  );
  playerMarker.setLatLng(newLatLng);
  map.setView(newLatLng);

  currentCells.forEach((cell) => {
    board.getCacheForCell(cell);
  });
  currentCells = board.getCellsNearPoint(newLatLng);

  drawLine(newLatLng);
  updateCells();
  board.savePolyline();
}

function drawLine(nextPoint: leaflet.LatLng) {
  board.addPoint({ i: nextPoint.lat, j: nextPoint.lng });
  polyline.addLatLng(nextPoint);
}

movementButtons.north.addEventListener(
  "click",
  () => movePlayer(TILE_WIDTH, 0),
);
movementButtons.south.addEventListener(
  "click",
  () => movePlayer(-TILE_WIDTH, 0),
);
movementButtons.west.addEventListener(
  "click",
  () => movePlayer(0, -TILE_WIDTH),
);
movementButtons.east.addEventListener("click", () => movePlayer(0, TILE_WIDTH));
