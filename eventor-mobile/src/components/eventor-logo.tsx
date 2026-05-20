import { Asset } from 'expo-asset';
import { StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

const eventorIcon = Asset.fromModule(require('../assets/eventor-icon.svg'));

export function EventorLogo() {
  return (
    <View accessibilityLabel="Eventor logo" style={styles.logo}>
      <SvgUri height={78} uri={eventorIcon.uri} width={78} />
      <Text style={styles.logoText}>Eventor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoText: {
    color: '#004f6e',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
