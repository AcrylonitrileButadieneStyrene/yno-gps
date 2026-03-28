import { parse } from "https://deno.land/std@0.224.0/toml/mod.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

Deno.mkdirSync("public/index/", { recursive: true });

for (const game of Deno.readDirSync("data/")) {
    Deno.mkdirSync(`public/data/${game.name}/`, { recursive: true })

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

await Deno.bundle({
    entrypoints: ["userscript/index.ts"],
    outputDir: "public/",
    platform: "browser",
});
const contents = decoder.decode(Deno.readFileSync("public/index.js"));
const header = decoder.decode(Deno.readFileSync("userscript/yno-gps.meta.js"));
Deno.writeFileSync("public/yno-gps.user.js", encoder.encode(header + "\n" + contents));
Deno.removeSync("public/index.js");
