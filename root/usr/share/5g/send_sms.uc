'use strict';
import { popen, writefile, readfile } from 'fs';

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

let inputRaw = readfile('/tmp/sms_in_payload.json') || '';

let num = '';
let txt = '';

try {
	let input = json(trim(inputRaw));
	if (input) {
		num = input.number || '';
		txt = input.text || '';
	}
} catch(e) {}

if (!num) {
	let mNum = match(inputRaw, /"number"\s*:\s*"([^"]+)"/);
	if (mNum) num = mNum[1];
}
if (!txt) {
	let mTxt = match(inputRaw, /"text"\s*:\s*"([^"]+)"/);
	if (mTxt) txt = mTxt[1];
}

num = trim(num);
txt = trim(txt);

if (!num || !txt) {
	print(sprintf("%J\n", { error: "Vui lòng nhập đầy đủ số điện thoại và nội dung tin nhắn!" }));
	exit(0);
}

writefile('/tmp/sms_send_payload.txt', txt);

// Tạo SMS qua ModemManager mmcli
let safeNum = replace(num, '"', '');
let createCmd = 'mmcli -m 0 --messaging-create-sms="number=' + safeNum + '" --messaging-create-sms-with-text=/tmp/sms_send_payload.txt 2>&1';
let createOut = run(createCmd);

let m = match(createOut, /SMS\/([0-9]+)/);
if (!m) {
	print(sprintf("%J\n", { error: "Không thể tạo tin nhắn: " + createOut }));
	exit(0);
}

let smsId = m[1];
let sendOut = run('mmcli -s ' + smsId + ' --send 2>&1');

if (match(sendOut, /successfully sent/i) || match(sendOut, /success/i)) {
	// Lưu vào CSDL
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

	push(dbMessages, {
		id: smsId,
		path: '/org/freedesktop/ModemManager1/SMS/' + smsId,
		number: num,
		text: txt,
		timestamp: getNowIso(),
		state: 'sent',
		smsc: ''
	});

	writefile(DB_FILE, sprintf("%J\n", dbMessages));

	print(sprintf("%J\n", { result: true, id: smsId, message: "Gửi tin nhắn thành công!" }));
} else {
	print(sprintf("%J\n", { error: "Lỗi gửi: " + sendOut, id: smsId }));
}
