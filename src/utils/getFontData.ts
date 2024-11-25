import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getFontData(
  family: string,
  bold: boolean = false,
  italic: boolean = false,
  underline: boolean = false,
  strikeout: boolean = false,
): Promise<Buffer> {
  let cmd = `powershell -File .\\src\\utils\\GetFontData.ps1 -family "${family}"`;

  if (bold) {
    cmd += ' -bold';
  }

  if (italic) {
    cmd += ' -italic';
  }

  if (underline) {
    cmd += ' -underline';
  }

  if (strikeout) {
    cmd += ' -strikeout';
  }

  const { stdout } = await execAsync(cmd, {
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 100,
  });

  //console.log((stdout as Buffer).length);

  return stdout;
}
