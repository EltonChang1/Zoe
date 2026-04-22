import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
} from "react-native";

import { ActivityCard } from "@/components/cards/ActivityCard";
import { Avatar } from "@/components/ui/Avatar";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { HeadlineItalic, LabelCaps } from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { activity } from "@/data/activity";
import { currentUserId, getUser } from "@/data/users";

/**
 * Search / Following Activity — VDK §18.2, Design_guide/search_page/code.html.
 * Large Newsreader italic search input + stacked activity cards from followed curators.
 */
export default function SearchScreen() {
  const router = useRouter();
  const me = getUser(currentUserId);
  const [query, setQuery] = useState("");

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} className="active:opacity-70">
            <Icon name="tune" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[22px] tracking-tightest">
            Zoe
          </Text>
        }
        trailing={<Avatar uri={me.avatar} size="sm" />}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial search input */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center border-b border-outline-variant/40 pb-3">
            <Icon name="search" size={22} color="#504446" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for inspiration…"
              placeholderTextColor="rgba(80,68,70,0.6)"
              className="flex-1 ml-3 font-headline-italic text-on-surface text-[22px]"
              style={{ paddingVertical: 6 }}
            />
            <Pressable hitSlop={8} className="active:opacity-70">
              <Icon name="center-focus-weak" size={22} color="#504446" />
            </Pressable>
          </View>
        </View>

        {/* Following Activity header */}
        <View className="px-5 mb-5">
          <LabelCaps>Following activity</LabelCaps>
          <HeadlineItalic className="mt-1 text-primary text-[30px]">
            Your circle, ranked
          </HeadlineItalic>
        </View>

        {/* Activity feed */}
        <View className="px-5">
          {activity.map((a) => (
            <ActivityCard
              key={a.id}
              card={a}
              onPress={() => {
                if (a.objectId) {
                  // naive: route to the first post with this object
                  router.push(`/post/P001`);
                }
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
