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

// interface CoinSerial {
//   serial: number;
// }

// export class CoinManager {
//   private readonly coinArray = new Map<string, CoinSerial>();
//   private readonly cell: Cell;

//   constructor(cell: Cell) {
//     this.cell = cell;
//   }

//   get numCoins() {
//     return Math.floor(
//       luck([this.cell.i, this.cell.j, "initialValue"].toString()) * MAX_COINS
//     );
//   }

//   private getCanonicalCoin(coin: CoinSerial): CoinSerial {
//     const { serial } = coin;
//     const key = `${this.cell.i}.${this.cell.j}.${serial}`;
//     if (!this.coinArray.has(key)) {
//       this.coinArray.set(key, coin);
//     }
//     return this.coinArray.get(key)!;
//   }

//   get coins(): CoinSerial[] {
//     const resultCoins: CoinSerial[] = [];
//     for (let serial = 0; serial < this.numCoins; serial++) {
//       const coin = this.getCanonicalCoin({
//         serial: serial,
//       });
//       resultCoins.push(coin);
//     }
//     return resultCoins;
//   }

//   toString() {
//     return
//   }
// }

// should i return string or list of objects like isnt that the same tho,
