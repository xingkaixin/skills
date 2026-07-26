import { publishCatalog } from "./catalog/publication.ts";

const checkOnly = process.argv.includes("--check");
await publishCatalog(process.cwd(), checkOnly);
