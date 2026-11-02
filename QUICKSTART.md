# React Native and Expo quickstart

**Release status:** npm and the native packages are being prepared. The current source tree uses local native SDK dependencies; the command below is for the verified public release. Do not publish this package while `native-sdk.json` has `source: local`. For a working source checkout, follow [Build the example from public sources](SOURCE_SETUP.md). Contact Appy for current onboarding.

## 1. Prepare your app

Requires Expo SDK 54+ with a development build, iOS 15.1+ and Android API 21+. Expo Go cannot load the native SDK. Bare React Native apps need Expo Modules; see [bare setup](README.md#2b-bare-react-native).

Register your app in **Apps & SDK**, including iOS Team ID/bundle ID and Android package/signing fingerprints. The SDK endpoints require Enterprise. Copy the publishable key and link domain.

## 2. Install after public release

```bash
npx expo install react-native-appy
```

In `app.json`, replace the example domain and scheme:

```json
{
  "expo": {
    "scheme": "yourapp",
    "plugins": [
      ["react-native-appy", { "linkDomains": ["YOUR_SUBDOMAIN.appy.to"] }]
    ]
  }
}
```

Create a new development build after applying the plugin; a JavaScript reload does not apply native configuration. See the [full setup](README.md#2-add-the-config-plugin-expo).

## 3. Configure once

At module scope in your app's entry file:

```ts
import Appy from 'react-native-appy';

Appy.configure({
  publishableKey: 'appy_pk_REPLACE_WITH_YOUR_PUBLISHABLE_KEY',
  linkDomains: ['YOUR_SUBDOMAIN.appy.to'],
});
```

## 4. Receive links

In a long-lived root component:

```ts
useEffect(() => {
  const subscription = Appy.addDeepLinkListener((result) => {
    if (result.status === 'found') {
      // Route using result.link.slug and result.link.parameters.
    }
  });
  return () => subscription.remove();
}, []);
```

Import `useEffect` from `react`. Tap an Appy link on a device and verify the callback and dashboard, then test a fresh install through the link. Deferred matching depends on platform and available signals.

Use only publishable keys, validate route parameters, and keep debug logging off in production. See the [example app](example/README.md) and [full guide](README.md) for consent, events and attribution.
