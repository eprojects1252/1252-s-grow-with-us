import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sriamirthaa.ecommerce",
  appName: "Sri Amirthaa",
  webDir: "public",
  server: {
    url: "https://1252-s-grow-with-us.vercel.app",
    cleartext: false,
    allowNavigation: [
      "1252-s-grow-with-us.vercel.app",
      "sri-amirthaa-id-core.vercel.app",
      "sri-amirthaa-id-core.firebaseapp.com"
    ]
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
