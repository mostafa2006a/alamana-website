// إعدادات قابلة للتعديل (روابط الهاتف والخريطة وفيسبوك مكتوبة في index.html)
const CONFIG = {
  whatsapp: '201050012321', // بصيغة دولية بدون +
  email: 'info@alamana.win',
};

const waLink = (text = 'مرحبًا، أريد الاستفسار عن خدمات الأمانة') =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

// روابط واتساب
document.querySelectorAll('.js-wa').forEach((a) => { a.href = waLink(); });

// السنة في الفوتر
document.getElementById('year').textContent = new Date().getFullYear();

// قائمة الموبايل
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
};
burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

// تبويبات الكاسور
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      document.getElementById(`tab-${t.dataset.tab}`).hidden = !active;
    });
  });
});

// اختيار الخدمة مسبقًا عند الضغط على زر له data-service
const serviceSelect = document.getElementById('serviceSelect');
document.querySelectorAll('[data-service]').forEach((btn) => {
  btn.addEventListener('click', () => { serviceSelect.value = btn.dataset.service; });
});

// نموذج عرض السعر
const form = document.getElementById('quoteForm');
const formError = document.getElementById('formError');

const buildMessage = () => {
  const d = Object.fromEntries(new FormData(form));
  if (!d.name.trim() || !d.phone.trim() || !d.service) {
    formError.hidden = false;
    return null;
  }
  formError.hidden = true;
  return [
    'طلب عرض سعر - موقع الأمانة',
    `الاسم: ${d.name}`,
    `الهاتف: ${d.phone}`,
    `الخدمة: ${d.service}`,
    d.location && `الموقع: ${d.location}`,
    d.qty && `الكمية: ${d.qty}`,
    d.notes && `ملاحظات: ${d.notes}`,
  ].filter(Boolean).join('\n');
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = buildMessage();
  if (msg) window.open(waLink(msg), '_blank', 'noopener');
});

document.getElementById('mailBtn').addEventListener('click', () => {
  const msg = buildMessage();
  if (msg) {
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('طلب عرض سعر')}&body=${encodeURIComponent(msg)}`;
  }
});

// معرض الصور
const lightbox = document.getElementById('lightbox');
const lbImg = lightbox.querySelector('img');
document.querySelectorAll('#gallery img').forEach((img) => {
  img.addEventListener('click', () => {
    lbImg.src = img.src; lbImg.alt = img.alt;
    lightbox.hidden = false;
  });
});
const closeLb = () => { lightbox.hidden = true; };
lightbox.addEventListener('click', (e) => { if (e.target !== lbImg) closeLb(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
