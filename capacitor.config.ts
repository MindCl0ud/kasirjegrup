import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jegrup.kasir',
  appName: 'Kasir JE Grup',
  webDir: 'dist',
  server: {
    // Untuk development: uncomment dan isi URL Vercel
    // url: 'https://kasirjegrup.vercel.app',
    // cleartext: true,
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
    backgroundColor: '#F8F6F9',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#F8F6F9',
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#C2185B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
