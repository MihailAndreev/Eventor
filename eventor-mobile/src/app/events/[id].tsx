import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  void id;

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
