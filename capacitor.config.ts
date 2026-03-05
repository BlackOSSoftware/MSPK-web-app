import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mspk.trading.solutions',
  appName: 'MSPK Trading Solutions',
  webDir: 'build',
  server: {
    url: 'https://mspk-web-app.vercel.app/',
    cleartext: false
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: "#000000"
    }
  }
};

export default config;