Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("D:\DAIICT College\Software\CSES Extension\icons\image.jpg")
$img.Save("D:\DAIICT College\Software\CSES Extension\icons\image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
