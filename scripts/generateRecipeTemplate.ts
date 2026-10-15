// Genera docs/plantilla-productos.xlsx:  npx vite-node scripts/generateRecipeTemplate.ts
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildRecipeTemplate } from '../src/utils/recipeTemplate';

const DEFAULT_CATEGORIES = [
  'Café caliente', 'Café frío', 'Métodos especiales', 'Bebida sin café', 'Matcha', 'Chai', 'Chocolate',
  'Refresher', 'Proteína', 'Waffle', 'Picnic Box', 'Experiencia cena', 'Otro',
];

buildRecipeTemplate(DEFAULT_CATEGORIES).then((buffer) => {
  const out = resolve(__dirname, '../../docs/plantilla-productos.xlsx');
  writeFileSync(out, Buffer.from(buffer));
  console.log(`Plantilla escrita en ${out}`);
});
