import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.base393.BasePod',
  appName: 'BasePod',
  webDir: 'out',
  server: {
    // MusicKit 認証で apple.com / icloud.com への navigation を WKWebView 内
    // で許可（default は外部 Safari 飛び）。これにより auth 完了時の postMessage
    // が同 window context で届き、MusicKitProvider の polling/event listener
    // で state 反映できる。
    allowNavigation: [
      '*.apple.com',
      '*.icloud.com',
      '*.mzstatic.com',
    ],
  },
};

export default config;
