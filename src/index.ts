import { promises as fs } from 'fs';
import path from 'path';

import JSZip from 'jszip';

import { SaveService } from './support/neanes/services/SaveService';
import { LayoutService } from './support/neanes/services/LayoutService';
import { PdfGenerator } from './PdfGenerator';

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

if (process.argv[2]) {
  const score = SaveService.LoadScoreFromJson(
    JSON.parse(await readScoreFile(process.argv[2])),
  );

  const pages = LayoutService.processPages(score);

  await new PdfGenerator().generate(score, pages);
} else {
  console.log('usage: npx tsx index.ts filename.byz|x');
}
