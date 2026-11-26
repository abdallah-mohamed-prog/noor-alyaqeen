# نور اليقين (Noor Al-Yaqeen)

Arabic Islamic quiz, 4,959 sourced questions in 7 doors (Quran, Hadith, Worship, Prophets, Seerah, Caliphs, "what every Muslim must know"). Version 1.8.

## Layout
- `assets/`  Ready-to-ship web app (the APK's assets folder): index.html, app.js, app.css, sw.js, data/*.json (questions, one file per door), icons.
  - `sw.js` only clears old service-worker caches and unregisters itself. app.js does not register a service worker. This matters on phones that had APK 1.0 to 1.3 installed.
- `app/`  Source of the web app that builds `assets/app.js` and `app.css`. React + esbuild. Questions are loaded at runtime from `assets/data/*.json`, which are not in `app/src`.
  - Build: `cd app && npm install && npx esbuild src/main.tsx --bundle --minify --outfile=../assets/app.js --loader:.css=css`
  - Then replace the service worker registration call in `app.js`: `navigator.serviceWorker.register("sw.js")` -> `Promise.resolve()`.
- `hosted-source/`  Source of the hosted online version (uses the Instinct Files framework, so it will not build standalone). Holds the question source (`data.ts`, `quran.ts`, `extra.ts`).

## Progress and backup
Progress is stored in localStorage keys `iq.p-<door>.v1` (one character per question: 0 unanswered, 1 right, 2 wrong, by position). Home screen has a backup code (NQ1.…, checksummed) to export and restore it. Restore only works with the same question order.

## APK
Android WebView wrapper, package `com.noor.yaqeen`, loads `assets/` from `https://appassets.androidplatform.net/`. Exposes `Android.exitApp()` to the page. The signing key is NOT in this repo.

## Sources
Each question has a source line (Quran text via api.alquran.cloud, sunnah.com, binbaz.org.sa, shamela.ws Al-Bidaya wa'l-Nihaya and Al-Raheeq, uploaded books). No Wikipedia. Questions were checked against the cited pages by script, not by a scholar.

## تحميل اللعبة (Download)

**لتحميل أحدث نسخة من اللعبة (APK) لأندرويد:** افتح صفحة [Releases](../../releases) وحمّل ملف `noor-alyaqeen-v1.8.apk`، ثم ثبّته على هاتفك (قد يطلب منك الهاتف السماح بالتثبيت من مصادر غير معروفة).

**To install the game on Android:** open the [Releases](../../releases) page, download `noor-alyaqeen-v1.8.apk`, and install it (your phone may ask you to allow installs from unknown sources).

## المؤلف (Author)

عبدالله غريب (Abdallah Ghareeb)
