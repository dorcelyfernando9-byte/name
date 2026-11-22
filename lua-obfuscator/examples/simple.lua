-- Simple Lua script to test obfuscation
local function greet(name)
    print("Hello, " .. name .. "!")
end

local function fibonacci(n)
    if n <= 1 then
        return n
    end
    return fibonacci(n - 1) + fibonacci(n - 2)
end

greet("World")
print("Fibonacci(10) = " .. fibonacci(10))
