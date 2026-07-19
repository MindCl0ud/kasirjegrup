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
    backgroundColor: '#020817',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#020817',
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#020817',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#020817',
    },
  },
};

export default config;
