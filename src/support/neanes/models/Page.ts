import { ElementType, ScoreElement } from './Element';

export class Page {
  public lines: Line[] = [];

  public isVisible: boolean = false;

  // A page is empty if it contains only one line
  // and the line is empty
  public get isEmpty() {
    return this.lines.length === 1 && this.lines[0].isEmpty;
  }
}

export class Line {
  public elements: ScoreElement[] = [];

  // A line is empty if it contains only the empty element
  public get isEmpty() {
    return (
      this.elements.length === 1 &&
      this.elements[0].elementType === ElementType.Empty
    );
  }
}
