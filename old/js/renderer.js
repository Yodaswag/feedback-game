import { SHIP_X } from './input.js';

export function drawScene(ctx, canvas, assets, model) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (assets.waterBackground) {
    ctx.drawImage(assets.waterBackground, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#aac7da';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (assets.backgroundTexture) {
    ctx.globalAlpha = 0.18;
    ctx.drawImage(assets.backgroundTexture, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }

  if (assets.ship) {
    ctx.drawImage(assets.ship, SHIP_X - 70, model.shipY - 70, 140, 156);
  }

  for (const item of model.items) {
    const asset = item.isGood ? assets.treasureChest : assets.bomb;
    if (asset) ctx.drawImage(asset, item.x - 36, item.y - 36, 72, 72);
  }
}
