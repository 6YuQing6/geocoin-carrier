// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

import { Board, Cell, Coin } from "./board.ts";

// HTML Elements ---------------------------------------------------------------
const statusPanel = document.querySelector<HTMLDivElement>("#status-panel")!; // element `statusPanel` is defined in index.html
statusPanel.innerHTML = "No points yet...";

// Leaflet Map Settings ---------------------------------------------------------------
const ORIGIN = leaflet.latLng(0, 0);
// oakes: 36.98949379578401, -122.06277128548504
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_WIDTH = 1e-4;
const VISIBILITY_RADIUS = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
const collectedCoins: Coin[] = [];

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

leaflet.marker(ORIGIN).addTo(map).bindPopup("This is you!").openPopup();

// Leaflet Random Cells ---------------------------------------------------------------
const board = new Board(TILE_WIDTH, VISIBILITY_RADIUS, CACHE_SPAWN_PROBABILITY);
const currentCells: Cell[] = board.getCellsNearPoint(ORIGIN);

currentCells.forEach((cell) => {
  const bounds = board.getCellBounds(cell);
  const coins = board.getCoinsInCell(cell);
  leaflet
    .rectangle(bounds)
    .addTo(map)
    .bindPopup(() => createPopup(cell, coins));
});

function createPopup(cell: Cell, coins: Coin[]): HTMLElement {
  // Popup description
  const popupDiv = document.createElement("div");
  popupDiv.innerHTML = displayDescription(cell, coins);

  // Poke button functionality
  popupDiv
    .querySelector<HTMLButtonElement>("#poke")!
    .addEventListener("click", () => {
      if (coins.length <= 0) {
        return;
      }
      const coin = coins.pop()!;
      collectedCoins.push(coin);
      popupDiv.querySelector<HTMLSpanElement>("#coin-display")!.innerHTML =
        displayCoins(coins);
      statusPanel.innerHTML = displayCoins(collectedCoins);
    });

  return popupDiv;
}

// helper display functions
function displayCoins(coins: Coin[]): string {
  return `Coins: ${
    coins
      .map((coin) => `${coin.i}:${coin.j}#${coin.serial}`)
      .join("  ")
  }`;
}

function displayDescription(cell: Cell, coins: Coin[]): string {
  return `
    <div>There is a cache here at "${cell.i},${cell.j}".
      <div id="coin-display"> ${displayCoins(coins)} </div>
    </div>
    <button id="poke">poke</button>`;
}
