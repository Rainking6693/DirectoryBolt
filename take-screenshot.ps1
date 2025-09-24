Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$screenshot = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($screenshot)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$screenshot.Save("C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt\staff-dashboard-screenshot.png")
$graphics.Dispose()
$screenshot.Dispose()

Write-Host "Screenshot saved to staff-dashboard-screenshot.png"