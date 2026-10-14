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
    backgroundColor: '#F4F5FA',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#F4F5FA',
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#232C75',
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
