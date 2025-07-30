// اسم ذاكرة التخزين المؤقت (Cache) لتطبيقك.
// قم بتغيير هذا الاسم (مثل زيادة الرقم) في كل مرة تقوم فيها بتحديث أي من الملفات في `urlsToCache`
// لضمان أن المتصفح يقوم بتنزيل الإصدارات الجديدة من الملفات.
const CACHE_NAME = 'smart-pph-cache-v1.17.0'; // تم زيادة الإصدار لضمان التحديث

// قائمة بالملفات الأساسية التي يجب تخزينها مؤقتًا عند تثبيت عامل الخدمة.
// تأكد من أن هذه المسارات صحيحة بالنسبة لموقع ملفاتك.
// يجب أن تكون offline.html هنا لضمان توفرها.
const urlsToCache = [
    './offline.html', // *** يجب أن تكون صفحة عدم الاتصال مخزنة مؤقتًا دائمًا ***
    // يمكنك تضمين ملفات التطبيق الأساسية الأخرى هنا لتحسين الأداء عند الاتصال
    // ولكن سلوك الجلب سيضمن عدم عرضها في وضع عدم الاتصال إذا فشلت الشبكة.
    './', // يمثل index.html في نفس المجلد (نقطة البداية)
    './index.html',
    './discounts.html',
    './database.html',
    './fitnessup.html',
    './manifest.json',
    './pphicon.png', // تأكد من أن هذه الصورة موجودة في نفس المجلد
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN (خارجي)
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js', // SheetJS library (خارجي)
    // خطوط Cairo من Google Fonts (هذه يجب أن تكون URLs كاملة لأنها خارجية)
    // من المهم جدًا إضافة ملفات الخطوط الفعلية التي يتم تحميلها بواسطة CSS
    // هذه مجرد أمثلة شائعة لملفات الخطوط، قد تحتاج إلى فحص تبويب "الشبكة" في أدوات المطور
    // عند تحميل تطبيقك لأول مرة لمعرفة الروابط الدقيقة لملفات الخطوط التي يتم جلبها.
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap',
    'https://fonts.gstatic.com/s/cairo/v19/SLXGc1nY6HgpO7qL0YuRzyhJzW8.woff2', // مثال لملف خط WOFF2
    'https://fonts.gstatic.com/s/cairo/v19/SLXGc1nY6HgpO7qL0YuRzyhJzW8.woff',  // مثال لملف خط WOFF
    'https://fonts.gstatic.com/s/cairo/v19/SLXGc1nY6HgpO7qL0YuRzyhJzW8.ttf',   // مثال لملف خط TTF
    // أضف هنا أي ملفات JavaScript أو CSS أو صور أخرى محلية يستخدمها تطبيقك
    // مثال: './js/main.js',
    // مثال: './css/style.css',
    // مثال: './images/background.jpg'
];

// حدث التثبيت (Install Event):
// يتم تشغيل هذا الحدث عندما يقوم المتصفح بتثبيت عامل الخدمة.
// هنا نقوم بفتح ذاكرة تخزين مؤقت جديدة وتخزين جميع الملفات الأساسية فيها.
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching App Shell');
                // استخدام `addAll` قد يفشل إذا كان أي من الروابط غير صالحة أو لم يتم العثور عليها (404).
                // في هذه الحالة، سيفشل تثبيت عامل الخدمة.
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Cache addAll failed during install. Check URLs:', error);
                // يمكن هنا إضافة منطق للتعامل مع الأخطاء بشكل أكثر تفصيلاً
                // على سبيل المثال، يمكنك محاولة التخزين المؤقت لكل ملف على حدة لتحديد أي ملف يسبب المشكلة.
            })
    );
});

// حدث التفعيل (Activate Event):
// يتم تشغيل هذا الحدث بعد تثبيت عامل الخدمة بنجاح.
// هنا نقوم بتنظيف أي ذاكرة تخزين مؤقت قديمة لم تعد مستخدمة.
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// حدث الجلب (Fetch Event):
// يتم تشغيل هذا الحدث في كل مرة يحاول فيها المتصفح جلب مورد (مثل صفحة HTML، صورة، CSS، JS).
// استراتيجية "Network Only with Offline Fallback":
// حاول دائمًا جلب المورد من الشبكة أولاً.
// إذا فشل الجلب من الشبكة (أي أن المستخدم غير متصل)، قم بعرض صفحة عدم الاتصال.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request) // حاول دائمًا الجلب من الشبكة أولاً
            .catch(() => {
                // إذا فشل الجلب من الشبكة (أنت غير متصل بالإنترنت)،
                // قم بعرض صفحة عدم الاتصال المخزنة مؤقتًا.
                // هذا يضمن أن التطبيق الرئيسي لا يعمل في وضع عدم الاتصال،
                // ويتم عرض صفحة الأوفلاين فقط.
                return caches.match('./offline.html');
            })
    );
});
