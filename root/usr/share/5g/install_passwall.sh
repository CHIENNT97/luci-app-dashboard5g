#!/bin/sh

STATUS_FILE="/tmp/passwall_install_status.json"
LOG_FILE="/tmp/install_passwall.log"

set_status() {
	STATUS="$1"
	PERCENT="$2"
	MSG="$3"
	echo "[$(date '+%H:%M:%S')] >>> $MSG" >> "$LOG_FILE"
	cat <<EOF > "$STATUS_FILE"
{
	"status": "$STATUS",
	"percent": $PERCENT,
	"msg": "$MSG",
	"time": "$(date '+%H:%M:%S')"
}
EOF
}

echo "========================================================" > "$LOG_FILE"
echo " BẮT ĐẦU CÀI ĐẶT PASSWALL 2 (OpenWrt PassWall 2)" >> "$LOG_FILE"
echo " Thời gian: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo " Kiến trúc CPU: $(uname -m) / Target: aarch64_cortex-a53" >> "$LOG_FILE"
echo "========================================================" >> "$LOG_FILE"

# 1. Cập nhật và cài các gói phụ thuộc hệ thống
set_status "running" 15 "Đang cập nhật danh sách gói và cài đặt gói phụ thuộc cơ sở..."
opkg update >> "$LOG_FILE" 2>&1
opkg install --force-space coreutils coreutils-base64 coreutils-nohup coreutils-timeout curl ip-full libuci-lua lua luci-compat luci-lib-jsonc lyaml resolveip unzip luci-lua-runtime xray-core sing-box >> "$LOG_FILE" 2>&1

# 2. Chuẩn bị thư mục tạm thời
mkdir -p /tmp/pw2_install
cd /tmp/pw2_install || exit 1

# 3. Lấy thông tin phiên bản mới nhất từ GitHub Openwrt-Passwall/openwrt-passwall2
set_status "running" 35 "Đang kết nối GitHub để lấy link tải bản PassWall 2 mới nhất..."
LATEST_TAG=$(curl -sL https://api.github.com/repos/Openwrt-Passwall/openwrt-passwall2/releases/latest | grep '"tag_name":' | head -n 1 | cut -d'"' -f4)
[ -z "$LATEST_TAG" ] && LATEST_TAG="26.9.12-2"
echo "Phiên bản phát hành PassWall 2: $LATEST_TAG" >> "$LOG_FILE"

PW2_BASE="https://github.com/Openwrt-Passwall/openwrt-passwall2/releases/download/${LATEST_TAG}"

# 4. Tải và cài đặt gói lõi phụ trợ (packages_ipk_aarch64_cortex-a53.zip)
set_status "running" 50 "Đang tải các gói lõi quy tắc (v2ray-geosite, v2ray-geoip, chinadns-ng)..."
curl -sL -o /tmp/pw2_install/packages_ipk.zip "${PW2_BASE}/packages_ipk_aarch64_cortex-a53.zip" >> "$LOG_FILE" 2>&1
if [ -f /tmp/pw2_install/packages_ipk.zip ]; then
	unzip -o /tmp/pw2_install/packages_ipk.zip -d /tmp/pw2_install/ >> "$LOG_FILE" 2>&1
	rm -f /tmp/pw2_install/packages_ipk.zip
	echo "Tiến hành cài đặt tuần tự các gói dữ liệu quy tắc & Core..." >> "$LOG_FILE"
	for pkg in tcping geoview v2ray-geoip v2ray-geosite chinadns-ng; do
		F=$(ls /tmp/pw2_install/${pkg}*.ipk 2>/dev/null | head -n 1)
		if [ -n "$F" ]; then
			echo "Cài đặt thành phần: $(basename "$F")..." >> "$LOG_FILE"
			opkg install --force-space "$F" >> "$LOG_FILE" 2>&1
			rm -f "$F"
		fi
	done
fi

# 5. Tải và cài đặt gói giao diện chính luci-app-passwall2 và ngôn ngữ
set_status "running" 75 "Đang tải và cài đặt giao diện luci-app-passwall2..."
PW2_IPK_URL=$(curl -sL https://api.github.com/repos/Openwrt-Passwall/openwrt-passwall2/releases/latest | grep "browser_download_url.*luci-app-passwall2.*all\.ipk" | head -n 1 | cut -d'"' -f4)
[ -z "$PW2_IPK_URL" ] && PW2_IPK_URL="${PW2_BASE}/luci-app-passwall2_26.9.12-r2_all.ipk"

curl -sL -o /tmp/pw2_install/luci-app-passwall2.ipk "$PW2_IPK_URL" >> "$LOG_FILE" 2>&1
opkg install --force-space /tmp/pw2_install/luci-app-passwall2.ipk >> "$LOG_FILE" 2>&1
rm -f /tmp/pw2_install/luci-app-passwall2.ipk

# Tải gói i18n
curl -sL -o /tmp/pw2_install/luci-i18n-passwall2.ipk "${PW2_BASE}/luci-i18n-passwall2-zh-cn_26.9.12_all.ipk" >> "$LOG_FILE" 2>&1
opkg install --force-space /tmp/pw2_install/luci-i18n-passwall2.ipk >> "$LOG_FILE" 2>&1
rm -f /tmp/pw2_install/luci-i18n-passwall2.ipk

# 6. Dọn dẹp tệp tạm
rm -rf /tmp/pw2_install

# 7. Khởi động lại dịch vụ web và rpcd
set_status "running" 90 "Đang làm mới bộ nhớ cache giao diện LuCI..."
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
/etc/init.d/rpcd restart >/dev/null 2>&1
/etc/init.d/uhttpd restart >/dev/null 2>&1

# 8. Kiểm tra kết quả
if opkg list-installed | grep -q "luci-app-passwall2"; then
	echo "========================================================" >> "$LOG_FILE"
	echo " CHÚC MỪNG: CÀI ĐẶT THÀNH CÔNG PASSWALL 2! [$(date '+%H:%M:%S')]" >> "$LOG_FILE"
	echo " Đường dẫn truy cập trong LuCI: Dịch vụ -> PassWall 2" >> "$LOG_FILE"
	echo " URL: /cgi-bin/luci/admin/services/passwall2" >> "$LOG_FILE"
	echo "========================================================" >> "$LOG_FILE"
	set_status "success" 100 "Đã cài đặt thành công PassWall 2! Bạn có thể bấm 'Mở PassWall 2' để cấu hình."
else
	echo "========================================================" >> "$LOG_FILE"
	echo " CÀI ĐẶT THẤT BẠI! Vui lòng kiểm tra lại log chi tiết ở trên." >> "$LOG_FILE"
	echo "========================================================" >> "$LOG_FILE"
	set_status "error" 0 "Quá trình cài đặt gặp lỗi! Vui lòng kiểm tra lại kết nối mạng."
fi
