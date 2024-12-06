import leaflet from "leaflet";
import { Cell } from "./board.ts";

export function initializeMap(
  mapContainer: HTMLElement,
  center: leaflet.LatLng,
  zoom: number,
) {
  const map = leaflet.map(mapContainer, {
    center,
    zoom,
    minZoom: zoom - 2,
    maxZoom: zoom,
    zoomControl: true,
    scrollWheelZoom: false,
  });

  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    .addTo(map);

  return map; // Return the map instance
}

export function createLayerGroup(map: leaflet.Map): leaflet.LayerGroup {
  const layerGroup = leaflet.layerGroup([]).addTo(map);
  return layerGroup;
}

export function updateLayer(
  layerGroup: leaflet.LayerGroup,
  cells: Cell[],
  getCellBounds: (cell: Cell) => leaflet.LatLngBoundsExpression,
  getPopupContent: (cell: Cell) => string,
) {
  layerGroup.clearLayers();
  cells.forEach((cell) => {
    const rectangle = leaflet
      .rectangle(getCellBounds(cell))
      .bindPopup(getPopupContent(cell));
    layerGroup.addLayer(rectangle);
  });
}
