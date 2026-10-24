// Copie le worker de MapLibre dans public/ : résolu par défaut à côté du
// bundle, il est introuvable une fois le code passé par Turbopack.
// Lancé avant `dev` et `build` (package.json) ; le fichier copié n'est pas versionné.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre-gl-worker.mjs");
