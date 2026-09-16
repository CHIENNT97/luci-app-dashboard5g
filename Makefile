#
# Copyright (C) 2024-2026 NTChien97
# Dashboard BY NTC - 5G CPE Management Suite
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-dashboard5g
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=NTChien97 <chiennt97@gmail.com>
PKG_LICENSE:=GPL-2.0-or-later

LUCI_TITLE:=Dashboard BY NTC - 5G CPE Management Suite
LUCI_DESCRIPTION:=Dashboard BY NTC - Bo quan tri modem 5G NR toan dien cho OpenWrt / ImmortalWrt
LUCI_DEPENDS:=+luci-base +rpcd +curl
LUCI_PKGARCH:=all

# Build seamlessly with standard OpenWrt feeds/luci if available
ifneq ($(wildcard $(TOPDIR)/feeds/luci/luci.mk),)
  include $(TOPDIR)/feeds/luci/luci.mk
else
  include $(INCLUDE_DIR)/package.mk

  define Package/$(PKG_NAME)
    SECTION:=luci
    CATEGORY:=LuCI
    SUBMENU:=3. Applications
    TITLE:=$(LUCI_TITLE)
    DEPENDS:=$(LUCI_DEPENDS)
    PKGARCH:=all
  endef

  define Package/$(PKG_NAME)/description
    $(LUCI_DESCRIPTION)
  endef

  define Build/Prepare
  endef

  define Build/Configure
  endef

  define Build/Compile
  endef

  define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/share/5g
	$(CP) ./root/usr/share/5g/* $(1)/usr/share/5g/
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.5g $(1)/usr/libexec/rpcd/luci.5g
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/* $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/* $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/status
	$(INSTALL_DATA) ./root/www/luci-static/resources/view/status/* $(1)/www/luci-static/resources/view/status/
	$(INSTALL_DIR) $(1)/etc
	$(INSTALL_DATA) ./root/etc/* $(1)/etc/
	chmod +x $(1)/usr/share/5g/*.sh 2>/dev/null || true
	chmod +x $(1)/usr/libexec/rpcd/luci.5g 2>/dev/null || true
  endef

  define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
chmod +x /usr/libexec/rpcd/luci.5g 2>/dev/null
chmod +x /usr/share/5g/*.sh 2>/dev/null
/etc/init.d/rpcd restart 2>/dev/null
rm -rf /tmp/luci-indexcache* /tmp/luci-modulecache
exit 0
  endef

  define Package/$(PKG_NAME)/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
rm -rf /tmp/luci-indexcache* /tmp/luci-modulecache
exit 0
  endef

  $(eval $(call BuildPackage,$(PKG_NAME)))
endif

