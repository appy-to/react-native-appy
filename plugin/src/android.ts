import { AndroidConfig } from 'expo/config-plugins';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;
type IntentFilter = NonNullable<AndroidConfig.Manifest.ManifestActivity['intent-filter']>[number];

export const BACKUP_RULES_FILE = 'appy_backup_rules';
export const DATA_EXTRACTION_RULES_FILE = 'appy_data_extraction_rules';

export const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="sharedpref" path="to.appy.sdk.xml" />
</full-backup-content>
`;

export const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="sharedpref" path="to.appy.sdk.xml" />
    </cloud-backup>
    <device-transfer>
        <exclude domain="sharedpref" path="to.appy.sdk.xml" />
    </device-transfer>
</data-extraction-rules>
`;

export function addAppLinkIntentFilter(manifest: AndroidManifest, linkDomains: string[]): AndroidManifest {
  const activity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
  const filters = (activity['intent-filter'] ??= []);
  const covered = new Set(filters.filter(isHttpsViewFilter).flatMap(hostsOf));
  const missing = linkDomains.filter((domain) => !covered.has(domain));
  if (missing.length > 0) {
    filters.push({
      $: { 'android:autoVerify': 'true' },
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [{ $: { 'android:scheme': 'https' } }, ...missing.map((host) => ({ $: { 'android:host': host } }))],
    } as IntentFilter);
  }
  return manifest;
}

export type BackupRulesOutcome = 'added' | 'already-added' | 'backup-disabled' | 'custom-rules';

export function applyBackupRules(manifest: AndroidManifest): BackupRulesOutcome {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  const attributes = application.$ as Record<string, string | undefined>;
  if (attributes['android:allowBackup'] === 'false') {
    return 'backup-disabled';
  }
  const fullBackup = attributes['android:fullBackupContent'];
  const extraction = attributes['android:dataExtractionRules'];
  if (fullBackup === `@xml/${BACKUP_RULES_FILE}` && extraction === `@xml/${DATA_EXTRACTION_RULES_FILE}`) {
    return 'already-added';
  }
  if (fullBackup || extraction) {
    return 'custom-rules';
  }
  attributes['android:fullBackupContent'] = `@xml/${BACKUP_RULES_FILE}`;
  attributes['android:dataExtractionRules'] = `@xml/${DATA_EXTRACTION_RULES_FILE}`;
  return 'added';
}

function isHttpsViewFilter(filter: IntentFilter): boolean {
  const isView = (filter.action ?? []).some((action) => action.$['android:name'] === 'android.intent.action.VIEW');
  const isHttps = (filter.data ?? []).some((data) => data.$['android:scheme'] === 'https');
  return isView && isHttps;
}

function hostsOf(filter: IntentFilter): string[] {
  return (filter.data ?? []).map((data) => data.$['android:host']).filter((host): host is string => typeof host === 'string');
}
