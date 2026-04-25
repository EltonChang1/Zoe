import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Body, Display, LabelCaps } from "@/components/ui/Text";
import { ApiHttpError, useAuth } from "@/lib/api";
import { verifyEmail as verifyEmailRequest } from "@/lib/api/endpoints";

/**
 * Opens from the email deep link `zoe://verify-email?token=…`.
 * Works signed in (refreshes profile) or signed out (then sign in).
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const raw = params.token;
  const token = typeof raw === "string" ? raw : raw?.[0];
  const { refreshUser, isSignedIn } = useAuth();

  const ran = useRef(false);
  const [status, setStatus] = useState<"loading" | "ok" | "err">(
    token ? "loading" : "err",
  );
  const [message, setMessage] = useState<string | null>(
    token ? null : "Missing verification token. Open the link from your email.",
  );

  useEffect(() => {
    if (!token) return;
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        await verifyEmailRequest(token);
        if (isSignedIn) await refreshUser();
        setStatus("ok");
        setMessage(null);
      } catch (e) {
        setStatus("err");
        setMessage(
          e instanceof ApiHttpError
            ? e.message
            : "We couldn’t verify this link. It may have expired.",
        );
      }
    })();
  }, [token, isSignedIn, refreshUser]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-7 pt-16">
        <LabelCaps className="text-primary mb-3">EMAIL</LabelCaps>
        <Display className="text-primary text-[32px] leading-[38px]">
          {status === "ok" ? "Verified." : "Verify email"}
        </Display>

        {status === "loading" ? (
          <View className="mt-12 items-center">
            <ActivityIndicator size="large" color="#55343B" />
            <Body className="mt-6 text-on-surface-variant text-center">
              Confirming your address…
            </Body>
          </View>
        ) : status === "ok" ? (
          <View className="mt-10 gap-4">
            <Body className="text-on-surface-variant text-[15px] leading-[22px]">
              Your email is confirmed. You can continue in the app.
            </Body>
            <Button
              label="Continue"
              full
              onPress={() =>
                router.replace(isSignedIn ? "/(tabs)" : "/(auth)/sign-in")
              }
            />
          </View>
        ) : (
          <View className="mt-10 gap-4">
            <Body className="text-[#B3261E]">{message}</Body>
            <Button
              label="Back to sign in"
              full
              onPress={() => router.replace("/(auth)/sign-in")}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
