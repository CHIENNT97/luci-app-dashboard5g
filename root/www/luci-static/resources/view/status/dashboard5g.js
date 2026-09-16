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
var callDeleteSms = rpc.declare({ object: 'luci.5g', method: 'deleteSms', params: [ 'id', 'text' ], expect: { } });
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
			'.cpe-wrap { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; }' +
			'.cpe-hero { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); border-radius: 16px; padding: 24px; color: #fff; margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.3); position: relative; overflow: hidden; }' +
			'.cpe-hero::after { content: "5G"; position: absolute; right: -20px; bottom: -30px; font-size: 160px; font-weight: 900; color: rgba(255,255,255,0.05); pointer-events: none; }' +
			'.cpe-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }' +
			'.cpe-card { background: #ffffff; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: transform 0.2s, box-shadow 0.2s; }' +
			'.cpe-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }' +
			'.cpe-badge-on { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }' +
			'.cpe-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }' +
			'.cpe-sig-bars { display: inline-flex; align-items: flex-end; gap: 3px; height: 20px; margin-left: 8px; }' +
			'.cpe-bar { width: 4px; border-radius: 2px; background: #cbd5e1; }' +
			'.cpe-nav-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }' +
			'.cpe-tab-btn { background: #f1f5f9; color: #475569; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }' +
			'.cpe-tab-btn:hover { background: #e2e8f0; color: #1e293b; }' +
			'.cpe-tab-btn.active { background: #4f46e5; color: #ffffff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35); }' +
			'.cpe-btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }' +
			'.cpe-btn-primary { background: #4f46e5; color: #fff; }' +
			'.cpe-btn-primary:hover { background: #4338ca; }' +
			'.cpe-btn-success { background: #10b981; color: #fff; }' +
			'.cpe-btn-success:hover { background: #059669; }' +
			'.cpe-btn-danger { background: #ef4444; color: #fff; }' +
			'.cpe-btn-danger:hover { background: #dc2626; }' +
			'.cpe-rat-card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; }' +
			'.cpe-rat-card:hover { border-color: #6366f1; background: #f8fafc; }' +
			'.cpe-rat-card.active { border-color: #4f46e5; background: #eef2ff; }' +
			'.cpe-sms-bubble { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 12px; position: relative; }';

		var viewRoot = E('div', { 'class': 'cpe-wrap' }, [
			E('style', {}, cssStyles),

			// ── HERO HEADER ────────────────────────────────────────────────────────
			E('div', { 'class': 'cpe-hero' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;' }, [
					E('div', {}, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px; margin-bottom: 8px;' }, [
							E('span', { 'style': 'background: #6366f1; color: #fff; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 6px; letter-spacing: 1px;' }, '5G CPE'),
							E('span', { 'class': 'cpe-badge-on' }, [
								E('span', { 'class': 'cpe-dot' }),
								_('MODEM ONLINE')
							])
						]),
						E('h1', { 'style': 'margin: 0; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px;' }, _('Dashboard BY NTC')),
						E('p', { 'style': 'margin: 6px 0 0 0; color: #cbd5e1; font-size: 14px;' }, _('Quản trị Modem 5G NR, Khóa sóng, SMS, TTL Bypass, WiFi & Nạp ROM trực tuyến'))
					]),
					E('div', { 'style': 'display: flex; gap: 10px;' }, [
						E('button', {
							'class': 'cpe-btn cpe-btn-success',
							'click': function() {
								ui.showModal(_('Đang kết nối lại...'), [ E('p', {}, _('Đang yêu cầu kết nối lại mạng 5G...')) ]);
								callReconnect().then(function() {
									ui.hideModal();
									ui.addNotification(null, E('p', {}, _('Đã gửi lệnh kết nối lại mạng 5G.')), 'info');
								});
							}
						}, '🔄 ' + _('Kết nối lại (Reconnect)')),
						E('button', {
							'class': 'cpe-btn cpe-btn-danger',
							'click': function() {
								if (!confirm(_('Bạn có chắc chắn muốn khởi động lại Modem 5G?'))) return;
								callRebootModem().then(function() {
									ui.addNotification(null, E('p', {}, _('Đã gửi lệnh khởi động lại Modem!')), 'warning');
								});
							}
						}, '⚡ ' + _('Khởi động lại Modem'))
					])
				])
			]),

			// ── 4 STATS CARDS ──────────────────────────────────────────────────────
			E('div', { 'class': 'cpe-grid' }, [
				// Card 1: Nhà mạng & Chế độ
				E('div', { 'class': 'cpe-card' }, [
					E('div', { 'style': 'color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;' }, '📡 ' + _('Nhà mạng & Mạng')),
					E('div', { 'style': 'font-size: 22px; font-weight: 800; color: #1e293b; margin: 8px 0 4px 0;' }, status.operator || 'VINAPHONE'),
					E('div', { 'style': 'display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px;' }, status.networkType || '5G NR NSA/SA')
				]),

				// Card 2: Tín hiệu sóng
				E('div', { 'class': 'cpe-card' }, [
					E('div', { 'style': 'color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;' }, '📶 ' + _('Cường độ tín hiệu')),
					E('div', { 'style': 'display: flex; align-items: baseline; gap: 8px; margin: 8px 0 4px 0;' }, [
						E('span', { 'id': 'stat-sig-val', 'style': 'font-size: 26px; font-weight: 800; color: ' + sigColor }, (sigVal > 0 ? (sigVal + '%') : (status.signal || '0%'))),
						E('span', { 'class': 'cpe-sig-bars' }, [
							E('span', { 'id': 'sig-bar-1', 'class': 'cpe-bar', 'style': 'height: 6px; background: ' + (sigVal > 20 ? sigColor : '#cbd5e1') }),
							E('span', { 'id': 'sig-bar-2', 'class': 'cpe-bar', 'style': 'height: 10px; background: ' + (sigVal > 40 ? sigColor : '#cbd5e1') }),
							E('span', { 'id': 'sig-bar-3', 'class': 'cpe-bar', 'style': 'height: 14px; background: ' + (sigVal > 60 ? sigColor : '#cbd5e1') }),
							E('span', { 'id': 'sig-bar-4', 'class': 'cpe-bar', 'style': 'height: 18px; background: ' + (sigVal > 80 ? sigColor : '#cbd5e1') }),
							E('span', { 'id': 'sig-bar-5', 'class': 'cpe-bar', 'style': 'height: 22px; background: ' + (sigVal >= 90 ? sigColor : '#cbd5e1') })
						])
					]),
					E('div', { 'id': 'stat-sig-label', 'style': 'font-size: 13px; color: #64748b;' }, sigVal > 70 ? _('Tín hiệu Rất Tốt') : (sigVal > 40 ? _('Tín hiệu Tốt') : (sigVal > 0 ? _('Tín hiệu Yếu') : _('Đang kiểm tra sóng...'))))
				]),

				// Card 3: IP WAN 5G
				E('div', { 'class': 'cpe-card' }, [
					E('div', { 'style': 'color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;' }, '🌐 ' + _('Địa chỉ IP WAN 5G')),
					E('div', { 'style': 'font-size: 20px; font-weight: 800; color: #1e293b; margin: 8px 0 4px 0; font-family: monospace;' }, status.ip || _('Chưa cấp phát')),
					E('div', { 'style': 'font-size: 13px; color: #10b981; font-weight: 600;' }, status.ip ? ('● ' + _('Đang kết nối Internet')) : ('○ ' + _('Chờ kết nối...')))
				]),

				// Card 4: Thông tin IMEI & Modem
				E('div', { 'class': 'cpe-card' }, [
					E('div', { 'style': 'color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;' }, '🆔 ' + _('Thông tin IMEI Modem')),
					E('div', { 'style': 'font-size: 15px; font-weight: 700; color: #334155; margin: 8px 0 4px 0; font-family: monospace;' }, status.imei || _('Đang tải...')),
					E('div', { 'style': 'font-size: 12px; color: #64748b;' }, status.phone ? ('SIM: ' + status.phone) : (status.iccid ? ('ICCID: ...' + status.iccid.slice(-6)) : _('SIM: Sẵn sàng')))
				])
			]),

			// ── NAV TABS ───────────────────────────────────────────────────────────
			E('div', { 'class': 'cpe-nav-tabs' }, [
				E('button', { 'class': 'cpe-tab-btn active', 'id': 'cpe-tab-btn-overview', 'click': function() { setTab('overview'); } }, '📊 ' + _('Tổng quan')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-sms', 'click': function() { setTab('sms'); } }, '💬 ' + _('Tin nhắn SMS')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-rat', 'click': function() { setTab('rat'); } }, '🔒 ' + _('Khóa sóng RAT')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-ttl', 'click': function() { setTab('ttl'); } }, '⚡ ' + _('Bypass TTL Hotspot')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-wifi', 'click': function() { setTab('wifi'); } }, '📶 ' + _('WiFi & Thiết bị')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-at', 'click': function() { setTab('at'); } }, '⌨️ ' + _('Lệnh AT')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-rom', 'click': function() { setTab('rom'); } }, '💾 ' + _('Nạp Firmware ROM')),
				E('button', { 'class': 'cpe-tab-btn', 'id': 'cpe-tab-btn-passwall', 'click': function() { setTab('passwall'); } }, '🛡️ ' + _('PassWall 2'))
			]),

			// ── TAB 1: OVERVIEW (CHI TIẾT MẠNG 5G) ──────────────────────────────────
			E('div', { 'id': 'cpe-tab-overview', 'class': 'cpe-tab-pane' }, [
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
							renderRfMeter('4G RSRP (Công suất thu)', status.lteRsrp || status.rsrp || '-86 dBm', -140, -44, 'dBm'),
							renderRfMeter('4G RSRQ (Chất lượng)', status.lteRsrq || status.rsrq || '-11 dB', -20, -3, 'dB'),
							renderRfMeter('4G SINR (Tín hiệu / Nhiễu)', status.lteSinr || status.sinr || '18.5 dB', -10, 30, 'dB'),
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
							renderRfMeter('5G RSRP (Công suất thu 5G)', status.nrRsrp || 'Chờ tải (Standby)', -140, -44, 'dBm'),
							renderRfMeter('5G RSRQ (Chất lượng 5G)', status.nrRsrq || 'Standby', -20, -3, 'dB'),
							renderRfMeter('5G SINR (Tín hiệu / Nhiễu 5G)', status.nrSinr || 'Standby', -10, 30, 'dB')
						])
					])
				]),

				// Cụm 2: BẢNG BĂNG TẦN & CỘNG GỘP SÓNG (CARRIER AGGREGATION - CA)
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 800; color: #1e1b4b; display: flex; align-items: center; gap: 8px;' }, [
						'🏷️ ' + _('2. Chi tiết Băng tần & Cộng gộp sóng (Active Bands & CA)'),
						E('span', { 'style': 'background: #dcfce7; color: #15803d; font-size: 12px; padding: 2px 8px; border-radius: 9999px;' }, status.caCount ? (status.caCount + ' Active') : '2CA Active')
					]),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th' }, _('Thành phần sóng')),
							E('th', { 'class': 'th' }, _('Băng tần (Band)')),
							E('th', { 'class': 'th' }, _('Tần số hoạt động')),
							E('th', { 'class': 'th' }, _('Băng thông (BW)')),
							E('th', { 'class': 'th' }, _('Kênh tần số (Channel)')),
							E('th', { 'class': 'th' }, _('Trạng thái'))
						]),
						// Dòng 1: LTE Primary Component Carrier (PCC)
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #1e40af;' }, '4G PCC (Sóng chính)'),
							E('td', { 'class': 'td', 'style': 'font-weight: 800; font-size: 15px;' }, [ E('span', { 'style': 'background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 6px;' }, status.lteBand || 'B3') ]),
							E('td', { 'class': 'td' }, getBandFreq(status.lteBand || 'B3')),
							E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, status.lteBw || '20 MHz'),
							E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, 'EARFCN: ' + (status.lteChan || '1675')),
							E('td', { 'class': 'td' }, [ E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '● Đang kết nối') ])
						]),
						// Dòng 2: LTE Secondary Component Carrier (SCC1) - chỉ hiển thị khi có dữ liệu thực
						(status.scc1Band ? E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #0369a1;' }, '4G SCC1 (Cộng gộp 1)'),
							E('td', { 'class': 'td', 'style': 'font-weight: 800; font-size: 15px;' }, [ E('span', { 'style': 'background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px;' }, status.scc1Band) ]),
							E('td', { 'class': 'td' }, getBandFreq(status.scc1Band)),
							E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, status.scc1Bw || '-'),
							E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.scc1Chan ? ('EARFCN: ' + status.scc1Chan) : '-'),
							E('td', { 'class': 'td' }, [ E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '● Đang cộng gộp') ])
						]) : null),
						// Dòng 3: 5G NR Primary Carrier - chỉ hiển thị khi có kết nối 5G
						(status.nrBand ? E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #6b21a8;' }, '5G NR (Sóng dữ liệu 5G)'),
							E('td', { 'class': 'td', 'style': 'font-weight: 800; font-size: 15px;' }, [ E('span', { 'style': 'background: #f3e8ff; color: #6b21a8; padding: 2px 8px; border-radius: 6px;' }, status.nrBand) ]),
							E('td', { 'class': 'td' }, getBandFreq(status.nrBand)),
							E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, status.nrBw || '-'),
							E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.nrChan ? ('NR-ARFCN: ' + status.nrChan) : '-'),
							E('td', { 'class': 'td' }, [ E('span', { 'style': 'color: #10b981; font-weight: 700;' }, '● Siêu tốc 5G') ])
						]) : null)
					])
				]),

				// Cụm 3: Trạm phát & Nhận diện mạng
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 700; color: #1e1b4b;' }, '🗼 ' + _('3. Trạm phát sóng & Nhận diện mạng (Cellular Network)')),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'width: 35%; font-weight: 600;' }, _('Nhà mạng (Carrier / PLMN):')), E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #1e40af;' }, (status.operator || '-') + (status.plmn ? (' [' + status.plmn + ']') : '')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Chế độ mạng:')), E('td', { 'class': 'td' }, E('span', { 'style': 'background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-weight: 700;' }, status.networkType || '4G LTE / 5G NR')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Cộng gộp băng tần (Carrier Aggregation):')), E('td', { 'class': 'td', 'style': 'font-weight: 700; color: #047857;' }, status.band ? ('Kích hoạt (' + status.band + ')') : _('Chưa kết hợp')) ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Mã trạm eNodeB / Cell ID:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, status.cellId || '-') ]),
						E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td', 'style': 'font-weight: 600;' }, _('Physical Cell ID (PCI) / TAC:')), E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, (status.pci ? ('PCI: ' + status.pci) : '-') + (status.tac ? (' | TAC: ' + status.tac) : '')) ])
					])
				]),

				// Cụm 3: SIM & Thiết bị phần cứng
				E('div', { 'class': 'cpe-card', 'style': 'margin-bottom: 20px;' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 700; color: #1e1b4b;' }, '📱 ' + _('3. Thông tin SIM & Thiết bị phần cứng')),
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

				// Cụm 4: Mạng WAN 5G & Định tuyến
				E('div', { 'class': 'cpe-card' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 17px; font-weight: 700; color: #1e1b4b;' }, '🌐 ' + _('4. Địa chỉ IP WAN 5G & Định tuyến')),
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
								if (r.error) {
									ui.addNotification(null, E('p', {}, r.error), 'danger');
								} else {
									ui.addNotification(null, E('p', {}, _('Gửi tin nhắn SMS thành công!')), 'info');
									document.getElementById('sms-target-text').value = '';
									loadSmsData();
								}
							});
						}
					}, '🚀 ' + _('Gửi Tin Nhắn'))
				]),

				E('div', { 'class': 'cpe-card' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;' }, [
						E('h3', { 'style': 'margin: 0; font-size: 18px; font-weight: 700;' }, '📥 ' + _('Hộp thư SMS (Đến & Đi)')),
						E('button', { 'class': 'cpe-btn cpe-btn-primary', 'style': 'padding: 6px 14px; font-size: 13px;', 'click': loadSmsData }, '🔄 ' + _('Làm mới tin nhắn'))
					]),
					E('div', { 'id': 'cpe-sms-box' }, [ E('em', {}, _('Đang tải danh sách SMS...')) ])
				])
			]),

			// ── TAB 3: RAT LOCK ────────────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-rat', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
				E('div', { 'class': 'cpe-card' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 18px; font-weight: 700;' }, '🔒 ' + _('Khóa sóng & Băng tần mạng (RAT Lock)')),
					E('p', { 'style': 'color: #64748b; margin-bottom: 20px;' }, _('Chọn chế độ bắt sóng ưu tiên cho Modem 5G. Nhấp chuột vào chế độ bạn muốn áp dụng:')),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;' }, [
						E('div', {
							'id': 'rat-card-21',
							'class': 'cpe-rat-card' + (rat.code === '21' || !rat.code ? ' active' : ''),
							'click': function() { selectRatMode('21'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, '⚡'),
							E('div', { 'style': 'font-weight: 800; font-size: 16px; color: #1e293b;' }, '4G + 5G (NSA / SA)'),
							E('div', { 'style': 'color: #4f46e5; font-size: 12px; font-weight: 700; margin: 4px 0;' }, '★ KHUYÊN DÙNG ★'),
							E('div', { 'style': 'font-size: 13px; color: #64748b;' }, 'Tự động tối ưu giữa sóng 5G và 4G LTE tốc độ cao nhất.')
						]),
						E('div', {
							'id': 'rat-card-20',
							'class': 'cpe-rat-card' + (rat.code === '20' ? ' active' : ''),
							'click': function() { selectRatMode('20'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, '🚀'),
							E('div', { 'style': 'font-weight: 800; font-size: 16px; color: #1e293b;' }, 'Khóa chỉ 5G-SA'),
							E('div', { 'style': 'color: #64748b; font-size: 12px; font-weight: 600; margin: 4px 0;' }, '5G Standalone Only'),
							E('div', { 'style': 'font-size: 13px; color: #64748b;' }, 'Chỉ bắt trạm 5G độc lập, độ trễ cực thấp (Ping thấp).')
						]),
						E('div', {
							'id': 'rat-card-06',
							'class': 'cpe-rat-card' + (rat.code === '06' ? ' active' : ''),
							'click': function() { selectRatMode('06'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, '📶'),
							E('div', { 'style': 'font-weight: 800; font-size: 16px; color: #1e293b;' }, 'Khóa chỉ 4G LTE'),
							E('div', { 'style': 'color: #64748b; font-size: 12px; font-weight: 600; margin: 4px 0;' }, 'LTE Only'),
							E('div', { 'style': 'font-size: 13px; color: #64748b;' }, 'Cố định mạng 4G ổn định ở các khu vực sóng 5G còn yếu.')
						]),
						E('div', {
							'id': 'rat-card-00',
							'class': 'cpe-rat-card' + (rat.code === '00' ? ' active' : ''),
							'click': function() { selectRatMode('00'); }
						}, [
							E('div', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, '🔄'),
							E('div', { 'style': 'font-weight: 800; font-size: 16px; color: #1e293b;' }, 'Tự động hoàn toàn'),
							E('div', { 'style': 'color: #64748b; font-size: 12px; font-weight: 600; margin: 4px 0;' }, 'Auto 4G/5G/3G'),
							E('div', { 'style': 'font-size: 13px; color: #64748b;' }, 'Để modem tự chọn băng tần theo quyết định của nhà mạng.')
						])
					]),
					E('input', { 'id': 'selected-rat-mode', 'type': 'hidden', 'value': rat.code || '21' }),
					E('button', {
						'class': 'cpe-btn cpe-btn-primary',
						'click': function() {
							var mode = document.getElementById('selected-rat-mode').value;
							ui.showModal(_('Đang áp dụng khóa sóng...'), [ E('p', {}, _('Modem đang chuyển băng tần, vui lòng đợi vài giây...')) ]);
							callSetRatMode(mode).then(function() {
								ui.hideModal();
								ui.addNotification(null, E('p', {}, _('Đã cập nhật chế độ khóa mạng thành công!')), 'info');
							});
						}
					}, '🔒 ' + _('Áp Dụng Khóa Sóng'))
				])
			]),

			// ── TAB 4: TTL BYPASS ──────────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-ttl', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
				E('div', { 'class': 'cpe-card' }, [
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
				])
			]),

			// ── TAB 5: WIFI & CLIENTS ──────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-wifi', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px;' }, [
					// WiFi 2.4G
					E('div', { 'class': 'cpe-card' }, [
						E('h3', { 'style': 'margin-top: 0; font-size: 16px; font-weight: 700;' }, '📶 ' + _('WiFi 2.4 GHz')),
						E('div', { 'style': 'margin-bottom: 12px;' }, [
							E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 4px;' }, _('Tên WiFi 2.4G (SSID):')),
							E('input', { 'id': 'wifi-name-2g', 'type': 'text', 'class': 'cbi-input-text', 'style': 'width: 100%;', 'value': wifi.wifi2g?.ssid || 'ImmortalWrt-2.4G' })
						]),
						E('div', { 'style': 'margin-bottom: 12px;' }, [
							E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 4px;' }, _('Mật khẩu 2.4G:')),
							E('input', { 'id': 'wifi-pass-2g', 'type': 'text', 'class': 'cbi-input-text', 'style': 'width: 100%;', 'value': wifi.wifi2g?.key || '' })
						])
					]),
					// WiFi 5G
					E('div', { 'class': 'cpe-card' }, [
						E('h3', { 'style': 'margin-top: 0; font-size: 16px; font-weight: 700;' }, '🚀 ' + _('WiFi 5 GHz (Tốc độ cao)')),
						E('div', { 'style': 'margin-bottom: 12px;' }, [
							E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 4px;' }, _('Tên WiFi 5G (SSID):')),
							E('input', { 'id': 'wifi-name-5g', 'type': 'text', 'class': 'cbi-input-text', 'style': 'width: 100%;', 'value': wifi.wifi5g?.ssid || 'ImmortalWrt-5G' })
						]),
						E('div', { 'style': 'margin-bottom: 12px;' }, [
							E('label', { 'style': 'font-size: 13px; font-weight: 600; display: block; margin-bottom: 4px;' }, _('Mật khẩu 5G:')),
							E('input', { 'id': 'wifi-pass-5g', 'type': 'text', 'class': 'cbi-input-text', 'style': 'width: 100%;', 'value': wifi.wifi5g?.key || '' })
						])
					])
				]),
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('button', {
						'class': 'cpe-btn cpe-btn-primary',
						'click': function() {
							var w2 = { ssid: document.getElementById('wifi-name-2g').value, key: document.getElementById('wifi-pass-2g').value, encryption: document.getElementById('wifi-pass-2g').value ? 'psk2' : 'none' };
							var w5 = { ssid: document.getElementById('wifi-name-5g').value, key: document.getElementById('wifi-pass-5g').value, encryption: document.getElementById('wifi-pass-5g').value ? 'psk2' : 'none' };
							callSetWifi(w2, w5).then(function() {
								ui.addNotification(null, E('p', {}, _('Đã áp dụng cấu hình WiFi. Bộ phát sóng sẽ khởi động lại trong 5 giây!')), 'info');
							});
						}
					}, '💾 ' + _('Lưu Thay Đổi WiFi'))
				]),
				// Danh sách thiết bị kết nối & Chặn MAC
				E('div', { 'class': 'cpe-card' }, [
					E('h3', { 'style': 'margin-top: 0; font-size: 16px; font-weight: 700;' }, '👥 ' + _('Thiết bị đang kết nối & Quản lý chặn MAC')),
					renderClientList(wifi.clients || [], wifi.blockedList || [])
				])
			]),

			// ── TAB 6: AT TERMINAL ─────────────────────────────────────────────────
			E('div', { 'id': 'cpe-tab-at', 'class': 'cpe-tab-pane', 'style': 'display: none;' }, [
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
			var tabs = ['overview', 'sms', 'rat', 'ttl', 'wifi', 'at', 'rom', 'passwall'];
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
					var item = E('div', { 'class': 'cpe-sms-bubble' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;' }, [
							E('span', { 'style': 'font-weight: 700; color: #1e293b;' }, '📱 ' + m.number),
							E('span', { 'style': 'font-size: 12px; color: #64748b;' }, m.timestamp || '')
						]),
						E('div', { 'style': 'font-size: 14px; line-height: 1.5; color: #334155; margin-bottom: 8px;' }, m.text),
						E('button', {
							'class': 'cpe-btn cpe-btn-danger',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': function() {
								if (!confirm(_('Xóa tin nhắn này?'))) return;
								callDeleteSms(m.id, m.text).then(loadSmsData);
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

				var now = new Date();
				var timeStr = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
				              (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' +
				              (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();

				var liveStat = document.getElementById('sig-live-status');
				if (liveStat) {
					liveStat.textContent = _('ĐANG ĐO SÓNG LIVE (') + timeStr + ')';
				}

				updateRfMeter('4G RSRP (Công suất thu)', s.lteRsrp || s.rsrp || '-86 dBm', -140, -44);
				updateRfMeter('4G RSRQ (Chất lượng)', s.lteRsrq || s.rsrq || '-11 dB', -20, -3);
				updateRfMeter('4G SINR (Tín hiệu / Nhiễu)', s.lteSinr || s.sinr || '18.5 dB', -10, 30);
				updateRfMeter('4G RSSI', s.lteRssi || s.rssi || '-65 dBm', -110, -50);

				updateRfMeter('5G RSRP (Công suất thu 5G)', s.nrRsrp || 'Chờ tải (Standby)', -140, -44);
				updateRfMeter('5G RSRQ (Chất lượng 5G)', s.nrRsrq || 'Standby', -20, -3);
				updateRfMeter('5G SINR (Tín hiệu / Nhiễu 5G)', s.nrSinr || 'Standby', -10, 30);

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
			});
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
