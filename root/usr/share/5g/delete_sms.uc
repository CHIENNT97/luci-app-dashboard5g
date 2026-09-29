'use strict';
import { popen, readfile, writefile } from 'fs';

const DB_FILE = '/etc/5g_sms_db.json';

function run(cmd) {
	let fd = popen(cmd, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
}

let inputRaw = readfile('/tmp/sms_del_payload.json') || '';
let input = {};
try {
	input = json(trim(inputRaw)) || {};
} catch(e) {}

let targetId = input?.id || '';
let targetText = input?.text || '';

if (!targetId && !targetText) {
	let m = match(inputRaw, /"id"\s*:\s*"([^"]+)"/);
	if (m) targetId = m[1];
}

// Xác định cổng AT
let port = trim(readfile('/tmp/cpe_at_port')) || '';
if (!port || !match(port, /\/dev\/ttyUSB/)) {
	port = '/dev/ttyUSB0';
}

// 1. Xóa trên bộ nhớ Modem qua sms_tool & mmcli (nếu có)
if (targetId && match(targetId, /^[0-9]+$/)) {
	run(sprintf("flock -x /var/lock/at_port.lock /usr/bin/sms_tool -d %s delete %s 2>/dev/null", port, targetId));
}

// 2. Xóa trong file CSDL lưu trữ cục bộ
let dbMessages = [];
let dbRaw = readfile(DB_FILE);
if (dbRaw) {
	try {
		let parsed = json(trim(dbRaw));
		if (parsed && type(parsed) == 'array') {
			dbMessages = parsed;
		}
	} catch(e) {}
}

let newDb = [];
for (let m in dbMessages) {
	if (targetId && ("" + m.id) == ("" + targetId)) continue;
	if (targetText && m.text == targetText) continue;
	push(newDb, m);
}

writefile(DB_FILE, sprintf("%J\n", newDb));
print(sprintf("%J\n", { result: true }));
