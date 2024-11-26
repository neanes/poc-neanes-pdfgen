import { promises as fs } from 'fs';
import path from 'path';

import JSZip from 'jszip';

import { SaveService } from './support/neanes/services/SaveService';
import { LayoutService } from './support/neanes/services/LayoutService';
import { PdfGenerator } from './PdfGenerator';
import { TextMeasurementService } from './support/neanes/services/TextMeasurementService';
import { defaultFonts, getFontData, getFontOptionsForScore } from './utils';
import { Score } from './support/neanes/models/Score';
import { FontRegistry } from './FontRegistry';

async function readScoreFile(filePath: string) {
  let data: string;

  // If using the compressed file format, zip first
  if (path.extname(filePath) === '.byz') {
    const file = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(file);
    data = await zip.file(/\.(byzx)$/)[0].async('text');
  } else if (path.extname(filePath) === '.byzx') {
    data = await fs.readFile(filePath, 'utf8');
  } else {
    throw `Unsupported file type: ${path.extname(filePath)}`;
  }

  return data;
}

async function registerDefaultFonts() {
  const promises: Promise<void>[] = [];
  for (const [family, file] of defaultFonts.entries()) {
    promises.push(TextMeasurementService.registerFontByPath(family, file));
  }

  await Promise.all(promises);
}

async function registerOtherFonts(fontRegistry: FontRegistry, score: Score) {
  for (const options of getFontOptionsForScore(score)) {
    if (defaultFonts.has(options.key)) {
      continue;
    }

    console.log(`Registering ${options.key}`);

    // TODO handle fonts that are not found
    const data = await getFontData(
      options.fontFamily,
      options.bold,
      options.italic,
    );

    fontRegistry.registerFont(options.key, data);

    TextMeasurementService.registerFontByBuffer(options.key, data);
  }
}

if (process.argv[2]) {
  const score = SaveService.LoadScoreFromJson(
    JSON.parse(await readScoreFile(process.argv[2])),
  );

  console.time('fontkit: register fonts');
  const fontRegistry = new FontRegistry();
  await registerDefaultFonts();
  await registerOtherFonts(fontRegistry, score);
  console.timeEnd('fontkit: register fonts');

  const pages = LayoutService.processPages(score);

  await new PdfGenerator().setFontRegistry(fontRegistry).generate(score, pages);
} else {
  console.log('usage: npx tsx index.ts filename.byz|x');
}
