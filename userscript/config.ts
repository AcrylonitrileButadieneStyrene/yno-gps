const game = document.location.pathname.replace(/\//g, "");
const indexUrl = `https://raw.githubusercontent.com/AcrylonitrileButadieneStyrene/yno-gps/data/index/${game}.json`;
const dataUrl = "https://cdn.jsdelivr.net/gh/AcrylonitrileButadieneStyrene/yno-gps@data";
const maxAge = 86400000; // 1 day

type World = {
    width?: number,
    height?: number,
    loop?: {
        vertical?: boolean,
        horizontal?: boolean,
    },
    directions?: { [key: string]: (number | [number, number])[][] },
};

let index: number[] = [];
export const config: Record<number, World | undefined> = {};

async function fetchIndex() {
    const cache = await unsafeWindow.caches.open("yno-gps");
    const cached = await cache.match(indexUrl);
    if (cached) {
        const cachedDate = new Date(cached.headers.get("Date")!)
        if (new Date().getTime() - cachedDate.getTime() < maxAge) {
            updateStatus(cache, cachedDate);
            return await cached.text();
        }
    }

    const response = await fetch(indexUrl);
    const status = response.status;
    const statusText = response.statusText;
    if (status >= 400) {
        if (status == 404)
            return;

        alert(`An issue occurred with loading the yno-gps index: ${status} (${statusText})`);
        throw statusText;
    }
    const headers = new Headers(response.headers);
    const text = await response.text();

    // use existing date if valid or current date
    let date = new Date(headers.get("Date") || "");
    date = (!isNaN(date.getTime()) && date) || new Date();

    headers.set("Date", date.toUTCString());
    updateStatus(cache, date);

    await cache.put(indexUrl, new Response(text, { status, statusText, headers }));
    return text;
}

function updateStatus(cache: Cache, date: Date) {
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

export function loadMap(map: number) {
    if (map in config)
        return;
    config[map] = undefined;
    if (index.includes(map))
        fetch(`${dataUrl}/data/${game}/${map}.json`)
            .then(response => response.json())
            .then(value => config[map] = value);
}
