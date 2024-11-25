import {
  DropCapElement,
  ElementType,
  NoteElement,
  ScoreElement,
  TextBoxElement,
} from '../support/neanes/models/Element';
import { PageSetup } from '../support/neanes/models/PageSetup';
import { Score } from '../support/neanes/models/Score';

export class FontOptions {
  fontFamily: string = '';
  italic: boolean = false;
  bold: boolean = false;
  underline: boolean = false;

  get key(): string {
    let key = this.fontFamily;

    if (this.bold) {
      key += ' Bold';
    }

    if (this.italic) {
      key += ' Italic';
    }

    if (this.underline) {
      key += ' Underline';
    }

    return key;
  }
}

export function getFontOptionsFromElement(element: ScoreElement) {
  if (element.elementType === ElementType.TextBox) {
    const textBox = element as TextBoxElement;

    const options = new FontOptions();
    options.fontFamily = textBox.fontFamily;
    options.bold = textBox.bold;
    options.italic = textBox.italic;
    options.underline = textBox.underline;
    return options;
  } else if (element.elementType === ElementType.DropCap) {
    const dropCap = element as DropCapElement;

    const options = new FontOptions();
    options.fontFamily = dropCap.fontFamily;
    options.bold = dropCap.fontWeight === '700';
    options.italic = dropCap.fontStyle === 'italic';
    return options;
  } else if (element.elementType === ElementType.Note) {
    const note = element as NoteElement;

    const options = new FontOptions();
    options.fontFamily = note.lyricsFontFamily;
    options.bold = note.lyricsFontStyle === '700';
    options.italic = note.lyricsFontStyle === 'italic';
    options.underline = note.lyricsTextDecoration === 'underline';
    return options;
  } else {
    throw new Error(`Unsupported type ${element.elementType}`);
  }
}

export function getFontOptionsFromPageSetup(pageSetup: PageSetup) {
  const dropCapOptions = new FontOptions();
  dropCapOptions.fontFamily = pageSetup.dropCapDefaultFontFamily;
  dropCapOptions.bold = pageSetup.dropCapDefaultFontWeight === '700';
  dropCapOptions.italic = pageSetup.dropCapDefaultFontStyle === 'italic';

  const textBoxOptions = new FontOptions();
  textBoxOptions.fontFamily = pageSetup.textBoxDefaultFontFamily;
  textBoxOptions.bold = pageSetup.textBoxDefaultFontWeight === '700';
  textBoxOptions.italic = pageSetup.textBoxDefaultFontStyle === 'italic';

  const lyricOptions = new FontOptions();
  lyricOptions.fontFamily = pageSetup.lyricsDefaultFontFamily;
  lyricOptions.bold = pageSetup.lyricsDefaultFontWeight === '700';
  lyricOptions.italic = pageSetup.lyricsDefaultFontStyle === 'italic';

  const neumeOptions = new FontOptions();
  neumeOptions.fontFamily = pageSetup.neumeDefaultFontFamily;

  return [dropCapOptions, textBoxOptions, lyricOptions, neumeOptions];
}

export function getFontOptionsForScore(score: Score) {
  const map = new Map<string, FontOptions>();

  for (const option of getFontOptionsFromPageSetup(score.pageSetup)) {
    map.set(option.key, option);
  }

  // TODO headers and footers, too
  for (const element of score.staff.elements) {
    if (element.elementType === ElementType.DropCap) {
      const dropCap = element as DropCapElement;
      if (!dropCap.useDefaultStyle) {
        const option = getFontOptionsFromElement(dropCap);
        map.set(option.key, option);
      }
    } else if (element.elementType === ElementType.Note) {
      const note = element as NoteElement;
      if (!note.lyricsUseDefaultStyle) {
        const option = getFontOptionsFromElement(note);
        map.set(option.key, option);
      }
    } else if (element.elementType === ElementType.TextBox) {
      const textBox = element as TextBoxElement;
      if (!textBox.useDefaultStyle) {
        const option = getFontOptionsFromElement(textBox);
        map.set(option.key, option);
      }
    }
  }

  return Array.from(map.values());
}
