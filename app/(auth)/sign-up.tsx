import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import type { ImagePickerAsset } from "expo-image-picker";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Body, Display, HeadlineItalic, LabelCaps } from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { DEFAULT_BOT_AVATAR_URL } from "@/lib/avatar";
import { ApiHttpError, useAuth } from "@/lib/api";
import { pickImage } from "@/lib/api/uploads";

const HANDLE_RX = /^[a-z0-9_.]{3,24}$/;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarAsset, setAvatarAsset] = useState<ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOk = HANDLE_RX.test(handle.toLowerCase());
  const canSubmit =
    displayName.trim().length > 0 &&
    handleOk &&
    email.length > 3 &&
    password.length >= 8 &&
    !photoBusy &&
    !busy;

  const chooseAvatar = async () => {
    setPhotoBusy(true);
    setError(null);
    try {
      const picked = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.86,
      });
      if (picked) setAvatarAsset(picked);
    } catch (err) {
      setError(
        err instanceof ApiHttpError
          ? err.message
          : "Could not open your photo library. Try again.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await signUp({ email, password, handle, displayName, avatarAsset });
      Alert.alert(
        "Check your email",
        "We sent a link to verify your address. You can keep using Zoe while it’s pending.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
        { cancelable: true, onDismiss: () => router.replace("/(tabs)") },
      );
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 409) {
        setError(
          "That email or handle is already taken. Use Sign in, or try another email / handle.",
        );
      } else {
        setError(
          err instanceof ApiHttpError
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
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

          <View className="mb-10 items-center">
            <Pressable
              onPress={chooseAvatar}
              disabled={busy || photoBusy}
              accessibilityRole="button"
              accessibilityLabel={
                avatarAsset ? "Change profile photo" : "Add profile photo"
              }
              className="active:opacity-80"
            >
              <View className="h-28 w-28 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-low">
                <Image
                  source={{ uri: avatarAsset?.uri ?? DEFAULT_BOT_AVATAR_URL }}
                  style={{ width: 104, height: 104, borderRadius: 52 }}
                  contentFit="cover"
                  transition={160}
                />
                <View className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border border-background bg-primary">
                  <Icon name="photo-camera" size={18} color="#FFF7F0" />
                </View>
              </View>
            </Pressable>
            <View className="mt-4 flex-row items-center gap-4">
              <Pressable
                onPress={chooseAvatar}
                disabled={busy || photoBusy}
                className="active:opacity-70"
              >
                <Body className="text-primary text-[13px] underline">
                  {avatarAsset
                    ? "Change profile photo"
                    : photoBusy
                      ? "Opening photos..."
                      : "Add profile photo"}
                </Body>
              </Pressable>
              {avatarAsset ? (
                <Pressable
                  onPress={() => setAvatarAsset(null)}
                  disabled={busy}
                  className="active:opacity-70"
                >
                  <Body className="text-on-surface-variant text-[13px]">
                    Use default
                  </Body>
                </Pressable>
              ) : null}
            </View>
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
            <SocialAuthButtons
              mode="sign-up"
              onSuccess={(result) =>
                router.replace(
                  (result.onboardingRequired ? "/complete-profile" : "/(tabs)") as never,
                )
              }
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
