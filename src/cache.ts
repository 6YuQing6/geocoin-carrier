interface Momento<T> {
  toMomento(): T;
  fromMomento(momento: T): void;
}

const MAX_COINS = 5;
import { Cell } from "./board.ts";
import luck from "./luck.ts";

class BaseMomento implements Momento<string> {
  i: number;
  j: number;

  constructor(cell?: Cell) {
    this.i = cell ? cell.i : 0;
    this.j = cell ? cell.j : 0;
  }

  toMomento() {
    return JSON.stringify({ i: this.i, j: this.j });
  }

  fromMomento(momento: string) {
    const { i, j } = JSON.parse(momento);
    this.i = i;
    this.j = j;
    return this;
  }
}

export class Cache extends BaseMomento {
  numCoins: number;

  constructor(cell: Cell) {
    super(cell);
    this.numCoins = Math.ceil(
      luck([cell.i, cell.j, "initialValue"].toString()) * MAX_COINS,
    );
  }

  override toMomento() {
    const baseMomento = JSON.parse(super.toMomento());
    return JSON.stringify({ ...baseMomento, numCoins: this.numCoins });
  }

  override fromMomento(momento: string) {
    const { numCoins } = JSON.parse(momento);
    super.fromMomento(momento);
    this.numCoins = numCoins;
    return this;
  }
}

export class Point extends BaseMomento {
  constructor(cell?: Cell) {
    super(cell);
  }
}
