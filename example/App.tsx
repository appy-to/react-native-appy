import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Appy, { type AppyDeepLinkResult } from 'react-native-appy';

const publishableKey = process.env.EXPO_PUBLIC_APPY_PUBLISHABLE_KEY ?? 'appy_pk_test_replace_me';
const linkDomain = process.env.EXPO_PUBLIC_APPY_LINK_DOMAIN ?? 'acme.appy.to';
const apiBaseUrl = process.env.EXPO_PUBLIC_APPY_API_BASE_URL;

Appy.configure({
  publishableKey,
  linkDomains: [linkDomain],
  logLevel: 'debug',
  apiBaseUrl,
});

function describe(result: AppyDeepLinkResult): string {
  switch (result.status) {
    case 'found':
      return `Deep link: ${result.link.slug} ${JSON.stringify(result.link.parameters)} deferred=${result.link.isDeferred} → ${result.link.deeplinkUrl}`;
    case 'notFound':
      return 'First launch: no Appy link led to this install';
    case 'failed':
      return `First launch: no answer (${result.error})`;
  }
}

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const add = (line: string) => setLog((lines) => [line, ...lines]);

  useEffect(() => {
    const deepLinks = Appy.addDeepLinkListener((result) => add(describe(result)));
    const attributions = Appy.addAttributionListener((attribution) =>
      add(
        attribution.isOrganic
          ? 'Attribution: organic'
          : `Attribution: ${attribution.linkSlug ?? attribution.network?.name} (${attribution.source}/${attribution.medium}/${attribution.campaign})`
      )
    );
    const urls = Linking.addEventListener('url', ({ url }) => {
      if (!Appy.isAppyLink(url)) {
        add(`Other link: ${url}`);
      }
    });
    Appy.isTrackingEnabled().then(setTrackingEnabled);
    add(`Appy native SDK ${Appy.nativeSdkVersion()}, react-native-appy ${Appy.pluginVersion}`);
    return () => {
      deepLinks.remove();
      attributions.remove();
      urls.remove();
    };
  }, []);

  const trackPurchase = () => {
    Appy.track('purchase', {
      properties: { sku: 'A1', qty: 1 },
      revenue: 19.98,
      currency: 'USD',
      deduplicationId: `example-${Date.now()}`,
    });
    Appy.flush();
    add('Tracked purchase 19.98 USD');
  };

  const shareLink = async () => {
    const url = await Appy.buildLink('spring', { ref: 'example' });
    add(`Share link: ${url ?? 'needs a valid slug and link domain'}`);
  };

  const storedValues = async () => {
    const attribution = await Appy.getAttribution();
    const latest = await Appy.getLatestDeepLink();
    add(`Stored attribution: ${attribution ? JSON.stringify(attribution) : 'none yet'}, latest link: ${latest?.slug ?? 'none'}`);
  };

  const toggleTracking = (enabled: boolean) => {
    Appy.setTrackingEnabled(enabled);
    setTrackingEnabled(enabled);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appy example</Text>
      <View style={styles.buttons}>
        <Button title="Track purchase" onPress={trackPurchase} />
        <Button title="Build share link" onPress={shareLink} />
        <Button title="Stored values" onPress={storedValues} />
      </View>
      <View style={styles.row}>
        <Text>Tracking enabled</Text>
        <Switch value={trackingEnabled} onValueChange={toggleTracking} />
      </View>
      <ScrollView style={styles.log} testID="appy-log">
        {log.map((line, index) => (
          <Text key={`${index}-${line}`} style={styles.line}>
            {line}
          </Text>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  buttons: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 },
  log: { flex: 1 },
  line: { paddingVertical: 4 },
});
