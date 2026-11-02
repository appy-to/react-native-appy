import fs from 'fs';
import os from 'os';
import path from 'path';
import { AndroidConfig } from 'expo/config-plugins';

import { BACKUP_RULES_XML, addAppLinkIntentFilter, applyBackupRules } from '../android';
import withAppy, { normalizeLinkDomains } from '../index';
import { ASSOCIATED_DOMAINS_KEY, addAppySdkPod, addAssociatedDomains } from '../ios';
import { appySdkPodLine, packageRoot, readNativeSdkConfig } from '../nativeSdk';

const EXPO_PODFILE = `require File.join(File.dirname(\`node --print "require.resolve('expo/package.json')"\`), "scripts/autolinking")

platform :ios, podfile_properties['ios.deploymentTarget'] || '16.4'

target 'Example' do
  use_expo_modules!

  config = use_native_modules!(config_command)
end
`;

async function manifestFromXml(xml: string): Promise<AndroidConfig.Manifest.AndroidManifest> {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'appy-manifest-'));
  const file = path.join(directory, 'AndroidManifest.xml');
  fs.writeFileSync(file, xml);
  return AndroidConfig.Manifest.readAndroidManifestAsync(file);
}

function appManifest(applicationAttributes = 'android:allowBackup="true"', extraFilters = '') {
  return manifestFromXml(`<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application android:name=".MainApplication" ${applicationAttributes}>
    <activity android:name=".MainActivity" android:exported="true" android:launchMode="singleTask">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="acme"/>
      </intent-filter>
      ${extraFilters}
    </activity>
  </application>
</manifest>`);
}

describe('linkDomains option', () => {
  it('normalizes hosts and removes duplicates', () => {
    expect(normalizeLinkDomains(['Acme.Appy.to', 'https://acme.appy.to/', 'applinks:go.acme.com', ' go.acme.com '])).toEqual([
      'acme.appy.to',
      'go.acme.com',
    ]);
  });

  it('is required', () => {
    expect(() => normalizeLinkDomains(undefined)).toThrow('linkDomains');
    expect(() => normalizeLinkDomains([])).toThrow('linkDomains');
    expect(() => normalizeLinkDomains([42])).toThrow('host name');
  });

  it('fails the prebuild early when missing', () => {
    expect(() => withAppy({ name: 'Example', slug: 'example' }, {} as never)).toThrow('linkDomains');
  });
});

describe('iOS', () => {
  it('adds applinks entries next to existing associated domains', () => {
    const entitlements = addAssociatedDomains(
      { [ASSOCIATED_DOMAINS_KEY]: ['applinks:www.acme.com'], 'aps-environment': 'development' },
      ['acme.appy.to'],
      false
    );

    expect(entitlements).toEqual({
      [ASSOCIATED_DOMAINS_KEY]: ['applinks:www.acme.com', 'applinks:acme.appy.to'],
      'aps-environment': 'development',
    });
  });

  it('adds developer mode entries and stays idempotent', () => {
    const once = addAssociatedDomains({}, ['acme.appy.to'], true);
    const twice = addAssociatedDomains(once, ['acme.appy.to'], true);

    expect(twice[ASSOCIATED_DOMAINS_KEY]).toEqual(['applinks:acme.appy.to', 'applinks:acme.appy.to?mode=developer']);
  });

  it('adds the AppySDK pod after use_expo_modules!', () => {
    const podfile = addAppySdkPod(EXPO_PODFILE, "pod 'AppySDK', :git => 'https://github.com/appy-to/appy-ios-sdk.git', :tag => '1.0.0'");

    expect(podfile).toContain(
      "  use_expo_modules!\n  pod 'AppySDK', :git => 'https://github.com/appy-to/appy-ios-sdk.git', :tag => '1.0.0'\n"
    );
  });

  it('replaces an existing AppySDK pod line instead of adding a second one', () => {
    const local = addAppySdkPod(EXPO_PODFILE, "pod 'AppySDK', :path => '/tmp/appy/ios'");
    const published = addAppySdkPod(local, "pod 'AppySDK', :git => 'https://github.com/appy-to/appy-ios-sdk.git', :tag => '1.0.0'");

    expect(published.match(/pod 'AppySDK'/g)).toHaveLength(1);
    expect(published).toContain(":tag => '1.0.0'");
  });

  it('falls back to a bare React Native Podfile', () => {
    const podfile = "target 'Bare' do\n  config = use_native_modules!\nend\n";

    expect(addAppySdkPod(podfile, "pod 'AppySDK'")).toBe("target 'Bare' do\n  config = use_native_modules!\n  pod 'AppySDK'\nend\n");
  });

  it('refuses a Podfile without a target', () => {
    expect(() => addAppySdkPod('platform :ios', "pod 'AppySDK'")).toThrow('Podfile');
  });
});

describe('native SDK source', () => {
  it('reads native-sdk.json from the package', () => {
    const config = readNativeSdkConfig();

    expect(config.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(config.android.coordinates).toBe('to.appy:appy-sdk');
  });

  it('uses the local iOS SDK folder in local mode', () => {
    expect(
      appySdkPodLine({
        source: 'local',
        version: '1.0.0',
        ios: { gitUrl: 'https://github.com/appy-to/appy-ios-sdk.git', localPath: '../ios' },
        android: { coordinates: 'to.appy:appy-sdk', localRepository: '../android/build/local-maven' },
      })
    ).toBe(`pod 'AppySDK', :path => '${path.resolve(packageRoot, '../ios')}'`);
  });

  it('uses the Git tag of the native version in published mode', () => {
    expect(
      appySdkPodLine({
        source: 'published',
        version: '1.2.3',
        ios: { gitUrl: 'https://github.com/appy-to/appy-ios-sdk.git', localPath: '../ios' },
        android: { coordinates: 'to.appy:appy-sdk', localRepository: '../android/build/local-maven' },
      })
    ).toBe("pod 'AppySDK', :git => 'https://github.com/appy-to/appy-ios-sdk.git', :tag => '1.2.3'");
  });
});

describe('Android', () => {
  it('adds one autoVerify intent filter for the link domains', async () => {
    const manifest = addAppLinkIntentFilter(await appManifest(), ['acme.appy.to', 'go.acme.com']);
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    const appLinks = activity['intent-filter']!.filter((filter) => filter.$?.['android:autoVerify'] === 'true');

    expect(appLinks).toHaveLength(1);
    expect(appLinks[0].data!.map((data) => data.$)).toEqual([
      { 'android:scheme': 'https' },
      { 'android:host': 'acme.appy.to' },
      { 'android:host': 'go.acme.com' },
    ]);
    expect(appLinks[0].category!.map((category) => category.$['android:name'])).toEqual([
      'android.intent.category.DEFAULT',
      'android.intent.category.BROWSABLE',
    ]);
  });

  it('does not duplicate hosts that already have an https filter', async () => {
    const existing = `<intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https" android:host="acme.appy.to"/>
      </intent-filter>`;
    const manifest = await appManifest(undefined, existing);
    addAppLinkIntentFilter(manifest, ['acme.appy.to']);
    addAppLinkIntentFilter(manifest, ['acme.appy.to']);

    const filters = AndroidConfig.Manifest.getMainActivityOrThrow(manifest)['intent-filter']!;
    expect(filters.filter((filter) => filter.$?.['android:autoVerify'] === 'true')).toHaveLength(1);
  });

  it('excludes the SDK state from backups when the app has no rules', async () => {
    const manifest = await appManifest();

    expect(applyBackupRules(manifest)).toBe('added');
    expect(applyBackupRules(manifest)).toBe('already-added');
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    expect(application.$['android:fullBackupContent']).toBe('@xml/appy_backup_rules');
    expect(application.$['android:dataExtractionRules']).toBe('@xml/appy_data_extraction_rules');
    expect(BACKUP_RULES_XML).toContain('<exclude domain="sharedpref" path="to.appy.sdk.xml" />');
  });

  it('leaves custom backup rules and disabled backups alone', async () => {
    const custom = await appManifest('android:allowBackup="true" android:fullBackupContent="@xml/secure_store_backup_rules"');
    const disabled = await appManifest('android:allowBackup="false"');

    expect(applyBackupRules(custom)).toBe('custom-rules');
    expect(AndroidConfig.Manifest.getMainApplicationOrThrow(custom).$['android:fullBackupContent']).toBe(
      '@xml/secure_store_backup_rules'
    );
    expect(applyBackupRules(disabled)).toBe('backup-disabled');
    expect(AndroidConfig.Manifest.getMainApplicationOrThrow(disabled).$['android:fullBackupContent']).toBeUndefined();
  });
});

describe('plugin wiring', () => {
  it('registers the entitlements, manifest and Podfile mods', () => {
    const config = withAppy({ name: 'Example', slug: 'example' }, { linkDomains: ['acme.appy.to'] }) as any;

    expect(typeof config.mods.ios.entitlements).toBe('function');
    expect(typeof config.mods.ios.dangerous).toBe('function');
    expect(typeof config.mods.android.manifest).toBe('function');
    expect(config._internal.pluginHistory['react-native-appy']).toEqual({ name: 'react-native-appy', version: '1.0.0' });
  });
});
