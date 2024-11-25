//const { createCanvas } = require('canvas');

import { Font, openSync } from 'fontkit';

// registerFont('neanes/assets/Neanes.otf', { family: 'Neanes' });
// registerFont('neanes/assets/EZ Omega.ttf', { family: 'Omega' });
// registerFont('neanes/assets/SourceSerif4-Regular.otf', {
//   family: 'Source Serif',
// });

// const canvas = createCanvas(1000, 1000);

const fontMap = new Map<string, Font>();

fontMap.set('Neanes', openSync('src/support/neanes/assets/Neanes.otf') as Font);
fontMap.set(
  'Omega',
  openSync('src/support/neanes/assets/EZ Omega.ttf') as Font,
);
fontMap.set(
  'PFGoudyInitials',
  openSync('src/support/neanes/assets/PFGoudyInitials.ttf') as Font,
);
fontMap.set(
  'Source Serif',
  openSync('src/support/neanes/assets/SourceSerif4-Regular.otf') as Font,
);

fontMap.set('Palatino Linotype', openSync('C:/Windows/Fonts/pala.ttf') as Font);

const fontFamilyRegex = /px "?([\w ]*)"?$/;
const fontSizeRegex = /([0-9.]*)px/;

export class TextMeasurementService {
  public static getTextWidth(text: string, fontCss: string) {
    const fontFamily = fontCss.match(fontFamilyRegex)![1];
    const fontSize = Number(fontCss.match(fontSizeRegex)![1]);
    const font = fontMap.get(fontFamily)!;
    const run = font.layout(text);

    return (run.advanceWidth / font.unitsPerEm) * fontSize;
  }

  public static getTextHeight(text: string, fontCss: string) {
    const fontFamily = fontCss.match(fontFamilyRegex)![1];
    const fontSize = Number(fontCss.match(fontSizeRegex)![1]);
    const font = fontMap.get(fontFamily)!;
    const run = font.layout(text);

    return (run.bbox.height / font.unitsPerEm) * fontSize;
  }

  public static getFontHeight(fontCss: string) {
    const fontFamily = fontCss.match(fontFamilyRegex)![1];
    const fontSize = Number(fontCss.match(fontSizeRegex)![1]);
    const font = fontMap.get(fontFamily)!;

    return (font.bbox.height / font.unitsPerEm) * fontSize;
  }

  public static getFontBoundingBoxDescent(fontCss: string) {
    const fontFamily = fontCss.match(fontFamilyRegex)![1];
    const fontSize = Number(fontCss.match(fontSizeRegex)![1]);
    const font = fontMap.get(fontFamily)!;

    return (font.descent / font.unitsPerEm) * fontSize;
  }

  public static getFontBoundingBoxAscent(fontCss: string) {
    const fontFamily = fontCss.match(fontFamilyRegex)![1];
    const fontSize = Number(fontCss.match(fontSizeRegex)![1]);
    const font = fontMap.get(fontFamily)!;

    return (font.ascent / font.unitsPerEm) * fontSize;
  }
}
