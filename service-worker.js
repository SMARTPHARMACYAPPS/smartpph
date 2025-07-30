// اسم ذاكرة التخزين المؤقت (Cache) لتطبيقك.
// قم بتغيير هذا الاسم (مثل زيادة الرقم) في كل مرة تقوم فيها بتحديث أي من الملفات في `urlsToCache`
// لضمان أن المتصفح يقوم بتنزيل الإصدارات الجديدة من الملفات.
const CACHE_NAME = 'smart-pph-cache-v1.2.0'; // تم زيادة الإصدار لضمان التحديث

// قائمة بالملفات الأساسية التي يجب تخزينها مؤقتًا عند تثبيت عامل الخدمة.
// بما أن تطبيقك مستضاف في مجلد فرعي (smartpph/)، فإن المسارات هنا يجب أن تكون:
// 1. نسبية لنطاق عامل الخدمة (إذا كان عامل الخدمة في نفس المجلد).
// 2. أو مسارات مطلقة تبدأ بالمسار الكامل للمجلد الفرعي (مثل '/smartpph/index.html').
// الخيار الأسهل هو استخدام المسارات النسبية `./` إذا كان service-worker.js في نفس المجلد.
const urlsToCache = [
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
// هنا نستخدم استراتيجية "Cache First, then Network" (الذاكرة المؤقتة أولاً، ثم الشبكة):
// 1. نحاول جلب المورد من ذاكرة التخزين المؤقت.
// 2. إذا وجدناه، نعيده فورًا.
// 3. إذا لم نجده في الذاكرة المؤقتة، نذهب إلى الشبكة لجلبه.
// 4. بمجرد جلبه من الشبكة، نقوم بتخزينه مؤقتًا للاستخدام المستقبلي ثم نعيده.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // إذا كان المورد موجودًا في ذاكرة التخزين المؤقت، أعده
                if (response) {
                    return response;
                }
                // إذا لم يكن موجودًا، اذهب إلى الشبكة لجلبه
                return fetch(event.request)
                    .then((networkResponse) => {
                        // تحقق مما إذا كان الاستجابة صالحة قبل التخزين المؤقت
                        // لا تخزن استجابات الأخطاء (مثل 404, 500) أو استجابات غير HTTP (مثل chrome-extension://)
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // استنسخ الاستجابة لأنها "Stream" ولا يمكن قراءتها مرتين
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    })
                    .catch(error => {
                        console.error('Service Worker: Fetch failed for:', event.request.url, error);
                        // هذه النقطة يتم الوصول إليها إذا فشل الجلب من الشبكة (أنت غير متصل بالإنترنت)
                        // يمكنك هنا عرض صفحة "غير متصل بالإنترنت" مخصصة إذا كنت قد أعددت واحدة
                        // مثال: return caches.match('/offline.html');
                        // في هذه الحالة، سيظهر المتصفح خطأ "لا يوجد اتصال بالإنترنت" إذا لم يكن المورد مخزنًا مؤقتًا.
                    });
            })
    );
});
