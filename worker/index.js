// Worker قدّام موقع alamana.win (اسمه على Cloudflare: purple-boat-19ae)
//
// بيشتغل على الصفحة الرئيسية "/" بس (run_worker_first في wrangler.jsonc)؛
// باقي الملفات (صور، CSS، JS، robots.txt، .well-known…) بتتخدم مباشرة من غير ما يشتغل.
//
// وظيفته:
// 1) Markdown negotiation: لو الطلب جاي بـ "Accept: text/markdown" (وكيل ذكاء اصطناعي)
//    يرجّع محتوى index.md بدل HTML. المتصفحات العادية بتاخد HTML زي ما هي.
// 2) يضيف Link headers للصفحة الرئيسية عشان الوكلاء يلاقوا ملفات الاكتشاف.
// 3) يضيف هيدرز الأمان، لأن ملف _headers مش بيتطبق على ردود الـWorker.
//
// لو عدّلت محتوى index.html، حدّث index.md بنفس المحتوى.

const CONTENT_SIGNAL = 'ai-train=yes, search=yes, ai-input=yes'; // نفس القيم اللي في robots.txt

const LINK = [
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</.well-known/ard.json>; rel="describedby"; type="application/json"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</index.md>; rel="alternate"; type="text/markdown"',
].join(', ');

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isHomePage = url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD');
    if (!isHomePage) return env.ASSETS.fetch(request);

    if (wantsMarkdown(request.headers.get('Accept'))) {
      const md = await markdownResponse(request, env, url);
      if (md) return md;
    }

    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    decorate(out.headers);
    return out;
  },
};

// true لو الطلب بيفضّل Markdown على HTML (مع احترام قيم q)
function wantsMarkdown(accept) {
  if (!accept) return false;
  let md = 0;
  let html = 0;
  for (const part of accept.toLowerCase().split(',')) {
    const [type, ...params] = part.split(';').map((s) => s.trim());
    const qParam = params.find((p) => p.startsWith('q='));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    if (Number.isNaN(q)) continue;
    if (type === 'text/markdown' || type === 'text/x-markdown') md = Math.max(md, q);
    if (type === 'text/html' || type === 'application/xhtml+xml') html = Math.max(html, q);
  }
  return md > 0 && md >= html;
}

async function markdownResponse(request, env, url) {
  const asset = await env.ASSETS.fetch(new Request(new URL('/index.md', url).toString()));
  if (!asset.ok) return null; // لو index.md مش موجود نرجع HTML عادي
  const text = await asset.text();
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    'Content-Signal': CONTENT_SIGNAL,
    'x-markdown-tokens': String(estimateTokens(text)),
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  });
  decorate(headers);
  return new Response(request.method === 'HEAD' ? null : text, { status: 200, headers });
}

function decorate(headers) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  headers.set('Link', LINK);
  // Vary: Accept عشان أي كاش يفصل نسخة HTML عن نسخة Markdown
  const vary = headers.get('Vary');
  if (!vary) headers.set('Vary', 'Accept');
  else if (!vary.split(',').some((v) => v.trim().toLowerCase() === 'accept')) headers.set('Vary', `${vary}, Accept`);
}

// تقدير تقريبي لعدد التوكنز (الحروف العربية بتاخد توكنز أكتر من الإنجليزي)
function estimateTokens(text) {
  let ascii = 0;
  let other = 0;
  for (const ch of text) {
    if (ch.charCodeAt(0) < 128) ascii++;
    else other++;
  }
  return Math.ceil(ascii / 4 + other / 2.5);
}
