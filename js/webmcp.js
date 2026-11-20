// أدوات WebMCP: بتخلّي وكلاء الذكاء الاصطناعي اللي شغالين جوه المتصفح يستخدموا الموقع
// المواصفة: https://webmachinelearning.github.io/webmcp/
//  - request_quote: يملأ نموذج عرض السعر ويرجّع رابط واتساب جاهز (مش بيبعت حاجة لوحده)
//  - get_company_info: الخدمات ومناطق العمل وبيانات التواصل
// لو غيّرت رقم الواتساب أو البريد في main.js غيّرهم هنا كمان.
(() => {
  const mc = document.modelContext || navigator.modelContext;
  if (!mc || typeof mc.registerTool !== 'function') return;

  const WHATSAPP = '201050012321';
  const EMAIL = 'info@alamana.win';
  const form = document.getElementById('quoteForm');
  const select = document.getElementById('serviceSelect');
  if (!form || !select) return;
  const SERVICES = [...select.options].map((o) => o.value).filter(Boolean);

  // نسخ كروم القديمة (navigator.modelContext) كانت مستنية النتيجة بصيغة MCP
  const legacy = !document.modelContext;
  const reply = (data) => (legacy ? { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] } : data);

  const register = (tool) => {
    try {
      const result = mc.registerTool(tool);
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch (_) {
      // أداة بنفس الاسم متسجلة بالفعل، أو نسخة مختلفة من الـAPI
    }
  };

  const clean = (v) => String(v ?? '').trim();

  register({
    name: 'request_quote',
    title: 'طلب عرض سعر من الأمانة',
    description: 'Prepare a price-quote request to ALAMANA (Egyptian contractor and building-materials supplier in Ain Sokhna and Galala). Fills the quote form on this page and returns a ready WhatsApp link and email link. Nothing is sent automatically: the user must press "إرسال عبر واتساب" or open the returned link. Confirm the details with the user first.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Customer name (الاسم)' },
        phone: { type: 'string', description: 'Phone number for the callback (رقم الهاتف), e.g. 01xxxxxxxxx' },
        service: { type: 'string', enum: SERVICES, description: 'Requested service (الخدمة المطلوبة): one of the Arabic labels' },
        location: { type: 'string', description: 'Project location (موقع المشروع), e.g. العين السخنة' },
        quantity: { type: 'string', description: 'Approximate quantity (الكمية التقريبية), e.g. 5000 م³' },
        notes: { type: 'string', description: 'Other details (ملاحظات)' },
      },
      required: ['name', 'phone', 'service'],
    },
    execute: async (input) => {
      const i = input || {};
      const d = {
        name: clean(i.name),
        phone: clean(i.phone),
        service: clean(i.service),
        location: clean(i.location),
        qty: clean(i.quantity),
        notes: clean(i.notes),
      };
      if (!d.name || !d.phone || !SERVICES.includes(d.service)) {
        return reply({ ok: false, error: 'name, phone and one of the listed services are required', services: SERVICES });
      }

      // نملأ النموذج عشان المستخدم يشوف البيانات قبل ما يبعت
      for (const [key, value] of Object.entries(d)) {
        const field = form.elements.namedItem(key);
        if (field) field.value = value;
      }
      const formError = document.getElementById('formError');
      if (formError) formError.hidden = true;
      const section = document.getElementById('quote');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const message = [
        'طلب عرض سعر - موقع الأمانة',
        `الاسم: ${d.name}`,
        `الهاتف: ${d.phone}`,
        `الخدمة: ${d.service}`,
        d.location && `الموقع: ${d.location}`,
        d.qty && `الكمية: ${d.qty}`,
        d.notes && `ملاحظات: ${d.notes}`,
      ].filter(Boolean).join('\n');

      return reply({
        ok: true,
        sent: false,
        next_step: 'The quote form on the page is filled. Ask the user to press "إرسال عبر واتساب" (or open whatsapp_url) to send it. ALAMANA replies with the quote.',
        message,
        whatsapp_url: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
        email_url: `mailto:${EMAIL}?subject=${encodeURIComponent('طلب عرض سعر')}&body=${encodeURIComponent(message)}`,
        phone: '+201050012321',
      });
    },
  });

  register({
    name: 'get_company_info',
    title: 'بيانات شركة الأمانة',
    description: 'Get ALAMANA company information: services, the BF 90.3 bucket crusher, service areas, and contact details (phone, WhatsApp, email, address, map).',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => reply({
      name: 'الأمانة للتوريدات العمومية والمقاولات العمومية (ALAMANA)',
      areas: ['العين السخنة', 'مرتفعات الجلالة', 'جميع محافظات مصر'],
      services: SERVICES,
      bucket_crusher: 'كاسور الأمانة BF 90.3: باكيت كراشر يُركَّب على الحفار وينتج سن متدرج (3 و6 و11 وأكبر) في الموقع، بدون مولد أو سولار أو لودر تغذية. التأجير بالمتر أو بالطن حسب حجم السن، والبيع مع الضمان والصيانة.',
      pricing: 'Quotes on request only; there is no public price list.',
      contact: {
        phone: ['+201050012321', '+201050012329', '+201050012328', '+201200300181'],
        whatsapp: `https://wa.me/${WHATSAPP}`,
        email: EMAIL,
        address: 'شارع الجمهورية، برج المدينة المنورة، الدور الثامن، شقة 23، الصف، الجيزة، مصر',
        map: 'https://www.google.com/maps?q=29.5734766,31.2811211',
        facebook: 'https://www.facebook.com/share/1cg9iE1Tck/',
      },
      more: ['https://alamana.win/llms.txt', 'https://alamana.win/index.md'],
    }),
  });
})();
