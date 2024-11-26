# Neanes PDF Generator Proof-of-Concept

If you are looking for the main Neanes software, please go [here](https://neanes.github.io/neanes/).

## Running

```bash
npm install
npm run start -- /path/to/file.byz|x
```

Output is written to `output.pdf`.

If you are on Windows and receive an error concerning PowerShell scripts, you must [update your execution policy](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy).

## What is this?

Neanes uses Electron's printing and PDF generation capabilities to achieve WYSIWYG. This project is a demonstration of how PDF generation could be achieved without relying on Electron's printing capabilities. It was created to serve as a reference should Neanes ever need to pivot from its current technologies, as well as a reference for anyone who might want to create their own scorewriting software without Electron, or a CLI tool for Neanes.

It is only a rough proof-of-concept and contains many missing features. For example, lack of font resolution on MacOS, lack of a centralized font registry (which means fonts are being loaded twice), no support for TTC font files, and no support for rich text boxes.
