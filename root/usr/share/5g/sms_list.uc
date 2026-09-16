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

// 1. Đọc CSDL tin nhắn đã lưu
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

// 2. Quét tin nhắn từ modem qua mmcli
let listRaw = run('mmcli -m 0 --messaging-list-sms -J 2>/dev/null');
let listObj = json(listRaw);
let smsPaths = listObj ? listObj['modem.messaging.sms'] : [];

let changed = false;

for (let p in smsPaths) {
	let parts = split(p, '/');
	let id = parts[length(parts) - 1];
	let sRaw = run('mmcli -s ' + id + ' -J 2>/dev/null');
	let sObj = json(sRaw)?.sms;
	if (sObj) {
		let txt = sObj.content?.text || '';
		let num = sObj.content?.number || '';
		let ts = sObj.properties?.timestamp || '';
		let state = sObj.properties?.state || 'received';

		if (txt == '--' || txt == '') continue;

		// Kiểm tra trùng lặp theo ID và Path của ModemManager trong DB
		let exists = false;
		for (let m in dbMessages) {
			if (m.path == p || (m.id == id && m.timestamp == ts)) {
				exists = true;
				break;
			}
		}

		if (!exists) {
			push(dbMessages, {
				id: id,
				path: p,
				number: num || 'Hệ thống / Ẩn số',
				text: txt,
				timestamp: (ts && ts != '--') ? ts : getNowIso(),
				state: state,
				smsc: sObj.properties?.smsc || ''
			});
			changed = true;
		}
	}
}

// 3. Nếu có tin nhắn mới, lưu lại CSDL
if (changed) {
	writefile(DB_FILE, sprintf("%J\n", dbMessages));
}

// 4. Sắp xếp tin nhắn mới nhất lên đầu theo timestamp hoặc ID
sort(dbMessages, function(a, b) {
	if (a.timestamp && b.timestamp && a.timestamp != b.timestamp) {
		return a.timestamp < b.timestamp ? 1 : -1;
	}
	return (+b.id) - (+a.id);
});

print(sprintf("%J\n", { messages: dbMessages }));
