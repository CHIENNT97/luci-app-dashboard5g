#!/bin/sh

URL="$1"
FLAGS="$2"
STATUS_FILE="/tmp/rom_flash_status.json"
FIRMWARE_FILE="/tmp/firmware.bin"
LOG_FILE="/tmp/flash_sysupgrade.log"

set_status() {
	STATUS="$1"
	PERCENT="$2"
	MSG="$3"
	cat <<EOF > "$STATUS_FILE"
{
	"status": "$STATUS",
	"percent": $PERCENT,
	"msg": "$MSG",
	"time": "$(date '+%H:%M:%S')"
}
EOF
}

set_status "downloading" 15 "Bắt đầu tải file ROM từ máy chủ về Router..."
rm -f "$FIRMWARE_FILE" /tmp/gdrive_cookie.txt "$LOG_FILE"

# Sử dụng curl tải file (hỗ trợ cả Google Drive và HTTP direct)
if echo "$URL" | grep -q "drive.google.com"; then
	set_status "downloading" 25 "Đang tải file Firmware từ Google Drive..."
	curl -L -k -s -S -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -c /tmp/gdrive_cookie.txt "$URL" -o "$FIRMWARE_FILE"
else
	if which curl >/dev/null 2>&1; then
		curl -L -k -s -S -A "Mozilla/5.0" "$URL" -o "$FIRMWARE_FILE"
	else
		wget --no-check-certificate "$URL" -O "$FIRMWARE_FILE"
	fi
fi

if [ ! -f "$FIRMWARE_FILE" ] || [ $(wc -c < "$FIRMWARE_FILE" 2>/dev/null || echo 0) -lt 5000000 ]; then
	set_status "error" 0 "Lỗi: Không thể tải file ROM hoặc link tải không tồn tại (Dung lượng tải về nhỏ hơn 5MB)!"
	exit 1
fi

set_status "verifying" 60 "Đang kiểm tra tính toàn vẹn và độ tương thích của file ROM..."
sleep 2

# Kiểm tra sysupgrade
if sysupgrade -T "$FIRMWARE_FILE" >/dev/null 2>&1; then
	set_status "flashing" 80 "File ROM hợp lệ! Đang chuẩn bị nạp Firmware..."
else
	# Nếu board name khác nhau (cmcc,rax3000m-stock vs 5g,cpe,V2), tự động bổ sung cờ -F
	if ! echo "$FLAGS" | grep -q -- "-F"; then
		FLAGS="$FLAGS -F"
	fi
	set_status "flashing" 80 "Đã kích hoạt cờ Buộc nạp (-F) cho dòng chip Filogic. Đang nạp Firmware..."
fi

sleep 2
set_status "rebooting" 100 "Đang ghi Firmware vào bộ nhớ Flash và khởi động lại router. Vui lòng đợi 2-3 phút..."

# Tiến hành flash thực tế với các cờ tùy chọn (-n, -F)
echo "Executing: sysupgrade $FLAGS $FIRMWARE_FILE" > "$LOG_FILE"
sysupgrade $FLAGS "$FIRMWARE_FILE" >> "$LOG_FILE" 2>&1 &
