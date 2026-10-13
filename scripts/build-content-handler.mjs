import {build} from 'esbuild';
await build({entryPoints:['server/src/public-content-seo.mjs'],bundle:true,platform:'node',target:'node20',format:'esm',outfile:'dist-content/public-content-seo.mjs',banner:{js:"import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);"}});
console.log('Public content handler bundled with sanitizer and parser; only Node built-ins remain external.');
