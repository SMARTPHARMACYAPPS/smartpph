// اسم ذاكرة التخزين المؤقت (Cache) لتطبيقك. قم بتغييره عند تحديث الموارد لضمان تحديثها لدى المستخدمين.
// تم تحديث الإصدار ليشمل الملفات الجديدة.
const CACHE_NAME = 'smart-pph-cache-v1.1.0';

// قائمة بالملفات الأساسية التي يجب تخزينها مؤقتًا عند تثبيت عامل الخدمة.
// تأكد من أن هذه المسارات صحيحة بالنسبة لموقع ملفاتك.
const urlsToCache = [
    '/', // الصفحة الرئيسية (عادةً index.html)
    'index.html',
    'discounts.html', // صفحة الخصومات الجديدة
    'database.html', // صفحة قاعدة البيانات (قد تكون customers.html في سياق سابق، لكن سأفترض database.html الآن)
    'fitnessup.html', // صفحة اللياقة البدنية الجديدة
    'manifest.json', // ملف البيان الخاص بتطبيق الويب التقدمي
    'pphicon.png', // الصورة الجديدة
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js', // SheetJS library
    // خطوط Cairo من Google Fonts (إذا كنت تستخدمها)
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap',
    'https://fonts.gstatic.com/s/cairo/v19/SLXGc1nY6HgpO7qL0YuRzyhJzW8.woff2', // مثال لملف خط، قد تحتاج إلى إضافة المزيد
    'https://fonts.gstatic.com/s/cairo/v19/SLXGc1nY6HgpO7qL0YuRzyhJzW8.woff',
    // إذا كان لديك أي صور أو ملفات JavaScript أو CSS إضافية محلية، أضفها هنا
    // 'path/to/your/script.js',
    // 'path/to/your/style.css'
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
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Cache addAll failed', error);
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
// هنا نستخدم استراتيجية "Cache First" (الذاكرة المؤقتة أولاً):
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
                        // يمكنك هنا عرض صفحة "غير متصل بالإنترنت" مخصصة إذا فشل الجلب
                        // return caches.match('/offline.html');
                    });
            })
    );
});
