import * as fs from "node:fs/promises";

await fs.copyFile("./dist/lib/index.d.ts", "./dist/esm/index.d.ts");
await fs.copyFile("./esm/tsdoc-metadata.json", "./dist/lib/tsdoc-metadata.json");
await fs.rename("./esm/tsdoc-metadata.json", "./dist/esm/tsdoc-metadata.json");
await fs.copyFile("./LICENSE", "./dist/LICENSE");
await fs.copyFile("./README.md", "./dist/README.md");
await fs.copyFile("./package.json", "./dist/package.json");