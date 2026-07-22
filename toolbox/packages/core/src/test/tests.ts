import { BindableEvent, RemoteEvent, EventBus } from "../events";
import { MemoryDriver } from "../storage/memory/MemoryDriver";
import { CryptoEngine } from "../storage/nsql/crypto";
import { ConfigManager } from "../config/ConfigManager";
import { SyntaxParser } from "../config/SyntaxParser";
import { TaskScheduler } from "../tasks/TaskScheduler";
import { Validator } from "../validation/Validator";
import { TemplateEngine } from "../templates/TemplateEngine";
import { pipe } from "../streams/StreamPipeline";
import { ObfuscatorEngine, Obfuscator } from "../obfuscator/ObfuscatorEngine";
import { CryptoEngineAdvanced } from "../crypto/CryptoEngineAdvanced";
import { ColorCycle, Marquee, SlideShow, animations, Spinner, ConsoleAnimation } from "../animations/Animations";

async function runTests() {
  const passed: string[] = [];
  const failed: string[] = [];
  const testQueue: Array<{ name: string; fn: () => void | Promise<void> }> = [];

  function test(name: string, fn: () => void | Promise<void>) {
    testQueue.push({ name, fn });
  }

  // Events
  test("BindableEvent Connect/Fire", () => {
    const event = new BindableEvent<number>();
    let received = 0;
    event.Connect((data) => { received = data; });
    event.Fire(42);
    if (received !== 42) throw new Error(`Expected 42, got ${received}`);
  });

  test("BindableEvent Wait", async () => {
    const event = new BindableEvent<string>();
    setTimeout(() => event.Fire("hello"), 10);
    const result = await event.Wait(100);
    if (result !== "hello") throw new Error(`Expected hello, got ${result}`);
  });

  test("BindableEvent ConnectOnce", () => {
    const event = new BindableEvent();
    let count = 0;
    event.ConnectOnce(() => { count++; });
    event.Fire(null);
    event.Fire(null);
    if (count !== 1) throw new Error(`Expected 1, got ${count}`);
  });

  test("BindableEvent Disconnect", () => {
    const event = new BindableEvent();
    let count = 0;
    const id = event.Connect(() => { count++; });
    event.Disconnect(id);
    event.Fire(null);
    if (count !== 0) throw new Error(`Expected 0, got ${count}`);
  });

  test("BindableEvent with filter", () => {
    const event = new BindableEvent<any>();
    let received: any = 0;
    const id = event.Connect((data) => { received = data; });
    event.SetFilter(id, (data) => data > 10);
    event.Fire(5);
    if (received !== 0) throw new Error(`Expected 0, got ${received}`);
    event.Fire(15);
    if (received !== 15) throw new Error(`Expected 15, got ${received}`);
  });

  test("BindableEvent with middleware", () => {
    const event = new BindableEvent<number>();
    let received = 0;
    event.Connect((data) => { received = data; });
    event.UseMiddleware((data, next) => { next(data * 2); });
    event.Fire(21);
    if (received !== 42) throw new Error(`Expected 42, got ${received}`);
  });

  test("EventBus on/emit", () => {
    let received: any = null;
    EventBus.on("test:event", (data) => { received = data; });
    EventBus.emit("test:event", { foo: "bar" });
    if (!received || received.foo !== "bar") throw new Error("EventBus emit failed");
    EventBus.clear("test:event");
  });

  test("EventBus once", async () => {
    let count = 0;
    EventBus.once("test:once", () => { count++; });
    EventBus.emit("test:once");
    EventBus.emit("test:once");
    if (count !== 1) throw new Error(`Expected 1, got ${count}`);
    EventBus.clear("test:once");
  });

  test("EventBus wait", async () => {
    setTimeout(() => EventBus.emit("test:wait", "data"), 10);
    const result = await EventBus.wait("test:wait", 100);
    if (result !== "data") throw new Error(`Expected "data", got ${result}`);
    EventBus.clear("test:wait");
  });

  test("EventBus list", () => {
    EventBus.on("test:list1", () => {});
    EventBus.on("test:list2", () => {});
    const events = EventBus.list();
    if (!events.includes("test:list1") || !events.includes("test:list2")) throw new Error("List failed");
    EventBus.clear();
  });

  // Storage
  test("MemoryDriver set/get", async () => {
    const driver = new MemoryDriver();
    await driver.set("key1", "value1");
    const val = await driver.get("key1");
    if (val !== "value1") throw new Error(`Expected value1, got ${val}`);
    await driver.close();
  });

  test("MemoryDriver set/get object", async () => {
    const driver = new MemoryDriver();
    const obj = { name: "test", count: 42 };
    await driver.set("obj", obj);
    const val = await driver.get("obj");
    if (val.name !== "test" || val.count !== 42) throw new Error("Object storage failed");
    await driver.close();
  });

  test("MemoryDriver delete", async () => {
    const driver = new MemoryDriver();
    await driver.set("del", "value");
    const deleted = await driver.delete("del");
    if (!deleted) throw new Error("Delete returned false");
    const val = await driver.get("del");
    if (val !== null) throw new Error("Value still exists after delete");
    await driver.close();
  });

  test("MemoryDriver has", async () => {
    const driver = new MemoryDriver();
    await driver.set("has", "value");
    const exists = await driver.has("has");
    if (!exists) throw new Error("has returned false for existing key");
    const notExists = await driver.has("nope");
    if (notExists) throw new Error("has returned true for non-existing key");
    await driver.close();
  });

  test("MemoryDriver TTL", async () => {
    const driver = new MemoryDriver();
    await driver.set("ttl", "value", { ttl: 1 });
    let val = await driver.get("ttl");
    if (val !== "value") throw new Error("TTL value not set");
    await new Promise(r => setTimeout(r, 1100));
    val = await driver.get("ttl");
    if (val !== null) throw new Error("TTL value not expired");
    await driver.close();
  });

  test("MemoryDriver listKeys", async () => {
    const driver = new MemoryDriver();
    await driver.set("a:1", "v1");
    await driver.set("a:2", "v2");
    await driver.set("b:1", "v3");
    const keys = await driver.listKeys("a:");
    if (keys.length !== 2) throw new Error(`Expected 2 keys, got ${keys.length}`);
    await driver.close();
  });

  // Crypto
  test("CryptoEngine hash", () => {
    const crypto = new CryptoEngine();
    const hash = crypto.hash("test");
    if (hash.length !== 128) throw new Error(`SHA-512 hash should be 128 chars, got ${hash.length}`);
  });

  test("CryptoEngine encrypt/decrypt", () => {
    const crypto = new CryptoEngine("test-key");
    const encrypted = crypto.encrypt("secret data");
    const decrypted = crypto.decrypt(encrypted);
    if (decrypted !== "secret data") throw new Error("Encrypt/decrypt roundtrip failed");
  });

  test("CryptoEngine obfuscate/deobfuscate", () => {
    const crypto = new CryptoEngine();
    const data = "test-data-" + Date.now();
    const obfuscated = crypto.obfuscate(data);
    const deobfuscated = crypto.deobfuscate(obfuscated);
    if (deobfuscated !== data) throw new Error(`Obfuscate/deobfuscate roundtrip failed: got ${deobfuscated}, expected ${data}`);
  });

  // Config
  test("ConfigManager set/get", () => {
    const config = new ConfigManager({ basePath: "/tmp/toolbox_test_config", autoSave: false });
    config.set("theme", "dark");
    config.set("app.name", "MyApp");
    const theme = config.get("theme");
    const name = config.get("app.name");
    if (theme !== "dark" || name !== "MyApp") throw new Error("Config set/get failed");
  });

  test("ConfigManager list", () => {
    const config = new ConfigManager({ basePath: "/tmp/toolbox_test_config", autoSave: false });
    config.set("key1", "value1");
    config.set("key2", "value2");
    const all = config.list();
    if (all.key1 !== "value1" || all.key2 !== "value2") throw new Error("Config list failed");
  });

  test("ConfigManager delete", () => {
    const config = new ConfigManager({ basePath: "/tmp/toolbox_test_config", autoSave: false });
    config.set("del", "value");
    config.delete("del");
    if (config.get("del") !== null) throw new Error("Config delete failed");
  });

  test("ConfigManager reset", () => {
    const config = new ConfigManager({ basePath: "/tmp/toolbox_test_config", autoSave: false });
    config.set("reset", "value");
    config.reset("reset");
    if (config.get("reset") !== null) throw new Error("Config reset failed");
  });

  // SyntaxParser
  test("SyntaxParser parse string", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse('set name "hello"');
    if (ast.length !== 1) throw new Error("Expected 1 statement");
    if (ast[0].type !== "SetStatement") throw new Error("Expected SetStatement");
    if (ast[0].name !== "name") throw new Error(`Expected name, got ${ast[0].name}`);
  });

  test("SyntaxParser parse number", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse("set count 42");
    if (ast[0].value.type !== "NumberLiteral") throw new Error("Expected NumberLiteral");
    if (ast[0].value.value !== 42) throw new Error(`Expected 42, got ${ast[0].value.value}`);
  });

  test("SyntaxParser parse log", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse('log "hello world"');
    if (ast[0].type !== "LogStatement") throw new Error("Expected LogStatement");
    if (ast[0].level !== "info") throw new Error("Expected info level");
  });

  test("SyntaxParser parse if statement", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse('if x == 5 { log "yes" }');
    if (ast[0].type !== "IfStatement") throw new Error("Expected IfStatement");
  });

  test("SyntaxParser parse for loop", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse("for item in items { log item }");
    if (ast[0].type !== "ForStatement") throw new Error("Expected ForStatement");
    if (ast[0].variable !== "item") throw new Error(`Expected item, got ${ast[0].variable}`);
  });

  test("SyntaxParser parse function", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse("function greet(name) { log name }");
    if (ast[0].type !== "FunctionStatement") throw new Error("Expected FunctionStatement");
    if (ast[0].params[0] !== "name") throw new Error("Expected name param");
  });

  test("SyntaxParser parse object", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse('{name: "test", count: 42}');
    if (ast[0].type !== "ExpressionStatement" || ast[0].expression.type !== "ObjectLiteral") throw new Error("Expected ObjectLiteral");
    if (ast[0].expression.properties.length !== 2) throw new Error("Expected 2 properties");
  });

  test("SyntaxParser parse array", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse("[1, 2, 3]");
    if (ast[0].type !== "ExpressionStatement" || ast[0].expression.type !== "ArrayLiteral") throw new Error("Expected ArrayLiteral");
    if (ast[0].expression.elements.length !== 3) throw new Error("Expected 3 elements");
  });

  test("SyntaxParser toolbox command", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse('storage set "key" "value"');
    if (ast[0].type !== "ToolboxCommand") throw new Error("Expected ToolboxCommand");
    if (ast[0].command !== "storage") throw new Error("Expected storage command");
  });

  test("SyntaxParser toolbox command with block", () => {
    const parser = new SyntaxParser();
    const ast = parser.parse('event on startup -> { log "started" }');
    if (ast[0].type !== "ToolboxCommand") throw new Error("Expected ToolboxCommand");
    if (ast[0].command !== "event") throw new Error("Expected event command");
    if (!ast[0].block) throw new Error("Expected block");
  });

  // Tasks
  test("TaskScheduler delayed task", async () => {
    const scheduler = new TaskScheduler();
    let executed = false;
    scheduler.delayed("1ms", () => { executed = true; });
    await new Promise(r => setTimeout(r, 10));
    if (!executed) throw new Error("Delayed task not executed");
    scheduler.stopAll();
  });

  test("TaskScheduler cancel", () => {
    const scheduler = new TaskScheduler();
    let executed = false;
    const id = scheduler.delayed("10ms", () => { executed = true; });
    scheduler.cancel(id);
    scheduler.stopAll();
    if (scheduler.getStatus(id)) throw new Error("Task should be removed after cancel");
  });

  test("TaskScheduler list", () => {
    const scheduler = new TaskScheduler();
    scheduler.delayed("10ms", () => {}, "task1");
    scheduler.delayed("20ms", () => {}, "task2");
    const tasks = scheduler.list();
    if (tasks.length !== 2) throw new Error(`Expected 2 tasks, got ${tasks.length}`);
    scheduler.stopAll();
  });

  // Validation
  test("Validator email", () => {
    if (!Validator.email("user@example.com")) throw new Error("Valid email failed");
    if (Validator.email("invalid")) throw new Error("Invalid email passed");
  });

  test("Validator url", () => {
    if (!Validator.url("https://example.com")) throw new Error("Valid URL failed");
    if (Validator.url("not-a-url")) throw new Error("Invalid URL passed");
  });

  test("Validator schema", () => {
    const result = Validator.schema(
      { name: "string", age: "number" },
      { name: "John", age: 25 }
    );
    if (!result.valid) throw new Error("Valid schema failed");
  });

  test("Validator schema with errors", () => {
    const result = Validator.schema(
      { name: "string", email: "email" },
      { name: 123, email: "invalid" }
    );
    if (result.valid) throw new Error("Invalid schema should fail");
    if (result.errors.length !== 2) throw new Error(`Expected 2 errors, got ${result.errors.length}`);
  });

  // Templates
  test("TemplateEngine simple render", () => {
    const engine = new TemplateEngine();
    const result = engine.render("Hello {{name}}!", { name: "World" });
    if (result !== "Hello World!") throw new Error(`Expected "Hello World!", got "${result}"`);
  });

  test("TemplateEngine nested path", () => {
    const engine = new TemplateEngine();
    const result = engine.render("{{user.name}} is {{user.age}}", {
      user: { name: "John", age: 25 }
    });
    if (result !== "John is 25") throw new Error(`Expected "John is 25", got "${result}"`);
  });

  test("TemplateEngine filters", () => {
    const engine = new TemplateEngine();
    const result = engine.render("{{name|upper}}", { name: "john" });
    if (result !== "JOHN") throw new Error(`Expected "JOHN", got "${result}"`);
  });

  test("TemplateEngine define/renderNamed", () => {
    const engine = new TemplateEngine();
    engine.define("greeting", "Hello {{name}}!");
    const result = engine.renderNamed("greeting", { name: "World" });
    if (result !== "Hello World!") throw new Error(`Expected "Hello World!", got "${result}"`);
  });

  // Streams
  test("pipe basic map", async () => {
    const result = await pipe([1, 2, 3]).map(x => x * 2).toArray();
    if (JSON.stringify(result) !== "[2,4,6]") throw new Error(`Expected [2,4,6], got ${JSON.stringify(result)}`);
  });

  test("pipe filter", async () => {
    const result = await pipe([1, 2, 3, 4, 5]).filter(x => x > 2).toArray();
    if (JSON.stringify(result) !== "[3,4,5]") throw new Error(`Expected [3,4,5], got ${JSON.stringify(result)}`);
  });

  test("pipe chained operations", async () => {
    const result = await pipe([1, 2, 3, 4, 5, 6])
      .filter(x => x % 2 === 0)
      .map(x => x * 10)
      .toArray();
    if (JSON.stringify(result) !== "[20,40,60]") throw new Error(`Expected [20,40,60], got ${JSON.stringify(result)}`);
  });

  test("pipe take", async () => {
    const result = await pipe([1, 2, 3, 4, 5]).take(3).toArray();
    if (JSON.stringify(result) !== "[1,2,3]") throw new Error(`Expected [1,2,3], got ${JSON.stringify(result)}`);
  });

  test("pipe skip", async () => {
    const result = await pipe([1, 2, 3, 4, 5]).skip(2).toArray();
    if (JSON.stringify(result) !== "[3,4,5]") throw new Error(`Expected [3,4,5], got ${JSON.stringify(result)}`);
  });

  test("pipe count", async () => {
    const count = await pipe([1, 2, 3]).count();
    if (count !== 3) throw new Error(`Expected 3, got ${count}`);
  });

  test("pipe first", async () => {
    const first = await pipe([10, 20, 30]).first();
    if (first !== 10) throw new Error(`Expected 10, got ${first}`);
  });

  // RemoteEvent
  test("RemoteEvent basic", () => {
    const remote = new RemoteEvent("test");
    let received: any = null;
    remote.OnServerEvent.Connect((data) => { received = data; });
    remote.FireServer("hello");
    if (!received || received.args[0] !== "hello") throw new Error("RemoteEvent failed");
    remote.Destroy();
  });

  test("Discord bot builder", () => {
    const { DiscordBotBuilder } = require("../discord");
    const bot = new DiscordBotBuilder();
    let cmdExecuted = false;
    bot.command({
      name: "ping",
      description: "Pong!",
      handler: async (ctx: any) => { cmdExecuted = true; },
    });
    EventBus.emit("discord:command:ping", { command: "ping" });
    if (!cmdExecuted) throw new Error("Discord command not executed");
  });

  // Obfuscator
  test("Obfuscator light obfuscate/deobfuscate", () => {
    const engine = Obfuscator.light();
    const data = "Hello Toolbox";
    const obfuscated = engine.obfuscate(data);
    const deobfuscated = engine.deobfuscate(obfuscated.data);
    if (deobfuscated !== data) throw new Error(`Expected "${data}", got "${deobfuscated}"`);
  });

  test("Obfuscator medium obfuscate/deobfuscate", () => {
    const engine = Obfuscator.medium();
    const data = "Test data with symbols: !@#$%";
    const obfuscated = engine.obfuscate(data);
    const deobfuscated = engine.deobfuscate(obfuscated.data);
    if (deobfuscated !== data) throw new Error("Medium obfuscation roundtrip failed");
  });

  test("Obfuscator heavy obfuscate/deobfuscate", () => {
    const engine = Obfuscator.heavy("secret-key");
    const data = "Heavy obfuscation test";
    const obfuscated = engine.obfuscate(data, "secret-key");
    const deobfuscated = engine.deobfuscate(obfuscated.data, "secret-key");
    if (deobfuscated !== data) throw new Error("Heavy obfuscation roundtrip failed");
  });

  test("Obfuscator extreme obfuscate/deobfuscate", () => {
    const engine = Obfuscator.extreme();
    const data = "X".repeat(100);
    const obfuscated = engine.obfuscate(data);
    const deobfuscated = engine.deobfuscate(obfuscated.data);
    if (deobfuscated !== data) throw new Error("Extreme obfuscation roundtrip failed");
  });

  test("Obfuscator different levels produce different outputs", () => {
    const data = "Same data";
    const light = Obfuscator.light().obfuscate(data);
    const heavy = Obfuscator.heavy().obfuscate(data);
    if (light.data === heavy.data) throw new Error("Different levels should produce different outputs");
  });

  // CryptoEngineAdvanced
  test("CryptoEngineAdvanced encrypt/decrypt", () => {
    const engine = new CryptoEngineAdvanced("master-key");
    const data = "Secret data to encrypt";
    const encrypted = engine.encrypt(data);
    const decrypted = engine.decrypt(encrypted.data);
    if (!decrypted.success) throw new Error("Decryption failed");
    if (decrypted.data !== data) throw new Error(`Expected "${data}", got "${decrypted.data}"`);
  });

  test("CryptoEngineAdvanced encrypt/decrypt with password", () => {
    const engine = new CryptoEngineAdvanced();
    const data = "Password protected data";
    const encrypted = engine.encrypt(data, "user-password");
    const decrypted = engine.decrypt(encrypted.data, "user-password");
    if (!decrypted.success) throw new Error("Password decryption failed");
    if (decrypted.data !== data) throw new Error("Password encrypt/decrypt roundtrip failed");
  });

  test("CryptoEngineAdvanced wrong password fails", () => {
    const engine = new CryptoEngineAdvanced();
    const data = "Secret";
    const encrypted = engine.encrypt(data, "correct-password");
    const decrypted = engine.decrypt(encrypted.data, "wrong-password");
    if (decrypted.success) throw new Error("Should fail with wrong password");
  });

  test("CryptoEngineAdvanced hash SHA-512", () => {
    const engine = new CryptoEngineAdvanced();
    const hash = engine.hash("test data");
    if (hash.length !== 128) throw new Error(`SHA-512 should be 128 hex chars, got ${hash.length}`);
  });

  test("CryptoEngineAdvanced hash MD5", () => {
    const engine = new CryptoEngineAdvanced(undefined, { hash: "md5" });
    const hash = engine.hash("test");
    if (hash.length !== 32) throw new Error(`MD5 should be 32 hex chars, got ${hash.length}`);
  });

  test("CryptoEngineAdvanced generateKeyPair", () => {
    const engine = new CryptoEngineAdvanced();
    const pair = engine.generateKeyPair("rsa-2048");
    if (!pair.publicKey.includes("BEGIN PUBLIC KEY")) throw new Error("Invalid public key format");
    if (!pair.privateKey.includes("BEGIN PRIVATE KEY")) throw new Error("Invalid private key format");
  });

  test("CryptoEngineAdvanced sign/verify", () => {
    const engine = new CryptoEngineAdvanced();
    const pair = engine.generateKeyPair("rsa-2048");
    const data = "Data to sign";
    const signature = engine.sign(data, pair.privateKey);
    const valid = engine.verify(data, signature, pair.publicKey);
    if (!valid) throw new Error("Signature verification failed");
  });

  test("CryptoEngineAdvanced encryptWithPublicKey/decryptWithPrivateKey", () => {
    const engine = new CryptoEngineAdvanced();
    const pair = engine.generateKeyPair("rsa-2048");
    const data = "Secret message";
    const encrypted = engine.encryptWithPublicKey(data, pair.publicKey);
    const decrypted = engine.decryptWithPrivateKey(encrypted, pair.privateKey);
    if (decrypted !== data) throw new Error("Asymmetric encrypt/decrypt roundtrip failed");
  });

  test("CryptoEngineAdvanced different algorithms", () => {
    const engines = [
      new CryptoEngineAdvanced("key", { symmetric: "aes-256-gcm" }),
      new CryptoEngineAdvanced("key", { symmetric: "aes-256-cbc" }),
      new CryptoEngineAdvanced("key", { symmetric: "aes-128-gcm" }),
    ];
    for (const engine of engines) {
      const data = "Test data";
      const encrypted = engine.encrypt(data);
      const decrypted = engine.decrypt(encrypted.data);
      if (!decrypted.success || decrypted.data !== data) throw new Error(`Algorithm failed: ${engine}`);
    }
  });

  // Animations - ColorCycle
  test("ColorCycle rainbow rendering", () => {
    const cc = new ColorCycle("test", "rainbow", { speed: 100 });
    cc.start();
    cc.stop();
  });

  test("ColorCycle breathing rendering", () => {
    const cc = new ColorCycle("test", "breathing");
    cc.start();
    cc.stop();
  });

  test("ColorCycle sweep rendering", () => {
    const cc = new ColorCycle("test", "sweep");
    cc.start();
    cc.stop();
  });

  test("ColorCycle pulse rendering", () => {
    const cc = new ColorCycle("test", "pulse");
    cc.start();
    cc.stop();
  });

  test("ColorCycle setText and setRunning", () => {
    const cc = new ColorCycle("test");
    cc.setText("new text");
    cc.setRunning(true);
    cc.setRunning(false);
  });

  // Animations - Marquee
  test("Marquee left scrolling", () => {
    const m = new Marquee("test marquee", { width: 20, speed: 50, direction: "left" });
    m.start();
    m.stop();
  });

  test("Marquee right scrolling", () => {
    const m = new Marquee("test", { width: 10, speed: 50, direction: "right" });
    m.start();
    m.stop();
  });

  test("Marquee setText and multiple starts", () => {
    const m = new Marquee("text");
    m.setText("new text");
    m.start();
    m.setRunning(false);
    m.setRunning(true);
    m.setRunning(false);
  });

  test("Marquee single loop stops automatically", () => {
    const m = new Marquee("x", { width: 5, speed: 10, loop: false });
    m.start();
    // stop quickly to avoid long test
    setTimeout(() => m.stop(), 50);
  });

  // Animations - SlideShow
  test("SlideShow construction and start/stop", () => {
    const ss = new SlideShow(["text A", "text B", "text C"], { interval: 500, width: 20 });
    ss.start();
    ss.stop();
  });

  test("SlideShow single text does not crash", () => {
    const ss = new SlideShow(["only"], { interval: 500 });
    ss.start();
    ss.stop();
  });

  test("SlideShow setRunning", () => {
    const ss = new SlideShow(["a", "b"]);
    ss.setRunning(true);
    ss.setRunning(false);
  });

  test("SlideShow empty texts does not crash", () => {
    const ss = new SlideShow([]);
    ss.start();
    ss.stop();
  });

  // Animations - animations object
  test("animations.colorCycle factory", () => {
    const cc = animations.colorCycle("hello");
    cc.start();
    cc.stop();
  });

  test("animations.marquee factory", () => {
    const m = animations.marquee("hello", { width: 10 });
    m.start();
    m.stop();
  });

  test("animations.slideShow factory", () => {
    const ss = animations.slideShow(["a", "b"], { interval: 500 });
    ss.start();
    ss.stop();
  });

  // Run tests sequentially
  for (const t of testQueue) {
    try {
      const result = t.fn();
      if (result instanceof Promise) {
        await result;
      }
      passed.push(t.name);
    } catch (error: any) {
      failed.push(`${t.name}: ${error.message}`);
      console.error(`  FAIL: ${t.name} - ${error.message}`);
    }
  }

  // Results
  console.log(`\n Tests: ${passed.length}/${passed.length + failed.length} passed`);
  if (failed.length > 0) {
    console.log(` Failed: ${failed.join(", ")}`);
    process.exit(1);
  }
}

runTests().catch(console.error);
