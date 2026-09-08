// Génère src/plugins/icons.js à partir des icônes réellement présentes dans le
// code source, et vérifie que chacune existe bien dans @mdi/js.
// Usage : node gen-icons.mjs
import fs from 'node:fs'
import path from 'node:path'
import * as mdi from '@mdi/js'

const SRC = path.resolve('src')
const OUT = path.join(SRC, 'plugins', 'icons.js')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.(vue|js|ts)$/.test(e.name) ? [p] : []
  })
}

// On ignore src/plugins/ : aucune icône n'y est utilisée, et vuetify.js y
// contient la chaîne "mdi-svg" (nom du module vuetify/iconsets/mdi-svg) qui
// serait prise à tort pour une icône et ferait échouer la génération.
const PLUGINS = path.join(SRC, 'plugins')
const files = walk(SRC).filter((f) => !path.resolve(f).startsWith(PLUGINS))
const found = new Set()
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8')
  for (const m of txt.matchAll(/mdi-[a-z0-9-]+/g)) found.add(m[0])
}

const names = [...found].sort()
const toCamel = (n) =>
  'mdi' + n.slice(4).split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('')

const ok = []
const missing = []
for (const n of names) {
  const camel = toCamel(n)
  if (typeof mdi[camel] === 'string') ok.push([n, camel])
  else missing.push([n, camel])
}

console.log(`Icônes trouvées dans le code : ${names.length}`)
console.log(`Résolues dans @mdi/js        : ${ok.length}`)

if (missing.length) {
  console.log('')
  console.log('*** INTROUVABLES DANS @mdi/js — génération interrompue ***')
  for (const [n, c] of missing) console.log(`   ${n}  ->  ${c}`)
  process.exit(1)
}

const imports = ok.map(([, c]) => `  ${c},`).join('\n')
const entries = ok.map(([n, c]) => `  '${n}': ${c},`).join('\n')

const out = `// FICHIER GÉNÉRÉ — ne pas éditer à la main.
// Régénérer avec le script gen-icons.mjs après avoir ajouté une icône.
//
// Ne contient QUE les ${ok.length} icônes réellement utilisées dans les templates,
// au lieu des ~7000 de la police complète. Les alias internes de Vuetify
// (flèches de listes, coches, navigation du calendrier) viennent de
// 'vuetify/iconsets/mdi-svg' et sont déjà des chemins SVG.
import {
${imports}
} from '@mdi/js'

// Table nom Material Design -> chemin SVG
export const APP_ICONS = {
${entries}
}
`

fs.writeFileSync(OUT, out, 'utf8')
console.log('')
console.log(`Écrit : ${path.relative(process.cwd(), OUT)}`)
