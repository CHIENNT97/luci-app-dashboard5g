'use strict';
import { popen, readfile, writefile } from 'fs';

// ===================================================================================
// CẤU HÌNH ĐƯỜNG DẪN THƯ MỤC / SERVER CHỨA BẢN ROM
// Bạn có thể thay đổi link Google Drive Folder hoặc link thư mục web server tại đây:
// ===================================================================================
const DEFAULT_ROM_FOLDER = 'https://drive.google.com/drive/folders/1lp-9rqllk9vrzD-y07HudgSm8o63b0E0?usp=drive_link';

const ROM_CFG_FILE = '/etc/5g_rom_config.json';
const PROGRESS_FILE = '/tmp/rom_flash_status.json';

function run(cmd) {
	let fd = popen(cmd, 'r');
	if (!fd) return '';
	let res = fd.read('all');
	fd.close();
	return res ? trim(res) : '';
}

function extractUrl(raw) {
	if (!raw) return '';
	try {
		let p = json(trim(raw));
		if (p && p.url) return trim(p.url);
	} catch(e) {}

	let m = match(raw, /https?:\/\/[a-zA-Z0-9_.:\/?=&%#+-]+/i);
	if (m && m[0]) return trim(m[0]);

	return '';
}

function parseGoogleDriveFolder(folderUrl, html) {
	let roms = [];
	let seenIds = {};

	let items = split(html, 'data-handled-by-drag-and-drop="true"');
	for (let i = 1; i < length(items); i++) {
		let chunk = items[i];
		let prev = items[i-1];

		let mId = match(chunk, /ssk=['"]5:[^:]*:([a-zA-Z0-9_-]{25,})/);
		let fileId = (mId && mId[1]) ? mId[1] : '';

		let mCleanId = match(fileId, /^([a-zA-Z0-9_-]{28,34})/);
		if (mCleanId && mCleanId[1]) fileId = mCleanId[1];
		fileId = replace(fileId, /-+$/, '');

		if (fileId && !seenIds[fileId]) {
			let mName = match(prev, /aria-label=['"]([^'"]+\.(bin|img|tar\.gz|trx))[^'"]*['"]/i);
			if (!mName) mName = match(chunk, /aria-label=['"]([^'"]+\.(bin|img|tar\.gz|trx))[^'"]*['"]/i);
			if (!mName) mName = match(prev, /([a-zA-Z0-9_\-\.]+\.(bin|img|tar\.gz|trx))/i);
			if (!mName) mName = match(chunk, /([a-zA-Z0-9_\-\.]+\.(bin|img|tar\.gz|trx))/i);

			let fileName = (mName && mName[1]) ? trim(mName[1]) : '';

			if (fileName && match(fileName, /\.(bin|img|tar\.gz|trx)$/i)) {
				seenIds[fileId] = true;

				let dlUrl = 'https://drive.google.com/uc?id=' + fileId + '&export=download';
				
				let sizeStr = '53.0 MB';
				if (match(fileName, /immortalwrt/i)) {
					sizeStr = '24.5 MB';
				} else if (match(fileName, /chiennt97/i)) {
					sizeStr = '53.0 MB';
				}

				let isStable = match(fileName, /sysupgrade|stable|release|stock/i);

				push(roms, {
					id: 'gdrive_' + length(roms),
					name: fileName,
					url: dlUrl,
					fileId: fileId,
					size: sizeStr,
					version: isStable ? 'Bản Chuẩn (Sysupgrade)' : 'Bản Nâng Cao',
					desc: 'Bản Firmware nạp từ kho lưu trữ bảo mật.',
					date: run('date "+%Y-%m-%d"')
				});
			}
		}
	}

	if (length(roms) == 0) {
		let mBins = match(html, /([a-zA-Z0-9_\-\.]+\.(bin|img|tar\.gz|trx))/ig);
		let mId = match(html, /ssk=['"]5:[^:]*:([a-zA-Z0-9_-]{28,34})/);
		if (mBins && length(mBins) > 0 && mId && mId[1]) {
			let fName = mBins[0];
			let fId = replace(mId[1], /-+$/, '');
			let dlUrl = 'https://drive.google.com/uc?id=' + fId + '&export=download';

			push(roms, {
				id: 'gdrive_0',
				name: fName,
				url: dlUrl,
				fileId: fId,
				size: match(fName, /immortalwrt/i) ? '24.5 MB' : '53.0 MB',
				version: 'Bản Chuẩn (Sysupgrade)',
				desc: 'Bản Firmware nạp từ kho lưu trữ bảo mật.',
				date: run('date "+%Y-%m-%d"')
			});
		}
	}

	return roms;
}

function scanFolder(folderUrl) {
	if (!folderUrl || length(trim(folderUrl)) == 0) {
		folderUrl = DEFAULT_ROM_FOLDER;
	}

	folderUrl = trim(folderUrl);
	if (!match(folderUrl, /^https?:\/\//i)) {
		folderUrl = 'http://' + folderUrl;
	}

	let isGDrive = (index(folderUrl, 'drive.google.com') >= 0);

	let cmd = 'curl -k -s -L --max-time 15 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "' + replace(folderUrl, '"', '') + '"';
	let html = run(cmd);

	if (!html || length(html) < 5) {
		return { error: "Không thể kết nối máy chủ lưu trữ ROM. Vui lòng kiểm tra lại kết nối Internet của Router!" };
	}

	let roms = [];

	if (isGDrive) {
		let mFile = match(folderUrl, /\/file\/d\/([a-zA-Z0-9_-]{25,})/i);
		if (mFile && mFile[1]) {
			let fileId = mFile[1];
			let dlUrl = 'https://drive.google.com/uc?id=' + fileId + '&export=download';

			push(roms, {
				id: 'gdrive_0',
				name: 'Firmware-Update.bin',
				url: dlUrl,
				fileId: fileId,
				size: '53.0 MB',
				version: 'Bản Nâng Cấp',
				desc: 'Bản Firmware nâng cấp hệ thống.',
				date: run('date "+%Y-%m-%d"')
			});
		} else {
			roms = parseGoogleDriveFolder(folderUrl, html);
		}
	} else {
		let isJson = false;
		try {
			let jData = json(trim(html));
			if (jData && type(jData) == 'array') {
				isJson = true;
				for (let item in jData) {
					let itemUrl = item.url || item.download_url || item.link || '';
					if (!itemUrl && item.name) {
						itemUrl = (match(folderUrl, /\/$/) ? folderUrl : (folderUrl + '/')) + item.name;
					}
					push(roms, {
						id: 'rom_' + length(roms),
						name: item.name || ('Bản ROM #' + (length(roms) + 1)),
						url: itemUrl,
						size: item.size || '53.0 MB',
						version: item.version || 'Auto-detected',
						desc: item.desc || 'Bản Firmware hệ thống.',
						date: item.date || run('date "+%Y-%m-%d"')
					});
				}
			}
		} catch(e) {}

		if (!isJson || length(roms) == 0) {
			let base = folderUrl;
			if (!match(base, /\/$/)) base = base + '/';

			let lines = split(html, '<a ');
			let seen = {};

			for (let i = 1; i < length(lines); i++) {
				let chunk = lines[i];
				let mHref = match(chunk, /href\s*=\s*"([^"#?]+)"/i);
				if (!mHref) mHref = match(chunk, /href\s*=\s*'([^'#?]+)'/i);

				if (mHref && mHref[1]) {
					let file = mHref[1];
					if (match(file, /\.(bin|img|tar\.gz|trx)$/i) && !match(file, /^\.\.\//) && !seen[file]) {
						seen[file] = true;

						let fullUrl = file;
						if (!match(file, /^https?:\/\//i)) {
							if (match(file, /^\//)) {
								let mDomain = match(base, /^(https?:\/\/[^\/]+)/i);
								fullUrl = (mDomain ? mDomain[1] : base) + file;
							} else {
								fullUrl = base + file;
							}
						}

						let cleanName = file;
						let mClean = match(file, /([^\/]+)$/);
						if (mClean && mClean[1]) cleanName = mClean[1];

						let isStable = match(cleanName, /sysupgrade|stable|release|stock/i);
						let rId = 'rom_' + length(roms);

						push(roms, {
							id: rId,
							name: cleanName,
							url: fullUrl,
							size: match(cleanName, /immortalwrt/i) ? '24.5 MB' : '53.0 MB',
							version: isStable ? 'Bản Chuẩn (Sysupgrade)' : 'Bản Nâng Cao',
							desc: 'Bản Firmware hệ thống: ' + cleanName,
							date: run('date "+%Y-%m-%d"')
						});
					}
				}
			}
		}

		if (length(roms) == 0 && match(folderUrl, /\.(bin|img|tar\.gz)$/i)) {
			let mName = match(folderUrl, /([^\/]+)$/);
			let fName = mName ? mName[1] : 'Firmware.bin';

			push(roms, {
				id: 'rom_0',
				name: fName,
				url: folderUrl,
				size: '53.0 MB',
				version: 'Link trực tiếp',
				desc: 'Bản Firmware nạp trực tiếp.',
				date: run('date "+%Y-%m-%d"')
			});
		}
	}

	let cfg = {
		serverUrl: folderUrl,
		roms: roms
	};
	writefile(ROM_CFG_FILE, sprintf("%J\n", cfg));

	return {
		result: true,
		count: length(roms),
		roms: roms
	};
}

let action = ARGV[0] || 'get';

if (action == 'get') {
	let cfg = { serverUrl: DEFAULT_ROM_FOLDER, roms: [] };
	let raw = readfile(ROM_CFG_FILE);
	if (raw) {
		try {
			cfg = json(trim(raw)) || cfg;
		} catch(e) {}
	}
	let statusRaw = readfile(PROGRESS_FILE);
	let flashStatus = { status: 'idle', percent: 0, msg: 'Sẵn sàng' };
	if (statusRaw) {
		try {
			flashStatus = json(trim(statusRaw)) || flashStatus;
		} catch(e) {}
	}
	cfg.flashStatus = flashStatus;
	print(sprintf("%J\n", cfg));
} else if (action == 'checkFolder') {
	let raw = readfile('/tmp/rom_check_payload.json') || '';
	let url = extractUrl(raw);
	if (!url) url = DEFAULT_ROM_FOLDER;
	print(sprintf("%J\n", scanFolder(url)));
} else if (action == 'startFlash') {
	let raw = readfile('/tmp/rom_flash_payload.json') || '';
	let romUrl = extractUrl(raw);
	let keepConfig = true;
	let force = true;

	try {
		let p = json(trim(raw));
		if (p) {
			if (p.keepConfig === false || p.keepConfig === 'false') keepConfig = false;
			if (p.force === false || p.force === 'false') force = false;
		}
	} catch(e) {
		if (index(raw, '"keepConfig":false') >= 0 || index(raw, '"keepConfig":"false"') >= 0) keepConfig = false;
	}

	if (!romUrl) {
		print(sprintf("%J\n", { error: "Không tìm thấy link tải bản ROM đã chọn!" }));
		exit(0);
	}

	writefile(PROGRESS_FILE, sprintf("%J\n", {
		status: 'downloading',
		percent: 5,
		msg: 'Đang kết nối và tải file ROM về Router...',
		url: romUrl
	}));

	let flags = '';
	if (!keepConfig) flags = flags + ' -n';
	if (force) flags = flags + ' -F';
	flags = trim(flags);

	run('/bin/sh /usr/share/5g/flash_rom.sh "' + replace(romUrl, '"', '') + '" "' + flags + '" >/tmp/flash_rom.log 2>&1 &');

	print(sprintf("%J\n", { result: true, msg: "Đã bắt đầu quá trình nạp ROM!" }));
} else if (action == 'status') {
	let statusRaw = readfile(PROGRESS_FILE);
	let flashStatus = { status: 'idle', percent: 0, msg: 'Chưa có tiến trình' };
	if (statusRaw) {
		try {
			flashStatus = json(trim(statusRaw)) || flashStatus;
		} catch(e) {}
	}
	print(sprintf("%J\n", flashStatus));
}
