# Dashboard BY NTC - 5G CPE Management Suite for OpenWrt / ImmortalWrt

Bộ quản trị chuyên dụng cho modem 5G NR (Qualcomm Snapdragon X55 / X62 / X65, Quectel RM500Q/RM520N, Fibocom FM350/FM160, v.v.) hoạt động trên nền tảng OpenWrt & ImmortalWrt (hỗ trợ hoàn hảo MediaTek Filogic 820, MT7981B, ZX7981PG, RAX3000M,...).

---

## 🌟 Tính Năng Nổi Bật

1. **Giám sát tín hiệu 5G/4G Carrier Aggregation (CA) theo thời gian thực:**
   - Hiển thị băng tần chính (PCC) và các băng tần phụ (SCC1, SCC2, SCC3, SCC4).
   - Đo lường chi tiết chỉ số sóng: RSRP, RSRQ, SINR, CQI, PCI, Cell ID, Bandwidth.
   - Thống kê lưu lượng mạng realtime (Download / Upload speed).
2. **Terminal tập lệnh AT trực tiếp:**
   - Gửi lệnh AT tới Modem và nhận kết quả phản hồi ngay lập tức trên giao diện Web.
   - Có sẵn các lệnh tắt hữu ích (kiểm tra sóng, nhiệt độ modem, đổi IMEI, khóa cell).
3. **Bypass giới hạn phát Hotspot (TTL Mangle qua nftables):**
   - Hỗ trợ đổi TTL thành `64`, `65`, `128` (Windows PC),... để dùng toàn bộ dung lượng gói cước chính không bị trừ vào data chia sẻ Hotspot.
   - Cơ chế lưu vĩnh viễn trên router (giữ cấu hình qua các lần khởi động lại).
4. **Hộp thư SMS đầy đủ tính năng:**
   - Đọc tin nhắn SMS tiếng Việt UTF-8 chuẩn.
   - Gửi tin nhắn SMS trực tiếp tới đầu số bất kỳ.
   - Xóa tin nhắn rác hoặc toàn bộ hộp thư.
5. **Cài đặt PassWall 2 tự động (Tích hợp Live Console Log):**
   - Kiểm tra trạng thái cài đặt PassWall 2 trên router.
   - Tự động tải và cài đặt toàn bộ gói phụ thuộc (chinadns-ng, sing-box, xray, shadowsocks-rust,...).
   - Màn hình Console đen chuẩn Terminal hiển thị tiến trình tải/cài đặt trực tiếp theo thời gian thực.
6. **Khóa mạng & Băng tần (RAT Lock):**
   - Khóa chế độ chỉ 5G SA, chỉ 5G NSA, 5G Auto, hoặc chỉ 4G LTE.
7. **Quản lý thiết bị & Chặn truy cập (Device Blocking):**
   - Xem danh sách thiết bị kết nối, chặn MAC address.
8. **Cấu hình WiFi & Quản lý ROM Firmware:**
   - Đổi SSID, mật khẩu WiFi 2.4GHz & 5GHz.
   - Hỗ trợ kiểm tra thư mục ROM online và nạp ROM trực tiếp.

---

## 📦 Hướng Dẫn Biên Dịch Trong OpenWrt / ImmortalWrt

### 1. Đưa package vào mã nguồn OpenWrt
Đứng tại thư mục gốc của mã nguồn OpenWrt / ImmortalWrt, thực hiện lệnh:

```bash
# Clone vào thư mục package
git clone https://github.com/CHIENNT97/luci-app-dashboard5g.git package/luci-app-dashboard5g

# Cập nhật index package
./scripts/feeds update -i
./scripts/feeds install -a
```

### 2. Chọn package trong menuconfig
```bash
make menuconfig
```
Di chuyển tới:
> **LuCI** ---> **3. Applications** ---> Chọn `<*>` hoặc `<M>` trước **luci-app-dashboard5g**

Lưu lại cấu hình (`.config`).

### 3. Biên dịch riêng package
```bash
make package/luci-app-dashboard5g/compile V=s
```
File cài đặt `.ipk` sẽ được tạo ra tại thư mục:
`bin/packages/<architecture>/base/` hoặc `bin/packages/<architecture>/luci/`.

---

## 🚀 Hướng Dẫn Cài Đặt Nhanh Trực Tiếp Lên Router

### Cách 1: Cài bằng file `.ipk` (Khuyên dùng)
Tải file `luci-app-dashboard5g_1.0.0-1_all.ipk` có sẵn trong repository này lên router qua SCP / WinSCP vào `/tmp/`, sau đó chạy qua SSH:
```bash
opkg update
opkg install /tmp/luci-app-dashboard5g_1.0.0-1_all.ipk --force-reinstall
```

### Cách 2: Cài thủ công bằng Script `offline_install.sh`
Sau khi tải thư mục mã nguồn về router (ví dụ lưu tại `/tmp/luci-app-dashboard5g`):
```bash
cd /tmp/luci-app-dashboard5g
sh offline_install.sh
```

---

## 🌐 Truy Cập Giao Diện
Sau khi cài đặt xong:
1. Đăng nhập vào LuCI Router (mặc định: `http://192.168.1.1` hoặc IP router của bạn).
2. Vào mục **Trạng thái (Status)** -> **Dashboard 5G**.
3. Nếu giao diện chưa hiện ngay, nhấn tổ hợp phím **`Ctrl + F5`** (hoặc `Shift + F5`) trên trình duyệt để xóa sạch cache web.
