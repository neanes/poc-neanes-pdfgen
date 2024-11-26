export class FontRegistry {
  private map = new Map<string, Buffer>();

  registerFont(key: string, data: Buffer) {
    this.map.set(key, data);
  }

  getFontData(key: string) {
    return this.map.get(key);
  }
}
