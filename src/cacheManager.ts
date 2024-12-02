import { Cache } from "./cache.ts";
import { Cell } from "./board.ts";

export class CacheManager {
  private caches: Map<string, string> = new Map();

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
    const c: { key: string; value: string }[] = [];
    this.caches.forEach((value, key) => {
      c.push({ key: key, value: value });
    });
    localStorage.setItem("caches", JSON.stringify(c));
  }

  loadSession() {
    const c = localStorage.getItem("caches");
    if (c) {
      const cachesession: Array<{ key: string; value: string }> = JSON.parse(c);
      this.caches = new Map(cachesession.map((item) => [item.key, item.value]));
    }
  }

  clearSession() {
    localStorage.removeItem("caches");
    this.caches.clear();
  }
}
