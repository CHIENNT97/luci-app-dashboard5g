'use strict';
import { popen, readfile, writefile } from 'fs';

const STATUS_FILE = '/tmp/passwall_install_status.json';
const LOG_FILE = '/tmp/install_passwall.log';

function run(cmd) {
	let fd = popen(cmd, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
}

let action = ARGV[0] || 'status';

if (action == 'status') {
	let isInstalled = false;
	let check = run('opkg list-installed | grep -i "luci-app-passwall2" 2>/dev/null');
	if (check && length(check) > 0) isInstalled = true;

	let installStatus = {
		status: isInstalled ? 'installed' : 'idle',
		percent: isInstalled ? 100 : 0,
		msg: isInstalled ? 'Đã cài đặt PassWall 2' : 'Chưa cài đặt PassWall 2'
	};

	let statusRaw = readfile(STATUS_FILE);
	if (statusRaw) {
		try {
			let parsed = json(trim(statusRaw));
			if (parsed) installStatus = parsed;
		} catch(e) {}
	}

	let logContent = readfile(LOG_FILE) || '';

	print(sprintf("%J\n", {
		installed: isInstalled,
		status: installStatus,
		log: logContent
	}));
} else if (action == 'install') {
	writefile(STATUS_FILE, sprintf("%J\n", {
		status: 'running',
		percent: 5,
		msg: 'Bắt đầu quá trình cài đặt PassWall 2...'
	}));

	writefile(LOG_FILE, 'Khởi tạo tiến trình cài đặt PassWall 2...\n');

	run('/bin/sh /usr/share/5g/install_passwall.sh >/tmp/install_passwall_bg.log 2>&1 &');
	print(sprintf("%J\n", { result: true, msg: 'Đã bắt đầu tiến trình cài đặt PassWall 2!' }));
} else if (action == 'clearLog') {
	writefile(LOG_FILE, '');
	writefile(STATUS_FILE, sprintf("%J\n", {
		status: 'idle',
		percent: 0,
		msg: 'Đã xóa nhật ký log.'
	}));
	print(sprintf("%J\n", { result: true }));
}
