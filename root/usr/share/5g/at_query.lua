local nixio = require "nixio"

local port = arg[1] or "/dev/ttyUSB0"
local cmd = arg[2] or "ATI"
local timeout = tonumber(arg[3]) or 1.5

-- Mutex lock to prevent serial port collisions between queries, SMS, and signal polling
local lk = nixio.open("/var/lock/at_port.lock", "w+", 666)
if lk then lk:lock("lock") end

local f = nixio.open(port, "r+")
if not f then
    if lk then lk:lock("ulock"); lk:close() end
    os.exit(1)
end

f:setblocking(false)

-- 1. Drain any lingering bytes from port until quiet
local quiet = 0
while quiet < 2 do
    local chunk = f:read(1024)
    if chunk and #chunk > 0 then
        quiet = 0
    else
        quiet = quiet + 1
        nixio.nanosleep(0, 15000000) -- 15ms
    end
end

-- 2. Send full AT command string
local to_send = cmd .. "\r\n"
local sent = 0
while sent < #to_send do
    local n = f:write(to_send:sub(sent + 1))
    if n and n > 0 then
        sent = sent + n
    else
        nixio.nanosleep(0, 5000000)
    end
end

-- 3. Read response until OK or ERROR
local resp = ""
local start = nixio.gettimeofday()
while (nixio.gettimeofday() - start) < timeout do
    local chunk = f:read(1024)
    if chunk and #chunk > 0 then
        resp = resp .. chunk
        if resp:find("\r\nOK\r?\n") or resp:find("\nOK\r?\n") or resp:find("\r\nERROR\r?\n") or resp:find("\nERROR\r?\n") then
            break
        end
    else
        nixio.nanosleep(0, 20000000) -- 20ms sleep
    end
end

f:close()
if lk then lk:lock("ulock"); lk:close() end

io.write(resp)
