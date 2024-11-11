// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

import { Board, Cell, Coin } from "./board.ts";

// Configuration Settings ---------------------------------------------------------------
const ORIGIN = leaflet.latLng(0, 0);
// oakes: 36.98949379578401, -122.06277128548504
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_WIDTH = 1e-4;
const VISIBILITY_RADIUS = 8;
const collectedCoins: Coin[] = [];

// HTML Elements ---------------------------------------------------------------
const statusPanel = document.querySelector<HTMLDivElement>("#status-panel")!; // element `statusPanel` is defined in index.html
statusPanel.innerHTML = "No points yet...";

// Leaflet Elements ---------------------------------------------------------------
const map = leaflet.map(document.getElementById("map")!, {
  center: ORIGIN,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
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
let currentCells: Cell[] = board.getCellsNearPoint(ORIGIN);
const currentRectangles = leaflet.layerGroup([]).addTo(map);

// Binds a rectangle popup to each cell
function updateCells() {
  currentRectangles.clearLayers();
  currentCells.forEach((cell) => {
    const rectangle = leaflet
      .rectangle(board.getCellBounds(cell))
      .bindPopup(() => createPopup(cell, board.getCoinsInCell(cell)));
    currentRectangles.addLayer(rectangle);
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

  popupDiv
    .querySelector<HTMLButtonElement>("#poke")!
    .addEventListener("click", () => {
      const cache = board.getCacheForCell(cell);
      if (cache.numCoins > 0) {
        cache.numCoins -= 1;
        board.saveCacheState(cell, cache);
        const collectedCoin = { ...cell, serial: cache.numCoins };
        collectedCoins.push(collectedCoin);
        popupDiv.querySelector<HTMLSpanElement>("#coin-display")!.innerHTML =
          displayCoins(board.getCoinsInCell(cell));
        statusPanel.innerHTML = displayCoins(collectedCoins);
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
const movementButtons = {
  north: document.getElementById("north")!,
  south: document.getElementById("south")!,
  west: document.getElementById("west")!,
  east: document.getElementById("east")!,
};

function movePlayer(deltaLat: number, deltaLng: number) {
  const currentLatLng = playerMarker.getLatLng();
  const newLatLng = leaflet.latLng(
    currentLatLng.lat + deltaLat,
    currentLatLng.lng + deltaLng,
  );
  playerMarker.setLatLng(newLatLng);
  map.setView(newLatLng);

  // Save current cache states
  currentCells.forEach((cell) => {
    const cache = board.getCacheForCell(cell);
    board.saveCacheState(cell, cache);
  });

  currentCells = board.getCellsNearPoint(newLatLng);
  updateCells();
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
