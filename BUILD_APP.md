# 📱 Build Kasir JE Grup — Android & iPhone

## Cara Tercepat: Mode Live (Tanpa Build)
Edit `capacitor.config.ts`, uncomment bagian `server.url`:
```ts
server: {
  url: 'https://kasirjegrup.vercel.app',
  cleartext: true,
},
```
Ini akan membuat app Android/iPhone yang **langsung load dari Vercel**.
Keuntungan: tidak perlu rebuild app saat ada update fitur.

---

## ANDROID (APK)

### Persyaratan
- Android Studio: https://developer.android.com/studio (gratis)
- Java JDK 17+
- NodeJS 18+

### Langkah Build
```bash
# 1. Install dependencies
npm install

# 2. Build web + sync ke Android
npm run cap:android
# atau manual:
npm run build
npx cap add android   # hanya sekali
npx cap sync android
npx cap open android  # buka Android Studio
```

### Di Android Studio
1. Tunggu Gradle sync selesai
2. **Build → Build Bundle(s)/APK(s) → Build APK(s)**
3. APK tersimpan di: `android/app/build/outputs/apk/debug/`
4. Transfer ke HP Android → install

### Upload ke Play Store
1. **Build → Generate Signed Bundle/APK**
2. Pilih **Android App Bundle (.aab)**
3. Buat keystore baru atau pakai yang ada
4. Upload `.aab` ke Google Play Console

---

## IPHONE (iOS)

### Persyaratan
- Mac dengan macOS 12+
- Xcode 14+ (dari App Store, gratis)
- Apple Developer Account ($99/tahun untuk App Store)
- CocoaPods: `sudo gem install cocoapods`

### Langkah Build
```bash
# 1. Build web + sync ke iOS
npm run cap:ios
# atau manual:
npm run build
npx cap add ios    # hanya sekali
npx cap sync ios
npx cap open ios   # buka Xcode
```

### Di Xcode
1. Pilih target device atau simulator
2. Set Bundle ID: `com.jegrup.kasir`
3. Set Team (Apple Developer Account)
4. **Product → Archive** untuk upload ke App Store
5. Atau **Product → Run** untuk test di simulator

### Install ke iPhone tanpa App Store (TestFlight)
1. Archive → Distribute App → TestFlight
2. Kirim link ke pengguna untuk install beta

---

## Konfigurasi App ID
Edit `capacitor.config.ts`:
```ts
appId: 'com.jegrup.kasir',  // ganti sesuai keinginan
appName: 'Kasir JE Grup',   // nama app yang tampil di HP
```

---

## Update App
Setiap ada perubahan kode:
```bash
npm run build        # build ulang web
npx cap sync         # sync ke Android & iOS
# lalu build APK/IPA dari Android Studio / Xcode
```

Atau jika pakai mode live (server.url), **tidak perlu rebuild app** — cukup push ke GitHub dan Vercel auto-deploy.

---

## Troubleshooting

**Android: SDK tidak ditemukan**
- Buka Android Studio → SDK Manager
- Install Android SDK 33 atau lebih baru

**iOS: Pods error**
```bash
cd ios/App && pod install
```

**Firestore tidak jalan di app**
- Pastikan `server.androidScheme: 'https'` di config
- Tambahkan domain Firestore ke `allowNavigation` jika perlu
