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

// 1. Đọc danh sách thiết bị bị chặn
let blockedList = [];
let dbRaw = readfile(BLOCKED_DB);
if (dbRaw) {
	try {
		let parsed = json(trim(dbRaw));
		if (parsed && type(parsed) == 'array') {
			blockedList = parsed;
		}
	} catch(e) {}
}

let blockedMacMap = {};
for (let b in blockedList) {
	if (b.mac) blockedMacMap[lc(b.mac)] = true;
}

// 2. 2.4G Config
let ssid2g = run('uci -q get wireless.default_MT7981_1_1.ssid') || 'ImmortalWrt-2.4G';
let enc2g = run('uci -q get wireless.default_MT7981_1_1.encryption') || 'none';
let key2g = run('uci -q get wireless.default_MT7981_1_1.key') || '';
let chan2g = run('uci -q get wireless.MT7981_1_1.channel') || 'auto';
let dis2g = run('uci -q get wireless.default_MT7981_1_1.disabled') || '0';
let hid2g = run('uci -q get wireless.default_MT7981_1_1.hidden') || '0';
let bw2g = run('uci -q get wireless.MT7981_1_1.htmode') || 'HE40';

// 3. 5G Config
let ssid5g = run('uci -q get wireless.default_MT7981_1_2.ssid') || 'ImmortalWrt-5G';
let enc5g = run('uci -q get wireless.default_MT7981_1_2.encryption') || 'none';
let key5g = run('uci -q get wireless.default_MT7981_1_2.key') || '';
let chan5g = run('uci -q get wireless.MT7981_1_2.channel') || '36';
let dis5g = run('uci -q get wireless.default_MT7981_1_2.disabled') || '0';
let hid5g = run('uci -q get wireless.default_MT7981_1_2.hidden') || '0';
let bw5g = run('uci -q get wireless.MT7981_1_2.htmode') || 'HE160';

// 4. DHCP Leases map
let leases = {};
let leaseRaw = readfile('/tmp/dhcp.leases') || readfile('/var/dhcp.leases') || '';
let lines = split(leaseRaw, '\n');
for (let l in lines) {
	let parts = split(trim(l), ' ');
	if (length(parts) >= 4) {
		let mac = lc(parts[1]);
		leases[mac] = { ip: parts[2], name: (parts[3] != '*' ? parts[3] : 'Thiết bị di động') };
	}
}

// 5. Clients List
let clients = [];
let ifaces = [
	{ ifname: 'ra0', band: '2.4 GHz' },
	{ ifname: 'rax0', band: '5 GHz' }
];

for (let ifo in ifaces) {
	let assocRaw = run('iwinfo ' + ifo.ifname + ' assoclist 2>/dev/null');
	let clines = split(assocRaw, '\n');
	let curClient = null;

	for (let cl in clines) {
		let str = trim(cl);
		let mMac = match(str, /^([0-9A-Fa-f:]{17})\s+(-?[0-9]+)\s+dBm/);
		if (mMac && mMac[1]) {
			let rawMac = mMac[1];
			let mac = lc(rawMac);
			let sig = mMac[2];
			let lInfo = leases[mac] || { ip: '-', name: 'Khách WiFi' };
			curClient = {
				mac: rawMac,
				ip: lInfo.ip,
				name: lInfo.name,
				band: ifo.band,
				signal: sig + ' dBm',
				rate: '-',
				isBlocked: !!blockedMacMap[mac]
			};
			push(clients, curClient);
		} else if (curClient) {
			let mRate = match(str, /([0-9.]+\s*M?B?it\/s)/);
			if (mRate && mRate[1]) {
				curClient.rate = mRate[1];
			}
		}
	}
}

let result = {
	wifi2g: {
		ssid: ssid2g,
		encryption: enc2g,
		key: key2g,
		channel: chan2g,
		disabled: (dis2g == '1'),
		hidden: (hid2g == '1'),
		htmode: bw2g
	},
	wifi5g: {
		ssid: ssid5g,
		encryption: enc5g,
		key: key5g,
		channel: chan5g,
		disabled: (dis5g == '1'),
		hidden: (hid5g == '1'),
		htmode: bw5g
	},
	clients: clients,
	blockedList: blockedList
};

print(sprintf("%J\n", result));
