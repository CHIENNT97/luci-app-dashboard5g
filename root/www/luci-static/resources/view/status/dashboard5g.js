'use strict';
'require view';
'require fs';
'require ui';
'require rpc';
'require poll';

var callGetStatus = rpc.declare({ object: 'luci.5g', method: 'getStatus', expect: { } });
var callSendAt = rpc.declare({ object: 'luci.5g', method: 'sendAt', params: [ 'cmd' ], expect: { } });
var callReconnect = rpc.declare({ object: 'luci.5g', method: 'reconnect', expect: { } });
var callRebootModem = rpc.declare({ object: 'luci.5g', method: 'rebootModem', expect: { } });
var callListSms = rpc.declare({ object: 'luci.5g', method: 'listSms', expect: { } });
var callSendSms = rpc.declare({ object: 'luci.5g', method: 'sendSms', params: [ 'number', 'text' ], expect: { } });
var callDeleteSms = rpc.declare({ object: 'luci.5g', method: 'deleteSms', params: [ 'id', 'text', 'all' ], expect: { } });
var callGetTtl = rpc.declare({ object: 'luci.5g', method: 'getTtl', expect: { } });
var callSetTtl = rpc.declare({ object: 'luci.5g', method: 'setTtl', params: [ 'enabled', 'value' ], expect: { } });
var callGetWifi = rpc.declare({ object: 'luci.5g', method: 'getWifi', expect: { } });
var callSetWifi = rpc.declare({ object: 'luci.5g', method: 'setWifi', params: [ 'wifi2g', 'wifi5g' ], expect: { } });
var callBlockDevice = rpc.declare({ object: 'luci.5g', method: 'blockDevice', params: [ 'mac', 'name', 'action' ], expect: { } });
var callGetRomConfig = rpc.declare({ object: 'luci.5g', method: 'getRomConfig', expect: { } });
var callCheckRomFolder = rpc.declare({ object: 'luci.5g', method: 'checkRomFolder', params: [ 'url' ], expect: { } });
var callStartFlashRom = rpc.declare({ object: 'luci.5g', method: 'startFlashRom', params: [ 'url', 'keepConfig', 'force' ], expect: { } });
var callGetPasswallStatus = rpc.declare({ object: 'luci.5g', method: 'getPasswallStatus', expect: { } });
var callInstallPasswall = rpc.declare({ object: 'luci.5g', method: 'installPasswall', expect: { } });
var callClearPasswallLog = rpc.declare({ object: 'luci.5g', method: 'clearPasswallLog', expect: { } });
var callGetRatMode = rpc.declare({ object: 'luci.5g', method: 'getRatMode', expect: { } });
var callSetRatMode = rpc.declare({ object: 'luci.5g', method: 'setRatMode', params: [ 'mode' ], expect: { } });
var callSetPhone = rpc.declare({ object: 'luci.5g', method: 'setPhone', params: [ 'phone' ], expect: { } });

return view.extend({
	load: function() {
		return Promise.all([
			callGetStatus().catch(function() { return {}; }),
			callGetTtl().catch(function() { return { enabled: true, value: '65' }; }),
			callGetWifi().catch(function() { return {}; }),
			callGetRatMode().catch(function() { return { code: '21', name: 'Khóa 4G + 5G' }; }),
			callGetPasswallStatus().catch(function() { return { installed: false }; })
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var ttl = data[1] || {};
		var wifi = data[2] || {};
		var rat = data[3] || {};
		var pw = data[4] || {};

		var sigVal = (status.signal != null && status.signal !== '') ? parseInt(status.signal) : 0;
		if (isNaN(sigVal)) sigVal = 0;
		if (sigVal > 100) sigVal = 100;
		var sigColor = sigVal > 60 ? '#10b981' : (sigVal > 35 ? '#f59e0b' : (sigVal > 0 ? '#ef4444' : '#94a3b8'));
		var cssStyles = 
			/* ── CSS VARIABLES (light default) ── */
			':root { --cpe-bg: #f8fafc; --cpe-card-bg: #ffffff; --cpe-card-border: #e2e8f0; --cpe-text-primary: #1e293b; --cpe-text-secondary: #64748b; --cpe-text-muted: #94a3b8; --cpe-tab-bg: #f1f5f9; --cpe-tab-hover-bg: #e2e8f0; --cpe-tab-color: #475569; --cpe-tab-hover-color: #1e293b; --cpe-nav-border: #e2e8f0; --cpe-strip-divider: #f1f5f9; --cpe-rat-border: #e2e8f0; --cpe-rat-hover-bg: #f8fafc; --cpe-rat-active-bg: #eef2ff; --cpe-rat-active-border: #4f46e5; --cpe-sms-bg: #f8fafc; --cpe-sms-border: #e2e8f0; --cpe-input-bg: #ffffff; --cpe-input-border: #cbd5e1; --cpe-input-color: #1e293b; --cpe-lte-card-bg: #f8fafc; --cpe-lte-card-border: #e2e8f0; --cpe-nr-card-bg: #faf5ff; --cpe-nr-card-border: #f3e8ff; --cpe-table-stripe: #f8fafc; --cpe-shadow: rgba(0,0,0,0.05); --cpe-shadow-hover: rgba(0,0,0,0.08); }' +
			/* ── DARK MODE OVERRIDES ── */
			'@media (prefers-color-scheme: dark) { :root { --cpe-bg: #0f172a; --cpe-card-bg: #1e293b; --cpe-card-border: #334155; --cpe-text-primary: #f1f5f9; --cpe-text-secondary: #94a3b8; --cpe-text-muted: #64748b; --cpe-tab-bg: #1e293b; --cpe-tab-hover-bg: #334155; --cpe-tab-color: #94a3b8; --cpe-tab-hover-color: #f1f5f9; --cpe-nav-border: #334155; --cpe-strip-divider: #334155; --cpe-rat-border: #334155; --cpe-rat-hover-bg: #1e293b; --cpe-rat-active-bg: #1e1b4b; --cpe-rat-active-border: #818cf8; --cpe-sms-bg: #1e293b; --cpe-sms-border: #334155; --cpe-input-bg: #0f172a; --cpe-input-border: #475569; --cpe-input-color: #f1f5f9; --cpe-lte-card-bg: #172033; --cpe-lte-card-border: #1e3a5f; --cpe-nr-card-bg: #1a1033; --cpe-nr-card-border: #3b1f5e; --cpe-table-stripe: #162032; --cpe-shadow: rgba(0,0,0,0.3); --cpe-shadow-hover: rgba(0,0,0,0.5); } }' +
			'.cpe-wrap { font-family: system-ui, -apple-system, sans-serif; color: var(--cpe-text-primary); }' +
			'.cpe-hero { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); border-radius: 12px; padding: 10px 20px; color: #fff; margin-bottom: 16px; box-shadow: 0 4px 15px -3px rgba(49, 46, 129, 0.25); position: relative; overflow: hidden; }' +
			'.cpe-hero::after { content: "5G"; position: absolute; right: 10px; bottom: -20px; font-size: 80px; font-weight: 900; color: rgba(255,255,255,0.04); pointer-events: none; }' +
			'.cpe-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }' +
			'.cpe-strip-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; align-items: center; }' +
			'.cpe-strip-item { display: flex; flex-direction: column; justify-content: center; }' +
			'@media (min-width: 1050px) { .cpe-strip-grid { grid-template-columns: repeat(5, 1fr); } .cpe-strip-item:not(:last-child) { border-right: 1px solid var(--cpe-strip-divider); padding-right: 16px; } }' +
			'.cpe-card { background: var(--cpe-card-bg); border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px var(--cpe-shadow); border: 1px solid var(--cpe-card-border); transition: transform 0.2s, box-shadow 0.2s; }' +
			'.cpe-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px var(--cpe-shadow-hover); }' +
			'.cpe-badge-on { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }' +
			'@media (prefers-color-scheme: dark) { .cpe-badge-on { background: #14532d; color: #86efac; } }' +
			'.cpe-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }' +
			'.cpe-sig-bars { display: inline-flex; align-items: flex-end; gap: 3px; height: 20px; margin-left: 8px; }' +
			'.cpe-bar { width: 4px; border-radius: 2px; background: #475569; }' +
			'.cpe-nav-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid var(--cpe-nav-border); padding-bottom: 12px; }' +
			'.cpe-tab-btn { background: var(--cpe-tab-bg); color: var(--cpe-tab-color); border: 1px solid var(--cpe-card-border); padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }' +
			'.cpe-tab-btn:hover { background: var(--cpe-tab-hover-bg); color: var(--cpe-tab-hover-color); }' +
			'.cpe-tab-btn.active { background: #4f46e5; color: #ffffff; border-color: #4f46e5; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35); }' +
			'.cpe-btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }' +
			'.cpe-btn-primary { background: #4f46e5; color: #fff; }' +
			'.cpe-btn-primary:hover { background: #4338ca; }' +
			'.cpe-btn-success { background: #10b981; color: #fff; }' +
			'.cpe-btn-success:hover { background: #059669; }' +
			'.cpe-btn-danger { background: #ef4444; color: #fff; }' +
			'.cpe-btn-danger:hover { background: #dc2626; }' +
			'.cpe-rat-card { border: 2px solid var(--cpe-rat-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; }' +
			'.cpe-rat-card:hover { border-color: #6366f1; background: var(--cpe-rat-hover-bg); }' +
			'.cpe-rat-card.active { border-color: var(--cpe-rat-active-border); background: var(--cpe-rat-active-bg); }' +
			'.cpe-sms-bubble { background: var(--cpe-sms-bg); border: 1px solid var(--cpe-sms-border); border-radius: 12px; padding: 14px; margin-bottom: 12px; position: relative; }' +
			/* ── DARK MODE: inline hardcoded colors override ── */
			'@media (prefers-color-scheme: dark) {' +
			'  .cpe-wrap, .cpe-wrap * { --tw-text: var(--cpe-text-primary); }' +
			'  #stat-sig-label { color: var(--cpe-text-secondary) !important; }' +
			'  #stat-data-total, #stat-data-sub { color: var(--cpe-text-primary) !important; }' +
			'  .cpe-card [style*="color: #1e293b"] { color: var(--cpe-text-primary) !important; }' +
			'  .cpe-card [style*="color: #64748b"] { color: var(--cpe-text-secondary) !important; }' +
			'  .cpe-card [style*="color: #94a3b8"] { color: var(--cpe-text-muted) !important; }' +
			'  .cpe-card [style*="background: #f8fafc"] { background: var(--cpe-lte-card-bg) !important; }' +
			'  .cpe-card [style*="background: #faf5ff"] { background: var(--cpe-nr-card-bg) !important; }' +
			'  [style*="border: 2px solid #e2e8f0"] { border-color: var(--cpe-card-border) !important; }' +
			'  [style*="color: #1e1b4b"] { color: #a5b4fc !important; }' +
			'  [style*="color: #1e40af"] { color: #93c5fd !important; }' +
			'  [style*="color: #6b21a8"] { color: #d8b4fe !important; }' +
			'  [style*="color: #0369a1"] { color: #7dd3fc !important; }' +
			'  [style*="background: #dbeafe"] { background: #1e3a5f !important; }' +
			'  [style*="background: #e0f2fe"] { background: #0c2a4a !important; }' +
			'  [style*="background: #f3e8ff"] { background: #2e1065 !important; }' +
			'  [style*="background: #dcfce7"] { background: #14532d !important; color: #86efac !important; }' +
			'  [style*="background: #fef3c7"] { background: #78350f !important; color: #fde68a !important; }' +
			'  [style*="background: #fee2e2"] { background: #7f1d1d !important; color: #fca5a5 !important; }' +
			'  textarea, input[type="text"], input[type="number"], select { background: var(--cpe-input-bg) !important; color: var(--cpe-input-color) !important; border-color: var(--cpe-input-border) !important; }' +
			'  table.table { border-color: var(--cpe-card-border) !important; }' +
			'  table.table td { color: var(--cpe-text-primary) !important; border-color: var(--cpe-card-border) !important; }' +
			'  table.table tr:nth-child(even) td { background: var(--cpe-table-stripe) !important; }' +
			'}';

		var viewRoot = E('div', { 'class': 'cpe-wrap' }, [
			E('style', {}, cssStyles),

			// ── HERO HEADER (SLIM) ──────────────────────────────────────────────────
			E('div', { 'class': 'cpe-hero' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;' }, [
					E('h1', { 'style': 'margin: 0; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px;' }, _('Dashboard BY NTC'))
				])
			]),

			// ── NAV TABS ───────────────────────────────────────────────────────────
			E('div', { 'class': 'cpe-nav-tabs' }, [
				E('button', { 'class': 'cpe-tab-btn active', 'id': 'cpe-tab-btn-overview', 'click': function() { setTab('overview'); } }, '📊 ' + _('Tổng quan')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-sms', 'click': function() { setTab('sms'); } }, '💬 ' + _('Tin nhắn SMS')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-ttl', 'click': function() { setTab('ttl'); } }, '⚡ ' + _('TTL & Lệnh AT')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-wifi', 'click': function() { setTab('wifi'); } }, '📶 ' + _('WiFi & Thiết bị')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-rom', 'click': function() { setTab('rom'); } }, '💾 ' + _('Nạp Firmware ROM')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-passwall', 'click': function() { setTab('passwall'); } }, '🛡️ ' + _('PassWall 2'))
			]),

			// ── TAB 1: OVERVIEW (CHI TIẾT MẠNG 5G) ──────────────────────────────────
			E('div', { 'id': 'cpe-tab-overview', 'class': 'cpe-tab-pane' }, [
				// ── THANH THỐNG KÊ TỔNG HỢP TINH GỌN (UNIFIED STATUS STRIP) ────────────
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px; padding: 16px 20px;' }, [
					E('div', { 'class': 'cpe-strip-grid' }, [
						// Cột 1: Nhà mạng & Mạng
						E('div', { 'class': 'cpe-strip-item' }, [
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;' }, '📡 ' + _('Nhà mạng & Mạng')),
							E('div', { 'style': 'font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 4px;' }, status.operator || 'VINAPHONE'),
							E('div', { 'style': 'display: flex; align-items: center; gap: 6px; font-size: 12px;' }, [
								E('span', { 'style': 'background: #e0e7ff; color: #4338ca; font-weight: 700; padding: 1px 7px; border-radius: 5px; font-size: 11px;' }, status.networkType || '5G NR NSA')
							])
						]),

						// Cột 2: Cường độ tín hiệu
						E('div', { 'class': 'cpe-strip-item' }, [
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;' }, '📶 ' + _('Cường độ tín hiệu')),
							E('div', { 'style': 'display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;' }, [
								E('span', { 'id': 'stat-sig-val', 'style': 'font-size: 24px; font-weight: 800; color: ' + sigColor }, (sigVal > 0 ? (sigVal + '%') : (status.signal || '0%'))),
								E('span', { 'class': 'cpe-sig-bars' }, [
									E('span', { 'id': 'sig-bar-1', 'class': 'cpe-bar', 'style': 'height: 6px; background: ' + (sigVal > 20 ? sigColor : '#cbd5e1') }),
									E('span', { 'id': 'sig-bar-2', 'class': 'cpe-bar', 'style': 'height: 10px; background: ' + (sigVal > 40 ? sigColor : '#cbd5e1') }),
									E('span', { 'id': 'sig-bar-3', 'class': 'cpe-bar', 'style': 'height: 14px; background: ' + (sigVal > 60 ? sigColor : '#cbd5e1') }),
									E('span', { 'id': 'sig-bar-4', 'class': 'cpe-bar', 'style': 'height: 18px; background: ' + (sigVal > 80 ? sigColor : '#cbd5e1') }),
									E('span', { 'id': 'sig-bar-5', 'class': 'cpe-bar', 'style': 'height: 22px; background: ' + (sigVal >= 90 ? sigColor : '#cbd5e1') })
								])
							]),
							E('div', { 'id': 'stat-sig-label', 'style': 'font-size: 12px; color: #64748b; font-weight: 600;' }, sigVal > 70 ? _('Tín hiệu Rất Tốt') : (sigVal > 40 ? _('Tín hiệu Tốt') : (sigVal > 0 ? _('Tín hiệu Yếu') : _('Đang kiểm tra sóng...'))))
						]),

						// Cột 3: IP WAN 5G
						E('div', { 'class': 'cpe-strip-item' }, [
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;' }, '🌐 ' + _('Địa chỉ IP WAN 5G')),
							E('div', { 'style': 'font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 4px; font-family: monospace;' }, status.ip || _('Chưa cấp phát')),
							E('div', { 'style': 'font-size: 12px; color: #10b981; font-weight: 600;' }, status.ip ? ('● ' + _('Đang kết nối Internet')) : ('○ ' + _('Chờ kết nối...')))
						]),

						// Cột 4: Dữ liệu Data đã dùng
						E('div', { 'class': 'cpe-strip-item' }, [
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;' }, '📊 ' + _('Dữ liệu đã dùng')),
							E('div', { 'id': 'stat-data-total', 'style': 'font-size: 19px; font-weight: 800; color: #1e293b; margin-bottom: 4px;' }, status.dataUsage || '0 MB'),
							E('div', { 'id': 'stat-data-sub', 'style': 'font-size: 11px; color: #64748b; font-weight: 500;' }, (status.rxFormatted && status.txFormatted) ? ('↓ ' + status.rxFormatted + ' • ↑ ' + status.txFormatted) : _('Đang đo lưu lượng...'))
						]),

						// Cột 5: Băng tần hoạt động
						E('div', { 'class': 'cpe-strip-item' }, [
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;' }, '🏷️ ' + _('Băng tần hoạt động')),
							E('div', { 'id': 'cpe-val-strip-band', 'style': 'font-size: 17px; font-weight: 800; color: #1e293b; margin-bottom: 4px;' }, status.band ? (status.band + ' (' + (status.caCount || 'CA') + ')') : (status.nrBand || '5G NR')),
							E('div', { 'style': 'font-size: 12px; color: #64748b;' }, status.phone ? ('SĐT: ' + status.phone) : (status.model || _('Modem 5G Online')))
						])
					])
				]),
				// Cụm 1: BẢNG ĐO SÓNG CHUYÊN SÂU 4G LTE & 5G NR (SIERRA EM9191 / 5G CPE)
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;' }, [
						E('div', {}, [
							E('h3', { 'style': 'margin: 0; font-size: 18px; font-weight: 800; color: #1e1b4b;' }, '📶 ' + _('1. Bảng đo sóng chi tiết 4G LTE & 5G NR (RF Signal Monitor)')),
							E('p', { 'style': 'margin: 4px 0 0 0; color: #64748b; font-size: 13px;' }, _('Đo đạc công suất thu RSRP, chất lượng RSRQ, tỉ số tín hiệu/nhiễu SINR thời gian thực.'))
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('span', { 'style': 'background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 6px;' }, [
								E('span', { 'class': 'cpe-dot' }),
								E('span', { 'id': 'sig-live-status' }, _('ĐANG TỰ ĐỘNG ĐO SÓNG (2s)'))
							]),
							E('button', { 'class': 'cpe-btn cpe-btn-primary', 'style': 'padding: 6px 14px; font-size: 13px;', 'click': refreshSignalData }, '🔄 ' + _('Đo sóng ngay'))
						])
					]),

					// 2 Cột đo sóng: 4G LTE & 5G NR
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;' }, [
						// Khối 4G LTE
						E('div', { 'style': 'background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px;' }, [
							E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
								E('div', { 'style': 'font-weight: 800; font-size: 15px; color: #1e40af; display: flex; align-items: center; gap: 6px;' }, [
									E('span', { 'style': 'background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px;' }, '4G LTE'),
									_('SÓNG 4G (ANCHOR)')
								]),
								E('span', { 'id': 'rf-lte-band', 'style': 'background: #dbeafe; color: #1e40af; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 6px;' }, status.lteBand ? (status.lteBand + ' (' + (status.lteBw || '20 MHz') + ')') : (status.band || 'B3 (1800 MHz)'))
							]),
							renderRfMeter('4G RSRP (Công suất thu)', status.lteRsrp || status.rsrp || '-86 dBm', -125, -75, 'dBm'),
							renderRfMeter('4G RSRQ (Chất lượng)', status.lteRsrq || status.rsrq || '-11 dB', -20, -3, 'dB'),
							renderRfMeter('4G SINR (Tín hiệu / Nhiễu)', status.lteSinr || status.sinr || '18.5 dB', -5, 25, 'dB'),
							renderRfMeter('4G RSSI', status.lteRssi || status.rssi || '-65 dBm', -110, -50, 'dBm')
						]),

						// Khối 5G NR
						E('div', { 'style': 'background: #faf5ff; border: 2px solid #f3e8ff; border-radius: 12px; padding: 16px;' }, [
							E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
								E('div', { 'style': 'font-weight: 800; font-size: 15px; color: #6b21a8; display: flex; align-items: center; gap: 6px;' }, [
									E('span', { 'style': 'background: #9333ea; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px;' }, '5G NR'),
									_('SÓNG 5G (DATA CARRIER)')
								]),
								E('span', { 'id': 'rf-nr-band', 'style': 'background: #f3e8ff; color: #6b21a8; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 6px;' }, status.nrBand ? (status.nrBand + ' (' + (status.nrBw || '100 MHz') + ')') : '5G NSA (Standby)')
							]),
							renderRfMeter('5G RSRP (Công suất thu 5G)', status.nrRsrp || 'Chờ tải (Standby)', -125, -75, 'dBm'),
							renderRfMeter('5G RSRQ (Chất lượng 5G)', status.nrRsrq || 'Standby', -20, -3, 'dB'),
							renderRfMeter('5G SINR (Tín hiệu / Nhiễu 5G)', status.nrSinr || 'Standby', -5, 25, 'dB')
						])
					])
				]),

				// Cụm 2: Khóa sóng & Chế độ mạng (RAT Lock)
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;' }, [
						E('div', {}, [
							E('h3', { 'style': 'margin: 0; font-size: 17px; font-weight: 700; color: #1e1b4b;' }, '🔒 ' + _('2. Khóa sóng & Chế độ mạng (RAT Lock)')),
							E('div', { 'style': 'color: #64748b; font-size: 13px; margin-top: 4px;' }, _('Chọn chế độ bắt sóng ưu tiên cho Modem 5G rồi bấm "Áp Dụng Khóa Sóng":'))
						]),
						E('button', {
							'class': 'cpe-btn cpe-btn-primary',
							'style': 'padding: 8px 18px; font-size: 13px; font-weight: 700;',
							'click': function() {
								var mode = document.getElementById('selected-rat-mode').value;
								ui.showModal(_('Đang áp dụng khóa sóng...'), [ E('p', {}, _('Modem đang chuyển băng tần, vui lòng đợi vài giây...')) ]);
								callSetRatMode(mode).then(function() {
									ui.hideModal();
									ui.addNotification(null, E('p', {}, _('Đã cập nhật chế độ khóa mạng thành công!')), 'info');
								});
							}
						}, '🔒 ' + _('Áp Dụng Khóa Sóng'))
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;' }, [
						E('div', {
							'id': 'rat-card-21',
							'class': 'cpe-rat-card' + (rat.code === '21' || !rat.code ? ' active' : ''),
							'click': function() { selectRatMode('21'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 6px;' }, '⚡'),
							E('div', { 'style': 'font-weight: 800; font-size: 15px; color: #1e293b;' }, '4G + 5G (NSA / SA)'),
							E('div', { 'style': 'color: #4f46e5; font-size: 11px; font-weight: 700; margin: 3px 0;' }, '★ KHUYÊN DÙNG ★'),
							E('div', { 'style': 'font-size: 12px; color: #64748b; line-height: 1.4;' }, 'Tự động tối ưu giữa sóng 5G và 4G LTE tốc độ cao nhất.')
						]),
						E('div', {
							'id': 'rat-card-20',
							'class': 'cpe-rat-card' + (rat.code === '20' ? ' active' : ''),
							'click': function() { selectRatMode('20'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 6px;' }, '🚀'),
							E('div', { 'style': 'font-weight: 800; font-size: 15px; color: #1e293b;' }, 'Khóa chỉ 5G-SA'),
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 600; margin: 3px 0;' }, '5G Standalone Only'),
							E('div', { 'style': 'font-size: 12px; color: #64748b; line-height: 1.4;' }, 'Chỉ bắt trạm 5G độc lập, độ trễ cực thấp (Ping thấp).')
						]),
						E('div', {
							'id': 'rat-card-06',
							'class': 'cpe-rat-card' + (rat.code === '06' ? ' active' : ''),
							'click': function() { selectRatMode('06'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 6px;' }, '📶'),
							E('div', { 'style': 'font-weight: 800; font-size: 15px; color: #1e293b;' }, 'Khóa chỉ 4G LTE'),
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 600; margin: 3px 0;' }, 'LTE Only'),
							E('div', { 'style': 'font-size: 12px; color: #64748b; line-height: 1.4;' }, 'Cố định mạng 4G ổn định ở các khu vực sóng 5G còn yếu.')
						]),
						E('div', {
							'id': 'rat-card-00',
							'class': 'cpe-rat-card' + (rat.code === '00' ? ' active' : ''),
							'click': function() { selectRatMode('00'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 6px;' }, '🔄'),
							E('div', { 'style': 'font-weight: 800; font-size: 15px; color: #1e293b;' }, 'Tự động hoàn toàn'),
							E('div', { 'style': 'color: #64748b; font-size: 11px; font-weight: 600; margin: 3px 0;' }, 'Auto 4G/5G/3G'),
							E('div', { 'style': 'font-size: 12px; color: #64748b; line-height: 1.4;' }, 'Để modem tự chọn băng tần theo quyết định của nhà mạng.')
						])
					]),
					E('input', { 'id': 'selected-rat-mode', 'type': 'hidden', 'value': rat.code || '21' })
				]),

				// Cụm 3: BẢNG BĂNG TẦN & CỘNG GỘP SÓNG (CARRIER AGGREGATION - CA)
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 800; color: #1e1b4b; display: flex; align-items: center; gap: 8px;' }, [
						'🏷️ ' + _('3. Chi tiết Băng tần & Cộng gộp sóng (Active Bands & CA)'),
						E('span', { 'id': 'cpe-ca-badge', 'style': 'background: #dcfce7; color: #15803d; font-size: 12px; padding: 2px 8px; border-radius: 9999px;' }, status.caCount ? (status.caCount + ' Active') : ((status.nrBand || (status.band && status.band.indexOf('+') >= 0)) ? '2CA Active' : 'Active'))
					]),
					E('table', { 'class': 'table', 'id': 'cpe-ca-table' }, renderCaTableRows(status))
				]),

				// Cụm 4: Trạm phát & Nhận diện mạng
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 700; color: #1e1b4b;' }, '🗼 ' + _('4. Trạm phát sóng & Nhận diện mạng (Cellular Network)')),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'width: 35%; font-weight: 600;' }, _('Nhà mạng (Carrier / PLMN):')), E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #1e40af;' }, (status.operator || '-') + (status.plmn ? (' [' + status.plmn + ']') : '')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Chế độ mạng:')), E('td', { 'class': 'td' }, E('span', { 'style': 'background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-weight: 700;' }, status.networkType || '4G LTE / 5G NR')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Cộng gộp băng tần (Carrier Aggregation):')), E('td', { 'id': 'cpe-val-ca-combine', 'class': 'td', 'style': 'font-weight: 700; color: #047857;' }, status.band ? ('Kích hoạt (' + status.band + ')') : _('Chưa kết hợp')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Mã trạm eNodeB / Cell ID:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.cellId || '-') ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Physical Cell ID (PCI) / TAC:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, (status.pci ? ('PCI: ' + status.pci) : '-') + (status.tac ? (' | TAC: ' + status.tac) : '')) ])
					])
				]),

				// Cụm 5: SIM & Thiết bị phần cứng
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 700; color: #1e1b4b;' }, '📱 ' + _('5. Thông tin SIM & Thiết bị phần cứng')),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'width: 35%; font-weight: 600;' }, _('Trạng thái SIM:')), E('td', { 'class': 'td' }, E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '✓ ' + _('Sẵn sàng / Đã nhận SIM'))) ]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Số điện thoại (SIM):')),
							E('td', { 'class': 'td', 'style': 'font-weight: 700;' }, [
								E('span', { 'id': 'cpe-val-phone', 'style': 'margin-right: 12px;' }, status.phone || _('Không lưu trong SIM')),
								E('button', {
									'class': 'btn cbi-button cbi-button-action',
									'style': 'padding: 2px 8px; font-size: 12px; vertical-align: middle;',
									'title': _('Chỉnh sửa / Lưu số điện thoại thủ công'),
									'click': function(ev) {
										ev.preventDefault();
										var cur = status.phone || '';
										var newPhone = prompt(_('Nhập số điện thoại cho thẻ SIM này:'), cur);
										if (newPhone !== null) {
											newPhone = newPhone.trim();
											callSetPhone(newPhone).then(function() {
												status.phone = newPhone;
												var el = document.getElementById('cpe-val-phone');
												if (el) el.innerText = newPhone || _('Không lưu trong SIM');
												ui.addNotification(null, E('p', _('Đã lưu số điện thoại thành công!')), 'info');
											}).catch(function(e) {
												ui.addNotification(null, E('p', _('Lưu số điện thoại thất bại: ') + (e.message || e)), 'error');
											});
										}
									}
								}, '✏️ ' + _('Sửa SĐT'))
							])
						]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Số IMEI Modem:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.imei || _('Đang tải...')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Số IMSI thẻ SIM:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.imsi || _('Không rõ')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Số ICCID thẻ SIM:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.iccid || _('Không rõ')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Dòng Modem:')), E('td', { 'class': 'td' }, status.model || _('Đang tải...')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Nhiệt độ Modem:')), E('td', { 'class': 'td', 'style': 'color: #ea580c; font-weight: 700;' }, status.temp ? ('🔥 ' + status.temp) : '-') ])
					])
				]),

				// Cụm 6: Mạng WAN 5G & Định tuyến
				E('div', { 'class': 'cpe-card' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 700; color: #1e1b4b;' }, '🌐 ' + _('6. Địa chỉ IP WAN 5G & Định tuyến')),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'width: 35%; font-weight: 600;' }, _('Địa chỉ IPv4 WAN:')), E('td', { 'class': 'td', 'style': 'font-family: monospace; font-size: 15px; font-weight: 700; color: #1e293b;' }, status.ip || _('Chưa kết nối')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Máy chủ DNS:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.dns || '-') ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Giao diện cổng mạng:')), E('td', { 'class': 'td' }, '5G (wwan0) - Giao thức QMI / ModemManager') ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Chế độ Bypass TTL:')), E('td', { 'class': 'td', 'id': 'cpe-val-ttl-status' }, ttl.enabled ? E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '✓ ' + _('Đang BẬT (TTL cố định = ') + ttl.value + ')') : E('span', { 'style': 'color: #ef4444; font-weight: 700;' }, '✗ ' + _('Đang TẮT'))) ])
					])
				])
			]),

			// ── TAB 2: SMS ─────────────────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-sms', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 18px; font-weight: 700;' }, '✉️ ' + _('Gửi tin nhắn SMS mới')),
					E('div', { 'style': 'display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 16px;' }, [
						E('div', {}, [
							E('label', { 'style': 'font-weight: 600; display: block; margin-bottom: 6px;' }, _('Số điện thoại nhận:')),
							E('input', { 'id': 'sms-target-number', 'type': 'text', 'class': 'cbi-input-text', 'placeholder': 'VD: 888, 191, 0912345678', 'style': 'width: 100%;' })
						]),
						E('div', {}, [
							E('label', { 'style': 'font-weight: 600; display: block; margin-bottom: 6px;' }, _('Nội dung tin nhắn:')),
							E('input', { 'id': 'sms-target-text', 'type': 'text', 'class': 'cbi-input-text', 'placeholder': 'Nhập nội dung (VD: 5G gửi 888)...', 'style': 'width: 100%;' })
						])
					]),
					E('button', {
						'class': 'cpe-btn cpe-btn-primary',
						'click': function() {
							var num = document.getElementById('sms-target-number').value.trim();
							var txt = document.getElementById('sms-target-text').value.trim();
							if (!num || !txt) {
								ui.addNotification(null, E('p', {}, _('Vui lòng nhập đầy đủ Số điện thoại và Nội dung!')), 'danger');
								return;
							}
							ui.showModal(_('Đang gửi tin nhắn...'), [ E('p', {}, _('Đang truyền tín hiệu SMS qua Modem...')) ]);
							callSendSms(num, txt).then(function(r) {
								ui.hideModal();
								if (r && r.error) {
									ui.addNotification(null, E('p', {}, r.error), 'danger');
								} else {
									ui.addNotification(null, E('p', {}, _('Gửi tin nhắn SMS thành công!')), 'info');
									document.getElementById('sms-target-text').value = '';
									loadSmsData();
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', {}, _('Lỗi kết nối khi gửi tin nhắn: ') + (err.message || err)), 'danger');
							});
						}
					}, '🚀 ' + _('Gửi Tin Nhắn'))
				]),

				E('div', { 'class': 'cpe-card' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;' }, [
						E('h3', { 'style': 'margin: 0; font-size: 18px; font-weight: 700;' }, '📥 ' + _('Hộp thư SMS (Đến & Đi)')),
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('button', { 'class': 'cpe-btn cpe-btn-primary', 'style': 'padding: 6px 14px; font-size: 13px;', 'click': loadSmsData }, '🔄 ' + _('Làm mới')),
							E('button', {
								'class': 'cpe-btn cpe-btn-danger',
								'style': 'padding: 6px 14px; font-size: 13px;',
								'click': function() {
									if (!confirm(_('Xóa toàn bộ tin nhắn SMS? Hành động này không thể hoàn tác!'))) return;
									var box = document.getElementById('cpe-sms-box');
									box.innerHTML = '<em>Đang xóa tất cả...</em>';
									callDeleteSms('', '', true).then(function() { loadSmsData(); });
								}
							}, '🗑️ ' + _('Xóa tất cả'))
						])
					]),
					E('div', { 'id': 'cpe-sms-box' }, [ E('em', {}, _('Đang tải danh sách SMS...')) ])
				])
			]),


			// ── TAB: TTL BYPASS & LỆNH AT ──────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-ttl', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 18px; font-weight: 700;' }, '⚡ ' + _('Bypass giới hạn phát Hotspot (TTL Mangle)')),
					E('p', { 'style': 'color: #64748b;' }, _('Tính năng này giúp bạn dùng toàn bộ dung lượng gói cước chính của SIM (như VinaPhone, Viettel, MobiFone) mà không bị trừ vào dung lượng Hotspot chia sẻ.')),
					E('div', { 'style': 'background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px;' }, [
						E('div', { 'style': 'margin-bottom: 16px;' }, [
							E('label', { 'style': 'font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 10px; cursor: pointer;' }, [
								E('input', {
									'id': 'ttl-toggle-checkbox',
									'type': 'checkbox',
									'checked': ttl.enabled ? '' : null,
									'style': 'transform: scale(1.3); cursor: pointer;'
								}),
								_('Kích hoạt Bypass TTL Mangle qua nftables')
							])
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 16px; flex-wrap: wrap;' }, [
							E('span', { 'style': 'font-weight: 600;' }, _('Giá trị TTL cố định:')),
							E('select', {
								'id': 'ttl-select-val',
								'class': 'cbi-input-select',
								'style': 'min-width: 240px; font-weight: 600;'
							}, [
								E('option', { 'value': '65', 'selected': (String(ttl.value || '65') === '65') ? '' : null }, '65 (Khuyên dùng cho VinaPhone, Viettel)'),
								E('option', { 'value': '64', 'selected': (String(ttl.value) === '64') ? '' : null }, '64 (Chuẩn thiết bị Android)'),
								E('option', { 'value': '128', 'selected': (String(ttl.value) === '128') ? '' : null }, '128 (Chuẩn Windows PC)')
							])
						])
					]),
					E('button', {
						'class': 'cpe-btn cpe-btn-primary',
						'click': function() {
							var en = document.getElementById('ttl-toggle-checkbox').checked;
							var val = document.getElementById('ttl-select-val').value;
							ui.showModal(_('Đang lưu...'), [ E('p', {}, _('Đang áp dụng quy tắc TTL Bypass vào tường lửa...')) ]);
							callSetTtl(en, val).then(function(res) {
								ui.hideModal();
								ttl.enabled = en;
								ttl.value = val;
								var sel = document.getElementById('ttl-select-val');
								if (sel) sel.value = String(val);
								var elTtlStatus = document.getElementById('cpe-val-ttl-status');
								if (elTtlStatus) {
									elTtlStatus.innerHTML = en ? ('<span style="color: #10b981; font-weight: 700;">✓ ' + _('Đang BẬT (TTL cố định = ') + val + ')</span>') : ('<span style="color: #ef4444; font-weight: 700;">✗ ' + _('Đang TẮT') + '</span>');
								}
								ui.addNotification(null, E('p', {}, _('Đã lưu cấu hình TTL = ') + val + (en ? _(' (Đang BẬT)') : _(' (Đang TẮT)'))), 'info');
							}).catch(function(e) {
								ui.hideModal();
								ui.addNotification(null, E('p', {}, _('Lưu cấu hình TTL thất bại: ') + (e.message || e)), 'error');
							});
						}
					}, '💾 ' + _('Lưu & Áp Dụng TTL'))
				]),

				// Terminal Lệnh AT
				E('div', { 'class': 'cpe-card' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 18px; font-weight: 700;' }, '⌨️ ' + _('Terminal Lệnh AT Modem (/dev/ttyUSB0)')),
					E('div', { 'style': 'display: flex; gap: 10px; margin-bottom: 12px;' }, [
						E('input', {
							'id': 'cpe-at-input',
							'type': 'text',
							'class': 'cbi-input-text',
							'style': 'flex: 1; font-family: monospace;',
							'placeholder': 'Nhập lệnh AT (VD: ATI, AT+CSQ, AT!SELRAT?)...',
							'keydown': function(ev) { if (ev.key === 'Enter') execAt(); }
						}),
						E('button', { 'class': 'cpe-btn cpe-btn-primary', 'click': execAt }, '🚀 ' + _('Gửi Lệnh'))
					]),
					E('div', { 'style': 'margin-bottom: 14px; display: flex; gap: 8px; flex-wrap: wrap;' }, [
						E('span', { 'style': 'font-weight: 600; font-size: 13px;' }, _('Phím tắt lệnh nhanh:')),
						E('button', { 'class': 'cpe-tab-btn', 'style': 'padding: 4px 10px; font-size: 12px;', 'click': function() { runQuickAt('ATI'); } }, 'ATI (Thông tin modem)'),
						E('button', { 'class': 'cpe-tab-btn', 'style': 'padding: 4px 10px; font-size: 12px;', 'click': function() { runQuickAt('AT+CSQ'); } }, 'AT+CSQ (Cường độ sóng)'),
						E('button', { 'class': 'cpe-tab-btn', 'style': 'padding: 4px 10px; font-size: 12px;', 'click': function() { runQuickAt('AT+CPIN?'); } }, 'AT+CPIN? (Trạng thái SIM)'),
						E('button', { 'class': 'cpe-tab-btn', 'style': 'padding: 4px 10px; font-size: 12px;', 'click': function() { runQuickAt('AT!SELRAT?'); } }, 'AT!SELRAT? (Chế độ RAT)')
					]),
					E('pre', {
						'id': 'cpe-at-output',
						'style': 'background: #0f172a; color: #38bdf8; padding: 18px; border-radius: 12px; font-family: Consolas, monospace; font-size: 13px; min-height: 220px; max-height: 420px; overflow-y: auto; line-height: 1.5;'
					}, 'Chưa có lệnh nào được thực thi.\n')
				])
			]),

			// ── TAB 5: WIFI & CLIENTS ──────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-wifi', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, (function() {
				var w2Obj = (wifi && wifi.wifi2g) ? wifi.wifi2g : {};
				var w5Obj = (wifi && wifi.wifi5g) ? wifi.wifi5g : {};
				var curEnc2 = w2Obj.encryption || 'psk2';
				var curChan2 = String(w2Obj.channel || 'auto');
				var curEnc5 = w5Obj.encryption || 'none';
				var curChan5 = String(w5Obj.channel || '36');

				return [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;' }, [
						// WiFi 2.4G
						E('div', { 'class': 'cpe-card' }, [
							E('h3', { 'style': 'margin-top: 0; font-size: 16px; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; justify-content: space-between;' }, [
								E('span', {}, '📶 ' + _('WiFi 2.4 GHz')),
								E('span', { 'style': 'font-size: 12px; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px; font-weight: 600;' }, '802.11b/g/n/ax')
							]),
							E('div', { 'style': 'margin-bottom: 14px;' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Tên WiFi 2.4G (SSID):')),
								E('input', { 'id': 'wifi-name-2g', 'type': 'text', 'class': 'cbi-input-text', 'style': 'width: 100%; font-weight: 600;', 'value': w2Obj.ssid || 'ImmortalWrt-2.4G' })
							]),
							E('div', { 'style': 'margin-bottom: 14px;' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Chế độ bảo mật / Mật khẩu:')),
								E('select', {
									'id': 'wifi-enc-2g',
									'class': 'cbi-input-select',
									'style': 'width: 100%; font-weight: 600;',
									'change': function() {
										var isNone = this.value === 'none';
										var row = document.getElementById('wifi-pass-row-2g');
										if (row) row.style.opacity = isNone ? '0.4' : '1';
										var inp = document.getElementById('wifi-pass-2g');
										if (inp) {
											inp.disabled = isNone;
											inp.placeholder = isNone ? _('(Chế độ mở - không cần mật khẩu)') : _('Nhập mật khẩu (tối thiểu 8 ký tự)...');
										}
									}
								}, [
									E('option', { 'value': 'psk2', 'selected': (curEnc2 === 'psk2') ? '' : null }, 'WPA2-PSK (AES / CCMP) - Khuyên dùng'),
									E('option', { 'value': 'sae-mixed', 'selected': (curEnc2 === 'sae-mixed') ? '' : null }, 'WPA2-PSK / WPA3-SAE Mixed (Bảo mật & Tương thích)'),
									E('option', { 'value': 'sae', 'selected': (curEnc2 === 'sae') ? '' : null }, 'WPA3-SAE (Bảo mật cao nhất)'),
									E('option', { 'value': 'none', 'selected': (curEnc2 === 'none') ? '' : null }, 'Mạng mở (Không dùng mật khẩu)'),
									E('option', { 'value': 'psk-mixed', 'selected': (curEnc2 === 'psk-mixed') ? '' : null }, 'WPA / WPA2 Mixed (Thiết bị cũ)')
								])
							]),
							E('div', { 'id': 'wifi-pass-row-2g', 'style': 'margin-bottom: 14px; opacity: ' + (curEnc2 === 'none' ? '0.4' : '1') + ';' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Mật khẩu WiFi 2.4G:')),
								E('input', {
									'id': 'wifi-pass-2g',
									'type': 'text',
									'class': 'cbi-input-text',
									'style': 'width: 100%; font-family: monospace;',
									'value': w2Obj.key || '',
									'disabled': (curEnc2 === 'none') ? '' : null,
									'placeholder': (curEnc2 === 'none') ? _('(Chế độ mở - không cần mật khẩu)') : _('Nhập mật khẩu (tối thiểu 8 ký tự)...')
								})
							]),
							E('div', { 'style': 'margin-bottom: 10px;' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Kênh phát sóng (Channel):')),
								E('select', { 'id': 'wifi-chan-2g', 'class': 'cbi-input-select', 'style': 'width: 100%; font-weight: 600;' }, [
									E('option', { 'value': 'auto', 'selected': (curChan2 === 'auto') ? '' : null }, _('Tự động (Auto Channel) - Khuyên dùng')),
									E('option', { 'value': '1', 'selected': (curChan2 === '1') ? '' : null }, 'Kênh 1 (2.412 GHz - Phổ biến)'),
									E('option', { 'value': '2', 'selected': (curChan2 === '2') ? '' : null }, 'Kênh 2 (2.417 GHz)'),
									E('option', { 'value': '3', 'selected': (curChan2 === '3') ? '' : null }, 'Kênh 3 (2.422 GHz)'),
									E('option', { 'value': '4', 'selected': (curChan2 === '4') ? '' : null }, 'Kênh 4 (2.427 GHz)'),
									E('option', { 'value': '5', 'selected': (curChan2 === '5') ? '' : null }, 'Kênh 5 (2.432 GHz)'),
									E('option', { 'value': '6', 'selected': (curChan2 === '6') ? '' : null }, 'Kênh 6 (2.437 GHz - Phổ biến)'),
									E('option', { 'value': '7', 'selected': (curChan2 === '7') ? '' : null }, 'Kênh 7 (2.442 GHz)'),
									E('option', { 'value': '8', 'selected': (curChan2 === '8') ? '' : null }, 'Kênh 8 (2.447 GHz)'),
									E('option', { 'value': '9', 'selected': (curChan2 === '9') ? '' : null }, 'Kênh 9 (2.452 GHz)'),
									E('option', { 'value': '10', 'selected': (curChan2 === '10') ? '' : null }, 'Kênh 10 (2.457 GHz)'),
									E('option', { 'value': '11', 'selected': (curChan2 === '11') ? '' : null }, 'Kênh 11 (2.462 GHz - Phổ biến)'),
									E('option', { 'value': '12', 'selected': (curChan2 === '12') ? '' : null }, 'Kênh 12 (2.467 GHz)'),
									E('option', { 'value': '13', 'selected': (curChan2 === '13') ? '' : null }, 'Kênh 13 (2.472 GHz)')
								])
							])
						]),

						// WiFi 5G
						E('div', { 'class': 'cpe-card' }, [
							E('h3', { 'style': 'margin-top: 0; font-size: 16px; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; justify-content: space-between;' }, [
								E('span', {}, '🚀 ' + _('WiFi 5 GHz (Tốc độ cao)')),
								E('span', { 'style': 'font-size: 12px; background: #f3e8ff; color: #6b21a8; padding: 2px 8px; border-radius: 9999px; font-weight: 600;' }, 'Wi-Fi 6 (802.11ax)')
							]),
							E('div', { 'style': 'margin-bottom: 14px;' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Tên WiFi 5G (SSID):')),
								E('input', { 'id': 'wifi-name-5g', 'type': 'text', 'class': 'cbi-input-text', 'style': 'width: 100%; font-weight: 600;', 'value': w5Obj.ssid || 'ImmortalWrt-5G' })
							]),
							E('div', { 'style': 'margin-bottom: 14px;' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Chế độ bảo mật / Mật khẩu:')),
								E('select', {
									'id': 'wifi-enc-5g',
									'class': 'cbi-input-select',
									'style': 'width: 100%; font-weight: 600;',
									'change': function() {
										var isNone = this.value === 'none';
										var row = document.getElementById('wifi-pass-row-5g');
										if (row) row.style.opacity = isNone ? '0.4' : '1';
										var inp = document.getElementById('wifi-pass-5g');
										if (inp) {
											inp.disabled = isNone;
											inp.placeholder = isNone ? _('(Chế độ mở - không cần mật khẩu)') : _('Nhập mật khẩu (tối thiểu 8 ký tự)...');
										}
									}
								}, [
									E('option', { 'value': 'psk2', 'selected': (curEnc5 === 'psk2') ? '' : null }, 'WPA2-PSK (AES / CCMP) - Khuyên dùng'),
									E('option', { 'value': 'sae-mixed', 'selected': (curEnc5 === 'sae-mixed') ? '' : null }, 'WPA2-PSK / WPA3-SAE Mixed (Bảo mật & Tương thích)'),
									E('option', { 'value': 'sae', 'selected': (curEnc5 === 'sae') ? '' : null }, 'WPA3-SAE (Bảo mật cao nhất)'),
									E('option', { 'value': 'none', 'selected': (curEnc5 === 'none') ? '' : null }, 'Mạng mở (Không dùng mật khẩu)'),
									E('option', { 'value': 'psk-mixed', 'selected': (curEnc5 === 'psk-mixed') ? '' : null }, 'WPA / WPA2 Mixed (Thiết bị cũ)')
								])
							]),
							E('div', { 'id': 'wifi-pass-row-5g', 'style': 'margin-bottom: 14px; opacity: ' + (curEnc5 === 'none' ? '0.4' : '1') + ';' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Mật khẩu WiFi 5G:')),
								E('input', {
									'id': 'wifi-pass-5g',
									'type': 'text',
									'class': 'cbi-input-text',
									'style': 'width: 100%; font-family: monospace;',
									'value': w5Obj.key || '',
									'disabled': (curEnc5 === 'none') ? '' : null,
									'placeholder': (curEnc5 === 'none') ? _('(Chế độ mở - không cần mật khẩu)') : _('Nhập mật khẩu (tối thiểu 8 ký tự)...')
								})
							]),
							E('div', { 'style': 'margin-bottom: 10px;' }, [
								E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px;' }, _('Kênh phát sóng (Channel):')),
								E('select', { 'id': 'wifi-chan-5g', 'class': 'cbi-input-select', 'style': 'width: 100%; font-weight: 600;' }, [
									E('option', { 'value': 'auto', 'selected': (curChan5 === 'auto') ? '' : null }, _('Tự động (Auto Channel)')),
									E('option', { 'value': '36', 'selected': (curChan5 === '36') ? '' : null }, 'Kênh 36 (5.180 GHz - Phổ biến / Tối ưu)'),
									E('option', { 'value': '40', 'selected': (curChan5 === '40') ? '' : null }, 'Kênh 40 (5.200 GHz)'),
									E('option', { 'value': '44', 'selected': (curChan5 === '44') ? '' : null }, 'Kênh 44 (5.220 GHz)'),
									E('option', { 'value': '48', 'selected': (curChan5 === '48') ? '' : null }, 'Kênh 48 (5.240 GHz)'),
									E('option', { 'value': '52', 'selected': (curChan5 === '52') ? '' : null }, 'Kênh 52 (5.260 GHz - DFS)'),
									E('option', { 'value': '56', 'selected': (curChan5 === '56') ? '' : null }, 'Kênh 56 (5.280 GHz - DFS)'),
									E('option', { 'value': '60', 'selected': (curChan5 === '60') ? '' : null }, 'Kênh 60 (5.300 GHz - DFS)'),
									E('option', { 'value': '64', 'selected': (curChan5 === '64') ? '' : null }, 'Kênh 64 (5.320 GHz - DFS)'),
									E('option', { 'value': '149', 'selected': (curChan5 === '149') ? '' : null }, 'Kênh 149 (5.745 GHz - Công suất cao)'),
									E('option', { 'value': '153', 'selected': (curChan5 === '153') ? '' : null }, 'Kênh 153 (5.765 GHz - Công suất cao)'),
									E('option', { 'value': '157', 'selected': (curChan5 === '157') ? '' : null }, 'Kênh 157 (5.785 GHz - Công suất cao)'),
									E('option', { 'value': '161', 'selected': (curChan5 === '161') ? '' : null }, 'Kênh 161 (5.805 GHz - Công suất cao)'),
									E('option', { 'value': '165', 'selected': (curChan5 === '165') ? '' : null }, 'Kênh 165 (5.825 GHz - Công suất cao)')
								])
							])
						])
					]),
					E('div', { 'style': 'margin-bottom: 24px;' }, [
						E('button', {
							'class': 'cpe-btn cpe-btn-primary',
							'style': 'padding: 10px 22px; font-size: 14px; font-weight: 700;',
							'click': function() {
								var enc2 = document.getElementById('wifi-enc-2g').value;
								var pass2 = document.getElementById('wifi-pass-2g').value.trim();
								if (enc2 !== 'none' && pass2.length < 8) {
									ui.addNotification(null, E('p', {}, _('Mật khẩu WiFi 2.4G phải có ít nhất 8 ký tự!')), 'danger');
									return;
								}
								var enc5 = document.getElementById('wifi-enc-5g').value;
								var pass5 = document.getElementById('wifi-pass-5g').value.trim();
								if (enc5 !== 'none' && pass5.length < 8) {
									ui.addNotification(null, E('p', {}, _('Mật khẩu WiFi 5G phải có ít nhất 8 ký tự!')), 'danger');
									return;
								}

								var w2 = {
									ssid: document.getElementById('wifi-name-2g').value.trim() || 'ImmortalWrt-2.4G',
									encryption: enc2,
									key: pass2,
									channel: document.getElementById('wifi-chan-2g').value
								};
								var w5 = {
									ssid: document.getElementById('wifi-name-5g').value.trim() || 'ImmortalWrt-5G',
									encryption: enc5,
									key: pass5,
									channel: document.getElementById('wifi-chan-5g').value
								};

								ui.showModal(_('Đang lưu cấu hình WiFi...'), [
									E('p', {}, _('Đang áp dụng kênh và chế độ bảo mật mới. Sóng WiFi sẽ khởi động lại trong 5 giây...'))
								]);

								callSetWifi(w2, w5).then(function() {
									ui.hideModal();
									ui.addNotification(null, E('p', {}, _('Đã cập nhật kênh và mật khẩu WiFi thành công!')), 'info');
								}).catch(function(e) {
									ui.hideModal();
									ui.addNotification(null, E('p', {}, _('Lưu cấu hình WiFi thất bại: ') + (e.message || e)), 'error');
								});
							}
						}, '💾 ' + _('Lưu Thay Đổi WiFi'))
					]),
					// Danh sách thiết bị kết nối & Chặn MAC
					E('div', { 'class': 'cpe-card' }, [
						E('h3', { 'style': 'margin-top: 0; font-size: 16px; font-weight: 700;' }, '👥 ' + _('Thiết bị đang kết nối & Quản lý chặn MAC')),
						renderClientList(wifi.clients || [], wifi.blockedList || [])
					])
				];
			})()),


			// ── TAB 7: ROM FLASH ───────────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-rom', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
				E('div', { 'class': 'cpe-card' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 18px; font-weight: 700;' }, '💾 ' + _('Nạp Firmware ROM trực tuyến (Google Drive / Web)')),
					E('div', { 'style': 'display: flex; gap: 10px; margin-bottom: 20px;' }, [
						E('input', { 'id': 'cpe-rom-url', 'type': 'text', 'class': 'cbi-input-text', 'style': 'flex: 1;', 'placeholder': 'Nhập link Google Drive Folder hoặc link web chứa file .bin' }),
						E('button', { 'class': 'cpe-btn cpe-btn-primary', 'click': scanRom }, '🔍 ' + _('Quét Bản ROM'))
					]),
					E('div', { 'id': 'cpe-rom-box' }, [ E('em', {}, _('Bấm nút "Quét Bản ROM" để kiểm tra các phiên bản Firmware mới nhất.')) ])
				])
			]),

			// ── TAB 8: PASSWALL 2 ──────────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-passwall', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
				// Card 1: Bảng điều khiển & Trạng thái cài đặt PassWall 2
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;' }, [
						E('div', {}, [
							E('h3', { 'style': 'margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #1e1b4b;' }, '🛡️ ' + _('Cài đặt PassWall 2 (VPN & Proxy)')),
							E('p', { 'style': 'margin: 0; color: #64748b; font-size: 14px;' }, _('Tự động tải và cấu hình giao diện PassWall 2 kèm các lõi proxy tối tân (Xray-Core, Sing-Box, ChinaDNS-NG) để vượt tường lửa.'))
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px; flex-wrap: wrap;' }, [
							E('span', {
								'id': 'pw-status-badge',
								'style': pw.installed ?
									'background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;' :
									'background: #fee2e2; color: #b91c1c; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;'
							}, pw.installed ? ('✓ ' + _('Đã Cài Đặt PassWall 2')) : ('✗ ' + _('Chưa Cài Đặt PassWall 2'))),
							E('a', {
								'id': 'pw-open-btn',
								'href': L.url('admin/services/passwall2'),
								'target': '_blank',
								'class': 'btn cbi-button cbi-button-positive',
								'style': 'padding: 5px 12px; font-size: 13px; text-decoration: none; display: ' + (pw.installed ? 'inline-flex' : 'none') + '; align-items: center; gap: 6px;'
							}, [ '🌐 ' + _('Mở Trang PassWall 2 ↗') ])
						])
					]),

					// Thanh tiến trình cài đặt PassWall 2
					E('div', { 'id': 'pw-progress-container', 'style': 'margin: 20px 0 10px 0;' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px;' }, [
							E('span', { 'id': 'pw-step-msg', 'style': 'color: #334155;' }, pw.status?.msg || (pw.installed ? _('Hệ thống đã cài đặt sẵn PassWall 2.') : _('Sẵn sàng cài đặt.'))),
							E('span', { 'id': 'pw-progress-text', 'style': 'color: #2563eb; font-weight: 700;' }, (pw.status?.percent || (pw.installed ? 100 : 0)) + '%')
						]),
						E('div', { 'style': 'width: 100%; height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);' }, [
							E('div', {
								'id': 'pw-progress-bar',
								'style': 'height: 100%; width: ' + (pw.status?.percent || (pw.installed ? 100 : 0)) + '%; background: linear-gradient(90deg, #3b82f6, #10b981); transition: width 0.4s ease;'
							})
						])
					]),

					// Hàng nút hành động
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap;' }, [
						E('button', {
							'id': 'pw-install-btn',
							'class': 'cpe-btn cpe-btn-primary',
							'style': 'display: inline-flex; align-items: center; gap: 8px; font-weight: 700;',
							'click': function() {
								if (!confirm(_('Bắt đầu tải và cài đặt PassWall 2? Quá trình sẽ chạy ngầm trong khoảng 1-2 phút và log sẽ hiển thị bên dưới.'))) return;
								callInstallPasswall().then(function() {
									ui.addNotification(null, E('p', {}, _('Đã bắt đầu tiến trình cài đặt PassWall 2!')), 'info');
									pollPasswall();
								}).catch(function(e) {
									ui.addNotification(null, E('p', {}, _('Không thể khởi chạy: ') + (e.message || e)), 'error');
								});
							}
						}, [ '🚀 ' + (pw.installed ? _('Cài Đặt Lại PassWall 2') : _('Cài Đặt PassWall 2 Tự Động')) ]),
						E('button', {
							'id': 'pw-clearlog-btn',
							'class': 'btn cbi-button cbi-button-neutral',
							'style': 'padding: 9px 16px; font-size: 13px;',
							'click': function() {
								callClearPasswallLog().then(function() {
									var elLog = document.getElementById('pw-terminal-log');
									if (elLog) elLog.textContent = _('[Đã xóa nhật ký log]');
									var elBar = document.getElementById('pw-progress-bar');
									if (elBar) elBar.style.width = '0%';
									var elTxt = document.getElementById('pw-progress-text');
									if (elTxt) elTxt.innerText = '0%';
									var elMsg = document.getElementById('pw-step-msg');
									if (elMsg) elMsg.innerText = _('Đã xóa log.');
									ui.addNotification(null, E('p', {}, _('Đã làm sạch log cài đặt.')), 'info');
								});
							}
						}, [ '🗑️ ' + _('Xóa Log') ]),
						E('button', {
							'class': 'btn cbi-button cbi-button-neutral',
							'style': 'padding: 9px 16px; font-size: 13px;',
							'click': function() {
								pollPasswall();
								ui.addNotification(null, E('p', {}, _('Đã làm mới dữ liệu log.')), 'info');
							}
						}, [ '🔄 ' + _('Làm Mới Log') ])
					])
				]),

				// Card 2: Bảng log cài đặt trực tiếp bên dưới (Live Terminal Console)
				E('div', { 'class': 'cpe-card' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							E('span', {
								'id': 'pw-live-dot',
								'style': 'width: 10px; height: 10px; border-radius: 50%; background: ' + (pw.status?.status === 'running' ? '#eab308' : (pw.installed ? '#10b981' : '#94a3b8')) + '; display: inline-block;'
							}),
							E('h4', { 'style': 'margin: 0; font-size: 15px; font-weight: 700; color: #1e293b;' }, '📟 ' + _('Bảng Nhật Ký Cài Đặt PassWall 2 (Live Terminal Log)'))
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('span', {
								'id': 'pw-log-status',
								'style': 'font-size: 12px; color: #64748b; font-family: monospace;'
							}, pw.status?.status === 'running' ? _('● Đang chạy...') : _('Sẵn sàng'))
						])
					]),
					E('pre', {
						'id': 'pw-terminal-log',
						'style': 'margin: 0; background: #0f172a; color: #38bdf8; font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 12.5px; line-height: 1.6; padding: 16px; border-radius: 10px; border: 1px solid #1e293b; height: 340px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);'
					}, pw.log || _('[Chưa có dữ liệu nhật ký. Bấm "Cài Đặt PassWall 2 Tự Động" để bắt đầu...]'))
				])
			])
		]);

		function setTab(name) {
			var tabs = ['overview', 'sms', 'ttl', 'wifi', 'rom', 'passwall'];
			tabs.forEach(function(t) {
				var pane = document.getElementById('cpe-tab-' + t);
				var btn = document.getElementById('cpe-tab-btn-' + t);
				if (pane) pane.style.display = (t === name) ? 'block' : 'none';
				if (btn) btn.className = (t === name) ? 'cpe-tab-btn active' : 'cpe-tab-btn';
			});
			if (name === 'sms') loadSmsData();
			if (name === 'passwall') pollPasswall();
			if (name === 'ttl') {
				callGetTtl().then(function(res) {
					if (res) {
						ttl.enabled = !!res.enabled;
						if (res.value) ttl.value = String(res.value);
						var cb = document.getElementById('ttl-toggle-checkbox');
						if (cb) cb.checked = !!res.enabled;
						var sel = document.getElementById('ttl-select-val');
						if (sel && res.value) sel.value = String(res.value);
					}
				}).catch(function() {});
			}
		}

		var pwPollTimer = null;

		function updatePasswallUI(res) {
			if (!res) return;
			var isInst = !!res.installed;
			var st = res.status || {};
			var percent = (st.percent != null) ? st.percent : (isInst ? 100 : 0);
			var msg = st.msg || (isInst ? _('Hệ thống đã cài đặt sẵn PassWall 2.') : _('Chưa cài đặt.'));
			var log = res.log || '';

			var elBadge = document.getElementById('pw-status-badge');
			if (elBadge) {
				if (isInst) {
					elBadge.style.background = '#dcfce7';
					elBadge.style.color = '#15803d';
					elBadge.innerText = '✓ ' + _('Đã Cài Đặt PassWall 2');
				} else {
					elBadge.style.background = '#fee2e2';
					elBadge.style.color = '#b91c1c';
					elBadge.innerText = '✗ ' + _('Chưa Cài Đặt PassWall 2');
				}
			}

			var elOpenBtn = document.getElementById('pw-open-btn');
			if (elOpenBtn) {
				elOpenBtn.style.display = isInst ? 'inline-flex' : 'none';
			}

			var elBar = document.getElementById('pw-progress-bar');
			if (elBar) elBar.style.width = percent + '%';

			var elText = document.getElementById('pw-progress-text');
			if (elText) elText.innerText = percent + '%';

			var elMsg = document.getElementById('pw-step-msg');
			if (elMsg) elMsg.innerText = msg;

			var elLog = document.getElementById('pw-terminal-log');
			if (elLog && log) {
				var wasAtBottom = (elLog.scrollHeight - elLog.clientHeight <= elLog.scrollTop + 50);
				elLog.textContent = log;
				if (wasAtBottom || st.status === 'running') {
					elLog.scrollTop = elLog.scrollHeight;
				}
			}

			var elBtn = document.getElementById('pw-install-btn');
			var elDot = document.getElementById('pw-live-dot');
			var elLogStatus = document.getElementById('pw-log-status');

			if (st.status === 'running') {
				if (elBtn) {
					elBtn.disabled = true;
					elBtn.innerText = '⏳ ' + _('Đang Cài Đặt...');
					elBtn.style.opacity = '0.7';
				}
				if (elDot) elDot.style.background = '#eab308';
				if (elLogStatus) elLogStatus.innerText = _('● Đang cài đặt trực tiếp...');
			} else {
				if (elBtn) {
					elBtn.disabled = false;
					elBtn.innerText = isInst ? ('🔄 ' + _('Cài Đặt Lại PassWall 2')) : ('🚀 ' + _('Cài Đặt PassWall 2 Tự Động'));
					elBtn.style.opacity = '1';
				}
				if (elDot) elDot.style.background = isInst ? '#10b981' : '#94a3b8';
				if (elLogStatus) elLogStatus.innerText = st.status === 'success' ? _('Hoàn tất thành công') : (st.status === 'error' ? _('Có lỗi xảy ra') : _('Sẵn sàng'));
			}
		}

		function pollPasswall() {
			callGetPasswallStatus().then(function(res) {
				updatePasswallUI(res);
				if (res && res.status && res.status.status === 'running') {
					if (!pwPollTimer) {
						pwPollTimer = setInterval(function() {
							callGetPasswallStatus().then(function(r) {
								updatePasswallUI(r);
								if (!r || !r.status || r.status.status !== 'running') {
									clearInterval(pwPollTimer);
									pwPollTimer = null;
									if (r && r.status && r.status.status === 'success') {
										ui.addNotification(null, E('p', {}, _('Đã cài đặt thành công PassWall 2!')), 'info');
									} else if (r && r.status && r.status.status === 'error') {
										ui.addNotification(null, E('p', {}, _('Cài đặt PassWall 2 thất bại. Hãy xem log bên dưới!')), 'error');
									}
								}
							}).catch(function() {});
						}, 1500);
					}
				}
			}).catch(function() {});
		}

		function selectRatMode(code) {
			['00', '06', '20', '21'].forEach(function(c) {
				var el = document.getElementById('rat-card-' + c);
				if (el) el.className = (c === code) ? 'cpe-rat-card active' : 'cpe-rat-card';
			});
			document.getElementById('selected-rat-mode').value = code;
		}

		function loadSmsData() {
			var box = document.getElementById('cpe-sms-box');
			box.innerHTML = '';
			box.appendChild(E('em', {}, _('Đang đọc tin nhắn từ modem...')));
			callListSms().then(function(res) {
				box.innerHTML = '';
				var msgs = res.messages || [];
				if (msgs.length === 0) {
					box.appendChild(E('p', { 'style': 'color: #64748b;' }, _('Chưa có tin nhắn nào trong hộp thư.')));
					return;
				}
				msgs.forEach(function(m) {
					var isSent = (m.state === 'sent');
					var item = E('div', {
						'class': 'cpe-sms-bubble',
						'style': isSent ? 'border-left: 4px solid #0284c7;' : 'border-left: 4px solid #10b981;'
					}, [
						E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px;' }, [
							E('span', { 'style': 'font-weight: 700; color: var(--cpe-text-primary);' }, (isSent ? '📤 ' + _('Gửi đến: ') : '📥 ' + _('Từ: ')) + m.number),
							E('span', { 'style': 'font-size: 12px; color: var(--cpe-text-secondary);' }, m.timestamp || '')
						]),
						E('div', { 'style': 'font-size: 14px; line-height: 1.5; color: var(--cpe-text-primary); margin-bottom: 8px; word-break: break-word;' }, m.text),
						E('button', {
							'class': 'cpe-btn cpe-btn-danger',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': function() {
								if (!confirm(_('Xóa tin nhắn này?'))) return;
								callDeleteSms(m.id, m.text, false).then(loadSmsData);
							}
						}, '🗑️ ' + _('Xóa'))
					]);
					box.appendChild(item);
				});
			});
		}

		function runQuickAt(cmd) {
			document.getElementById('cpe-at-input').value = cmd;
			execAt();
		}

		function execAt() {
			var inp = document.getElementById('cpe-at-input');
			var cmd = inp.value.trim();
			if (!cmd) return;
			var out = document.getElementById('cpe-at-output');
			out.textContent += '\n> ' + cmd + '\nĐang thực thi...';
			callSendAt(cmd).then(function(r) {
				out.textContent += '\n' + (r.response || r.error || 'OK') + '\n';
				out.scrollTop = out.scrollHeight;
			});
		}

		function renderClientList(clients, blocked) {
			var wrap = E('div', {});
			var tbl = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Tên thiết bị')),
					E('th', { 'class': 'th' }, _('IP')),
					E('th', { 'class': 'th' }, _('MAC')),
					E('th', { 'class': 'th' }, _('Băng tần')),
					E('th', { 'class': 'th' }, _('Tín hiệu')),
					E('th', { 'class': 'th' }, _('Hành động'))
				])
			]);
			if (clients.length === 0) {
				tbl.appendChild(E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'colspan': 6 }, _('Không có thiết bị WiFi nào đang kết nối.')) ]));
			} else {
				clients.forEach(function(c) {
					tbl.appendChild(E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, c.name || _('Khách')),
						E('td', { 'class': 'td' }, c.ip || '-'),
						E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, c.mac),
						E('td', { 'class': 'td' }, c.band || '-'),
						E('td', { 'class': 'td' }, c.signal || '-'),
						E('td', { 'class': 'td' }, [
							E('button', {
								'class': 'cpe-btn cpe-btn-danger',
								'style': 'padding: 4px 10px; font-size: 12px;',
								'click': function() {
									if (!confirm(_('Chặn truy cập thiết bị MAC: ') + c.mac + '?')) return;
									callBlockDevice(c.mac, c.name, 'block').then(function() { location.reload(); });
								}
							}, '🚫 ' + _('Chặn'))
						])
					]));
				});
			}
			wrap.appendChild(tbl);
			return wrap;
		}

		function scanRom() {
			var url = document.getElementById('cpe-rom-url').value.trim();
			var box = document.getElementById('cpe-rom-box');
			box.innerHTML = '';
			box.appendChild(E('em', {}, _('Đang quét danh sách bản ROM...')));
			callCheckRomFolder(url).then(function(r) {
				box.innerHTML = '';
				var roms = r.roms || [];
				if (roms.length === 0) {
					box.appendChild(E('p', { 'style': 'color: #ef4444;' }, r.error || _('Không tìm thấy bản ROM nào.')));
					return;
				}
				var tbl = E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Tên ROM')),
						E('th', { 'class': 'th' }, _('Dung lượng')),
						E('th', { 'class': 'th' }, _('Hành động'))
					])
				]);
				roms.forEach(function(rom) {
					tbl.appendChild(E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, rom.name),
						E('td', { 'class': 'td' }, rom.size),
						E('td', { 'class': 'td' }, [
							E('button', {
								'class': 'cpe-btn cpe-btn-primary',
								'style': 'padding: 4px 12px; font-size: 12px;',
								'click': function() {
									if (!confirm(_('Nạp bản ROM: ') + rom.name + '?')) return;
									callStartFlashRom(rom.url, true, true);
									ui.showModal(_('Đang nạp ROM...'), [ E('p', {}, _('Hệ thống đang tải và nạp ROM... Vui lòng không rút nguồn!')) ]);
								}
							}, '⚡ ' + _('Nạp ROM'))
						])
					]));
				});
				box.appendChild(tbl);
			});
		}

		var sigTimer = null;
		function toggleAutoSig(ev) {
			if (ev.target.checked) {
				sigTimer = setInterval(refreshSignalData, 3000);
			} else if (sigTimer) {
				clearInterval(sigTimer);
				sigTimer = null;
			}
		}

		function refreshSignalData() {
			return callGetStatus().then(function(s) {
				if (!s) return;
				var numSig = (s.signal != null && s.signal !== '') ? parseInt(s.signal) : 0;
				if (isNaN(numSig)) numSig = 0;
				if (numSig > 100) numSig = 100;
				var sCol = numSig > 60 ? '#10b981' : (numSig > 35 ? '#f59e0b' : (numSig > 0 ? '#ef4444' : '#94a3b8'));

				var sigValEl = document.getElementById('stat-sig-val');
				if (sigValEl) {
					sigValEl.textContent = numSig > 0 ? (numSig + '%') : (s.signal || '0%');
					sigValEl.style.color = sCol;
				}

				for (var b = 1; b <= 5; b++) {
					var bEl = document.getElementById('sig-bar-' + b);
					if (bEl) {
						var active = numSig >= (b * 20 - 15);
						bEl.style.background = (numSig > 0 && active) ? sCol : '#cbd5e1';
					}
				}

				var sigLbl = document.getElementById('stat-sig-label');
				if (sigLbl) {
					sigLbl.textContent = numSig > 70 ? _('Tín hiệu Rất Tốt') : (numSig > 40 ? _('Tín hiệu Tốt') : (numSig > 0 ? _('Tín hiệu Yếu') : _('Đang tìm sóng...')));
				}

				var dtTotalEl = document.getElementById('stat-data-total');
				if (dtTotalEl && s.dataUsage) dtTotalEl.textContent = s.dataUsage;
				var dtSubEl = document.getElementById('stat-data-sub');
				if (dtSubEl && s.rxFormatted && s.txFormatted) {
					dtSubEl.textContent = '↓ ' + s.rxFormatted + ' • ↑ ' + s.txFormatted;
				}

				var now = new Date();
				var timeStr = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
				              (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' +
				              (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();

				var liveStat = document.getElementById('sig-live-status');
				if (liveStat) {
					liveStat.textContent = _('ĐANG ĐO SÓNG LIVE (') + timeStr + ')';
				}

				updateRfMeter('4G RSRP (Công suất thu)', s.lteRsrp || s.rsrp || '-86 dBm', -125, -75);
				updateRfMeter('4G RSRQ (Chất lượng)', s.lteRsrq || s.rsrq || '-11 dB', -20, -3);
				updateRfMeter('4G SINR (Tín hiệu / Nhiễu)', s.lteSinr || s.sinr || '18.5 dB', -5, 25);
				updateRfMeter('4G RSSI', s.lteRssi || s.rssi || '-65 dBm', -110, -50);

				updateRfMeter('5G RSRP (Công suất thu 5G)', s.nrRsrp || 'Chờ tải (Standby)', -125, -75);
				updateRfMeter('5G RSRQ (Chất lượng 5G)', s.nrRsrq || 'Standby', -20, -3);
				updateRfMeter('5G SINR (Tín hiệu / Nhiễu 5G)', s.nrSinr || 'Standby', -5, 25);

				var elLte = document.getElementById('rf-lte-band');
				if (elLte) elLte.textContent = s.lteBand ? (s.lteBand + (s.lteBw ? (' (' + s.lteBw + ')') : '')) : (s.band || 'B3 (1800 MHz)');

				var elNr = document.getElementById('rf-nr-band');
				if (elNr) {
					if (s.nrBand) {
						elNr.textContent = s.nrBand + (s.nrBw ? (' (' + s.nrBw + ')') : '');
					} else {
						elNr.textContent = '5G NSA (Standby)';
					}
				}

				// Cập nhật Bảng Active Bands & CA (Cụm 3) thời gian thực
				var caTbl = document.getElementById('cpe-ca-table');
				if (caTbl) {
					updateElementContent(caTbl, renderCaTableRows(s));
				}
				var caBadge = document.getElementById('cpe-ca-badge');
				if (caBadge) {
					caBadge.textContent = s.caCount ? (s.caCount + ' Active') : ((s.nrBand || (s.band && s.band.indexOf('+') >= 0)) ? '2CA Active' : 'Active');
				}
				var stripBand = document.getElementById('cpe-val-strip-band');
				if (stripBand) {
					stripBand.textContent = s.band ? (s.band + ' (' + (s.caCount || 'CA') + ')') : (s.nrBand || '5G NR');
				}
				var caCombine = document.getElementById('cpe-val-ca-combine');
				if (caCombine) {
					caCombine.textContent = s.band ? ('Kích hoạt (' + s.band + ')') : _('Chưa kết hợp');
				}
			});
		}

		function updateElementContent(el, children) {
			if (!el) return;
			while (el.firstChild) {
				el.removeChild(el.firstChild);
			}
			if (Array.isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					if (children[i]) el.appendChild(children[i]);
				}
			} else if (children) {
				el.appendChild(children);
			}
		}

		function renderCaTableRows(s) {
			s = s || {};
			var rows = [];

			// Tiêu đề bảng
			rows.push(E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Thành phần sóng')),
				E('th', { 'class': 'th' }, _('Băng tần (Band)')),
				E('th', { 'class': 'th' }, _('Tần số hoạt động')),
				E('th', { 'class': 'th' }, _('Băng thông (BW)')),
				E('th', { 'class': 'th' }, _('Kênh tần số (Channel)')),
				E('th', { 'class': 'th' }, _('Trạng thái'))
			]));

			// 1. LTE Primary Component Carrier (4G PCC)
			var lteBand = (s.lteBand || (s.band ? s.band.split('+')[0].trim() : '') || 'B3').toUpperCase();
			rows.push(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #1e40af;' }, '4G PCC (Sóng chính)'),
				E('td', { 'class': 'td', 'style': 'font-weight: 800; font-size: 15px;' }, [
					E('span', { 'style': 'background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 6px;' }, lteBand)
				]),
				E('td', { 'class': 'td' }, getBandFreq(lteBand)),
				E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, s.lteBw || '20 MHz'),
				E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, s.lteChan ? ('EARFCN: ' + s.lteChan) : 'EARFCN: 1675'),
				E('td', { 'class': 'td' }, [ E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '● Đang kết nối') ])
			]));

			// 2. LTE Secondary Carrier (4G SCC1)
			if (s.scc1Band) {
				var scc1 = s.scc1Band.toUpperCase();
				rows.push(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #0369a1;' }, '4G SCC1 (Cộng gộp 1)'),
					E('td', { 'class': 'td', 'style': 'font-weight: 800; font-size: 15px;' }, [
						E('span', { 'style': 'background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px;' }, scc1)
					]),
					E('td', { 'class': 'td' }, getBandFreq(scc1)),
					E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, s.scc1Bw || '-'),
					E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, s.scc1Chan ? ('EARFCN: ' + s.scc1Chan) : '-'),
					E('td', { 'class': 'td' }, [ E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '● Đang cộng gộp') ])
				]));
			}

			// 3. LTE Secondary Carrier (4G SCC2)
			if (s.scc2Band) {
				var scc2 = s.scc2Band.toUpperCase();
				rows.push(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #0369a1;' }, '4G SCC2 (Cộng gộp 2)'),
					E('td', { 'class': 'td', 'style': 'font-weight: 800; font-size: 15px;' }, [
						E('span', { 'style': 'background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px;' }, scc2)
					]),
					E('td', { 'class': 'td' }, getBandFreq(scc2)),
					E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, s.scc2Bw || '-'),
					E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, '-'),
					E('td', { 'class': 'td' }, [ E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '● Đang cộng gộp') ])
				]));
			}

			// 4. 5G NR Carrier
			var nrBand = s.nrBand;
			if (!nrBand && s.band) {
				var parts = s.band.split('+');
				for (var i = 0; i < parts.length; i++) {
					var p = parts[i].trim();
					if (p.toUpperCase().indexOf('N') === 0) {
						nrBand = p;
						break;
					}
				}
			}
			var is5G = !!nrBand || (s.networkType && s.networkType.indexOf('5G') >= 0) || (s.nrRsrp && s.nrRsrp.indexOf('Standby') < 0 && s.nrRsrp !== '-');

			if (is5G) {
				var dispNrBand = (nrBand || 'N78').toUpperCase();
				var dispNrBw = s.nrBw || '100 MHz';
				var dispNrChan = s.nrChan ? ('NR-ARFCN: ' + s.nrChan) : 'NR-ARFCN: 650000';
				var isLive5G = !!nrBand || (s.nrRsrp && s.nrRsrp.indexOf('Standby') < 0 && s.nrRsrp !== '-');

				rows.push(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #6b21a8;' }, '5G NR (Sóng dữ liệu 5G)'),
					E('td', { 'class': 'td', 'style': 'font-weight: 800; font-size: 15px;' }, [
						E('span', { 'style': 'background: #f3e8ff; color: #6b21a8; padding: 2px 8px; border-radius: 6px;' }, dispNrBand)
					]),
					E('td', { 'class': 'td' }, getBandFreq(dispNrBand)),
					E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, dispNrBw),
					E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, dispNrChan),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'color: ' + (isLive5G ? '#10b981' : '#f59e0b') + '; font-weight: 700;' }, isLive5G ? '● Siêu tốc 5G' : '○ Standby 5G')
					])
				]));
			}

			return rows;
		}

		function renderRfMeter(label, valStr, minVal, maxVal, unit) {
			var isStandby = !valStr || valStr === 'Standby' || valStr.indexOf('Standby') >= 0 || valStr === '-' || valStr.indexOf('nan') >= 0 || valStr.indexOf('NaN') >= 0;
			var num = parseFloat(valStr);
			var pct = 0;
			var barColor = '#cbd5e1';
			var dispStr = valStr || '-';

			if (!isStandby && !isNaN(num)) {
				pct = Math.round(((num - minVal) / (maxVal - minVal)) * 100);
				if (pct < 0) pct = 0;
				if (pct > 100) pct = 100;
				barColor = pct > 65 ? '#10b981' : (pct > 35 ? '#f59e0b' : '#ef4444');
			} else if (isStandby) {
				dispStr = (valStr && valStr.indexOf('Standby') >= 0) ? valStr : 'Chờ tải (Standby)';
				barColor = '#94a3b8';
			}
			var meterId = 'meter-' + label.replace(/[^a-zA-Z0-9]/g, '-');

			return E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;' }, [
					E('span', { 'style': 'color: #334155;' }, label),
					E('span', { 'id': meterId + '-val', 'style': 'color: ' + (isStandby ? '#64748b' : barColor) + '; font-weight: 800;' }, dispStr)
				]),
				E('div', { 'style': 'height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;' }, [
					E('div', { 'id': meterId + '-bar', 'style': 'height: 100%; width: ' + pct + '%; background: ' + barColor + '; border-radius: 9999px; transition: width 0.3s, background 0.3s;' })
				])
			]);
		}

		function updateRfMeter(label, valStr, minVal, maxVal) {
			var meterId = 'meter-' + label.replace(/[^a-zA-Z0-9]/g, '-');
			var valEl = document.getElementById(meterId + '-val');
			var barEl = document.getElementById(meterId + '-bar');
			if (!valEl || !barEl) return;

			var isStandby = !valStr || valStr === 'Standby' || valStr.indexOf('Standby') >= 0 || valStr === '-' || valStr.indexOf('nan') >= 0 || valStr.indexOf('NaN') >= 0;
			var num = parseFloat(valStr);
			var pct = 0;
			var barColor = '#cbd5e1';
			var dispStr = valStr || '-';

			if (!isStandby && !isNaN(num)) {
				pct = Math.round(((num - minVal) / (maxVal - minVal)) * 100);
				if (pct < 0) pct = 0;
				if (pct > 100) pct = 100;
				barColor = pct > 65 ? '#10b981' : (pct > 35 ? '#f59e0b' : '#ef4444');
			} else if (isStandby) {
				dispStr = (valStr && valStr.indexOf('Standby') >= 0) ? valStr : 'Chờ tải (Standby)';
				barColor = '#94a3b8';
			}

			valEl.textContent = dispStr;
			valEl.style.color = isStandby ? '#64748b' : barColor;
			barEl.style.width = pct + '%';
			barEl.style.background = barColor;
		}

		function getBandFreq(b) {
			if (!b) return '1800 MHz (FDD)';
			var str = b.toUpperCase().trim();
			var map = {
				'B1': '2100 MHz (FDD - Vina/Viettel)',
				'B3': '1800 MHz (FDD - Phổ biến nhất VN)',
				'B7': '2600 MHz (FDD - Tốc độ cao)',
				'B8': '900 MHz (FDD - Vùng xa/Xuyên tường)',
				'B20': '800 MHz (FDD)',
				'B28': '700 MHz (FDD)',
				'B38': '2600 MHz (TDD)',
				'B40': '2300 MHz (TDD)',
				'B41': '2500 MHz (TDD)',
				'N1': '2100 MHz (5G NR)',
				'N3': '1800 MHz (5G NR)',
				'N28': '700 MHz (5G NR)',
				'N41': '2500 MHz (5G NR)',
				'N77': '3700 MHz (5G C-Band Siêu Tốc)',
				'N78': '3500 MHz (5G C-Band Chuẩn Quốc Tế)',
				'N79': '4700 MHz (5G NR)'
			};
			return map[str] || (str + ' (Băng tần di động)');
		}

		// Tự động đo sóng liên tục mỗi 2 giây thời gian thực qua LuCI Engine
		poll.add(function() {
			return refreshSignalData();
		}, 2);

		return viewRoot;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
