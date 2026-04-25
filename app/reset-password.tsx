import { useLocalSearchParams, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Body, Display, LabelCaps } from "@/components/ui/Text";
import { ApiHttpError } from "@/lib/api";
import { resetPassword as resetPasswordRequest } from "@/lib/api/endpoints";

/** Deep link: `zoe://reset-password?token=…` */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const raw = params.token;
  const token = typeof raw === "string" ? raw : raw?.[0];

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    Boolean(token) &&
    password.length >= 8 &&
    password === confirm &&
    !busy;

  const submit = async () => {
    if (!token || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await resetPasswordRequest(token, password);
      router.replace("/(auth)/sign-in");
    } catch (e) {
      setError(
        e instanceof ApiHttpError
          ? e.message
          : "Could not reset password. Try requesting a new link.",
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
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: 48,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <LabelCaps className="text-primary mb-3">PASSWORD</LabelCaps>
          <Display className="text-primary text-[32px] leading-[38px]">
            Choose a new password
          </Display>
          {!token ? (
            <Body className="mt-8 text-[#B3261E]">
              Missing reset token. Open the link from your email.
            </Body>
          ) : (
            <View className="mt-10 gap-8">
              <Field
                label="NEW PASSWORD"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                textContentType="newPassword"
              />
              <Field
                label="CONFIRM"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                textContentType="newPassword"
                onSubmitEditing={submit}
              />
              {error ? (
                <Body className="text-[#B3261E]">{error}</Body>
              ) : null}
              <Button
                label={busy ? "Saving…" : "Update password"}
                onPress={submit}
                disabled={!canSubmit}
                full
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps extends ComponentProps<typeof TextInput> {
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
