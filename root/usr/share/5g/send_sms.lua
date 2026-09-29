local nixio = require "nixio"

local port = arg[1] or "/dev/ttyUSB0"
local num = arg[2] or ""
local txt = ""

-- Read message text from payload file to preserve spaces, quotes, and newlines
local txt_file = "/tmp/sms_send_txt.tmp"
local f_txt = io.open(txt_file, "r")
if f_txt then
    txt = f_txt:read("*a")
    f_txt:close()
    os.remove(txt_file)
end
if (not txt or txt == "") and arg[3] then
    txt = arg[3]
end

if num == "" or txt == "" then
    print("{\"error\":\"Vui lòng nhập đầy đủ số điện thoại và nội dung!\"}")
    os.exit(1)
end

-- System-wide mutex lock on AT port
local lk = nixio.open("/var/lock/at_port.lock", "w+", 666)
if lk then lk:lock("lock") end

local f = nixio.open(port, "r+")
if not f then
    if lk then lk:lock("ulock"); lk:close() end
    print("{\"error\":\"Không thể mở cổng modem: " .. port .. "\"}")
    os.exit(1)
end
f:setblocking(false)

local function sleep_ms(ms)
    nixio.nanosleep(0, ms * 1000000)
end

local function drain()
    local quiet = 0
    while quiet < 3 do
        local c = f:read(1024)
        if c and #c > 0 then quiet = 0 else quiet = quiet + 1; sleep_ms(15) end
    end
end

local function send_cmd(cmd, pat, timeout)
    drain()
    f:write(cmd .. "\r\n")
    local resp = ""
    local start = nixio.gettimeofday()
    timeout = timeout or 1.5
    while (nixio.gettimeofday() - start) < timeout do
        local chunk = f:read(1024)
        if chunk and #chunk > 0 then
            resp = resp .. chunk
            if resp:find(pat) or resp:find("ERROR") then break end
        else
            sleep_ms(20)
        end
    end
    return resp
end

-- 1. Initialize SMS parameters
send_cmd("AT", "OK", 1)
send_cmd("AT+CMEE=2", "OK", 1)
send_cmd("AT+CMGF=1", "OK", 1)
send_cmd("AT+CSCS=\"GSM\"", "OK", 1)
send_cmd("AT+CSMP=17,167,0,0", "OK", 1)

-- 2. Initiate SMS sending
drain()
f:write(string.format("AT+CMGS=\"%s\"\r\n", num))
local prompt = ""
local start = nixio.gettimeofday()
while (nixio.gettimeofday() - start) < 3.0 do
    local chunk = f:read(1024)
    if chunk and #chunk > 0 then
        prompt = prompt .. chunk
        if prompt:find(">") or prompt:find("ERROR") then break end
    else
        sleep_ms(20)
    end
end

if not prompt:find(">") then
    f:write(string.char(27)) -- send ESC to cancel prompt
    f:close()
    if lk then lk:lock("ulock"); lk:close() end
    local err = prompt:match("%+CMS ERROR:%s*([^\r\n]+)") or prompt:match("ERROR") or "Modem không phản hồi ký tự nhập tin nhắn (>)"
    print(string.format("{\"error\":\"Lỗi khởi tạo gửi SMS: %s\"}", err))
    os.exit(1)
end

-- 3. Write message text terminated with Ctrl+Z (ASCII 26)
f:write(txt .. string.char(26))
local sendResp = ""
start = nixio.gettimeofday()
while (nixio.gettimeofday() - start) < 12.0 do
    local chunk = f:read(1024)
    if chunk and #chunk > 0 then
        sendResp = sendResp .. chunk
        if sendResp:find("%+CMGS:") or sendResp:find("OK") or sendResp:find("ERROR") then break end
    else
        sleep_ms(50)
    end
end

-- Ensure modem is not left waiting in prompt
if not (sendResp:find("%+CMGS:") or sendResp:find("OK") or sendResp:find("ERROR")) then
    f:write(string.char(27))
    sleep_ms(50)
end

f:close()
if lk then lk:lock("ulock"); lk:close() end

local cmgs_id = sendResp:match("%+CMGS:%s*(%d+)")
if cmgs_id or (sendResp:find("OK") and not sendResp:find("ERROR")) then
    print(string.format("{\"result\":true,\"id\":\"%s\",\"message\":\"Gửi tin nhắn thành công!\"}", cmgs_id or "1"))
else
    local cms_err = sendResp:match("%+CMS ERROR:%s*([^\r\n]+)")
    local cme_err = sendResp:match("%+CME ERROR:%s*([^\r\n]+)")
    local err = cms_err or cme_err or "Hết thời gian chờ phản hồi từ nhà mạng"
    if err == "500" or err == "unknown error" then
        err = "Nhà mạng từ chối (Mã 500: Vui lòng kiểm tra tài khoản chính của SIM hoặc SIM có được phép gửi tin nhắn hay không)"
    elseif err == "300" then
        err = "Lỗi định dạng SMS (Mã 300: Lỗi thiết lập tham số SMS trên SIM)"
    elseif err == "304" then
        err = "Lỗi định dạng số nhận (Mã 304: Số điện thoại không hợp lệ)"
    end
    print(string.format("{\"error\":\"%s\"}", err))
    os.exit(1)
end
