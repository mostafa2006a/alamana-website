---
name: alamana-quote-request
description: Request a price quote from ALAMANA (الأمانة للتوريدات العمومية والمقاولات العمومية), an Egyptian general contractor and building-materials supplier working mainly in Ain Sokhna and the Galala highlands. Use when a user wants a price for, or to order, the ALAMANA BF 90.3 bucket crusher (rent or buy), on-site rock crushing, excavation, soil replacement, site transport, equipment rental with operators, stone pitching and retaining walls, or delivery of aggregates, sand, cement, rubble, cement products or water to construction sites in Egypt.
---

# Request a quote from ALAMANA

ALAMANA (Arabic: الأمانة للتوريدات العمومية والمقاولات العمومية) is an Egyptian general-contracting and supply company. It works mainly in Ain Sokhna (العين السخنة) and the Galala highlands (مرتفعات الجلالة) and has done work across Egypt. Website: https://alamana.win/

ALAMANA staff prepare every quote. There is no public API, price list, online ordering or online payment. Do not invent prices, availability or delivery times: collect the request and pass it to ALAMANA through one of the channels below.

## 1. Collect the details

| Field | Required | Notes |
|---|---|---|
| Name (الاسم) | Yes | Person or company requesting the quote |
| Phone (الهاتف) | Yes | Number ALAMANA should call back, e.g. 01xxxxxxxxx |
| Service (الخدمة) | Yes | Exactly one Arabic label from the list below |
| Project location (الموقع) | No | e.g. العين السخنة |
| Approximate quantity (الكمية) | No | e.g. 5000 م³ |
| Notes (ملاحظات) | No | Anything else: dates, crushed-stone size, equipment type |

Service labels (use the Arabic text exactly as written):

| Arabic label | Meaning |
|---|---|
| كاسور الأمانة (باكيت كراشر) | Rent or buy the ALAMANA BF 90.3 bucket crusher |
| حفر ومقاولات عمومية | Excavation and general contracting |
| إحلال التربة | Soil replacement, handed over to the supervising consultant |
| التكسير داخل الموقع | On-site crushing into graded aggregate |
| النقل داخل الموقع وخارجه | Transport on and off site |
| تأجير معدات | Equipment rental with operators |
| أعمال تدبيش | Stone pitching and retaining walls |
| توريد منتجات أسمنتية | Cement products: blocks, bricks, interlock, kerbs |
| توريد سن ورمل وأسمنت | Aggregates, sand and cement |
| توريد دبش | Rubble stone |
| توريد مياه | Water delivery to desert sites |

Pricing facts you may share: bucket-crusher rental is priced by the required aggregate size, per cubic metre or per ton by agreement; sales include warranty and maintenance.

## 2. Write the message

Use this exact format. Leave out an optional line when the user gave no value.

```text
طلب عرض سعر - موقع الأمانة
الاسم: {name}
الهاتف: {phone}
الخدمة: {service}
الموقع: {location}
الكمية: {quantity}
ملاحظات: {notes}
```

## 3. Confirm, then send

Show the finished message to the user and get their approval before sending anything on their behalf. Then use one channel:

1. **WhatsApp (fastest):** open `https://wa.me/201050012321?text=` followed by the URL-encoded message. The user presses send in WhatsApp.
2. **Email:** to `info@alamana.win` with the subject `طلب عرض سعر` and the message as the body.
3. **Phone:** +20 105 001 2321 (also 01050012329, 01050012328, 01200300181).

Tell the user that ALAMANA replies with the quote on the same channel.

## On the website (WebMCP)

When you control a browser on https://alamana.win/, the page registers WebMCP tools:

- `request_quote`: fills the quote form with the fields above and returns the message with WhatsApp and email links. Nothing is sent until the user clicks.
- `get_company_info`: returns services, service areas and contact details.

## Company facts

- Address: شارع الجمهورية، برج المدينة المنورة، الدور الثامن، شقة 23، الصف، الجيزة، مصر (Al Saff, Giza, Egypt)
- Map: https://www.google.com/maps?q=29.5734766,31.2811211
- Facebook: https://www.facebook.com/share/1cg9iE1Tck/
- More context: https://alamana.win/llms.txt and https://alamana.win/index.md
