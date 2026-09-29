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

function getNowIso() {
	return run('date "+%Y-%m-%dT%H:%M:%S+07"');
}

function cleanSender(s) {
	if (!s) return 'Tổng đài / Hệ thống';
	s = trim(s);
	// Xử lý các chuỗi ký tự tổng đài mã hóa 7-bit (như =<<;5=905:2 -> VinaPhone)
	if (match(s, /^[=<>:;0-9]+$/) && match(s, /[=<>:;]/)) {
		return 'VinaPhone / Tổng đài';
	}
	return s;
}

function formatTs(ts) {
	if (!ts || ts == '--') return getNowIso();
	// Chuyển MM/DD/YY HH:MM:SS -> 20YY-MM-DD HH:MM:SS
	let m = match(ts, /^([0-9]{2})\/([0-9]{2})\/([0-9]{2})\s+([0-9]{2}:[0-9]{2}:[0-9]{2})/);
	if (m) {
		return '20' + m[3] + '-' + m[1] + '-' + m[2] + ' ' + m[4];
	}
	return ts;
}

// 1. Đọc CSDL tin nhắn đã lưu trong máy
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

let changed = false;

// Đã gỡ bỏ sms_tool để tránh xung đột port với ModemManager.
// Tính năng nhận tin nhắn sẽ dùng hoàn toàn bằng mmcli.

// 3. Quét bổ sung từ mmcli (nếu có tin nhắn lưu trữ khác)
let listRaw = run('mmcli -m 0 --messaging-list-sms -J 2>/dev/null');
let listObj = null;
try {
	listObj = json(trim(listRaw));
} catch(e) {}
let smsPaths = listObj ? listObj['modem.messaging.sms'] : [];

for (let p in smsPaths) {
	let parts = split(p, '/');
	let id = parts[length(parts) - 1];
	let sRaw = run('mmcli -s ' + id + ' -J 2>/dev/null');
	let sObj = null;
	try {
		sObj = json(trim(sRaw))?.sms;
	} catch(e) {}

	if (sObj) {
		let txt = sObj.content?.text || '';
		let num = sObj.content?.number || '';
		let ts = sObj.properties?.timestamp || '';
		let state = sObj.properties?.state || 'received';

		if (txt == '--' || txt == '') continue;

		let exists = false;
		for (let m in dbMessages) {
			if (m.path == p || (m.id == id && m.timestamp == ts) || (m.text == txt && m.timestamp == ts)) {
				exists = true;
				break;
			}
		}

		if (!exists) {
			push(dbMessages, {
				id: id,
				path: p,
				number: cleanSender(num || 'Hệ thống / Ẩn số'),
				text: txt,
				timestamp: (ts && ts != '--') ? ts : getNowIso(),
				state: state,
				smsc: sObj.properties?.smsc || ''
			});
			changed = true;
		}
	}
}

// 4. Lưu lại DB nếu có tin nhắn mới
if (changed) {
	writefile(DB_FILE, sprintf("%J\n", dbMessages));
}

// 5. Sắp xếp tin nhắn mới nhất lên đầu
sort(dbMessages, function(a, b) {
	if (a.timestamp && b.timestamp && a.timestamp != b.timestamp) {
		return a.timestamp < b.timestamp ? 1 : -1;
	}
	return (+b.id) - (+a.id);
});

print(sprintf("%J\n", { messages: dbMessages }));
