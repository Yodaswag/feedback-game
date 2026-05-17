const IMAGE_PATHS = [
  'water-bg',
  'background-texture',
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
  'logo',
  'arrow',
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
