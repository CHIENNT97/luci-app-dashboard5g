'use strict';
import { popen, readfile } from 'fs';

function run(cmd) {
	let fd = popen(cmd, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
}

let raw = readfile('/tmp/wifi_in_payload.json') || '';
let data = {};
try {
	data = json(trim(raw)) || {};
} catch(e) {}

let w2 = data.wifi2g;
if (w2) {
	if (w2.ssid) run('uci set wireless.default_MT7981_1_1.ssid="' + replace(w2.ssid, '"', '') + '"');
	if (w2.encryption) {
		run('uci set wireless.default_MT7981_1_1.encryption="' + w2.encryption + '"');
		if (w2.encryption == 'none') {
			run('uci -q del wireless.default_MT7981_1_1.key');
		} else if (w2.key) {
			run('uci set wireless.default_MT7981_1_1.key="' + replace(w2.key, '"', '') + '"');
		}
	}
	if (w2.channel) run('uci set wireless.MT7981_1_1.channel="' + w2.channel + '"');
	if (w2.htmode) run('uci set wireless.MT7981_1_1.htmode="' + w2.htmode + '"');
	run('uci set wireless.default_MT7981_1_1.disabled="' + (w2.disabled ? '1' : '0') + '"');
	run('uci set wireless.default_MT7981_1_1.hidden="' + (w2.hidden ? '1' : '0') + '"');
}

let w5 = data.wifi5g;
if (w5) {
	if (w5.ssid) run('uci set wireless.default_MT7981_1_2.ssid="' + replace(w5.ssid, '"', '') + '"');
	if (w5.encryption) {
		run('uci set wireless.default_MT7981_1_2.encryption="' + w5.encryption + '"');
		if (w5.encryption == 'none') {
			run('uci -q del wireless.default_MT7981_1_2.key');
		} else if (w5.key) {
			run('uci set wireless.default_MT7981_1_2.key="' + replace(w5.key, '"', '') + '"');
		}
	}
	if (w5.channel) run('uci set wireless.MT7981_1_2.channel="' + w5.channel + '"');
	if (w5.htmode) run('uci set wireless.MT7981_1_2.htmode="' + w5.htmode + '"');
	run('uci set wireless.default_MT7981_1_2.disabled="' + (w5.disabled ? '1' : '0') + '"');
	run('uci set wireless.default_MT7981_1_2.hidden="' + (w5.hidden ? '1' : '0') + '"');
}

run('uci commit wireless');
run('wifi reload >/dev/null 2>&1 &');

print(sprintf("%J\n", { result: true, message: "Đã lưu và áp dụng cấu hình WiFi thành công!" }));
