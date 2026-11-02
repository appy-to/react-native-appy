# Add Appy to a React Native or Expo app

Install `react-native-appy` from npm, then connect it to your app as shown below.

Requires Expo SDK 54+ with a development build. Use the iOS and Android minimum versions required by your Expo / React Native release. The native SDK does not run in Expo Go. [Bare React Native setup](README.md#2b-bare-react-native).

## 1. Get the two values for your app

In the [Appy dashboard](https://appy.to), open **Apps & SDK → New app**, register your own app, and open its **SDK setup** card. Copy **Publishable key** and **Link domain**. If it is already registered, open that app instead of creating another one.

[Which dashboard fields do I fill in?](SETUP.md#1-add-your-app-in-the-dashboard)

In every snippet below:

- Replace `YOUR_PUBLISHABLE_KEY` with the **entire key** copied from the dashboard.
- Replace `your-app.appy.to` with the **Link domain** copied from the dashboard.
- Keep names such as `Appy`, `AppySDK` and the package imports. They name the library you are adding; your own app keeps its name and identifiers.

The hosted SDK features require an Enterprise plan. You do not need a secret API key or a `curl` registration request for these steps.

## 2. Install the package

```bash
npx expo install react-native-appy
```

Use a development build; Expo Go cannot load this native module.

## 3. Paste your key and domain

Configure once at module scope in your app's entry file:

```ts
import Appy from 'react-native-appy';

Appy.configure({
  publishableKey: 'YOUR_PUBLISHABLE_KEY',
  linkDomains: ['your-app.appy.to'],
});
```

`Appy` is the imported library object. It does not rename your app.

## 4. Choose which screen to open

Import `useEffect` from `react` at the top of your file. Inside a long-lived root component:

```ts
useEffect(() => {
  const subscription = Appy.addDeepLinkListener((result) => {
    if (result.status === 'found') {
      // Use result.link.slug and result.link.parameters in your app's navigation.
    }
  });
  return () => subscription.remove();
}, []);
```

## 5. Test a real link

Create a link for the dashboard app whose key and domain you copied, install the matching development build, and tap the link. Check the callback before trying a fresh-install test.

The [full guide](README.md) covers events, consent and attribution. The [replacement table](SETUP.md#2-know-which-values-to-replace) explains every example name.
