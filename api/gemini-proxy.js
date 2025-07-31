// api/gemini-proxy.js
const fetch = require('node-fetch'); // هذه المكتبة ضرورية لـ Node.js للقيام بطلبات HTTP

// هذه هي الدالة الرئيسية التي ستنفذها Vercel
exports.default = async (req, res) => {
    // التحقق من أن الطلب هو POST (لأننا نرسل بيانات)
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // استخراج مفتاح الـ API الخاص بـ Gemini بأمان من متغيرات البيئة
    // هذا المتغير سيتم إعداده لاحقاً على Vercel
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // التحقق إذا كان مفتاح الـ API غير موجود (خطأ في الإعداد)
    if (!GEMINI_API_KEY) {
        res.status(500).send('API Key not configured.');
        return;
    }

    try {
        // تحليل البيانات المرسلة من الواجهة الأمامية (ملف index.html)
        const { chatHistory, isSpecialRequest } = req.body;

        // بناء البيانات (payload) التي سيتم إرسالها إلى Gemini API
        const payload = {
            contents: chatHistory,
            generationConfig: {} // لا يوجد حد أقصى للأحرف هنا
        };

        // عنوان URL الخاص بـ Gemini API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

        // إرسال الطلب إلى Gemini API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // التعامل مع الأخطاء من Gemini API
        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).send(`Error from Gemini API: ${errorText}`);
            return;
        }

        // استلام الرد من Gemini API
        const result = await response.json();

        // التحقق من بنية الرد واستخراج النص
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            // إرسال النص المستخرج كـ JSON إلى الواجهة الأمامية
            res.status(200).json({ text: text });
        } else {
            // إذا كانت بنية الرد غير متوقعة
            res.status(500).send('Unexpected API response structure.');
        }
    } catch (error) {
        // التعامل مع أي أخطاء تحدث داخل هذه الوظيفة بلا خادم
        console.error('Function error:', error);
        res.status(500).send(`Serverless function error: ${error.message}`);
    }
};
