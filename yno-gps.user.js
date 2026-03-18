// ==UserScript==
// @name        YNO GPS
// @match       *://ynoproject.net/*
// @version     0.1.0
// @description In-game pathfinding overlay
// @noframes
// @grant       unsafeWindow
// @downloadURL https://raw.githubusercontent.com/AcrylonitrileButadieneStyrene/yno-gps/master/yno-gps.user.js
// @supportURL  https://github.com/AcrylonitrileButadieneStyrene/yno-gps/issues
// @homepageURL https://github.com/AcrylonitrileButadieneStyrene/yno-gps/blob/master/README.md
// ==/UserScript==

const config = {
  51: {
    width: 145,
    height: 99,
    loop_vertical: true,
    loop_horizontal: true,
    directions: [
      { name: "To Dark Room", path: [
        [[88, 12], 13],
        [88, [74, 12]],
      ] },
    ],
  }
};

const overlay = document.createElement("canvas");
overlay.width = 320;
overlay.height = 240;
Object.assign(overlay.style, {
  transform: "scale(calc(var(--canvas-scale) * 2))",
  position: "absolute",
  mixBlendMode: "difference",
  pointerEvents: "none",
});
const context = overlay.getContext("2d");
context.fillStyle = "white";

let currentMap;
const easyrpgWaiter = setInterval(() => {
  try { easyrpgPlayer; onPlayerTeleported; } catch { return; }
  clearInterval(easyrpgWaiter);

  const original = onPlayerTeleported;
  onPlayerTeleported = function(map) {
    currentMap = map;
    return original.apply(this, arguments);
  };
  requestAnimationFrame(animate);
}, 100);

setTimeout(() => {
  document.getElementById("canvas").parentNode.appendChild(overlay);
  document.getElementById("canvasContainer").style.position = "relative";
}, 10_000);

function animate(delta) {
  render(delta);
  requestAnimationFrame(animate);
};

function render() {
  context.clearRect(0, 0, 320, 240);
  const world = config[currentMap];
  if (!world) return;

  let route = world.directions[0];

  let [px, py] = easyrpgPlayer.api.getPlayerCoords();
  for (const line of route.path) {
    let x = line[0];
    if (!Array.isArray(x))
      x = [x, x];
    else if (!world.width)
      x = swapLoopless(x);
    let y = line[1];
    if (!Array.isArray(y))
      y = [y, y];
    else if (!world.height)
      y = swapLoopless(y);

    let [sx, ex] = x;
    let [sy, ey] = y;
    for (let i = sx; i - 1 != ex; i = (i + 1) % world.width)
      for (let j = sy; j - 1 != ey; j = (j + 1) % world.height)
        drawTile(i, j, px, py);
  }
}

function swapLoopless([a, b]) {
  if (a > b)
    return [b, a];
  else return [a, b];
}

function drawTile(tx, ty, px, py) {
  let dx = tx - (px - 9);
  let dy = ty - (py - 7);
  context.beginPath();
  context.rect(dx * 16, dy * 16, 16, 16);
  context.fill();
}

