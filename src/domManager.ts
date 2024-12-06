import { Cell, Coin } from "./board.ts";
import { PlayerState } from "./playerstate.ts";

export class DOMManager {
  private statusPanel: HTMLElement;
  private resetButton: HTMLButtonElement;
  private geoLocationButton: HTMLButtonElement;
  private movementButtons: { [key: string]: HTMLElement };

  constructor() {
    this.statusPanel = document.querySelector<HTMLDivElement>("#status-panel")!;
    this.resetButton = document.querySelector<HTMLButtonElement>("#reset")!;
    this.geoLocationButton = document.querySelector<HTMLButtonElement>(
      "#sensor",
    )!;
    this.movementButtons = {
      north: document.getElementById("north")!,
      south: document.getElementById("south")!,
      west: document.getElementById("west")!,
      east: document.getElementById("east")!,
    };
  }

  // Update the status panel with the player's coins
  updateCoins(coins: Coin[]): void {
    this.statusPanel.innerHTML = this.displayCoins(coins);
    this.statusPanel.querySelectorAll(".coin").forEach((coinElement) => {
      coinElement.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const i = parseFloat(target.dataset.i!);
        const j = parseFloat(target.dataset.j!);
        console.log(`Coin clicked at (${i}, ${j})!`);
      });
    });
  }

  // Bind functionality for the reset button
  bindResetHandler(resetGame: () => void): void {
    this.resetButton.addEventListener("click", () => {
      const confirmation = confirm(
        "Are you sure you want to erase your game state?",
      );
      if (confirmation) resetGame();
    });
  }

  // Bind functionality for the geolocation button
  bindGeoLocationHandler(geoLocationToggle: () => void): void {
    this.geoLocationButton.addEventListener("click", () => {
      geoLocationToggle();
    });
  }

  // Bind functionality for movement buttons
  bindMovementHandlers(
    movePlayer: (deltaLat: number, deltaLng: number) => void,
  ): void {
    const boardWidth = 0.0001; // Adjust accordingly!

    this.movementButtons.north.addEventListener(
      "click",
      () => movePlayer(boardWidth, 0),
    );
    this.movementButtons.south.addEventListener(
      "click",
      () => movePlayer(-boardWidth, 0),
    );
    this.movementButtons.west.addEventListener(
      "click",
      () => movePlayer(0, -boardWidth),
    );
    this.movementButtons.east.addEventListener(
      "click",
      () => movePlayer(0, boardWidth),
    );
  }

  createPopup(
    cell: Cell,
    coins: Coin[],
    playerState: PlayerState,
  ): HTMLElement {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = this.displayDescription(cell, coins);

    const pokeButton = popupDiv.querySelector<HTMLButtonElement>("#poke")!;
    const coinDisplay = popupDiv.querySelector<HTMLSpanElement>(
      "#coin-display",
    )!;

    pokeButton.addEventListener("click", () => {
      const cache = playerState.getCacheForCell(cell);
      if (cache.numCoins > 0) {
        cache.numCoins -= 1;
        playerState.saveCacheState(cell, cache);
        const collectedCoin = { ...cell, serial: cache.numCoins };
        playerState.coins.push(collectedCoin);
        coinDisplay.innerHTML = this.displayCoins(
          playerState.getCoinsInCell(cell),
        );
        this.updateCoins(playerState.coins);
        playerState.saveSession();
      }
    });

    return popupDiv;
  }

  // Private helper for displaying coins in the panel
  private displayCoins(coins: Coin[]): string {
    return `Coins:<br>${
      coins
        .map(
          (coin) =>
            `<span class="coin" data-i="${coin.i}" data-j="${coin.j}" data-serial="${coin.serial}">🪙</span>`,
        )
        .join(" ")
    }`;
  }

  private displayDescription(cell: Cell, coins: Coin[]): string {
    return `
      <div>There is a cache here at "${cell.i},${cell.j}".
        <div id="coin-display"> ${this.displayCoins(coins)} </div>
      </div>
      <button id="poke">poke</button>`;
  }
}
