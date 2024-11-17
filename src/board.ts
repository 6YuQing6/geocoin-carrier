// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import luck from "./luck.ts";
import { Cache, Point } from "./cache.ts";

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
  private caches: Map<string, string> = new Map();
  coins: Coin[] = [];
  points: string[];

  constructor(width: number, radius: number) {
    this.width = width;
    this.radius = radius;
    this.knownCells = new Map<string, Cell>();
    this.points = [];
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

  saveCacheState(cell: Cell, cache: Cache) {
    const cellKey = `${cell.i}.${cell.j}`;
    this.caches.set(cellKey, cache.toMomento());
  }

  getCacheForCell(cell: Cell): Cache {
    const cellKey = `${cell.i}.${cell.j}`;
    const cacheMomento = this.caches.get(cellKey);
    if (!cacheMomento) {
      const cache = new Cache(cell);
      return cache;
    } else {
      return new Cache(cell).fromMomento(cacheMomento);
    }
  }

  saveSession() {
    // cache
    const c: { key: string; value: string }[] = [];
    this.caches.forEach((value, key) => {
      c.push({ key: key, value: value });
    });
    localStorage.setItem("caches", JSON.stringify(c));

    // coins
    localStorage.setItem("coins", JSON.stringify(this.coins));
  }

  savePolyline() {
    // polyline
    localStorage.setItem("polyline", JSON.stringify(this.points));
  }

  loadSession() {
    // cache
    const c = localStorage.getItem("caches");
    if (c) {
      const cachesession: Array<{ key: string; value: string }> = JSON.parse(c);
      this.caches = new Map(cachesession.map((item) => [item.key, item.value]));
    }

    // coins
    const coins = localStorage.getItem("coins");
    if (coins) {
      this.coins = JSON.parse(coins);
    }

    // polyline
    const p = localStorage.getItem("polyline");
    if (p) {
      this.points = JSON.parse(p);
    }
  }

  clearSession() {
    localStorage.removeItem("caches");
    localStorage.removeItem("coins");
    localStorage.removeItem("polyline");
    this.caches.clear();
    this.coins = [];
    this.points = [];
  }

  // adds point to polyline
  addPoint(point: Cell) {
    const p = new Point(point);
    this.points.push(p.toMomento());
    return this.points;
  }

  toLatLng(): leaflet.LatLng[] {
    const latLngPoints = this.points.map((point) => {
      const p = new Point().fromMomento(point);
      return leaflet.latLng(p.i, p.j);
    });
    return latLngPoints;
  }
}
