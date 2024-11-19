import leaflet from "leaflet";
import { Cache, Point } from "./cache.ts";
import { Cell, Coin } from "./board.ts";

export class PlayerState {
  private caches: Map<string, string> = new Map();
  coins: Coin[] = [];
  points: string[] = [];

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
