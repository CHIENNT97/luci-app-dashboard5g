#
# Copyright (C) 2024 NTChien97
# SPDX-License-Identifier: GPL-2.0-or-later
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-dashboard5g
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=NTChien97 <chiennt97@gmail.com>
PKG_LICENSE:=GPL-2.0-or-later

LUCI_TITLE:=Dashboard BY NTC - 5G CPE Management Suite
LUCI_DESCRIPTION:=Dashboard BY NTC - Bo quan tri modem 5G NR toan dien cho thiet bi OpenWrt / ImmortalWrt (ZX7981PG, RAX3000M, Filogic 820). \
	Tinh nang: Giam sat song 4G/5G CA realtime, Hop thu SMS, Terminal lenh AT, Bypass TTL Hotspot, \
	WiFi Settings, Device Blocking, ROM Update, RAT Lock, PassWall 2 Installer (Live Console).

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=+luci-base +rpcd +curl
  PKGARCH:=all
endef

define Package/$(PKG_NAME)/description
  $(LUCI_DESCRIPTION)
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	# ── Ucode backend scripts ──────────────────────────────────────────────
	$(INSTALL_DIR) $(1)/usr/share/5g
	$(INSTALL_DATA) ./root/usr/share/5g/send_at_direct.uc   $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/sms_list.uc         $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/send_sms.uc         $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/delete_sms.uc       $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/set_ttl.uc          $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/get_wifi.uc         $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/wifi_config.uc      $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/set_wifi.uc         $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/block_device.uc     $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/rom_manager.uc      $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/passwall_manager.uc $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/rat_manager.uc      $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/gdrive_all.uc       $(1)/usr/share/5g/
	$(INSTALL_DATA) ./root/usr/share/5g/gdrive_debug.uc     $(1)/usr/share/5g/
	$(INSTALL_BIN)  ./root/usr/share/5g/flash_rom.sh        $(1)/usr/share/5g/
	$(INSTALL_BIN)  ./root/usr/share/5g/install_passwall.sh $(1)/usr/share/5g/

	# ── RPCD ubus handler ─────────────────────────────────────────────────
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.5g $(1)/usr/libexec/rpcd/luci.5g

	# ── LuCI menu ─────────────────────────────────────────────────────────
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/menu-dashboard5g.json $(1)/usr/share/luci/menu.d/

	# ── RPCD ACL ──────────────────────────────────────────────────────────
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/acl-dashboard5g.json $(1)/usr/share/rpcd/acl.d/

	# ── LuCI view (HTM) ───────────────────────────────────────────────────
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/status
	$(INSTALL_DATA) ./root/www/luci-static/resources/view/status/dashboard5g.js $(1)/www/luci-static/resources/view/status/

	# ── Default data files ────────────────────────────────────────────────
	$(INSTALL_DIR) $(1)/etc
	$(INSTALL_DATA) ./root/etc/5g_sms_db.json $(1)/etc/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
/etc/init.d/rpcd restart 2>/dev/null
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
exit 0
endef

define Package/$(PKG_NAME)/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
exit 0
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
