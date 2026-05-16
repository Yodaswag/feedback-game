export const ASSET_URLS = {
  arrow: 'assets/images/arrow.png',
  backgroundTexture: 'assets/images/background-texture.png',
  bomb: 'assets/images/bomb.png',
  colorPalette: 'assets/images/color-palette.png',
  ship: 'assets/images/ship.png',
  treasureChest: 'assets/images/treasure-chest.png',
  waterBackground: 'assets/images/water-background.png',
};

export function preloadImages(urls = ASSET_URLS) {
  return Promise.all(Object.entries(urls).map(([key, src]) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve([key, image]);
    image.onerror = () => resolve([key, null]);
    image.src = src;
  }))).then((entries) => Object.fromEntries(entries));
}
