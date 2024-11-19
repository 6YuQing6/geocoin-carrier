// main.ts
// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

import { Board, Cell, Coin } from "./board.ts";
import { PlayerState } from "./playerstate.ts";

// Configuration Settings ---------------------------------------------------------------
const ORIGIN = leaflet.latLng(36.98949379578401, -122.06277128548504);
// oakes: 36.98949379578401, -122.06277128548504
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_WIDTH = 1e-4;
const VISIBILITY_RADIUS = 8;

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

// Leaflet Board Display ---------------------------------------------------------------
const board = new Board(TILE_WIDTH, VISIBILITY_RADIUS);
const playerState = new PlayerState();
playerState.loadSession(); // loads from local storage

// leaflet layer groups
const cellGroup = leaflet.layerGroup([]).addTo(map);
const polylineGroup = leaflet.layerGroup([]).addTo(map);

const polyline = leaflet.polyline(
  playerState.points ? playerState.toLatLng() : [ORIGIN],
  {
    color: "red",
  },
);
polylineGroup.addLayer(polyline);

// Clears the map and generates all current cells + gets coins in caches
function updateCells(newLatLng: leaflet.LatLng) {
  cellGroup.clearLayers();
  board.getCellsNearPoint(newLatLng).forEach((cell) => {
    const rectangle = leaflet
      .rectangle(board.getCellBounds(cell))
      .bindPopup(() => createPopup(cell, playerState.getCoinsInCell(cell)));
    cellGroup.addLayer(rectangle);
    playerState.getCacheForCell(cell);
  });
}
updateCells(ORIGIN);

// HTML Elements ---------------------------------------------------------------
const statusPanel = document.querySelector<HTMLDivElement>("#status-panel")!;
statusPanel.innerHTML = "No points yet...";
function updateStatusPanel() {
  statusPanel.innerHTML = displayCoins(playerState.coins);
  statusPanel.querySelectorAll(".coin").forEach((coinElement) => {
    coinElement.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const i = parseFloat(target.dataset.i!);
      const j = parseFloat(target.dataset.j!);
      const cell = { i, j };
      const rectangle = leaflet
        .rectangle(board.getCellBounds({ i, j }))
        .bindPopup(() => createPopup(cell, playerState.getCoinsInCell(cell)))
        .addTo(cellGroup)
        .openPopup();
      map.setView(
        board.getCellBounds({ i, j }).getCenter(),
        GAMEPLAY_ZOOM_LEVEL,
      );
      rectangle.on("popupclose", () => {
        map.setView(playerMarker.getLatLng(), GAMEPLAY_ZOOM_LEVEL);
      });
      cellGroup.addLayer(rectangle);
    });
  });
}
updateStatusPanel();

const geoLocationButton = document.querySelector<HTMLButtonElement>("#sensor")!;
geoLocationButton.addEventListener("click", () => {
  toggleGeolocation();
});

const resetButton = document.querySelector<HTMLButtonElement>("#reset")!;
resetButton.addEventListener("click", () => {
  const confirmation = confirm(
    "Are you sure you want to erase your game state?",
  );
  if (confirmation) {
    playerState.clearSession();
    updateStatusPanel();
    updateCells(playerMarker.getLatLng());
    polylineGroup.clearLayers();
  }
});

const movementButtons = {
  north: document.getElementById("north")!,
  south: document.getElementById("south")!,
  west: document.getElementById("west")!,
  east: document.getElementById("east")!,
};

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

function movePlayer(deltaLat: number, deltaLng: number) {
  const currentLatLng = playerMarker.getLatLng();
  const newLatLng = leaflet.latLng(
    currentLatLng.lat + deltaLat,
    currentLatLng.lng + deltaLng,
  );
  playerMarker.setLatLng(newLatLng);
  map.setView(newLatLng);

  drawLine(newLatLng);
  updateCells(newLatLng);
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

// HTML Display Defintions ---------------------------------------------------------------
function displayCoins(coins: Coin[]): string {
  return `Coins:<br>${
    coins
      .map(
        (coin) =>
          `<span class="coin" data-i="${coin.i}" data-j="${coin.j}" data-serial="${coin.serial}">🪙</span>`,
      )
      .join(" ")
  }`;
}

function displayDescription(cell: Cell, coins: Coin[]): string {
  return `
    <div>There is a cache here at "${cell.i},${cell.j}".
      <div id="coin-display"> ${displayCoins(coins)} </div>
    </div>
    <button id="poke">poke</button>`;
}

function createPopup(cell: Cell, coins: Coin[]): HTMLElement {
  const popupDiv = document.createElement("div");
  popupDiv.innerHTML = displayDescription(cell, coins);

  const pokeButton = popupDiv.querySelector<HTMLButtonElement>("#poke")!;
  const coinDisplay = popupDiv.querySelector<HTMLSpanElement>("#coin-display")!;

  pokeButton.addEventListener("click", () => {
    const cache = playerState.getCacheForCell(cell);
    if (cache.numCoins > 0) {
      cache.numCoins -= 1;
      playerState.saveCacheState(cell, cache);
      const collectedCoin = { ...cell, serial: cache.numCoins };
      playerState.coins.push(collectedCoin);
      coinDisplay.innerHTML = displayCoins(playerState.getCoinsInCell(cell));
      updateStatusPanel();
      playerState.saveSession();
    }
  });

  return popupDiv;
}
