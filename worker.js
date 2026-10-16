// Follower AI Pro — دستیار گفتگو
// Bindings: AI (Workers AI), DB (D1: follower-ai-pro-db). Optional variable: ACCESS_KEY.

const MODELS = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/google/gemma-3-12b-it",
];

const SYSTEM =
  "تو دستیار هوش مصنوعی پیج اینستاگرام فیتنس و آتش‌نشانی هستی. " +
  "به فارسی ساده و محاوره‌ای و مودبانه جواب بده. کوتاه و کاربردی بنویس، چون کاربر روی گوشی می‌خونه. " +
  "کارهات: ایده ریلز و استوری، نوشتن کپشن و هشتگ، برنامه محتوایی هفتگی، توصیف متنی ایده کاور و تصویر، " +
  "دسته‌بندی ایده‌ها، و کمک برای پیدا کردن دلیل افت رشد پیج. " +
  "قوانین: هیچ آمار، عدد یا تحلیلی از پیج کاربر نساز. اگر داده واقعی نداری، بگو «داده‌ای از پیج وصل نیست» و از کاربر بخواه عددها رو خودش بگه. " +
  "رشد یا فالوور تضمین نکن. توصیه‌های ورزشی و ایمنی آتش‌نشانی رو محتاطانه بده و ادعای پزشکی نکن. " +
  "اگر سوال مبهم بود، فقط یک سؤال کوتاه بپرس و بعد ادامه بده.";

const PAGE = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#22292C">
<title>دستیار پیج</title>
<style>
:root{--ash:#ECEAE6;--soot:#22292C;--tape:#E6C800;--paper:#fff;--mute:#6B7377;--line:#D9D5CE}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--ash);color:var(--soot);font-family:Vazirmatn,Tahoma,"Segoe UI",sans-serif;display:flex;flex-direction:column;height:100dvh}
header{background:var(--soot);color:#fff;padding:14px 16px 12px;display:flex;justify-content:space-between;align-items:center}
h1{font-size:17px;margin:0;font-weight:700}
.tape{height:8px;flex:none;background:repeating-linear-gradient(-45deg,var(--tape) 0 10px,var(--soot) 10px 20px)}
.new{background:transparent;color:#fff;border:1px solid #5A6468;border-radius:8px;padding:6px 10px;font:inherit;font-size:13px}
main{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.b{max-width:88%;padding:10px 13px;border-radius:14px;line-height:1.9;font-size:15px;white-space:pre-wrap;word-break:break-word}
.u{align-self:flex-start;background:var(--soot);color:#fff}
.a{align-self:flex-end;background:var(--paper);border:1px solid var(--line)}
.pending{color:var(--mute)}
#empty{margin:auto 0;padding:8px 4px;line-height:2;color:var(--mute);font-size:15px}
#empty strong{display:block;color:var(--soot);font-size:19px;margin-bottom:4px}
.chips{display:flex;gap:8px;overflow-x:auto;padding:8px 14px;flex:none}
.chip{flex:none;background:transparent;border:1px solid var(--soot);color:var(--soot);border-radius:999px;padding:7px 13px;font:inherit;font-size:14px;white-space:nowrap}
form{display:flex;gap:8px;padding:8px 14px calc(10px + env(safe-area-inset-bottom));flex:none}
textarea{flex:1;resize:none;border:1px solid #BDB8AF;border-radius:12px;padding:10px 12px;font:inherit;font-size:16px;background:#fff;color:var(--soot);max-height:120px}
.send{background:var(--soot);color:#fff;border:0;border-radius:12px;padding:0 18px;font:inherit;font-size:15px}
.send:disabled{opacity:.5}
button:focus-visible,textarea:focus-visible{outline:3px solid var(--tape);outline-offset:2px}
</style>
</head>
<body>
<header><h1>دستیار پیج</h1><button class="new" id="new" type="button">گفتگوی جدید</button></header>
<div class="tape"></div>
<main id="log">
  <div id="empty"><strong>برای پیجت چی لازم داری؟</strong>ایده ریل، کپشن، برنامه هفتگی یا دلیل افت رشد. یکی از دکمه‌های پایین رو بزن یا خودت بنویس.</div>
</main>
<div class="chips">
  <button class="chip" type="button" data-q="یه ایده ریل برای امروز بده، با هوک ۳ ثانیه‌ای و ترتیب صحنه‌ها.">ایده ریل امروز</button>
  <button class="chip" type="button" data-q="برای پستم کپشن بنویس. اول بپرس موضوع پست چیه.">کپشن بنویس</button>
  <button class="chip" type="button" data-q="یه برنامه محتوایی هفتگی بده: چند ریل، چند استوری و چند پست.">برنامه هفتگی</button>
  <button class="chip" type="button" data-q="پیجم رشد نمی‌کنه. چند سؤال کوتاه بپرس تا دلیلش رو پیدا کنیم.">چرا رشد نمی‌کنم؟</button>
</div>
<form id="f">
  <textarea id="t" rows="1" maxlength="2000" placeholder="پیامت رو بنویس"></textarea>
  <button class="send" id="s" type="submit">ارسال</button>
</form>
<script>
var sid = localStorage.getItem('sid');
if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('sid', sid); }
var log = document.getElementById('log'), ta = document.getElementById('t'), btn = document.getElementById('s');
var busy = false;

function hideEmpty() { var e = document.getElementById('empty'); if (e) e.remove(); }
function add(cls, text) {
  var d = document.createElement('div');
  d.className = 'b ' + cls;
  d.textContent = text;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}
function api(path, opts) {
  opts = opts || {};
  opts.headers = { 'content-type': 'application/json', 'x-key': localStorage.getItem('key') || '' };
  return fetch(path, opts).then(function (r) {
    if (r.status === 401) {
      var k = prompt('کلید دسترسی را وارد کن');
      if (k) { localStorage.setItem('key', k); opts.headers['x-key'] = k; return fetch(path, opts); }
    }
    return r;
  });
}
function send(text) {
  text = (text || ta.value).trim();
  if (!text || busy) return;
  busy = true; btn.disabled = true; ta.value = '';
  hideEmpty();
  add('u', text);
  var p = add('a pending', 'در حال نوشتن…');
  api('/api/chat', { method: 'POST', body: JSON.stringify({ sid: sid, message: text }) })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (x) { p.className = 'b a'; p.textContent = x.ok ? x.j.reply : (x.j.error || 'خطا در پاسخ'); })
    .catch(function () { p.className = 'b a'; p.textContent = 'اتصال برقرار نشد. اینترنت را بررسی کن و دوباره بفرست.'; })
    .then(function () { busy = false; btn.disabled = false; log.scrollTop = log.scrollHeight; });
}
document.getElementById('f').addEventListener('submit', function (e) { e.preventDefault(); send(); });
document.querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () { send(c.getAttribute('data-q')); }); });
document.getElementById('new').addEventListener('click', function () {
  if (!confirm('گفتگوی فعلی پاک شود؟')) return;
  api('/api/clear', { method: 'POST', body: JSON.stringify({ sid: sid }) }).then(function () { location.reload(); });
});
api('/api/history?sid=' + encodeURIComponent(sid)).then(function (r) { return r.json(); }).then(function (j) {
  (j.messages || []).forEach(function (m) { hideEmpty(); add(m.role === 'user' ? 'u' : 'a', m.content); });
}).catch(function () {});
</script>
</body>
</html>`;

let ready = false;
async function ensureTable(env) {
  if (ready) return;
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS records (tbl TEXT, k TEXT, ts INTEGER, data TEXT)"
  ).run();
  ready = true;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const validSid = (s) => typeof s === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(s);

async function loadHistory(env, sid, limit) {
  const r = await env.DB.prepare(
    "SELECT data FROM records WHERE tbl='assistant_msg' AND k LIKE ? ORDER BY ts DESC LIMIT ?"
  ).bind(sid + ":%", limit).all();
  return r.results.map((x) => JSON.parse(x.data)).reverse();
}

async function saveMsg(env, sid, ts, role, content) {
  await env.DB.prepare(
    "INSERT INTO records (tbl,k,ts,data) VALUES ('assistant_msg',?,?,?)"
  ).bind(sid + ":" + ts + ":" + role, ts, JSON.stringify({ role, content })).run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(PAGE, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }

    if (!url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });

    if (env.ACCESS_KEY && request.headers.get("x-key") !== env.ACCESS_KEY) {
      return json({ error: "کلید دسترسی درست نیست." }, 401);
    }

    try {
      await ensureTable(env);

      if (request.method === "GET" && url.pathname === "/api/history") {
        const sid = url.searchParams.get("sid");
        if (!validSid(sid)) return json({ messages: [] });
        return json({ messages: await loadHistory(env, sid, 50) });
      }

      if (request.method === "POST" && url.pathname === "/api/clear") {
        const body = await request.json().catch(() => null);
        if (!body || !validSid(body.sid)) return json({ error: "شناسه گفتگو نامعتبر است." }, 400);
        await env.DB.prepare("DELETE FROM records WHERE tbl='assistant_msg' AND k LIKE ?")
          .bind(body.sid + ":%").run();
        return json({ ok: true });
      }

      if (request.method === "POST" && url.pathname === "/api/chat") {
        const body = await request.json().catch(() => null);
        if (!body || !validSid(body.sid)) return json({ error: "شناسه گفتگو نامعتبر است." }, 400);
        const message = String(body.message || "").trim().slice(0, 2000);
        if (!message) return json({ error: "پیام خالی است." }, 400);

        const hist = await loadHistory(env, body.sid, 12);
        const messages = [{ role: "system", content: SYSTEM }, ...hist, { role: "user", content: message }];

        let reply = null;
        for (const model of MODELS) {
          try {
            const out = await env.AI.run(model, { messages, max_tokens: 700 });
            reply = (out && (out.response || (out.result && out.result.response))) || null;
            if (reply) break;
          } catch (e) { /* try next model */ }
        }
        if (!reply) {
          return json({ error: "مدل هوش مصنوعی پاسخ نداد. چند لحظه بعد دوباره امتحان کن." }, 502);
        }

        const ts = Date.now();
        await saveMsg(env, body.sid, ts, "user", message);
        await saveMsg(env, body.sid, ts + 1, "assistant", reply);
        return json({ reply });
      }

      return json({ error: "مسیر نامعتبر" }, 404);
    } catch (e) {
      return json({ error: "خطای سرور. دوباره امتحان کن." }, 500);
    }
  },
};
