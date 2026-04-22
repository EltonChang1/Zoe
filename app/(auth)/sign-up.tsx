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

const HANDLE_RX = /^[a-z0-9_.]{3,24}$/;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOk = HANDLE_RX.test(handle.toLowerCase());
  const canSubmit =
    displayName.trim().length > 0 &&
    handleOk &&
    email.length > 3 &&
    password.length >= 8 &&
    !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await signUp({ email, password, handle, displayName });
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
          <View className="mb-10">
            <LabelCaps className="text-primary mb-3">CREATE AN ACCOUNT</LabelCaps>
            <Display className="text-primary">
              Curate{"\n"}
              <HeadlineItalic className="text-[40px] leading-[44px] text-primary">
                your taste.
              </HeadlineItalic>
            </Display>
            <Body className="mt-4 text-on-surface-variant text-[15px] leading-[22px]">
              Rank what stays with you. Let the rest be noise.
            </Body>
          </View>

          <View className="gap-8">
            <Field
              label="DISPLAY NAME"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Clara Vance"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
            <Field
              label="HANDLE"
              value={handle}
              onChangeText={(v) => setHandle(v.toLowerCase())}
              placeholder="clara.v"
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              helper={
                handle && !handleOk
                  ? "3–24 chars, lowercase letters, digits, . or _"
                  : undefined
              }
            />
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
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
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
              label={busy ? "Creating account…" : "Create account"}
              onPress={handleSubmit}
              disabled={!canSubmit}
              full
            />
            <Link href="/(auth)/sign-in" asChild>
              <Pressable className="py-3 active:opacity-70">
                <Body className="text-center text-primary text-[13px]">
                  Already have an account? <Body className="underline">Sign in</Body>
                </Body>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  label: string;
  helper?: string;
}

function Field({ label, helper, ...input }: FieldProps) {
  return (
    <View>
      <LabelCaps className="text-primary mb-2">{label}</LabelCaps>
      <TextInput
        placeholderTextColor="#9A8E89"
        {...input}
        className="border-b border-outline-variant/40 pb-2 text-[18px] text-on-surface font-body"
        style={{ fontFamily: undefined }}
      />
      {helper && (
        <Body className="mt-2 text-[12px] text-on-surface-variant/80">
          {helper}
        </Body>
      )}
    </View>
  );
}
