import { parse } from "https://deno.land/std/toml/mod.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

await Deno.mkdir("public/index/", { recursive: true });

for (const game of Deno.readDirSync("data/")) {
    await Deno.mkdir(`public/data/${game.name}/`, { recursive: true })

    const index: number[] = [];
    for (const map of Deno.readDirSync(`data/${game.name}/`)) {
        const map_name = parseInt(map.name);
        index.push(map_name);

        Deno.readFile(`data/${game.name}/${map.name}`)
            .then(contents => {
                const map = parse(decoder.decode(contents));
                Deno.writeFile(
                    `public/data/${game.name}/${map_name}.json`,
                    encoder.encode(JSON.stringify(map))
                )
            });
    }

    Deno.writeFile(
        `public/index/${game.name}.json`,
        encoder.encode(JSON.stringify(index.sort()))
    );
}