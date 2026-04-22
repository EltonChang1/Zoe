import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Body, Display, HeadlineItalic, LabelCaps } from "@/components/ui/Text";
import { ApiHttpError, useAuth } from "@/lib/api";

/**
 * Sign-in screen.
 *
 * Editorial layout (VDK §18.x):
 *  - Generous top space; Display + italic tagline dominate the hero.
 *  - Inputs are tonal, no bounding boxes — only thin underlines.
 *  - Primary CTA uses the gradient wordmark treatment via Button.
 */
export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.length > 3 && password.length >= 6 && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await signIn({ email, password });
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiHttpError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-12">
            <LabelCaps className="text-primary mb-3">SIGN IN</LabelCaps>
            <Display className="text-primary">
              Welcome{"\n"}
              <HeadlineItalic className="text-[40px] leading-[44px] text-primary">
                back.
              </HeadlineItalic>
            </Display>
            <Body className="mt-4 text-on-surface-variant text-[15px] leading-[22px]">
              A curated, personal taste library. Rank what stays with you.
            </Body>
          </View>

          <View className="gap-8">
            <Field
              label="EMAIL"
              value={email}
              onChangeText={setEmail}
              placeholder="clara@zoe.app"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Field
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error && (
            <View className="mt-6">
              <Body className="text-[#B3261E]">{error}</Body>
            </View>
          )}

          <View className="mt-10 gap-3">
            <Button
              label={busy ? "Signing in…" : "Sign in"}
              onPress={handleSubmit}
              disabled={!canSubmit}
              full
            />
            <Link href="/(auth)/sign-up" asChild>
              <Pressable className="py-3 active:opacity-70">
                <Body className="text-center text-primary text-[13px]">
                  Don&apos;t have an account? <Body className="underline">Join Zoe</Body>
                </Body>
              </Pressable>
            </Link>
          </View>

          <View className="mt-16 items-center">
            <LabelCaps className="text-on-surface-variant/60">
              MODERN · CURATOR · EDITORIAL
            </LabelCaps>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  label: string;
}

function Field({ label, ...input }: FieldProps) {
  return (
    <View>
      <LabelCaps className="text-primary mb-2">{label}</LabelCaps>
      <TextInput
        placeholderTextColor="#9A8E89"
        {...input}
        className="border-b border-outline-variant/40 pb-2 text-[18px] text-on-surface font-body"
        style={{ fontFamily: undefined }}
      />
    </View>
  );
}
