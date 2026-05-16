const IMAGE_PATHS = [
  'water-bg',
  'ship',
  'chest-ribbon',
  'chest-plain',
  'chest-green',
  'bomb-lit',
  'bomb-unlit',
  'pirate-happy',
  'pirate-bored',
  'pirate-frustrated',
  'pirate-confused',
  'tattered-page',
];

export const images = {};

export function load() {
  const promises = IMAGE_PATHS.map(name =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        images[name] = img;
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load assets/${name}.png`));
      img.src = `assets/${name}.png`;
    })
  );
  return Promise.all(promises);
}
