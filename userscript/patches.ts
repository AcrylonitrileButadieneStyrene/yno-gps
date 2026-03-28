// deno-lint-ignore-file no-explicit-any

import { loadMap } from "./config.ts";
import { overlay } from "./renderer.ts";

export let currentMap: number | undefined;
export function patchTeleport() {
    const original = onPlayerTeleported;
    onPlayerTeleported = function (this: any, map: number) {
        currentMap = map;
        loadMap(map);
        return original.apply(this, arguments);
    };
}

export function patchUpdateOverlays() {
    const original = updateCanvasOverlays;
    updateCanvasOverlays = function (this: any) {
        const value = original.apply(this, arguments);
        const chat = document.getElementById("gameChatContainer")!;
        overlay.style.top = chat.style.top;
        return value;
    }
}