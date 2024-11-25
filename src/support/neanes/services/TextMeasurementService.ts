import { create, Font, open } from 'fontkit';

const fontMap = new Map<string, Font>();

const fontFamilyRegex = /px "?([\w ]*)"?$/;
const fontSizeRegex = /([0-9.]*)px/;

export class TextMeasurementService {
  public static async registerFontByPath(family: string, file: string) {
    fontMap.set(family, (await open(file)) as Font);
  }

  public static async registerFontByBuffer(family: string, data: Buffer) {
    fontMap.set(family, create(data) as Font);
  }

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
    try {
      const fontFamily = fontCss.match(fontFamilyRegex)![1];
      const fontSize = Number(fontCss.match(fontSizeRegex)![1]);
      const font = fontMap.get(fontFamily)!;

      return (font.bbox.height / font.unitsPerEm) * fontSize;
    } catch (e) {
      console.error(`[ERR] getFontHeight: ${fontCss}`, e);
      throw e;
    }
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
