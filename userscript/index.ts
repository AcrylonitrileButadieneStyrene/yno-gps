/// <reference lib="dom" />
/// <reference types="npm:@violentmonkey/types" />
// deno-lint-ignore-file no-explicit-any

import { patchTeleport, patchUpdateOverlays } from "./patches.ts";
import { animate } from "./renderer.ts";

declare global {
    var easyrpgPlayer: any;
    var onPlayerTeleported: any;
    var updateCanvasOverlays: any;
}

const easyrpgWaiter = setInterval(() => {
    try { easyrpgPlayer; onPlayerTeleported; updateCanvasOverlays; } catch { return; }
    clearInterval(easyrpgWaiter);
    patchTeleport();
    patchUpdateOverlays();
    requestAnimationFrame(animate);
}, 100);
