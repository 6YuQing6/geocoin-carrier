interface Momento<T> {
  toMomento(): T;
  fromMomento(momento: T): void;
}

export class Cache implements Momento<string> {
  i: number;
  j: number;
  numCoins: number;
  constructor(i: number = 0, j: number = 0, numCoins: number = 0) {
    this.i = i;
    this.j = j;
    this.numCoins = numCoins;
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
