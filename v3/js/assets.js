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
  'compass',
];

export const images = {};

export function load() {
  const promises = IMAGE_PATHS.map(name =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const path = name === 'logo' ? '../assets/compass.png' : `../assets/${name}.png`;
      img.onload = () => {
        images[name] = img;
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load ${path}`));
      img.src = path;
    })
  );
  return Promise.all(promises);
}
