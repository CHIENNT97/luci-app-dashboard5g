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
	DL_BYTES="${4:-0}"
	TOT_BYTES="${5:-0}"
	cat <<EOF > "$STATUS_FILE"
{
	"status": "$STATUS",
	"percent": $PERCENT,
	"msg": "$MSG",
	"downloaded_bytes": $DL_BYTES,
	"total_bytes": $TOT_BYTES,
	"time": "$(date '+%H:%M:%S')"
}
EOF
}

set_status "downloading" 5 "Bắt đầu kết nối máy chủ tải file ROM..." 0 0
rm -f "$FIRMWARE_FILE" /tmp/gdrive_cookie.txt "$LOG_FILE"

# 1. Thử lấy Content-Length (tổng dung lượng file) trước khi tải nếu là HTTP direct
TOTAL_BYTES=0
if which curl >/dev/null 2>&1; then
	CL=$(curl -sIL -k -A "Mozilla/5.0" "$URL" 2>/dev/null | tr -d '\r' | grep -i '^content-length:' | tail -n 1 | awk '{print $2}')
	if [ -n "$CL" ] && [ "$CL" -gt 1000000 ] 2>/dev/null; then
		TOTAL_BYTES="$CL"
	fi
fi

# 2. Khởi chạy curl tải file trong nền
if echo "$URL" | grep -q "drive.google.com"; then
	set_status "downloading" 8 "Đang kết nối Google Drive..." 0 0
	CONFIRM_CODE=$(curl -sL -c /tmp/gdrive_cookie.txt "$URL" 2>/dev/null | grep -o 'confirm=[^"&]*' | head -n 1)
	if [ -n "$CONFIRM_CODE" ]; then
		curl -L -k -S -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -b /tmp/gdrive_cookie.txt "${URL}&${CONFIRM_CODE}" -o "$FIRMWARE_FILE" > "$LOG_FILE" 2>&1 &
	else
		curl -L -k -S -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -c /tmp/gdrive_cookie.txt "$URL" -o "$FIRMWARE_FILE" > "$LOG_FILE" 2>&1 &
	fi
	DL_PID=$!
else
	if which curl >/dev/null 2>&1; then
		curl -L -k -S -A "Mozilla/5.0" "$URL" -o "$FIRMWARE_FILE" > "$LOG_FILE" 2>&1 &
		DL_PID=$!
	else
		wget --no-check-certificate "$URL" -O "$FIRMWARE_FILE" > "$LOG_FILE" 2>&1 &
		DL_PID=$!
	fi
fi

# 3. Vòng lặp theo dõi tiến trình tải thực tế mỗi 1 giây
LAST_BYTES=0
while kill -0 "$DL_PID" 2>/dev/null; do
	sleep 1
	if [ -f "$FIRMWARE_FILE" ]; then
		CUR_BYTES=$(wc -c < "$FIRMWARE_FILE" 2>/dev/null || echo 0)
	else
		CUR_BYTES=0
	fi

	DIFF_BYTES=$(( CUR_BYTES - LAST_BYTES ))
	[ $DIFF_BYTES -lt 0 ] && DIFF_BYTES=0
	LAST_BYTES=$CUR_BYTES

	CUR_MB=$(awk "BEGIN {printf \"%.1f\", $CUR_BYTES / 1048576}")
	SPEED_MB=$(awk "BEGIN {printf \"%.1f\", $DIFF_BYTES / 1048576}")

	if [ "$TOTAL_BYTES" -gt 0 ]; then
		TOT_MB=$(awk "BEGIN {printf \"%.1f\", $TOTAL_BYTES / 1048576}")
		P_RAW=$(( CUR_BYTES * 65 / TOTAL_BYTES ))
		PERCENT=$(( 10 + P_RAW ))
		[ $PERCENT -gt 75 ] && PERCENT=75
		MSG="Đang tải ROM: ${CUR_MB} MB / ${TOT_MB} MB (${PERCENT}%) - Tốc độ: ${SPEED_MB} MB/s"
	else
		P_RAW=$(( CUR_BYTES * 65 / 45000000 ))
		PERCENT=$(( 10 + P_RAW ))
		[ $PERCENT -gt 75 ] && PERCENT=75
		MSG="Đang tải ROM: ${CUR_MB} MB (${PERCENT}%) - Tốc độ: ${SPEED_MB} MB/s"
	fi

	set_status "downloading" "$PERCENT" "$MSG" "$CUR_BYTES" "$TOTAL_BYTES"
done

# Chờ tiến trình curl kết thúc hoàn toàn
wait "$DL_PID"
DL_EXIT=$?

FINAL_SIZE=$(wc -c < "$FIRMWARE_FILE" 2>/dev/null || echo 0)
if [ $DL_EXIT -ne 0 ] || [ ! -f "$FIRMWARE_FILE" ] || [ "$FINAL_SIZE" -lt 5000000 ]; then
	set_status "error" 0 "Lỗi: Không thể tải file ROM hoặc link tải không tồn tại (Dung lượng tải về nhỏ hơn 5MB)!"
	exit 1
fi

FINAL_MB=$(awk "BEGIN {printf \"%.1f\", $FINAL_SIZE / 1048576}")
set_status "verifying" 80 "Đã tải xong file ROM (${FINAL_MB} MB). Đang kiểm tra tính toàn vẹn (sysupgrade -T)..." "$FINAL_SIZE" "$FINAL_SIZE"
sleep 2

# Kiểm tra sysupgrade
MODE_MSG="Giữ nguyên cấu hình"
if echo "$FLAGS" | grep -q -- "-n"; then
	MODE_MSG="Xóa sạch cấu hình"
fi

if sysupgrade -T "$FIRMWARE_FILE" >/dev/null 2>&1; then
	set_status "flashing" 90 "File ROM hợp lệ! Đang nạp Firmware (${MODE_MSG})..." "$FINAL_SIZE" "$FINAL_SIZE"
else
	# Nếu board name khác nhau (cmcc,rax3000m-stock vs 5g,cpe,V2), tự động bổ sung cờ -F
	if ! echo "$FLAGS" | grep -q -- "-F"; then
		FLAGS="$FLAGS -F"
	fi
	set_status "flashing" 90 "Đã kích hoạt cờ Buộc nạp (-F). Đang nạp Firmware (${MODE_MSG})..." "$FINAL_SIZE" "$FINAL_SIZE"
fi

sleep 2
set_status "rebooting" 100 "Đang nạp Firmware (${MODE_MSG}) và khởi động lại router. Vui lòng đợi 2-3 phút..." "$FINAL_SIZE" "$FINAL_SIZE"

# Tiến hành flash thực tế với các cờ tùy chọn (-n, -F)
echo "Executing: sysupgrade $FLAGS $FIRMWARE_FILE" > "$LOG_FILE"
sysupgrade $FLAGS "$FIRMWARE_FILE" >> "$LOG_FILE" 2>&1 &
