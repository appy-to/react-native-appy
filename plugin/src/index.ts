import fs from 'fs';
import path from 'path';
import {
  type ConfigPlugin,
  WarningAggregator,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withEntitlementsPlist,
} from 'expo/config-plugins';

import {
  BACKUP_RULES_FILE,
  BACKUP_RULES_XML,
  DATA_EXTRACTION_RULES_FILE,
  DATA_EXTRACTION_RULES_XML,
  addAppLinkIntentFilter,
  applyBackupRules,
} from './android';
import { addAppySdkPod, addAssociatedDomains } from './ios';
import { appySdkPodLine, readNativeSdkConfig } from './nativeSdk';

const pkg = require('../../package.json') as { name: string; version: string };

export type AppyPluginProps = {
  linkDomains: string[];
  ios?: { developerMode?: boolean };
  android?: { excludeFromBackup?: boolean };
};

export function normalizeLinkDomains(linkDomains: unknown): string[] {
  if (!Array.isArray(linkDomains) || linkDomains.length === 0) {
    throw new Error(`${pkg.name}: set "linkDomains", for example ["acme.appy.to"], in the plugin options in app.json.`);
  }
  const domains = linkDomains.map((domain) => {
    if (typeof domain !== 'string') {
      throw new Error(`${pkg.name}: every entry of "linkDomains" must be a host name such as "acme.appy.to".`);
    }
    return domain
      .trim()
      .toLowerCase()
      .replace(/^applinks:/, '')
      .replace(/^[a-z]+:\/\//, '')
      .replace(/[/?#].*$/, '');
  });
  return [...new Set(domains.filter((domain) => domain.length > 0))];
}

const withAppyIos: ConfigPlugin<{ linkDomains: string[]; developerMode: boolean }> = (config, { linkDomains, developerMode }) => {
  config = withEntitlementsPlist(config, (config) => {
    config.modResults = addAssociatedDomains(config.modResults, linkDomains, developerMode);
    return config;
  });
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        const podfile = fs.readFileSync(podfilePath, 'utf8');
        fs.writeFileSync(podfilePath, addAppySdkPod(podfile, appySdkPodLine(readNativeSdkConfig())));
      } else {
        WarningAggregator.addWarningIOS(pkg.name, `No Podfile found; add ${appySdkPodLine(readNativeSdkConfig())} to your app target.`);
      }
      return config;
    },
  ]);
};

const withAppyAndroid: ConfigPlugin<{ linkDomains: string[]; excludeFromBackup: boolean }> = (
  config,
  { linkDomains, excludeFromBackup }
) =>
  withAndroidManifest(config, (config) => {
    addAppLinkIntentFilter(config.modResults, linkDomains);
    if (!excludeFromBackup) {
      return config;
    }
    const outcome = applyBackupRules(config.modResults);
    if (outcome === 'added' || outcome === 'already-added') {
      const xmlDirectory = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDirectory, { recursive: true });
      fs.writeFileSync(path.join(xmlDirectory, `${BACKUP_RULES_FILE}.xml`), BACKUP_RULES_XML);
      fs.writeFileSync(path.join(xmlDirectory, `${DATA_EXTRACTION_RULES_FILE}.xml`), DATA_EXTRACTION_RULES_XML);
    } else if (outcome === 'custom-rules') {
      WarningAggregator.addWarningAndroid(
        pkg.name,
        'Your app already sets backup rules. Add <exclude domain="sharedpref" path="to.appy.sdk.xml" /> to them so a reinstall keeps its first launch.'
      );
    }
    return config;
  });

const withAppy: ConfigPlugin<AppyPluginProps> = (config, props) => {
  const linkDomains = normalizeLinkDomains(props?.linkDomains);
  config = withAppyIos(config, { linkDomains, developerMode: props.ios?.developerMode ?? false });
  return withAppyAndroid(config, { linkDomains, excludeFromBackup: props.android?.excludeFromBackup ?? true });
};

export default createRunOncePlugin(withAppy, pkg.name, pkg.version);
