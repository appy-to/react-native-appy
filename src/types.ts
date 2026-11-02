export type AppyLogLevel = 'none' | 'error' | 'warning' | 'info' | 'debug';

export type AppyError = 'timeout' | 'network' | 'invalidResponse';

export type AppyConfiguration = {
  publishableKey: string;
  linkDomains?: string[];
  emailLinkDomains?: string[];
  logLevel?: AppyLogLevel;
  openDeferredDeepLinks?: boolean;
  deferredDeepLinkTimeoutMs?: number;
  launchLinkWaitMs?: number;
  requestTimeoutMs?: number;
  apiBaseUrl?: string;
  android?: {
    collectInstallReferrer?: boolean;
    metaAppId?: string;
  };
};

export type AppyDeepLink = {
  url: string | null;
  deeplinkUrl: string | null;
  slug: string;
  parameters: Record<string, string>;
  isDeferred: boolean;
  clickedAt: Date | null;
};

export type AppyDeepLinkResult =
  | { status: 'found'; link: AppyDeepLink }
  | { status: 'notFound' }
  | { status: 'failed'; error: AppyError };

export type AppyAdNetwork = {
  name: string;
  campaignId: string | null;
  campaignName: string | null;
  adGroupId: string | null;
  adGroupName: string | null;
  adId: string | null;
  clickId: string | null;
  touch: string | null;
};

export type AppyAttribution = {
  isOrganic: boolean;
  linkSlug: string | null;
  linkTitle: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  clickedAt: Date | null;
  network: AppyAdNetwork | null;
};

export type AppyEventProperties = Record<string, string | number | boolean>;

export type AppyTrackOptions = {
  properties?: AppyEventProperties;
  revenue?: number;
  currency?: string;
  deduplicationId?: string;
};

export type AppySubscription = {
  remove(): void;
};

export type NativeDeepLink = {
  url?: string | null;
  deeplinkUrl?: string | null;
  slug?: string | null;
  parameters?: Record<string, string> | null;
  isDeferred?: boolean | null;
  clickedAtMillis?: number | null;
};

export type NativeDeepLinkResult = {
  status: string;
  link?: NativeDeepLink | null;
  error?: string | null;
};

export type NativeAdNetwork = { name?: string | null } & Partial<Record<Exclude<keyof AppyAdNetwork, 'name'>, string | null>>;

export type NativeAttribution = {
  isOrganic?: boolean | null;
  linkSlug?: string | null;
  linkTitle?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  clickedAtMillis?: number | null;
  network?: NativeAdNetwork | null;
};
