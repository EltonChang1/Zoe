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
import { ApiHttpError } from "@/lib/api";
import { forgotPassword } from "@/lib/api/endpoints";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.includes("@") && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiHttpError
          ? e.message
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
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: 48,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10">
            <LabelCaps className="text-primary mb-3">RESET</LabelCaps>
            <Display className="text-primary">
              Forgot{"\n"}
              <HeadlineItalic className="text-[40px] leading-[44px] text-primary">
                password.
              </HeadlineItalic>
            </Display>
            <Body className="mt-4 text-on-surface-variant text-[15px] leading-[22px]">
              {done
                ? "If an account exists for that email, we sent a reset link. Check your inbox."
                : "Enter your email and we’ll send a link to choose a new password."}
            </Body>
          </View>

          {!done ? (
            <View className="gap-8">
              <View>
                <LabelCaps className="text-primary mb-2">EMAIL</LabelCaps>
                <TextInput
                  placeholderTextColor="#9A8E89"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="clara@zoe.app"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  className="border-b border-outline-variant/40 pb-2 text-[18px] text-on-surface font-body"
                  style={{ fontFamily: undefined }}
                  onSubmitEditing={submit}
                />
              </View>
              {error ? <Body className="text-[#B3261E]">{error}</Body> : null}
              <Button
                label={busy ? "Sending…" : "Send reset link"}
                onPress={submit}
                disabled={!canSubmit}
                full
              />
            </View>
          ) : (
            <Button label="Back to sign in" onPress={() => router.back()} full />
          )}

          <Link href="/(auth)/sign-in" asChild>
            <Pressable className="mt-8 py-3 active:opacity-70">
              <Body className="text-center text-primary text-[13px] underline">
                Sign in
              </Body>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
