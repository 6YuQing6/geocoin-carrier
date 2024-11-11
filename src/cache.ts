interface Momento<T> {
  toMomento(): T;
  fromMomento(momento: T): void;
}

const MAX_COINS = 5;
import { Cell } from "./board.ts";
import luck from "./luck.ts";

export class Cache implements Momento<string> {
  i: number;
  j: number;
  numCoins: number;
  constructor(cell: Cell) {
    this.i = cell.i;
    this.j = cell.j;
    this.numCoins = Math.ceil(
      luck([cell.i, cell.j, "initialValue"].toString()) * MAX_COINS,
    );
  }
  toMomento() {
    return JSON.stringify({ i: this.i, j: this.j, numCoins: this.numCoins });
  }

  fromMomento(momento: string) {
    const { i, j, numCoins } = JSON.parse(momento);
    this.i = i;
    this.j = j;
    this.numCoins = numCoins;
  }
}

export class CacheManager {
  private caches: Map<string, Cache> = new Map();

  saveCacheState(cellKey: string, cache: Cache) {
    this.caches.set(cellKey, cache);
  }

  getCacheState(cellKey: string): Cache | undefined {
    return this.caches.get(cellKey);
  }

  removeCacheState(cellKey: string) {
    this.caches.delete(cellKey);
  }
}
