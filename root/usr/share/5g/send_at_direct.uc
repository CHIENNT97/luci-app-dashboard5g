'use strict';
import { popen, open, readfile, writefile, access } from 'fs';

let cmd = ARGV[0] || 'ATI';

function run(cmdStr) {
	let fd = popen(cmdStr, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
}

// Thử qua mmcli trước (tức thì nếu ModemManager đang chạy)
let mmRes = run("mmcli -m 0 --command='" + cmd + "' 2>/dev/null");
if (mmRes && length(mmRes) > 0) {
	let marker = "response: '";
	let si = index(mmRes, marker);
	if (si >= 0) {
		let content = substr(mmRes, si + length(marker));
		let i = length(content);
		while (i > 0) {
			let ch = substr(content, i - 1, 1);
			if (ch == "\n" || ch == "\r" || ch == " " || ch == "\t") { i--; continue; }
			if (ch == "'") { i--; }
			break;
		}
		content = substr(content, 0, i);
		if (length(trim(content)) > 0) {
			print(trim(content) + "\n\nOK\n");
			exit(0);
		}
	}
}

function getAtPort() {
	let cached = trim(readfile('/tmp/cpe_at_port') || '');
	if (cached && access(cached)) return cached;

	let ports = ['/dev/ttyUSB2', '/dev/ttyUSB3', '/dev/ttyUSB1', '/dev/ttyUSB0', '/dev/ttyACM0'];
	for (let p in ports) {
		if (!access(p)) continue;
		writefile('/tmp/at_p_in', "AT\r\n");
		let fd = popen('atinout /tmp/at_p_in ' + p + ' /tmp/at_p_out 2>/dev/null', 'r');
		if (fd) { fd.read('all'); fd.close(); }
		let out = readfile('/tmp/at_p_out') || '';
		if (index(out, 'OK') >= 0) {
			writefile('/tmp/cpe_at_port', p);
			return p;
		}
	}
	return '/dev/ttyUSB2';
}

let port = getAtPort();
writefile('/tmp/at_direct_in', cmd + "\r\n");
let fd = popen('atinout /tmp/at_direct_in ' + port + ' /tmp/at_direct_out 2>/dev/null', 'r');
if (fd) {
	fd.read('all');
	fd.close();
}
let res = readfile('/tmp/at_direct_out') || '';
if (!res || length(trim(res)) == 0) {
	// Fallback to sms_tool
	let stFd = popen("sms_tool -d " + port + " at '" + cmd + "' 2>/dev/null", 'r');
	if (stFd) {
		res = stFd.read('all') || '';
		stFd.close();
	}
}
print(res);

