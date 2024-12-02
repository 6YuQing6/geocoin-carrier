// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";
import { Board } from "./board.ts";

export class Map {
  private readonly ORIGIN = leaflet.latLng(
    36.98949379578401,
    -122.06277128548504,
  );
  // oakes: 36.98949379578401, -122.06277128548504
  private readonly GAMEPLAY_ZOOM_LEVEL = 19;
  private playerMarker: leaflet.Marker;
  private cellGroup: leaflet.LayerGroup;
  private polylineGroup: leaflet.LayerGroup;
  private map: leaflet.Map;

  constructor(private board: Board) {
    this.map = leaflet.map(document.getElementById("map")!, {
      center: this.ORIGIN,
      zoom: this.GAMEPLAY_ZOOM_LEVEL,
      minZoom: this.GAMEPLAY_ZOOM_LEVEL - 2,
      maxZoom: this.GAMEPLAY_ZOOM_LEVEL,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // background
    leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      })
      .addTo(this.map);

    // Player
    this.playerMarker = leaflet
      .marker(this.ORIGIN)
      .addTo(this.map)
      .bindPopup("This is you!")
      .openPopup();

    // Layer Groups
    this.cellGroup = leaflet.layerGroup([]).addTo(this.map);
    this.polylineGroup = leaflet.layerGroup([]).addTo(this.map);
  }

  // Update UI when the player moves
  updatePlayerPosition(newLatLng: leaflet.LatLng): void {
    this.playerMarker.setLatLng(newLatLng);
    this.map.setView(newLatLng);

    // Update cells and any other map visuals
    this.updateCells(newLatLng);
  }

  updateCells(newLatLng: leaflet.LatLng) {
    this.board.getCellsNearPoint(newLatLng).forEach((cell) => {
      const rectangle = leaflet.rectangle(this.board.getCellBounds(cell));
      this.cellGroup.addLayer(rectangle);
    });
  }
}
