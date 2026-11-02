# Changelog

All notable changes to `react-native-appy` are documented in this file. The package follows [Semantic Versioning](https://semver.org).

## 1.0.0 - Unreleased

First release, built on the Appy iOS SDK 1.0 and the Appy Android SDK 1.0.

### Added

- `configure()` with publishable key, link domains, log level, `openDeferredDeepLinks`, deferred deep link timeout, launch link wait, request timeout, API base URL, and Android `collectInstallReferrer` and `metaAppId`. A second call in the same process, for example after a JavaScript reload, is ignored.
- `emailLinkDomains` in `configure()`, passed to the native SDKs, for email click-tracking domains that open the app; `isAppyLink()` matches them too.
- `addDeepLinkListener()` with the typed `AppyDeepLinkResult` union (`found`, `notFound`, `failed` with `timeout`, `network` or `invalidResponse`). The first launch after install is answered exactly once; every Appy link that opens the app, cold or warm, is delivered as `found`. A result that arrives while no listener is registered is delivered once to the next listener.
- `addAttributionListener()` and `getAttribution()` with organic or attributed installs, link, UTM source, medium and campaign, click time and Google Ads or Meta network data.
- `getLatestDeepLink()`, `handleUrl()` for links from notifications and QR scanners, `buildLink()` for share links, and `isAppyLink()` for Expo Router's `+native-intent` and React Navigation.
- `track()` with properties, revenue, currency and `deduplicationId`; `flush()`.
- `setUserId()`, `setTrackingEnabled()` and `isTrackingEnabled()`.
- `nativeSdkVersion()` and `pluginVersion`.
- Expo config plugin: Associated Domains (`applinks:`, optionally with `?mode=developer`), an `autoVerify` App Link intent filter on the main activity, the `AppySDK` pod in the Podfile, and Android Auto Backup rules that keep the first launch after a reinstall.
- Links reach the native SDK from the app delegate (and scene events forwarded by `ExpoAppDelegate`) on iOS and from the React activity on Android, without native code in the app. React Native's `Linking` still receives every link.
- Minimum versions: Expo SDK 54, iOS 15.1, Android 5.0 (API 21).
