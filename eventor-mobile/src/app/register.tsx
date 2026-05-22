import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError('Name, email, and password are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register({ name: trimmedName, email: trimmedEmail, password });
      router.replace('/events');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.header}>
              <Text style={styles.title}>Register</Text>
              <Text style={styles.subtitle}>Create your Eventor account to join group events.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                autoComplete="name"
                editable={!isSubmitting}
                onChangeText={setName}
                placeholder="Your name"
                returnKeyType="next"
                style={styles.input}
                textContentType="name"
                value={name}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                editable={!isSubmitting}
                inputMode="email"
                onChangeText={setEmail}
                placeholder="you@example.com"
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                editable={!isSubmitting}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                placeholder="At least 8 characters"
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                textContentType="newPassword"
                value={password}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || isSubmitting) && styles.submitButtonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Register</Text>
              )}
            </Pressable>

            <Link href="/login" style={styles.homeLink}>
              Back to Login
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 48,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 18,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: '#18201c',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#4c5a52',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#18201c',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#cbd5cf',
    borderRadius: 8,
    paddingHorizontal: 14,
    color: '#18201c',
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f6b4f',
  },
  submitButtonPressed: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  homeLink: {
    color: '#0f6b4f',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
