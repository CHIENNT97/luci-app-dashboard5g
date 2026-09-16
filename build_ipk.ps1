$ErrorActionPreference = "Stop"

$pkgName = "luci-app-dashboard5g"
$pkgVersion = "1.0.0-1"
$arch = "all"
$ipkName = "${pkgName}_${pkgVersion}_${arch}.ipk"

$workDir = "$PSScriptRoot\ipk_build_temp"
if (Test-Path $workDir) { Remove-Item -Recurse -Force $workDir }

$dataDir = "$workDir\data"
$controlDir = "$workDir\control"

New-Item -ItemType Directory -Force -Path $dataDir, $controlDir | Out-Null

# 1. Chuẩn bị thư mục Data
Copy-Item -Recurse -Force "$PSScriptRoot\root\*" "$dataDir\"

# Đảm bảo định dạng xuống dòng LF cho tất cả scripts và configs
Get-ChildItem -Recurse "$dataDir" -File | ForEach-Object {
    $raw = [System.IO.File]::ReadAllText($_.FullName)
    $clean = $raw.Replace("`r`n", "`n").Replace("`r", "`n")
    [System.IO.File]::WriteAllText($_.FullName, $clean, (New-Object System.Text.UTF8Encoding($false)))
}

# 2. Chuẩn bị file control
$controlContent = @"
Package: $pkgName
Version: 1.0.0-1
Depends: luci-base, rpcd, curl
Section: luci
Architecture: $arch
Maintainer: NTChien97 <chiennt97@gmail.com>
Description: LuCI Dashboard 5G CPE (ZX7981PG)
Source: https://github.com/NTChien97/luci-app-dashboard5g
"@.Replace("`r`n", "`n") + "`n"

[System.IO.File]::WriteAllText("$controlDir\control", $controlContent, (New-Object System.Text.UTF8Encoding($false)))

# 3. Postinst script (chạy sau khi opkg install)
$postinstContent = @"
#!/bin/sh
chmod +x /usr/libexec/rpcd/luci.5g 2>/dev/null
chmod +x /usr/share/5g/*.sh 2>/dev/null
/etc/init.d/rpcd restart 2>/dev/null
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
exit 0
"@.Replace("`r`n", "`n") + "`n"

[System.IO.File]::WriteAllText("$controlDir\postinst", $postinstContent, (New-Object System.Text.UTF8Encoding($false)))

# 4. Prerm script
$prermContent = @"
#!/bin/sh
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
exit 0
"@.Replace("`r`n", "`n") + "`n"

[System.IO.File]::WriteAllText("$controlDir\prerm", $prermContent, (New-Object System.Text.UTF8Encoding($false)))

# 5. File debian-binary
[System.IO.File]::WriteAllText("$workDir\debian-binary", "2.0`n", (New-Object System.Text.UTF8Encoding($false)))

# Hàm sửa permission của mọi file trong file .tar thành 0755 (rwxr-xr-x) chuẩn POSIX Linux
function Fix-TarPermissions($tarPath) {
    $bytes = [System.IO.File]::ReadAllBytes($tarPath)
    $offset = 0
    while ($offset + 512 -le $bytes.Length) {
        $allZero = $true
        for ($i = 0; $i -lt 512; $i++) {
            if ($bytes[$offset + $i] -ne 0) { $allZero = $false; break }
        }
        if ($allZero) { break }

        $sizeStr = [System.Text.Encoding]::ASCII.GetString($bytes, $offset + 124, 11).Trim()
        $fileSize = 0
        if ($sizeStr.Length -gt 0) {
            try { $fileSize = [Convert]::ToInt64($sizeStr, 8) } catch {}
        }

        # Đặt mode thành 0000755\0 (rwxr-xr-x)
        $modeBytes = [System.Text.Encoding]::ASCII.GetBytes("0000755`0")
        [Array]::Copy($modeBytes, 0, $bytes, $offset + 100, 8)

        # Xóa checksum thành khoảng trắng 0x20
        for ($i = 0; $i -lt 8; $i++) {
            $bytes[$offset + 148 + $i] = 32
        }

        # Tính tổng checksum 512 bytes của header
        $sum = 0
        for ($i = 0; $i -lt 512; $i++) {
            $sum += $bytes[$offset + $i]
        }

        # Ghi lại checksum (6 octal digits + null + space)
        $chkOct = [Convert]::ToString($sum, 8).PadLeft(6, '0')
        $chkBytes = [System.Text.Encoding]::ASCII.GetBytes("$chkOct`0 ")
        [Array]::Copy($chkBytes, 0, $bytes, $offset + 148, 8)

        $dataBlocks = [Math]::Ceiling($fileSize / 512.0)
        $offset += 512 + ([int]$dataBlocks * 512)
    }
    [System.IO.File]::WriteAllBytes($tarPath, $bytes)
}

function Compress-ToGzip($inFile, $outFile) {
    $fsIn = [System.IO.File]::OpenRead($inFile)
    $fsOut = [System.IO.File]::Create($outFile)
    $gz = New-Object System.IO.Compression.GZipStream($fsOut, [System.IO.Compression.CompressionMode]::Compress)
    $fsIn.CopyTo($gz)
    $gz.Close()
    $fsOut.Close()
    $fsIn.Close()
}

# 6. Tạo control.tar.gz với quyền 0755
Push-Location $controlDir
tar -cf "$workDir\control.tar" *
Pop-Location
Fix-TarPermissions "$workDir\control.tar"
Compress-ToGzip "$workDir\control.tar" "$workDir\control.tar.gz"

# 7. Tạo data.tar.gz với quyền 0755
Push-Location $dataDir
tar -cf "$workDir\data.tar" *
Pop-Location
Fix-TarPermissions "$workDir\data.tar"
Compress-ToGzip "$workDir\data.tar" "$workDir\data.tar.gz"

# 8. Đóng gói file .ipk
$outputIpk = "$PSScriptRoot\$ipkName"
Push-Location $workDir
tar -czf $outputIpk debian-binary control.tar.gz data.tar.gz
Pop-Location

# Copy ra cả thư mục cha
Copy-Item -Force $outputIpk "$PSScriptRoot\..\$ipkName"

# Dọn dẹp temp
Remove-Item -Recurse -Force $workDir

Write-Host "==========================================" -ForegroundColor Green
Write-Host " Da tao thanh cong file cai dat .ipk (Chuan quyen 755 Linux):" -ForegroundColor Green
Write-Host " $outputIpk" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
