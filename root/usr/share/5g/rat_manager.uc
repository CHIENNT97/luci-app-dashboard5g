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

	let ports = ['/dev/ttyUSB2', '/dev/ttyUSB0', '/dev/ttyUSB3', '/dev/ttyUSB1', '/dev/ttyACM0'];
	for (let p in ports) {
		if (!access(p)) continue;
		let out = run("lua /usr/share/5g/at_query.lua " + p + " 'AT' 0.5 2>/dev/null");
		if (index(out, 'OK') >= 0) {
			writefile('/tmp/cpe_at_port', p);
			return p;
		}
	}
	let defPort = access('/dev/ttyUSB0') ? '/dev/ttyUSB0' : '/dev/ttyUSB2';
	writefile('/tmp/cpe_at_port', defPort);
	return defPort;
}

function atCmd(cmd) {
	let port = getAtPort();
	let res = run("lua /usr/share/5g/at_query.lua " + port + " '" + cmd + "' 2.0 2>/dev/null");
	if (!res || length(trim(res)) == 0) {
		writefile('/tmp/at_live_in.txt', cmd + "\r\n");
		writefile('/tmp/at_live_out.txt', "");
		run("( atinout /tmp/at_live_in.txt " + port + " /tmp/at_live_out.txt 2>/dev/null & PID=$!; ( sleep 2 >/dev/null 2>&1; kill -9 $PID 2>/dev/null ) >/dev/null 2>&1 & wait $PID 2>/dev/null )");
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
