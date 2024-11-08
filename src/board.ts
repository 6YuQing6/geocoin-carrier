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

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;
  readonly spawnProbability: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(
    tileWidth: number,
    tileVisibilityRadius: number,
    spawnProbability: number,
  ) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map<string, Cell>();
    this.spawnProbability = spawnProbability;
  }

  // retrieves cell from map of cells
  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = `${i}.${j}`;
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, cell);
    }
    return this.knownCells.get(key)!;
  }

  // checks to see which cell you are in
  getCellForPoint(point: leaflet.LatLng): Cell {
    const i = Math.floor(point.lat / this.tileWidth);
    const j = Math.floor(point.lng / this.tileWidth);
    return this.getCanonicalCell({ i, j });
  }

  // gets cell rectangle position
  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const { i, j } = cell;
    const southWest = leaflet.latLng(i * this.tileWidth, j * this.tileWidth);
    const northEast = leaflet.latLng(
      (i + 1) * this.tileWidth,
      (j + 1) * this.tileWidth,
    );
    return leaflet.latLngBounds(southWest, northEast);
  }

  // gets cells near a origin point
  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    const { i, j } = originCell;

    // gets range of surrounding i,j points in a circle based on visibility radius
    const range = Array.from(
      { length: 2 * this.tileVisibilityRadius + 1 },
      (_, k) => k - this.tileVisibilityRadius,
    );

    // pushes each visible cell into resultCells array
    range.forEach((di) => {
      range.forEach((dj) => {
        if (luck([i + di, j + dj].toString()) < this.spawnProbability) {
          const cell = this.getCanonicalCell({ i: i + di, j: j + dj });
          resultCells.push(cell);
        }
      });
    });

    return resultCells;
  }

  getCoinsInCell(cell: Cell): Coin[] {
    const resultCoins: Coin[] = [];
    console.log("holllaa");
    const numCoins = Math.floor(
      luck([cell.i, cell.j, "initialValue"].toString()) * 50,
    );
    for (let s = 0; s < numCoins; s++) {
      resultCoins.push({ ...cell, serial: s });
      console.log("helo");
    }
    console.log(resultCoins);
    return resultCoins;
  }
}
