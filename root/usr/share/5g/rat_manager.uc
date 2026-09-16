'use strict';
import { popen, readfile, writefile, access } from 'fs';

function run(cmd) {
	let fd = popen(cmd, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
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

function atCmd(cmd) {
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
			if (length(trim(content)) > 0) return trim(content);
		}
	}
	let port = getAtPort();
	let res = run("sms_tool -d " + port + " at '" + cmd + "' 2>/dev/null");
	if (!res || length(trim(res)) == 0) {
		writefile('/tmp/at_live_in.txt', cmd + "\r\n");
		run("atinout /tmp/at_live_in.txt " + port + " /tmp/at_live_out.txt 2>/dev/null");
		res = readfile('/tmp/at_live_out.txt') || '';
	}
	return res ? trim(res) : '';
}

function getRatMode() {
	let raw = atCmd('AT!SELRAT?');
	let code = '00';
	let name = 'Tự động (Automatic 4G/5G)';

	let m = match(raw, /!SELRAT:\s*([0-9]+)/i);
	if (m && m[1]) {
		code = trim(m[1]);
		if (code == '00') {
			name = 'Tự động (Automatic 4G/5G)';
		} else if (code == '06') {
			name = 'Khóa chỉ 4G LTE (LTE Only)';
		} else if (code == '21') {
			name = 'Khóa 4G + 5G (LTE & NR 5G NSA/SA)';
		} else if (code == '20') {
			name = 'Khóa chỉ 5G-SA (NR 5G Standalone)';
		}
	}

	return {
		code: code,
		name: name,
		raw: raw
	};
}

function setRatMode(modeCode) {
	if (!modeCode) modeCode = '00';
	modeCode = trim(modeCode);

	let res = atCmd('AT!SELRAT=' + modeCode);

	let name = 'Khóa 4G + 5G (LTE & NR 5G NSA/SA)';
	if (modeCode == '00') name = 'Tự động (Automatic 4G/5G)';
	else if (modeCode == '06') name = 'Khóa chỉ 4G LTE (LTE Only)';
	else if (modeCode == '20') name = 'Khóa chỉ 5G-SA (NR 5G Standalone)';

	return {
		result: true,
		mode: modeCode,
		current: {
			code: modeCode,
			name: name
		}
	};
}

let action = ARGV[0] || 'get';

if (action == 'get') {
	print(sprintf("%J\n", getRatMode()));
} else if (action == 'set') {
	let raw = readfile('/tmp/rat_in_payload.json') || '';
	let modeCode = '21';
	try {
		let p = json(trim(raw));
		if (p && p.mode) modeCode = p.mode;
	} catch(e) {}

	print(sprintf("%J\n", setRatMode(modeCode)));
}
