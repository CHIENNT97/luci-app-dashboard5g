#!/bin/sh
#
# Script cai dat thu cong tren Router OpenWrt / ImmortalWrt
# Dashboard BY NTC - 5G CPE Management Suite
#

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=================================================="
echo "    Bat dau cai dat Dashboard BY NTC (5G CPE)    "
echo "=================================================="

if [ -f "$DIR/luci-app-dashboard5g_1.0.0-1_all.ipk" ]; then
    echo "[*] Phat hien goi .ipk, tien hanh cai dat qua opkg..."
    opkg install "$DIR/luci-app-dashboard5g_1.0.0-1_all.ipk" --force-reinstall
elif [ -d "$DIR/root" ]; then
    echo "[*] Sao chep file truc tiep tu thu muc root/ vao he thong..."
    cp -rf "$DIR/root/"* /
else
    echo "[!] Khong tim thay goi cai dat hoac thu muc root/ hop le!"
    exit 1
fi

echo "[*] Phan quyen thuc thi cho cac script..."
chmod +x /usr/libexec/rpcd/luci.5g 2>/dev/null
chmod +x /usr/share/5g/*.sh 2>/dev/null

echo "[*] Khoi dong lai dich vu rpcd va xoa sach cache LuCI..."
/etc/init.d/rpcd restart 2>/dev/null
rm -rf /tmp/luci-indexcache* /tmp/luci-modulecache

echo ""
echo "=================================================="
echo "           CAI DAT HOAN TAT THANH CONG!           "
echo "=================================================="
echo "-> Truy cap LuCI: Trang thai -> Dashboard 5G"
echo "-> Neu chua hien menu, hay nhan Ctrl + F5 tren trinh duyet."
exit 0

