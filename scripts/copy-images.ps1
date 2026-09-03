$src = "C:\Kerjoan\Kerjoan_Kosan\Foto Kost"
$dest = "C:\Kerjoan\Kerjoan_Kosan\website\public\images"

New-Item -ItemType Directory -Force -Path "$dest\exterior", "$dest\denah", "$dest\kamar-besar", "$dest\kamar-kecil" | Out-Null

$exterior = @(
  "1788330012128.jpg",
  "1788330012154.jpg",
  "1788330012202.jpg",
  "1788330012228.jpg",
  "1788330012262.jpg",
  "1788330012459.jpg"
)

for ($i = 0; $i -lt $exterior.Count; $i++) {
  Copy-Item "$src\$($exterior[$i])" "$dest\exterior\$($i + 1).jpg" -Force
}

Copy-Item "$src\Denah Kost.jpg" "$dest\denah\denah-kost.jpg" -Force
Copy-Item "$src\Kamar Besar\1788330012290.jpg" "$dest\kamar-besar\1.jpg" -Force
Copy-Item "$src\Kamar Besar\1788330012388.jpg" "$dest\kamar-besar\2.jpg" -Force

$kecil = @(
  "1788330012340.jpg",
  "1788330012365.jpg",
  "1788330012411.jpg",
  "1788330012435.jpg"
)

for ($i = 0; $i -lt $kecil.Count; $i++) {
  Copy-Item "$src\Kamar Kecil\$($kecil[$i])" "$dest\kamar-kecil\$($i + 1).jpg" -Force
}

Write-Output ((Get-ChildItem $dest -Recurse -File).Count)
