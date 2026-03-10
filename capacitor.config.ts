import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mspktrade.solution',
  appName: 'MSPK Trading Solutions',
  webDir: 'build',
  server: {
    url: 'https://user.mspktradesolutions.com/',
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