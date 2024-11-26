import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getFontData(
  family: string,
  bold: boolean = false,
  italic: boolean = false,
): Promise<Buffer> {
  switch (process.platform) {
    // TODO
    // case 'darwin':
    //   return await getDarwinSystemFonts(family);
    case 'win32':
      return await getFontDataWin32(family, bold, italic);
    case 'linux':
      return await getFontDataLinux(family, bold, italic);
    default:
      throw new Error(
        `Error: getSystemsFonts does not support platform ${process.platform}.`,
      );
  }
}

export async function getFontDataWin32(
  family: string,
  bold: boolean = false,
  italic: boolean = false,
): Promise<Buffer> {
  let cmd = `powershell -File .\\src\\utils\\GetFontData.ps1 -family "${family}"`;

  if (bold) {
    cmd += ' -bold';
  }

  if (italic) {
    cmd += ' -italic';
  }

  const { stdout } = await execAsync(cmd, {
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 100,
  });

  return stdout;
}

export async function getFontDataLinux(
  family: string,
  bold: boolean = false,
  italic: boolean = false,
): Promise<Buffer> {
  let style = 'Regular';

  if (bold && italic) {
    style = 'Bold Italic';
  } else if (bold) {
    style = 'Bold';
  } else if (italic) {
    style = 'Italic';
  }

  const cmd = `fc-match :family="${family}":style="${style}" file`;

  const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

  const path = stdout.replace(':file=', '').replace('\n', '');

  return await fs.readFile(path);
}
