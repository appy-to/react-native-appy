import AppyModule from './AppyModule';
import type {
  AppyAttribution,
  AppyConfiguration,
  AppyDeepLink,
  AppyDeepLinkResult,
  AppyError,
  AppyEventProperties,
  AppySubscription,
  AppyTrackOptions,
  NativeAttribution,
  NativeDeepLink,
  NativeDeepLinkResult,
} from './types';

export const pluginVersion = '1.0.0';

let configuredLinkDomains: string[] = [];

export function decodeDeepLink(raw: NativeDeepLink): AppyDeepLink {
  return {
    url: raw.url ?? null,
    deeplinkUrl: raw.deeplinkUrl ?? null,
    slug: raw.slug ?? '',
    parameters: { ...(raw.parameters ?? {}) },
    isDeferred: raw.isDeferred ?? false,
    clickedAt: toDate(raw.clickedAtMillis),
  };
}

export function decodeDeepLinkResult(raw: NativeDeepLinkResult): AppyDeepLinkResult {
  switch (raw.status) {
    case 'found':
      return { status: 'found', link: decodeDeepLink(raw.link ?? {}) };
    case 'notFound':
      return { status: 'notFound' };
    case 'failed':
      return { status: 'failed', error: toError(raw.error) };
    default:
      throw new Error(`Unknown deep link status from the native Appy SDK: ${String(raw.status)}`);
  }
}

export function decodeAttribution(raw: NativeAttribution): AppyAttribution {
  const network = raw.network;
  return {
    isOrganic: raw.isOrganic ?? true,
    linkSlug: raw.linkSlug ?? null,
    linkTitle: raw.linkTitle ?? null,
    source: raw.source ?? null,
    medium: raw.medium ?? null,
    campaign: raw.campaign ?? null,
    clickedAt: toDate(raw.clickedAtMillis),
    network: network
      ? {
          name: network.name ?? '',
          campaignId: network.campaignId ?? null,
          campaignName: network.campaignName ?? null,
          adGroupId: network.adGroupId ?? null,
          adGroupName: network.adGroupName ?? null,
          adId: network.adId ?? null,
          clickId: network.clickId ?? null,
          touch: network.touch ?? null,
        }
      : null,
  };
}

export function configure(configuration: AppyConfiguration): void {
  configuredLinkDomains = [...(configuration.linkDomains ?? []), ...(configuration.emailLinkDomains ?? [])].map(normalizeHost);
  AppyModule.configure({
    publishableKey: configuration.publishableKey,
    linkDomains: configuration.linkDomains ?? [],
    emailLinkDomains: configuration.emailLinkDomains ?? [],
    logLevel: configuration.logLevel ?? 'error',
    openDeferredDeepLinks: configuration.openDeferredDeepLinks ?? false,
    deferredDeepLinkTimeoutMillis: configuration.deferredDeepLinkTimeoutMs ?? 5000,
    launchLinkWaitMillis: configuration.launchLinkWaitMs ?? 500,
    requestTimeoutMillis: configuration.requestTimeoutMs ?? 10000,
    apiBaseUrl: configuration.apiBaseUrl ?? null,
    android: {
      collectInstallReferrer: configuration.android?.collectInstallReferrer ?? true,
      metaAppId: configuration.android?.metaAppId ?? null,
    },
  });
}

export function addDeepLinkListener(listener: (result: AppyDeepLinkResult) => void): AppySubscription {
  return AppyModule.addListener('onDeepLink', (raw) => listener(decodeDeepLinkResult(raw)));
}

export function addAttributionListener(listener: (attribution: AppyAttribution) => void): AppySubscription {
  return AppyModule.addListener('onAttribution', (raw) => listener(decodeAttribution(raw)));
}

export async function getAttribution(): Promise<AppyAttribution | null> {
  const raw = await AppyModule.getAttribution();
  return raw ? decodeAttribution(raw) : null;
}

export async function getLatestDeepLink(): Promise<AppyDeepLink | null> {
  const raw = await AppyModule.getLatestDeepLink();
  return raw ? decodeDeepLink(raw) : null;
}

export function handleUrl(url: string): Promise<boolean> {
  return AppyModule.handleUrl(url);
}

export function track(name: string, options: AppyTrackOptions = {}): void {
  AppyModule.track(name, {
    properties: supportedProperties(options.properties ?? {}),
    revenue: typeof options.revenue === 'number' && Number.isFinite(options.revenue) ? options.revenue : null,
    currency: options.currency ?? null,
    deduplicationId: options.deduplicationId ?? null,
  });
}

export function setUserId(userId: string | null): void {
  AppyModule.setUserId(userId);
}

export function setTrackingEnabled(enabled: boolean): void {
  AppyModule.setTrackingEnabled(enabled);
}

export function isTrackingEnabled(): Promise<boolean> {
  return AppyModule.isTrackingEnabled();
}

export function buildLink(slug: string, parameters: Record<string, string> = {}): Promise<string | null> {
  return AppyModule.buildLink(slug, parameters);
}

export function flush(): void {
  AppyModule.flush();
}

export function nativeSdkVersion(): string {
  return AppyModule.nativeSdkVersion;
}

export function isAppyLink(url: string, linkDomains: string[] = configuredLinkDomains): boolean {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)[^?#]*(\?[^#]*)?/i.exec(url.trim());
  if (!match) {
    return false;
  }
  const [, scheme, authority, query = ''] = match;
  if (/(^\?|&)appy_click_id=/i.test(query)) {
    return true;
  }
  const isWeb = scheme.toLowerCase() === 'http' || scheme.toLowerCase() === 'https';
  const host = authority.replace(/^.*@/, '').replace(/:\d+$/, '').toLowerCase();
  return isWeb && linkDomains.map(normalizeHost).includes(host);
}

function normalizeHost(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^applinks:/, '')
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '');
}

function supportedProperties(properties: AppyEventProperties): AppyEventProperties {
  const supported: AppyEventProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      supported[key] = value;
    }
  }
  return supported;
}

function toDate(millis: number | null | undefined): Date | null {
  return typeof millis === 'number' && Number.isFinite(millis) ? new Date(millis) : null;
}

function toError(raw: string | null | undefined): AppyError {
  return raw === 'timeout' || raw === 'network' ? raw : 'invalidResponse';
}
