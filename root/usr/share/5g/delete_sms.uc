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

// Xóa trên modem qua mmcli
if (targetId) {
	run('mmcli -m 0 --messaging-delete-sms=' + targetId + ' 2>/dev/null');
}

// Xóa trong file DB lưu trữ
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
	if (targetId && m.id == targetId) continue;
	if (targetText && m.text == targetText) continue;
	push(newDb, m);
}

writefile(DB_FILE, sprintf("%J\n", newDb));
print(sprintf("%J\n", { result: true }));
