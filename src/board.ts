// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import luck from "./luck.ts";
import { Cache, CacheManager } from "./cache.ts";

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
  private cacheManager: CacheManager = new CacheManager();

  constructor(width: number, radius: number) {
    this.width = width;
    this.radius = radius;
    this.knownCells = new Map<string, Cell>();
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
    const i = Math.floor(point.lat / this.width);
    const j = Math.floor(point.lng / this.width);
    return this.getCanonicalCell({ i, j });
  }

  // gets cell rectangle position
  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const { i, j } = cell;
    const southWest = leaflet.latLng(i * this.width, j * this.width);
    const northEast = leaflet.latLng(
      (i + 1) * this.width,
      (j + 1) * this.width,
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
      { length: 2 * this.radius + 1 },
      (_, k) => k - this.radius,
    );

    // pushes each visible cell into resultCells array
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

  getCoinsInCell(cell: Cell): Coin[] {
    const numCoins = this.getCacheForCell(cell);
    const coins: Coin[] = [];
    for (let serial = 0; serial < numCoins.numCoins; serial++) {
      coins.push({ ...cell, serial });
    }
    return coins;
  }

  getCacheForCell(cell: Cell): Cache {
    const cellKey = `${cell.i}.${cell.j}`;
    let cache = this.cacheManager.getCacheState(cellKey);
    if (!cache) {
      cache = new Cache(cell);
      this.cacheManager.saveCacheState(cellKey, cache);
    }
    return cache;
  }

  saveCacheState(cell: Cell, cache: Cache) {
    const cellKey = `${cell.i}.${cell.j}`;
    this.cacheManager.saveCacheState(cellKey, cache);
  }
}
