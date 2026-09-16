'use strict';
import { popen, readfile, writefile } from 'fs';

const BLOCKED_DB = '/etc/5g_blocked_devices.json';

function run(cmd) {
	let fd = popen(cmd, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
}

let raw = readfile('/tmp/block_in_payload.json') || '';

let action = (index(raw, 'unblock') >= 0) ? 'unblock' : 'block';

let mMac = match(raw, /([0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2})/);
let targetMac = (mMac && mMac[1]) ? mMac[1] : '';

let mName = match(raw, /"name"\s*:\s*"([^"]+)"/);
let deviceName = (mName && mName[1]) ? mName[1] : 'Thiết bị';

if (!targetMac) {
	print(sprintf("%J\n", { error: "Địa chỉ MAC không được để trống!" }));
	exit(0);
}

// 1. Đọc DB chặn hiện tại
let db = [];
let dbRaw = readfile(BLOCKED_DB);
if (dbRaw) {
	try {
		let p = json(trim(dbRaw));
		if (p && type(p) == 'array') db = p;
	} catch(e) {}
}

if (action == 'block') {
	let exists = false;
	for (let b in db) {
		if (lc(b.mac) == lc(targetMac)) {
			exists = true;
			break;
		}
	}
	if (!exists) {
		let nowStr = run('date "+%Y-%m-%d %H:%M:%S"');
		push(db, {
			mac: targetMac,
			name: deviceName,
			date: nowStr
		});
	}
} else if (action == 'unblock') {
	let newDb = [];
	for (let b in db) {
		if (lc(b.mac) != lc(targetMac)) {
			push(newDb, b);
		}
	}
	db = newDb;
}

// Lưu lại DB
writefile(BLOCKED_DB, sprintf("%J\n", db));

// 2. Cấu hình UCI wireless macfilter deny
run('uci -q del wireless.default_MT7981_1_1.maclist');
run('uci -q del wireless.default_MT7981_1_2.maclist');

if (length(db) > 0) {
	run('uci set wireless.default_MT7981_1_1.macfilter="deny"');
	run('uci set wireless.default_MT7981_1_2.macfilter="deny"');
	for (let b in db) {
		run('uci add_list wireless.default_MT7981_1_1.maclist="' + b.mac + '"');
		run('uci add_list wireless.default_MT7981_1_2.maclist="' + b.mac + '"');
	}
} else {
	run('uci -q del wireless.default_MT7981_1_1.macfilter');
	run('uci -q del wireless.default_MT7981_1_2.macfilter');
}
run('uci commit wireless');

// 3. Cấu hình nftables firewall drop
if (length(db) > 0) {
	let macs = [];
	for (let b in db) push(macs, b.mac);
	let macJoin = join(', ', macs);
	let nftRule = 'chain block_mac_forward {\n\ttype filter hook forward priority -10; policy accept;\n\tether saddr { ' + macJoin + ' } drop\n}\n' +
	              'chain block_mac_input {\n\ttype filter hook input priority -10; policy accept;\n\tether saddr { ' + macJoin + ' } drop\n}\n';
	writefile('/etc/nftables.d/98-block-mac.nft', nftRule);
} else {
	run('rm -f /etc/nftables.d/98-block-mac.nft');
}

run('fw4 reload >/dev/null 2>&1 &');

// 4. Ngắt kết nối ngay lập tức (Kick / Disassociate)
if (action == 'block') {
	run('iwpriv ra0 set Disassoc=' + targetMac + ' 2>/dev/null');
	run('iwpriv rax0 set Disassoc=' + targetMac + ' 2>/dev/null');
}

print(sprintf("%J\n", { result: true, action: action, mac: targetMac, blockedList: db }));
