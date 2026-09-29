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

let safeNum = replace(num, /[^0-9+]/g, '');
if (!safeNum) {
	print(sprintf("%J\n", { error: "Số điện thoại nhận không hợp lệ!" }));
	exit(0);
}

// Ghi nội dung SMS ra file tạm
writefile('/tmp/sms_send_txt.tmp', txt);

// Tạo SMS qua mmcli
let cmdCreate = sprintf("mmcli -m 0 --messaging-create-sms=\"number=%s\" --messaging-create-sms-with-text=/tmp/sms_send_txt.tmp 2>&1", safeNum);
let createOut = run(cmdCreate);
let mId = match(createOut, /SMS\/([0-9]+)/);

if (mId && mId[1]) {
	let smsId = mId[1];
	
	// Thực hiện gửi SMS với timeout 15 giây
	let sendOut = run(sprintf("timeout 15 mmcli -s %s --send 2>&1", smsId));
	
	if (index(sendOut, 'successfully sent') >= 0 || index(sendOut, 'successful') >= 0) {
		// Lưu tin nhắn đã gửi vào CSDL cục bộ
		let dbMessages = [];
		let dbRaw = readfile(DB_FILE);
		if (dbRaw) {
			try {
				let parsedDb = json(trim(dbRaw));
				if (parsedDb && type(parsedDb) == 'array') {
					dbMessages = parsedDb;
				}
			} catch(e) {}
		}

		push(dbMessages, {
			id: "" + smsId,
			number: num,
			text: txt,
			timestamp: getNowIso(),
			state: 'sent',
			smsc: ''
		});

		writefile(DB_FILE, sprintf("%J\n", dbMessages));

		print(sprintf("%J\n", { status: "success", result: true, id: smsId, message: "Gửi tin nhắn thành công!" }));
	} else {
		let errMsg = "Hết thời gian chờ hoặc Modem từ chối.";
		if (index(sendOut, 'Timeout was reached') >= 0 || index(sendOut, 'Terminated') >= 0) {
			errMsg = "Hết thời gian chờ phản hồi từ nhà mạng (Timeout).";
		} else if (sendOut) {
			errMsg = trim(sendOut);
		}
		print(sprintf("%J\n", { error: errMsg }));
	}
} else {
	print(sprintf("%J\n", { error: "Không thể khởi tạo SMS trên Modem. Lỗi: " + (createOut || "Unknown") }));
}
