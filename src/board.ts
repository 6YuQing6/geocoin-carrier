// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import luck from "./luck.ts";

export interface Cell {
  readonly i: number;
  readonly j: number;
}

export interface Coin {
  readonly i: number;
  readonly j: number;
  readonly serial: number;
}

const CACHE_SPAWN_PROBABILITY = 0.1;

export class Board {
  readonly width: number;
  readonly radius: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(width: number, radius: number) {
    this.width = width;
    this.radius = radius;
    this.knownCells = new Map<string, Cell>();
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = `${i}.${j}`;
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, cell);
    }
    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    const i = Math.floor(point.lat / this.width);
    const j = Math.floor(point.lng / this.width);
    return this.getCanonicalCell({ i, j });
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const { i, j } = cell;
    const southWest = leaflet.latLng(i * this.width, j * this.width);
    const northEast = leaflet.latLng(
      (i + 1) * this.width,
      (j + 1) * this.width,
    );
    return leaflet.latLngBounds(southWest, northEast);
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    const { i, j } = originCell;

    const range = Array.from(
      { length: 2 * this.radius + 1 },
      (_, k) => k - this.radius,
    );

    range.forEach((di) => {
      range.forEach((dj) => {
        if (luck([i + di, j + dj].toString()) < CACHE_SPAWN_PROBABILITY) {
          const cell = this.getCanonicalCell({ i: i + di, j: j + dj });
          resultCells.push(cell);
        }
      });
    });

    return resultCells;
  }
}
