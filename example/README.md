# react-native-appy example

An Expo app that configures Appy, prints every deep link and attribution result, tracks a purchase, builds a share link and toggles tracking. It uses the package from the parent folder and the config plugin from `app.json`.

## Run it

With the repositories arranged as in [source setup](../SOURCE_SETUP.md), `../native-sdk.json` has `"source": "local"`: the config plugin points the `AppySDK` pod at `sdks/ios`, and the Android module reads the Android SDK from its local Maven folder. Publish that folder first:

```bash
cd ../../android && ./gradlew :appy-sdk:publishReleasePublicationToLocalRepository
```

Then, from this folder:

```bash
npm install
(cd .. && npm install)
EXPO_PUBLIC_APPY_PUBLISHABLE_KEY=appy_pk_live_... EXPO_PUBLIC_APPY_LINK_DOMAIN=acme.appy.to npx expo run:ios
EXPO_PUBLIC_APPY_PUBLISHABLE_KEY=appy_pk_live_... EXPO_PUBLIC_APPY_LINK_DOMAIN=acme.appy.to npx expo run:android
```

Change `linkDomains` in `app.json`, and `bundleIdentifier` and `package` to an app registered with Appy, to test real Universal Links and App Links.

Open a link while the app runs and again after stopping it:

```bash
xcrun simctl openurl booted "https://acme.appy.to/spring?item=42"
xcrun simctl openurl booted "appyexample://items/42?appy_click_id=test"
adb shell 'am start -W -a android.intent.action.VIEW -d "appyexample://items/42?appy_click_id=test"'
```
