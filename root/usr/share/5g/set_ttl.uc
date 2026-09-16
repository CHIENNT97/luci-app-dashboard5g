'use strict';
import { readfile, writefile, popen } from 'fs';

let raw = readfile('/tmp/ttl_in_payload.json') || '';

let en = false;
let v = '65';

try {
	let j = json(trim(raw));
	if (j) {
		en = !!j.enabled;
		if (j.value != null && j.value != '') v = '' + j.value;
	}
} catch(e) {}

if (v == '65') {
	// Fallback regex
	if (index(raw, 'true') >= 0 || index(raw, '"1"') >= 0 || index(raw, ':1') >= 0) {
		if (index(raw, 'false') < 0) en = true;
	}
	let mVal = match(raw, /"value"\s*:\s*"?([0-9]+)"?/);
	if (mVal && mVal[1]) v = mVal[1];
}

function run(c) {
	let p = popen(c, 'r');
	if (p) {
		p.read('all');
		p.close();
	}
}

// Lưu cấu hình vào UCI để luôn ghi nhớ giá trị người dùng đã chọn
run('mkdir -p /etc/config && touch /etc/config/modeminfo && uci -q set modeminfo.ttl=ttl && uci -q set modeminfo.ttl.enabled=' + (en ? '1' : '0') + ' && uci -q set modeminfo.ttl.value=' + v + ' && uci commit modeminfo');

if (en) {
	let rule = 'chain mangle_post_ttl {\n\ttype filter hook postrouting priority 300; policy accept;\n\tip ttl set ' + v + '\n\tip6 hoplimit set ' + v + '\n}\n';
	writefile('/etc/nftables.d/99-ttl.nft', rule);
	run('fw4 reload >/dev/null 2>&1');
	print(sprintf("%J\n", { result: true, enabled: true, value: v }));
} else {
	run('rm -f /etc/nftables.d/99-ttl.nft; fw4 reload >/dev/null 2>&1');
	print(sprintf("%J\n", { result: true, enabled: false, value: v }));
}
