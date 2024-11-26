import fs from 'fs';

import PDFDocument from 'pdfkit';

import {
  ModeSign,
  Neume,
  TimeNeume,
  VocalExpressionNeume,
} from './support/neanes/models/Neumes';
import { NeumeMappingService } from './support/neanes/services/NeumeMappingService';
import { fontService } from './support/neanes/services/FontService';
import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  TextBoxElement,
} from './support/neanes/models/Element';
import { Unit } from './support/neanes/utils/Unit';
import { PageSetup } from './support/neanes/models/PageSetup';

import { Score } from './support/neanes/models/Score';
import { Page } from './support/neanes/models/Page';
import { defaultFonts, getFontData, getFontOptionsForScore } from './utils';
import { FontRegistry } from './FontRegistry';

export class PdfGenerator {
  private fontRegistry: FontRegistry | null = null;

  setFontRegistry(fontRegistry: FontRegistry) {
    this.fontRegistry = fontRegistry;
    return this;
  }

  public async generate(score: Score, pages: Page[]) {
    const pageSetup = score.pageSetup;
    console.time('generate');
    const doc = new PDFDocument({ size: 'LETTER' });

    doc.pipe(fs.createWriteStream('output.pdf')); // write to PDF

    console.time('pdfkit: register fonts');
    this.registerDefaultFonts(doc);
    await this.registerOtherFonts(doc, score);
    console.timeEnd('pdfkit: register fonts');

    let firstPage = true;

    console.time('generate: main loop');
    for (const page of pages) {
      if (!firstPage && page.lines.length > 1) {
        doc.addPage();
      }

      firstPage = false;

      for (const line of page.lines) {
        for (const element of line.elements) {
          if (element.elementType === ElementType.Note) {
            const note = element as NoteElement;
            this.renderNote(doc, note, pageSetup);
          } else if (element.elementType === ElementType.Martyria) {
            const martyria = element as MartyriaElement;
            this.renderMartyria(doc, martyria, pageSetup);
          } else if (element.elementType === ElementType.TextBox) {
            const textBox = element as TextBoxElement;
            this.renderTextBox(doc, textBox);
          } else if (element.elementType === ElementType.DropCap) {
            const dropCap = element as DropCapElement;
            this.renderDropCap(doc, dropCap);
          } else if (element.elementType === ElementType.ModeKey) {
            const modeKey = element as ModeKeyElement;
            this.renderModeKey(doc, modeKey, pageSetup);
          }
        }
      }
    }
    console.timeEnd('generate: main loop');

    // finalize the PDF and end the stream
    doc.end();

    console.timeEnd('generate');
  }

  private registerDefaultFonts(doc: PDFKit.PDFDocument) {
    for (const [family, file] of defaultFonts.entries()) {
      doc.registerFont(family, file);
    }
  }

  private async registerOtherFonts(doc: PDFKit.PDFDocument, score: Score) {
    for (const options of getFontOptionsForScore(score)) {
      if (defaultFonts.has(options.key)) {
        continue;
      }

      // TODO handle fonts that are not found
      doc.registerFont(
        options.key,
        this.fontRegistry?.getFontData(options.key) ??
          (await getFontData(options.fontFamily, options.bold, options.italic)),
      );
    }
  }

  private renderNote(
    doc: PDFKit.PDFDocument,
    note: NoteElement,
    pageSetup: PageSetup,
  ) {
    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const fontSize = Unit.toPt(pageSetup.neumeDefaultFontSize);
    const color = pageSetup.neumeDefaultColor;

    doc.font(fontFamily).fontSize(fontSize).fillColor(color);

    let mainTextOffsetX = Unit.toPt(note.x);

    if (note.measureBarLeft) {
      const mapping = this.getMapping(note.measureBarLeft);

      doc
        .fillColor(pageSetup.measureBarDefaultColor)
        .text(mapping.text, mainTextOffsetX, Unit.toPt(note.y), {
          continued: true,
          lineBreak: false,
        });

      mainTextOffsetX +=
        fontService.getAdvanceWidth(fontFamily, mapping.glyphName) * fontSize;
    }

    doc.fillColor(color);

    if (note.vareia) {
      const mapping = this.getMapping(VocalExpressionNeume.Vareia);
      doc.text(mapping.text, mainTextOffsetX, Unit.toPt(note.y), {
        continued: true,
        lineBreak: false,
      });

      mainTextOffsetX +=
        fontService.getAdvanceWidth(fontFamily, mapping.glyphName) * fontSize;
    }

    let mainText = this.getMapping(note.quantitativeNeume).text;

    if (
      note.vocalExpressionNeume &&
      ![
        VocalExpressionNeume.Heteron,
        VocalExpressionNeume.HeteronConnecting,
        VocalExpressionNeume.HeteronConnectingLong,
        VocalExpressionNeume.Endofonon,
      ].includes(note.vocalExpressionNeume)
    ) {
      mainText += this.getMapping(note.vocalExpressionNeume).text;
    }

    doc.text(mainText, mainTextOffsetX, Unit.toPt(note.y), {
      lineBreak: false,
    });

    if (
      note.vocalExpressionNeume != null &&
      [
        VocalExpressionNeume.Heteron,
        VocalExpressionNeume.HeteronConnecting,
        VocalExpressionNeume.HeteronConnectingLong,
        VocalExpressionNeume.Endofonon,
      ].includes(note.vocalExpressionNeume)
    ) {
      this.renderNotePartial(
        doc,
        note,
        note.vocalExpressionNeume,
        note.vocalExpressionNeumeOffsetX,
        note.vocalExpressionNeumeOffsetY,
        fontFamily,
        fontSize,
        pageSetup.heteronDefaultColor,
      );
    }

    if (note.gorgonNeume) {
      this.renderNotePartial(
        doc,
        note,
        note.gorgonNeume,
        note.gorgonNeumeOffsetX,
        note.gorgonNeumeOffsetY,
        fontFamily,
        fontSize,
        pageSetup.gorgonDefaultColor,
      );
    }

    if (note.secondaryGorgonNeume) {
      this.renderNotePartial(
        doc,
        note,
        note.secondaryGorgonNeume,
        note.secondaryGorgonNeumeOffsetX,
        note.secondaryGorgonNeumeOffsetY,
        fontFamily,
        fontSize,
        pageSetup.gorgonDefaultColor,
      );
    }

    if (note.timeNeume) {
      this.renderNotePartial(
        doc,
        note,
        note.timeNeume,
        note.timeNeumeOffsetX,
        note.timeNeumeOffsetY,
        fontFamily,
        fontSize,
        color,
      );
    }

    if (note.koronis) {
      this.renderNotePartial(
        doc,
        note,
        TimeNeume.Koronis,
        note.koronisOffsetX,
        note.koronisOffsetY,
        fontFamily,
        fontSize,
        pageSetup.koronisDefaultColor,
      );
    }

    if (note.accidental) {
      this.renderNotePartial(
        doc,
        note,
        note.accidental,
        note.accidentalOffsetX,
        note.accidentalOffsetY,
        fontFamily,
        fontSize,
        pageSetup.accidentalDefaultColor,
      );
    }

    if (note.secondaryAccidental) {
      this.renderNotePartial(
        doc,
        note,
        note.secondaryAccidental,
        note.secondaryAccidentalOffsetX,
        note.secondaryAccidentalOffsetY,
        fontFamily,
        fontSize,
        pageSetup.accidentalDefaultColor,
      );
    }

    if (note.tertiaryAccidental) {
      this.renderNotePartial(
        doc,
        note,
        note.tertiaryAccidental,
        note.tertiaryAccidentalOffsetX,
        note.tertiaryAccidentalOffsetY,
        fontFamily,
        fontSize,
        pageSetup.accidentalDefaultColor,
      );
    }

    if (note.fthora) {
      this.renderNotePartial(
        doc,
        note,
        note.fthora,
        note.fthoraOffsetX,
        note.fthoraOffsetY,
        fontFamily,
        fontSize,
        pageSetup.fthoraDefaultColor,
      );
    }

    if (note.secondaryFthora) {
      this.renderNotePartial(
        doc,
        note,
        note.secondaryFthora,
        note.secondaryFthoraOffsetX,
        note.secondaryFthoraOffsetY,
        fontFamily,
        fontSize,
        pageSetup.fthoraDefaultColor,
      );
    }

    if (note.tertiaryFthora) {
      this.renderNotePartial(
        doc,
        note,
        note.tertiaryFthora,
        note.tertiaryFthoraOffsetX,
        note.tertiaryFthoraOffsetY,
        fontFamily,
        fontSize,
        pageSetup.fthoraDefaultColor,
      );
    }

    if (note.noteIndicator && note.noteIndicatorNeume != null) {
      this.renderNotePartial(
        doc,
        note,
        note.noteIndicatorNeume,
        note.noteIndicatorOffsetX,
        note.noteIndicatorOffsetY,
        fontFamily,
        fontSize,
        pageSetup.noteIndicatorDefaultColor,
      );
    }

    if (note.ison) {
      this.renderNotePartial(
        doc,
        note,
        note.ison,
        note.isonOffsetX,
        note.isonOffsetY,
        fontFamily,
        fontSize,
        pageSetup.isonDefaultColor,
      );
    }

    if (note.measureNumber) {
      this.renderNotePartial(
        doc,
        note,
        note.measureNumber,
        note.measureNumberOffsetX,
        note.measureNumberOffsetY,
        fontFamily,
        fontSize,
        pageSetup.measureNumberDefaultColor,
      );
    }

    if (note.measureBarRight) {
      doc
        .fillColor(pageSetup.measureBarDefaultColor)
        .text(
          this.getMapping(note.measureBarRight).text,
          mainTextOffsetX +
            fontService.getAdvanceWidth(
              fontFamily,
              this.getMapping(note.quantitativeNeume).glyphName,
            ) *
              20,
          Unit.toPt(note.y),
          { lineBreak: false },
        );
    }

    if (note.tie) {
      this.renderNotePartial(
        doc,
        note,
        note.tie,
        note.tieOffsetX,
        note.tieOffsetY,
        fontFamily,
        fontSize,
        pageSetup.neumeDefaultColor,
      );
    }

    if (note.lyrics) {
      const fontSize = Unit.toPt(
        note.lyricsUseDefaultStyle
          ? pageSetup.lyricsDefaultFontSize
          : note.lyricsFontSize,
      );

      const fontFamily = note.lyricsUseDefaultStyle
        ? pageSetup.lyricsDefaultFontFamily
        : note.lyricsFontFamily;

      const color = note.lyricsUseDefaultStyle
        ? pageSetup.lyricsDefaultColor
        : note.lyricsColor;

      doc
        .font(fontFamily)
        .fontSize(fontSize)
        .fillColor(color)
        .text(
          note.lyrics,
          Unit.toPt(
            note.x +
              note.neumeWidth / 2 -
              note.lyricsWidth / 2 +
              note.lyricsHorizontalOffset / 2,
          ),
          Unit.toPt(note.y + note.lyricsVerticalOffset),
          {
            lineBreak: false,
          },
        );

      if (note.isMelisma && !note.isHyphen) {
        const offset = doc.heightOfString(note.lyrics);
        //const offset = Unit.toPt(note.lyricsFontHeight) / 4;
        doc
          .lineWidth(Unit.toPt(pageSetup.lyricsMelismaThickeness))
          .moveTo(
            Unit.toPt(
              note.x +
                note.neumeWidth / 2 +
                note.lyricsWidth / 2 +
                note.lyricsHorizontalOffset / 2 +
                pageSetup.lyricsMelismaSpacing,
            ),
            Unit.toPt(note.y + note.lyricsVerticalOffset + offset),
          )
          .lineTo(
            Unit.toPt(
              note.x +
                note.neumeWidth / 2 +
                note.lyricsWidth / 2 +
                note.lyricsHorizontalOffset / 2 +
                pageSetup.lyricsMelismaSpacing +
                note.melismaWidth,
            ),
            Unit.toPt(note.y + note.lyricsVerticalOffset + offset),
          )
          .stroke();
      } else if (note.isMelisma && note.isHyphen) {
        for (const hyphenOffset of note.hyphenOffsets) {
          doc
            .font(fontFamily)
            .fontSize(fontSize)
            .fillColor(color)
            .text(
              '-',
              Unit.toPt(
                note.x +
                  note.neumeWidth / 2 +
                  note.lyricsWidth / 2 +
                  note.lyricsHorizontalOffset +
                  hyphenOffset,
              ),
              Unit.toPt(note.y + note.lyricsVerticalOffset),
              {
                width: note.lyricsWidth,
              },
            );
        }
      }
    }
  }

  private renderNotePartial(
    doc: PDFKit.PDFDocument,
    note: NoteElement,
    neume: Neume,
    offsetX: number | null,
    offsetY: number | null,
    fontFamily: string,
    fontSize: number,
    color: string,
  ) {
    const offset = this.getOffset(fontFamily, note, neume);

    offset.x += offsetX || 0;
    offset.y += offsetY || 0;

    doc
      .fillColor(color)
      .text(
        this.getMapping(neume).text,
        Unit.toPt(note.x) + offset.x * fontSize,
        Unit.toPt(note.y) + offset.y * fontSize,
        { lineBreak: false },
      );
  }

  private renderMartyria(
    doc: PDFKit.PDFDocument,
    martyria: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    doc
      .font(pageSetup.neumeDefaultFontFamily)
      .fontSize(Unit.toPt(pageSetup.neumeDefaultFontSize));

    if (martyria.measureBarLeft) {
      doc
        .fillColor(pageSetup.measureBarDefaultColor)
        .text(
          this.getMapping(martyria.measureBarLeft).text,
          Unit.toPt(martyria.x),
          Unit.toPt(martyria.y),
          { lineBreak: false },
        );
    }

    doc
      .fillColor(pageSetup.martyriaDefaultColor)
      .text(
        this.getMapping(martyria.note).text +
          this.getMapping(martyria.rootSign).text,
        Unit.toPt(martyria.x),
        Unit.toPt(martyria.y),
        { lineBreak: false },
      );

    if (martyria.measureBarRight) {
      doc
        .fillColor(pageSetup.measureBarDefaultColor)
        .text(
          this.getMapping(martyria.measureBarRight).text,
          Unit.toPt(martyria.x + martyria.neumeWidth),
          Unit.toPt(martyria.y),
          { lineBreak: false },
        );
    }
  }

  private renderModeKey(
    doc: PDFKit.PDFDocument,
    modeKey: ModeKeyElement,
    pageSetup: PageSetup,
  ) {
    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const fontSize = Unit.toPt(modeKey.computedFontSize);
    const color = modeKey.computedColor;

    doc.font(fontFamily).fontSize(fontSize).fillColor(color);

    let text = this.getMapping(ModeSign.Ekhos).text;

    if (modeKey.isPlagal) {
      text += this.getMapping(ModeSign.Plagal).text;
    }

    if (modeKey.isVarys) {
      text += this.getMapping(ModeSign.Varys).text;
    }

    const martyriaMapping = this.getMapping(modeKey.martyria);

    text += martyriaMapping.text;

    if (modeKey.note) {
      text += this.getMapping(modeKey.note).text;
    }

    if (modeKey.fthoraAboveNote) {
      text += this.getMapping(modeKey.fthoraAboveNote).text;
    }

    if (modeKey.quantitativeNeumeAboveNote) {
      text += this.getMapping(modeKey.quantitativeNeumeAboveNote).text;
    }

    if (modeKey.note2) {
      text += this.getMapping(modeKey.note2).text;
    }

    if (modeKey.fthoraAboveNote2) {
      text += this.getMapping(modeKey.fthoraAboveNote2).text;
    }

    if (modeKey.quantitativeNeumeAboveNote2) {
      text += this.getMapping(modeKey.quantitativeNeumeAboveNote2).text;
    }

    if (modeKey.quantitativeNeumeRight) {
      text += this.getMapping(modeKey.quantitativeNeumeRight).text;
    }

    if (modeKey.fthoraAboveQuantitativeNeumeRight) {
      text += this.getMapping(modeKey.fthoraAboveQuantitativeNeumeRight).text;
    }

    doc.text(text, Unit.toPt(modeKey.x), Unit.toPt(modeKey.y), {
      lineBreak: false,
      align: 'center',
      width: Unit.toPt(modeKey.width),
      features: martyriaMapping.salt != null ? ['salt'] : undefined,
    });
  }

  private renderTextBox(doc: PDFKit.PDFDocument, textBox: TextBoxElement) {
    if (textBox.content === '') {
      return;
    }

    let fontFamily = textBox.computedFontFamily;

    if (textBox.italic) {
      fontFamily += ' Italic';
    }

    if (textBox.bold) {
      fontFamily += ' Bold';
    }

    // doc.rect(
    //   Unit.toPt(textBox.x),
    //   Unit.toPt(textBox.y),
    //   612,
    //   Unit.toPt(textBox.computedFontSize) * 1.2
    // );
    // doc.stroke();
    doc
      .font(fontFamily)
      .fontSize(Unit.toPt(textBox.computedFontSize))
      .fillColor(textBox.computedColor)
      .text(
        textBox.content,
        Unit.toPt(textBox.x),
        Unit.toPt(textBox.y) +
          (1.2 * Unit.toPt(textBox.computedFontSize) + 2) / 4,
        { width: Unit.toPt(textBox.width), align: textBox.alignment },
      );
  }

  private renderDropCap(doc: PDFKit.PDFDocument, dropCap: DropCapElement) {
    doc
      .font(dropCap.computedFontFamily)
      .fontSize(Unit.toPt(dropCap.computedFontSize))
      .fillColor(dropCap.computedColor);

    // doc.rect(
    //   Unit.toPt(dropCap.x),
    //   Unit.toPt(dropCap.y),
    //   doc.widthOfString(dropCap.content),
    //   doc.heightOfString(dropCap.content)
    // );
    // doc.stroke();

    const fontHeight = Unit.toPt(
      dropCap.computedFontSize * dropCap.computedLineHeight!,
    );

    const textHeight = doc.heightOfString(dropCap.content.trim());

    doc.text(
      dropCap.content,
      Unit.toPt(dropCap.x),
      Unit.toPt(dropCap.y) + (fontHeight - textHeight) / 2,
      { lineBreak: false },
    );
  }

  private getMapping(neume: Neume) {
    return NeumeMappingService.getMapping(neume);
  }

  private getOffset(fontFamily: string, note: NoteElement, markNeume: Neume) {
    const mark = this.getMapping(markNeume).glyphName;
    const base = this.getMapping(note.quantitativeNeume).glyphName;

    const offset = fontService.getMarkOffset(fontFamily, base, mark);

    // Shift offset for vareia
    if (note.vareia) {
      const vareiaGlyphName = this.getMapping(
        VocalExpressionNeume.Vareia,
      ).glyphName;

      const vareiaWidth = fontService.getAdvanceWidth(
        fontFamily,
        vareiaGlyphName,
      );
      offset.x += vareiaWidth;
    }

    // Shift offset for measure bar
    if (note.measureBarLeft) {
      const glyphName = this.getMapping(note.measureBarLeft).glyphName;

      const width = fontService.getAdvanceWidth(fontFamily, glyphName);
      offset.x += width;
    }

    return offset;
  }
}
