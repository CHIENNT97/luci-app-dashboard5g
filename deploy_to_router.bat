@echo off
chcp 65001 >nul
title Cai dat luci-app-dashboard5g len Modem / Router OpenWrt

echo ==============================================================
echo       CAI DAT LUCI-APP-DASHBOARD5G LEN MODEM / ROUTER
echo ==============================================================
echo.

set /p ROUTER_IP="Nhap dia chi IP cua Router (Mac dinh: 192.168.1.1): "
if "%ROUTER_IP%"=="" set ROUTER_IP=192.168.1.1

set /p ROUTER_USER="Nhap tai khoan SSH (Mac dinh: root): "
if "%ROUTER_USER%"=="" set ROUTER_USER=root

echo.
echo [*] Dang gui file cai dat .ipk len router (%ROUTER_USER%@%ROUTER_IP%)...
echo     (Neu router yeu cau mat khau, vui long nhap mat khau router)
echo.

scp -O "%~dp0luci-app-dashboard5g_1.0.0-1_all.ipk" %ROUTER_USER%@%ROUTER_IP%:/tmp/
if %ERRORLEVEL% NEQ 0 (
    echo [!] Khong the copy file qua scp. Thu copy truc tiep bang scp thuong...
    scp "%~dp0luci-app-dashboard5g_1.0.0-1_all.ipk" %ROUTER_USER%@%ROUTER_IP%:/tmp/
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] LOI: Khong the ket noi den Router qua SSH/SCP!
    echo     Vui long kiem tra lai IP, day mang hoac mat khau router.
    goto :end
)

echo.
echo [*] Dang tien hanh cai dat goi tren router...
ssh %ROUTER_USER%@%ROUTER_IP% "opkg install /tmp/luci-app-dashboard5g_1.0.0-1_all.ipk --force-reinstall && chmod +x /usr/libexec/rpcd/luci.5g /usr/share/5g/*.sh && /etc/init.d/rpcd restart && rm -rf /tmp/luci-indexcache /tmp/luci-modulecache && echo '=== CAI DAT THANH CONG! ==='"

echo.
echo ==============================================================
echo Ban co the mo trinh duyet truy cap vao router:
echo http://%ROUTER_IP%/cgi-bin/luci/admin/status/dashboard5g
echo ==============================================================

:end
echo.
pause
