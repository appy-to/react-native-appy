import {
  addAttributionListener,
  addDeepLinkListener,
  buildLink,
  configure,
  flush,
  getAttribution,
  getLatestDeepLink,
  handleUrl,
  isAppyLink,
  isTrackingEnabled,
  nativeSdkVersion,
  pluginVersion,
  setTrackingEnabled,
  setUserId,
  track,
} from './Appy';

export type {
  AppyAdNetwork,
  AppyAttribution,
  AppyConfiguration,
  AppyDeepLink,
  AppyDeepLinkResult,
  AppyError,
  AppyEventProperties,
  AppyLogLevel,
  AppySubscription,
  AppyTrackOptions,
} from './types';

export {
  addAttributionListener,
  addDeepLinkListener,
  buildLink,
  configure,
  flush,
  getAttribution,
  getLatestDeepLink,
  handleUrl,
  isAppyLink,
  isTrackingEnabled,
  nativeSdkVersion,
  pluginVersion,
  setTrackingEnabled,
  setUserId,
  track,
};

const Appy = {
  addAttributionListener,
  addDeepLinkListener,
  buildLink,
  configure,
  flush,
  getAttribution,
  getLatestDeepLink,
  handleUrl,
  isAppyLink,
  isTrackingEnabled,
  nativeSdkVersion,
  pluginVersion,
  setTrackingEnabled,
  setUserId,
  track,
};

export default Appy;
