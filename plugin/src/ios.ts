export const ASSOCIATED_DOMAINS_KEY = 'com.apple.developer.associated-domains';

export function addAssociatedDomains(
  entitlements: Record<string, any>,
  linkDomains: string[],
  developerMode: boolean
): Record<string, any> {
  const existing: string[] = Array.isArray(entitlements[ASSOCIATED_DOMAINS_KEY]) ? entitlements[ASSOCIATED_DOMAINS_KEY] : [];
  const wanted = linkDomains.flatMap((domain) =>
    developerMode ? [`applinks:${domain}`, `applinks:${domain}?mode=developer`] : [`applinks:${domain}`]
  );
  return {
    ...entitlements,
    [ASSOCIATED_DOMAINS_KEY]: [...existing, ...wanted.filter((entry) => !existing.includes(entry))],
  };
}

export function addAppySdkPod(podfile: string, podLine: string): string {
  const existing = /^([ \t]*)pod ['"]AppySDK['"].*$/m;
  if (existing.test(podfile)) {
    return podfile.replace(existing, (_line, indent: string) => `${indent}${podLine}`);
  }
  const anchors = [/^([ \t]*)use_expo_modules!.*$/m, /^([ \t]*)config = use_native_modules!.*$/m, /^target ['"][^'"]+['"] do.*$/m];
  for (const anchor of anchors) {
    const match = anchor.exec(podfile);
    if (match) {
      const indent = match[1] ?? '  ';
      const end = match.index + match[0].length;
      return `${podfile.slice(0, end)}\n${indent || '  '}${podLine}${podfile.slice(end)}`;
    }
  }
  throw new Error(`Could not find where to add ${podLine} in the Podfile. Add it inside your app target.`);
}
