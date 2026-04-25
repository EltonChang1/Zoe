import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon } from "@/components/ui/Icon";
import {
  Body,
  Display,
  Headline,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { useBlockedUsers, useUnblockUser } from "@/lib/api";

const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=200&q=60";

/**
 * Blocked users — settings screen reachable from Profile → overflow.
 *
 * Shows every account the viewer has blocked with an Unblock affordance
 * next to each row. Keeping this a first-class surface is both App Store
 * policy (users must be able to review / undo blocks) and a good UX
 * reassurance — they know the switch is reversible.
 */
export default function BlockedUsersScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useBlockedUsers();
  const unblock = useUnblockUser();

  const items = data ?? [];

  const handleUnblock = (handle: string, displayName: string) => {
    Alert.alert(
      `Unblock ${displayName}?`,
      "They'll be able to see your posts again and you'll see theirs.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: () =>
            unblock.mutate(handle, {
              onError: (err) =>
                Alert.alert(
                  "Couldn't unblock",
                  err instanceof Error ? err.message : "Please try again.",
                ),
            }),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Icon name="arrow-back" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[18px] tracking-tightest">
            Blocked
          </Text>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-2">
          <LabelCaps className="text-primary">Moderation</LabelCaps>
          <Display className="mt-2 text-[28px] leading-[32px]">
            Blocked accounts
          </Display>
          <Body className="mt-2 leading-[20px]">
            Neither of you will see each other across feeds, search, comments,
            or profiles. Unblocking brings their content back into view.
          </Body>
        </View>

        {isLoading && items.length === 0 ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        ) : isError ? (
          <View className="px-6 mt-10 gap-3">
            <Headline>Couldn&apos;t load your blocks</Headline>
            <Button label="Try again" onPress={() => refetch()} />
          </View>
        ) : items.length === 0 ? (
          <View className="px-6 mt-10">
            <View className="bg-surface-container-low rounded-xl p-6 items-start">
              <LabelCaps>No blocked accounts</LabelCaps>
              <HeadlineItalic className="mt-1 text-primary">
                {"\u2014"}
              </HeadlineItalic>
              <Body className="mt-2">
                When you block someone, they&apos;ll show up here so you can
                unblock them later.
              </Body>
            </View>
          </View>
        ) : (
          <View className="mt-6">
            {items.map((item) => (
              <View
                key={item.user.id}
                className="flex-row items-center px-6 py-3"
              >
                <Avatar
                  uri={item.user.avatarUrl ?? AVATAR_FALLBACK}
                  size="md"
                />
                <View className="flex-1 ml-3">
                  <Text className="font-headline text-on-surface text-[15px]">
                    {item.user.displayName}
                  </Text>
                  <Label className="mt-0.5 text-on-surface-variant text-[12px]">
                    @{item.user.handle}
                  </Label>
                </View>
                <Pressable
                  onPress={() =>
                    handleUnblock(item.user.handle, item.user.displayName)
                  }
                  disabled={unblock.isPending}
                  className="px-4 py-2 rounded-full border border-outline-variant active:opacity-70"
                >
                  <Text className="font-label-semibold text-on-surface text-[13px]">
                    Unblock
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
