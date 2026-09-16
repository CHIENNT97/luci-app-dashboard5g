'use strict';
import { popen, readfile, writefile } from 'fs';

function run(cmd) {
	let fd = popen(cmd, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
}

function getWifiData() {
	// 2.4G Config
	let ssid2g = run('uci -q get wireless.default_MT7981_1_1.ssid') || 'ImmortalWrt-2.4G';
	let enc2g = run('uci -q get wireless.default_MT7981_1_1.encryption') || 'none';
	let key2g = run('uci -q get wireless.default_MT7981_1_1.key') || '';
	let chan2g = run('uci -q get wireless.MT7981_1_1.channel') || 'auto';
	let dis2g = run('uci -q get wireless.default_MT7981_1_1.disabled') || '0';
	let hid2g = run('uci -q get wireless.default_MT7981_1_1.hidden') || '0';
	let bw2g = run('uci -q get wireless.MT7981_1_1.htmode') || 'HE40';

	// 5G Config
	let ssid5g = run('uci -q get wireless.default_MT7981_1_2.ssid') || 'ImmortalWrt-5G';
	let enc5g = run('uci -q get wireless.default_MT7981_1_2.encryption') || 'none';
	let key5g = run('uci -q get wireless.default_MT7981_1_2.key') || '';
	let chan5g = run('uci -q get wireless.MT7981_1_2.channel') || '36';
	let dis5g = run('uci -q get wireless.default_MT7981_1_2.disabled') || '0';
	let hid5g = run('uci -q get wireless.default_MT7981_1_2.hidden') || '0';
	let bw5g = run('uci -q get wireless.MT7981_1_2.htmode') || 'HE160';

	// DHCP Leases map: MAC -> { ip, name }
	let leases = {};
	let leaseRaw = readfile('/tmp/dhcp.leases') || readfile('/var/dhcp.leases') || '';
	let lines = split(leaseRaw, '\n');
	for (let l in lines) {
		let parts = split(trim(l), ' ');
		if (length(parts) >= 4) {
			let mac = tolower(parts[1]);
			leases[mac] = { ip: parts[2], name: (parts[3] != '*' ? parts[3] : 'Thiết bị di động') };
		}
	}

	// Clients List
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
			if (mMac) {
				let mac = tolower(mMac[1]);
				let sig = mMac[2];
				let lInfo = leases[mac] || { ip: '-', name: 'Khách WiFi' };
				curClient = {
					mac: mMac[1],
					ip: lInfo.ip,
					name: lInfo.name,
					band: ifo.band,
					signal: sig + ' dBm',
					rate: '-'
				};
				push(clients, curClient);
			} else if (curClient) {
				let mRate = match(str, /([0-9.]+\s*M?B?it\/s)/);
				if (mRate) {
					curClient.rate = mRate[1];
				}
			}
		}
	}

	return {
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
		clients: clients
	};
}

let mode = ARGV[0] || 'get';

if (mode == 'get') {
	print(sprintf("%J\n", getWifiData()));
} else if (mode == 'set') {
	let raw = readfile('/tmp/wifi_in_payload.json') || '';
	let data = {};
	try {
		data = json(trim(raw)) || {};
	} catch(e) {}

	let w2 = data.wifi2g;
	if (w2) {
		if (w2.ssid) run('uci set wireless.default_MT7981_1_1.ssid="' + replace(w2.ssid, '"', '') + '"');
		if (w2.encryption) {
			run('uci set wireless.default_MT7981_1_1.encryption="' + w2.encryption + '"');
			if (w2.encryption == 'none') {
				run('uci -q del wireless.default_MT7981_1_1.key');
			} else if (w2.key) {
				run('uci set wireless.default_MT7981_1_1.key="' + replace(w2.key, '"', '') + '"');
			}
		}
		if (w2.channel) run('uci set wireless.MT7981_1_1.channel="' + w2.channel + '"');
		if (w2.htmode) run('uci set wireless.MT7981_1_1.htmode="' + w2.htmode + '"');
		run('uci set wireless.default_MT7981_1_1.disabled="' + (w2.disabled ? '1' : '0') + '"');
		run('uci set wireless.default_MT7981_1_1.hidden="' + (w2.hidden ? '1' : '0') + '"');
	}

	let w5 = data.wifi5g;
	if (w5) {
		if (w5.ssid) run('uci set wireless.default_MT7981_1_2.ssid="' + replace(w5.ssid, '"', '') + '"');
		if (w5.encryption) {
			run('uci set wireless.default_MT7981_1_2.encryption="' + w5.encryption + '"');
			if (w5.encryption == 'none') {
				run('uci -q del wireless.default_MT7981_1_2.key');
			} else if (w5.key) {
				run('uci set wireless.default_MT7981_1_2.key="' + replace(w5.key, '"', '') + '"');
			}
		}
		if (w5.channel) run('uci set wireless.MT7981_1_2.channel="' + w5.channel + '"');
		if (w5.htmode) run('uci set wireless.MT7981_1_2.htmode="' + w5.htmode + '"');
		run('uci set wireless.default_MT7981_1_2.disabled="' + (w5.disabled ? '1' : '0') + '"');
		run('uci set wireless.default_MT7981_1_2.hidden="' + (w5.hidden ? '1' : '0') + '"');
	}

	run('uci commit wireless');
	run('wifi reload >/dev/null 2>&1 &');
	print(sprintf("%J\n", { result: true, message: "Đã lưu và áp dụng cấu hình WiFi thành công!" }));
}
