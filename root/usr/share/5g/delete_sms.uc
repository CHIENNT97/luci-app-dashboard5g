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

let targetId   = input?.id   || '';
let targetText = input?.text || '';
let deleteAll  = input?.all  == true;

// Fallback: parse thủ công nếu json() không đọc được
if (!targetId && !targetText && !deleteAll) {
	let m = match(inputRaw, /"id"\s*:\s*"([^"]+)"/);
	if (m) targetId = m[1];
	if (index(inputRaw, '"all":true') >= 0 || index(inputRaw, '"all": true') >= 0) deleteAll = true;
}

// ── 1. Đọc DB cục bộ ─────────────────────────────────────────────────────────
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

// ── 2. Xóa SMS trên Modem qua mmcli ─────────────────────────────────────────
if (deleteAll) {
	// Xóa toàn bộ SMS đang lưu trong ModemManager
	let listRaw = run('mmcli -m 0 --messaging-list-sms 2>/dev/null');
	for (let line in split(listRaw, '\n')) {
		let mPath = match(trim(line), /\/org\/freedesktop\/ModemManager1\/SMS\/([0-9]+)/);
		if (mPath && mPath[1]) {
			run(sprintf("mmcli -m 0 --messaging-delete-sms='/org/freedesktop/ModemManager1/SMS/%s' 2>/dev/null", mPath[1]));
		}
	}
	// Xóa toàn bộ DB cục bộ
	writefile(DB_FILE, '[]\n');
	print(sprintf("%J\n", { result: true, deleted: length(dbMessages) }));
	exit(0);
}

// Xóa tin nhắn đơn lẻ trên ModemManager bằng path hoặc id
let matchedMsg = null;
for (let m in dbMessages) {
	if (targetId && ("" + m.id) == ("" + targetId)) { matchedMsg = m; break; }
	if (targetText && m.text == targetText) { matchedMsg = m; break; }
}

if (matchedMsg) {
	// Nếu có path dbus (do mmcli lưu)
	if (matchedMsg.path && match(matchedMsg.path, /\/SMS\/([0-9]+)/)) {
		run(sprintf("mmcli -m 0 --messaging-delete-sms='%s' 2>/dev/null", matchedMsg.path));
	} else if (matchedMsg.id && match("" + matchedMsg.id, /^[0-9]+$/)) {
		// Thử theo index số
		run(sprintf("mmcli -m 0 --messaging-delete-sms='/org/freedesktop/ModemManager1/SMS/%s' 2>/dev/null", matchedMsg.id));
	}
}

// ── 3. Xóa trong DB cục bộ ───────────────────────────────────────────────────
let newDb = [];
for (let m in dbMessages) {
	if (targetId && ("" + m.id) == ("" + targetId)) continue;
	if (targetText && m.text == targetText) continue;
	push(newDb, m);
}

writefile(DB_FILE, sprintf("%J\n", newDb));
print(sprintf("%J\n", { result: true, deleted: length(dbMessages) - length(newDb) }));
