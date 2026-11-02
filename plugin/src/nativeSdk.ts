import fs from 'fs';
import path from 'path';

export type NativeSdkConfig = {
  source: 'local' | 'published';
  version: string;
  ios: { gitUrl: string; localPath: string };
  android: { coordinates: string; localRepository: string };
};

export const packageRoot = fs.realpathSync(path.join(__dirname, '..', '..'));

export function readNativeSdkConfig(root: string = packageRoot): NativeSdkConfig {
  return JSON.parse(fs.readFileSync(path.join(root, 'native-sdk.json'), 'utf8')) as NativeSdkConfig;
}

export function appySdkPodLine(config: NativeSdkConfig, root: string = packageRoot): string {
  if (config.source === 'local') {
    return `pod 'AppySDK', :path => '${path.resolve(root, config.ios.localPath)}'`;
  }
  return `pod 'AppySDK', :git => '${config.ios.gitUrl}', :tag => '${config.version}'`;
}
