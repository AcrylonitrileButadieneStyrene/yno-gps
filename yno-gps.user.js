// ==UserScript==
// @name        YNO GPS
// @match       *://ynoproject.net/*
// @version     0.1.5
// @description In-game pathfinding overlay
// @noframes
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// @downloadURL https://raw.githubusercontent.com/AcrylonitrileButadieneStyrene/yno-gps/data/yno-gps.user.js
// @supportURL  https://github.com/AcrylonitrileButadieneStyrene/yno-gps/issues
// @homepageURL https://github.com/AcrylonitrileButadieneStyrene/yno-gps/blob/master/README.md
// ==/UserScript==

const game = document.location.pathname.replace(/\//g, "");
const indexUrl = `https://raw.githubusercontent.com/AcrylonitrileButadieneStyrene/yno-gps/data/index/${game}.json`;
const dataUrl = "https://cdn.jsdelivr.net/gh/AcrylonitrileButadieneStyrene/yno-gps@data";
const maxAge = 86400000; // 1 day

let index = [];
const config = {};

async function fetchIndex() {
  const cache = await unsafeWindow.caches.open("yno-gps");
  const cached = await cache.match(indexUrl);
  if (cached) {
    const cachedDate = new Date(cached.headers.get("Date"))
    if (new Date() - cachedDate < maxAge) {
      updateStatus(cache, cachedDate);
      return await cached.text();
    }
  }

  const response = await fetch(indexUrl);
  const status = response.status;
  const statusText = response.statusText;
  if (status >= 400) {
    alert(`An issue occurred with loading the yno-gps index: ${status} (${statusText})`);
    throw statusText;
  }
  const headers = new Headers(response.headers);
  const text = await response.text();

  let date = headers.get("Date");
  if (date) date = new Date(date)
  if (!date || isNaN(date.getTime()))
    date = new Date();

  headers.set("Date", date.toUTCString());
  updateStatus(cache, date);

  await cache.put(indexUrl, new Response(text, { status, statusText, headers }));
  return text;
}

function updateStatus(cache, date) {
  GM_unregisterMenuCommand("last-updated");
  GM_registerMenuCommand(
    "Last updated: " + date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', }),
    () => {
      cache.delete(indexUrl);
      updateIndex();
    },
    { id: "last-updated" }
  );
}

async function updateIndex() {
  index = JSON.parse(await fetchIndex());
};
updateIndex();

const overlay = document.createElement("canvas");
overlay.width = 320;
overlay.height = 240;
Object.assign(overlay.style, {
  transform: "scale(calc(var(--canvas-scale) * 2))",
  position: "absolute",
  mixBlendMode: "difference",
  pointerEvents: "none",
  marginTop: "120px",
});
document.getElementById("canvas").parentNode.appendChild(overlay);
const context = overlay.getContext("2d");
context.fillStyle = "white";

const easyrpgWaiter = setInterval(() => {
  try { easyrpgPlayer; onPlayerTeleported; updateCanvasOverlays; } catch { return; }
  clearInterval(easyrpgWaiter);
  patchTeleport();
  patchUpdateOverlays();
  requestAnimationFrame(animate);
}, 100);

let currentMap;
function patchTeleport() {
  const original = onPlayerTeleported;
  onPlayerTeleported = function(map) {
    currentMap = map;
    loadMap(map);
    return original.apply(this, arguments);
  };
}

function patchUpdateOverlays() {
  const original = updateCanvasOverlays;
  updateCanvasOverlays = function() {
    const value = original.apply(this, arguments);
    const chat = document.getElementById("gameChatContainer");
    overlay.style.top = chat.style.top;
    return value;
  }
}

function loadMap(map) {
  if (map in config)
    return;
  config[map] = undefined;
  if (index.includes(map))
    fetch(`${dataUrl}/data/${game}/${map}.json`)
      .then(response => response.json())
      .then(value => config[map] = value);
}

function animate(delta) {
  render(delta);
  requestAnimationFrame(animate);
};

function render() {
  context.clearRect(0, 0, 320, 240);
  const world = config[currentMap];
  if (!world) return;

  const route = Object.values(world.directions)[0];

  const [px, py] = easyrpgPlayer.api.getPlayerCoords();
  for (const line of route) {
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

    const [sx, ex] = x;
    const [sy, ey] = y;
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
  const dx = tx - (px - 9);
  const dy = ty - (py - 7);
  context.beginPath();
  context.rect(dx * 16, dy * 16, 16, 16);
  context.fill();
}
