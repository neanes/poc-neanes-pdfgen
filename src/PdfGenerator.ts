import fs from 'fs';

import PDFDocument from 'pdfkit';

import { getFontData } from './utils/getFontData';

import { Neume } from './support/neanes/models/Neumes';
import { NeumeMappingService } from './support/neanes/services/NeumeMappingService';
import { VocalExpressionNeume } from './support/neanes/models/Neumes';
import { fontService } from './support/neanes/services/FontService';
import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
  TextBoxElement,
} from './support/neanes/models/Element';
import { Unit } from './support/neanes/utils/Unit';
import { PageSetup } from './support/neanes/models/PageSetup';

import { Score } from './support/neanes/models/Score';
import { Page } from './support/neanes/models/Page';

export class PdfGenerator {
  public async generate(score: Score, pages: Page[]) {
    const pageSetup = score.pageSetup;
    console.time('generate');
    const doc = new PDFDocument({ size: 'LETTER' });

    doc.pipe(fs.createWriteStream('output.pdf')); // write to PDF

    this.registerDefaultFonts(doc);

    doc.registerFont(
      'Palatino Linotype',
      await getFontData('Palatino LinoType'),
    );

    doc.registerFont(
      'Palatino Linotype Italic',
      await getFontData('Palatino LinoType', false, true),
    );

    doc.registerFont(
      'Palatino Linotype Bold',
      await getFontData('Palatino LinoType', true),
    );

    let firstPage = true;

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
          }
        }
      }
    }

    // finalize the PDF and end the stream
    doc.end();

    console.timeEnd('generate');
  }

  private registerDefaultFonts(doc: PDFKit.PDFDocument) {
    doc.registerFont('Neanes', 'support/neanes/assets/Neanes.otf');
    doc.registerFont('Omega', 'support/neanes/assets/EZ Omega.ttf');
    doc.registerFont('Omega Italic', 'support/neanes/assets/EZ Omega.ttf');
    doc.registerFont(
      'Source Serif',
      'support/neanes/assets/SourceSerif4-Regular.otf',
    );
    doc.registerFont(
      'PFGoudyInitials',
      'support/neanes/assets/PFGoudyInitials.ttf',
    );
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

    if (note.vocalExpressionNeume) {
      mainText += this.getMapping(note.vocalExpressionNeume).text;
    }

    doc.text(mainText, mainTextOffsetX, Unit.toPt(note.y), {
      lineBreak: false,
    });

    if (note.gorgonNeume) {
      const offset = this.getOffset(fontFamily, note, note.gorgonNeume);

      doc
        .fillColor(pageSetup.gorgonDefaultColor)
        .text(
          this.getMapping(note.gorgonNeume).text,
          Unit.toPt(note.x) + offset.x * fontSize,
          Unit.toPt(note.y) + offset.y * fontSize,
          { lineBreak: false },
        );
    }

    if (note.timeNeume) {
      const offset = this.getOffset(fontFamily, note, note.timeNeume);

      doc
        .fillColor(color)
        .text(
          this.getMapping(note.timeNeume).text,
          Unit.toPt(note.x) + offset.x * fontSize,
          Unit.toPt(note.y) + offset.y * fontSize,
          { lineBreak: false },
        );
    }

    if (note.accidental) {
      const offset = this.getOffset(fontFamily, note, note.accidental);

      doc
        .fillColor(pageSetup.accidentalDefaultColor)
        .text(
          this.getMapping(note.accidental).text,
          Unit.toPt(note.x) + offset.x * fontSize,
          Unit.toPt(note.y) + offset.y * fontSize,
          { lineBreak: false },
        );
    }

    if (note.ison) {
      const offset = this.getOffset(fontFamily, note, note.ison);

      doc
        .fillColor(pageSetup.isonDefaultColor)
        .text(
          this.getMapping(note.ison).text,
          Unit.toPt(note.x) + offset.x * fontSize,
          Unit.toPt(note.y) + offset.y * fontSize,
          { lineBreak: false },
        );
    }

    if (note.measureNumber) {
      const offset = this.getOffset(fontFamily, note, note.measureNumber);

      doc
        .fillColor(pageSetup.measureNumberDefaultColor)
        .text(
          this.getMapping(note.measureNumber).text,
          Unit.toPt(note.x) + offset.x * fontSize,
          Unit.toPt(note.y) + offset.y * fontSize,
          { lineBreak: false },
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
