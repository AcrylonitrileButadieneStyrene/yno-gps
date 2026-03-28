import { config } from "./config.ts";
import { currentMap } from "./patches.ts";

export const overlay = document.createElement("canvas");
overlay.width = 320;
overlay.height = 240;
Object.assign(overlay.style, {
    transform: "scale(calc(var(--canvas-scale) * 2))",
    position: "absolute",
    mixBlendMode: "difference",
    pointerEvents: "none",
    marginTop: "120px",
});
document.getElementById("canvas")!.parentNode!.appendChild(overlay);
const context = overlay.getContext("2d")!;
context.fillStyle = "white";

export function animate() {
    render();
    requestAnimationFrame(animate);
};

function render() {
    context.clearRect(0, 0, 320, 240);
    const world = config[currentMap!];
    if (!world) return;

    const route = Object.values(world.directions!)[0];

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
        for (let i = sx; i - 1 != ex; i = (i + 1) % world.width!)
            for (let j = sy; j - 1 != ey; j = (j + 1) % world.height!)
                drawTile(i, j, px, py);
    }
}

function swapLoopless([a, b]: [number, number]): [number, number] {
    if (a > b)
        return [b, a];
    else return [a, b];
}

function drawTile(tx: number, ty: number, px: number, py: number) {
    const dx = tx - (px - 9);
    const dy = ty - (py - 7);
    context.beginPath();
    context.rect(dx * 16, dy * 16, 16, 16);
    context.fill();
}
