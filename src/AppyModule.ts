import { NativeModule, requireNativeModule } from 'expo';

import type { NativeAttribution, NativeDeepLink, NativeDeepLinkResult } from './types';

type AppyModuleEvents = {
  onDeepLink: (result: NativeDeepLinkResult) => void;
  onAttribution: (attribution: NativeAttribution) => void;
};

declare class AppyNativeModule extends NativeModule<AppyModuleEvents> {
  readonly nativeSdkVersion: string;
  configure(configuration: Record<string, unknown>): void;
  handleUrl(url: string): Promise<boolean>;
  track(name: string, options: Record<string, unknown>): void;
  setUserId(userId: string | null): void;
  setTrackingEnabled(enabled: boolean): void;
  isTrackingEnabled(): Promise<boolean>;
  buildLink(slug: string, parameters: Record<string, string>): Promise<string | null>;
  flush(): void;
  getAttribution(): Promise<NativeAttribution | null>;
  getLatestDeepLink(): Promise<NativeDeepLink | null>;
}

export default requireNativeModule<AppyNativeModule>('Appy');
