Add-Type -AssemblyName System.Drawing
$src = "C:\Users\NISARG VEKARIYA\.gemini\antigravity\brain\c8a8df8f-4fc9-4af5-97c4-313d4f3a790c\cses_pro_trustable_icon_1781598097552.png"
$dest = "D:\DAIICT College\Software\CSES Extension\icons\image.png"
$img = [System.Drawing.Image]::FromFile($src)
$img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
