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

let port = getAtPort();
let res = run("lua /usr/share/5g/at_query.lua " + port + " '" + cmd + "' 2.5 2>/dev/null");
if (!res || length(trim(res)) == 0) {
	writefile('/tmp/at_direct_in', cmd + "\r\n");
	writefile('/tmp/at_direct_out', "");
	run("( atinout /tmp/at_direct_in " + port + " /tmp/at_direct_out 2>/dev/null & PID=$!; ( sleep 3 >/dev/null 2>&1; kill -9 $PID 2>/dev/null ) >/dev/null 2>&1 & wait $PID 2>/dev/null )");
	res = readfile('/tmp/at_direct_out') || '';
}
print(res);

