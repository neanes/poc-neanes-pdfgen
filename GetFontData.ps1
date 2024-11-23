param (
    [Parameter(Mandatory = $true)][string]$family,
    [switch]$bold = $false,
    [switch]$italic = $false,
    [switch]$underline = $false,
    [switch]$strikeout = $false
)

Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
 
public static class NativeMethods
{
        [DllImport("user32.dll")]
        public static extern IntPtr GetDC(IntPtr hwnd);

        [DllImport("user32.dll")]
        public static extern IntPtr ReleaseDC(IntPtr hwnd, IntPtr hdc);

        [DllImport("gdi32.dll")]
        public static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);

        [DllImport("gdi32.dll", SetLastError = true)]
        public static extern int GetFontData(
            IntPtr hdc, // handle to DC
            uint dwTable, // metric table name
            uint dwOffset, // offset into table
            byte[] lpvBuffer, // buffer for returned data
            int cbData // length of data
            );
}
"@

$style = [System.Drawing.FontStyle]::Regular

if ($bold) {
    $style = [System.Drawing.FontStyle]::Bold
}

if ($italic) {
    $style = $style -bor [System.Drawing.FontStyle]::Italic
}

if ($underline) {
    $style = $style -bor [System.Drawing.FontStyle]::Underline
}

if ($strikeout) {
    $style = $style -bor [System.Drawing.FontStyle]::Strikeout
}

$font = [System.Drawing.Font]::new($family, 10, $style)

$hfont = $font.ToHfont()

#Write-Host $hfont

$hdc = [NativeMethods]::GetDC(0)
$oldFont = [NativeMethods]::SelectObject($hdc, $hfont)

$isTtcf = $false

$size = [NativeMethods]::GetFontData($hdc, 0, 0, $null, 0)
$bytes = [byte[]]::new($size)
#$effectiveSize = NativeMethods.GetFontData($hdc, $isTtcf ? ttcf : 0, 0, bytes, size)
$effectiveSize = [NativeMethods]::GetFontData($hdc, 0, 0, $bytes, $size)
#Debug.Assert(size == effectiveSize)
# Clean up.
[NativeMethods]::SelectObject($hdc, $oldFont) | Out-Null
[NativeMethods]::ReleaseDC(0, $hdc) | Out-Null

# Write the bytes to stdout
$outputStream = [System.Console]::OpenStandardOutput()
$outputStream.Write($bytes, 0, $bytes.Length)
$outputStream.Close()