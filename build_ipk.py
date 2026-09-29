#!/usr/bin/env python3
import tarfile
import os
import shutil

workdir = 'ipk_tmp'
if os.path.exists(workdir):
    shutil.rmtree(workdir)

os.makedirs(workdir, exist_ok=True)
os.makedirs(f'{workdir}/control', exist_ok=True)

with open(f'{workdir}/debian-binary', 'w') as f:
    f.write('2.0\n')

control_content = '''Package: luci-app-dashboard5g
Version: 1.0.0-1
Depends: luci-base, rpcd, curl
Section: luci
Architecture: all
Maintainer: NTChien97 <chiennt97@gmail.com>
Description: LuCI Dashboard 5G CPE (ZX7981PG)
Source: https://github.com/NTChien97/luci-app-dashboard5g
'''

with open(f'{workdir}/control/control', 'w') as f:
    f.write(control_content)

postinst_content = '''#!/bin/sh
chmod +x /usr/libexec/rpcd/luci.5g 2>/dev/null
chmod +x /usr/share/5g/*.sh 2>/dev/null
/etc/init.d/rpcd restart 2>/dev/null
rm -rf /tmp/luci-indexcache* /tmp/luci-modulecache
exit 0
'''
with open(f'{workdir}/control/postinst', 'w') as f:
    f.write(postinst_content)

prerm_content = '''#!/bin/sh
rm -rf /tmp/luci-indexcache* /tmp/luci-modulecache
exit 0
'''
with open(f'{workdir}/control/prerm', 'w') as f:
    f.write(prerm_content)

# 1. create control.tar.gz with GNU_FORMAT
with tarfile.open(f'{workdir}/control.tar.gz', 'w:gz', format=tarfile.GNU_FORMAT) as tar:
    for name in ['control', 'postinst', 'prerm']:
        path = f'{workdir}/control/{name}'
        ti = tar.gettarinfo(path, arcname=f'./{name}')
        if name in ['postinst', 'prerm']:
            ti.mode = 0o755
        else:
            ti.mode = 0o644
        ti.uid = 0
        ti.gid = 0
        ti.uname = 'root'
        ti.gname = 'root'
        with open(path, 'rb') as f:
            tar.addfile(ti, f)

# 2. create data.tar.gz with GNU_FORMAT
with tarfile.open(f'{workdir}/data.tar.gz', 'w:gz', format=tarfile.GNU_FORMAT) as tar:
    for root_dir, dirs, files in os.walk('root'):
        for d in sorted(dirs):
            dirpath = os.path.join(root_dir, d)
            reldir = os.path.relpath(dirpath, 'root')
            ti = tar.gettarinfo(dirpath, arcname=f'./{reldir}')
            ti.mode = 0o755
            ti.uid = 0
            ti.gid = 0
            ti.uname = 'root'
            ti.gname = 'root'
            tar.addfile(ti)
        for f in sorted(files):
            filepath = os.path.join(root_dir, f)
            relfile = os.path.relpath(filepath, 'root')
            ti = tar.gettarinfo(filepath, arcname=f'./{relfile}')
            if f.endswith('.sh') or f == 'luci.5g' or f.endswith('.uc'):
                ti.mode = 0o755
            else:
                ti.mode = 0o644
            ti.uid = 0
            ti.gid = 0
            ti.uname = 'root'
            ti.gname = 'root'
            with open(filepath, 'rb') as fp:
                tar.addfile(ti, fp)

# 3. pack into ipk with GNU_FORMAT
with tarfile.open('luci-app-dashboard5g_1.0.0-1_all.ipk', 'w:gz', format=tarfile.GNU_FORMAT) as tar:
    for name in ['debian-binary', 'data.tar.gz', 'control.tar.gz']:
        path = f'{workdir}/{name}'
        ti = tar.gettarinfo(path, arcname=f'./{name}')
        ti.uid = 0
        ti.gid = 0
        ti.uname = 'root'
        ti.gname = 'root'
        with open(path, 'rb') as f:
            tar.addfile(ti, f)

shutil.rmtree(workdir)
print('Successfully built luci-app-dashboard5g_1.0.0-1_all.ipk!')
