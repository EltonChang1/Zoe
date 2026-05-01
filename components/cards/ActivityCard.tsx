import { Image } from "expo-image";
import { Pressable, View, Text } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Body, HeadlineItalic, Label } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import type { ActivityCard as ActivityCardType } from "@/data/types";
import { getUser } from "@/data/users";
import { getObject } from "@/data/objects";
import { displayObjectType } from "@/lib/objects/display";

/**
 * Following activity card (VDK §16.3, §18.2).
 * Actor line on top, rich artifact card below, optional rank movement corner.
 */
export function ActivityCard({
  card,
  onPress,
}: {
  card: ActivityCardType;
  onPress?: () => void;
}) {
  const actor = getUser(card.actorId);
  const object = card.objectId ? getObject(card.objectId) : undefined;

  const lifted = card.verb === "moved" || card.verb === "published";

  return (
    <Pressable onPress={onPress} className="mb-10 active:opacity-95">
      <View className="flex-row items-center mb-4 px-1">
        <Avatar uri={actor.avatar} size="md" />
        <View className="ml-3 flex-1">
          <Text className="font-body text-on-surface text-[14px] leading-[18px]">
            <Text className="font-body-medium">{actor.displayName}</Text>{" "}
            <Text className="font-body text-on-surface-variant">
              {card.verb === "moved"
                ? "moved"
                : card.verb === "added"
                  ? "added"
                  : card.verb === "saved"
                    ? "saved"
                    : "published"}
            </Text>{" "}
            {object && (
              <Text className="font-headline-italic text-primary text-[15px]">
                {object.title}
              </Text>
            )}
          </Text>
          <Label className="mt-1 text-[11px] text-on-surface-variant uppercase tracking-widest">
            {card.timestamp} · @{actor.handle}
          </Label>
        </View>
      </View>

      <View
        className={cn(
          "rounded-xl overflow-hidden",
          lifted
            ? "bg-surface-container-highest"
            : "bg-surface-container-low",
        )}
        style={{
          shadowColor: "#1B1C1A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 24,
          elevation: 2,
        }}
      >
        {(card.imageUrl || object?.heroImage) && (
          <View className="relative">
            <Image
              source={{ uri: card.imageUrl || object?.heroImage }}
              style={{ aspectRatio: 16 / 10 }}
              contentFit="cover"
              transition={220}
              className="w-full"
            />
            {card.movement === "up" && (
              <View className="absolute top-3 right-3 bg-background/90 rounded-full w-8 h-8 items-center justify-center">
                <Icon name="arrow-upward" size={16} color="#547C65" />
              </View>
            )}
            {card.movement === "down" && (
              <View className="absolute top-3 right-3 bg-background/90 rounded-full w-8 h-8 items-center justify-center">
                <Icon name="arrow-downward" size={16} color="#8B5D5D" />
              </View>
            )}
          </View>
        )}

        <View className="p-5">
          {object ? (
            <>
              <Label className="uppercase tracking-widest text-[10px] text-on-surface-variant">
                {displayObjectType(object.type)}{" "}
                {object.city ? `· ${object.city}` : ""}
              </Label>
              <HeadlineItalic className="mt-1 text-primary text-[22px] leading-[26px]">
                {object.title}
              </HeadlineItalic>
            </>
          ) : (
            <HeadlineItalic className="text-primary text-[22px] leading-[26px]">
              {card.message}
            </HeadlineItalic>
          )}
          {card.body && (
            <Body className="mt-2 text-[14px] leading-[20px]">{card.body}</Body>
          )}
          {card.rank != null && (
            <View className="mt-3 flex-row items-center">
              <Text className="font-serif text-primary text-[18px]">
                #{card.rank}
              </Text>
              <Label className="ml-2 uppercase tracking-widest text-[10px] text-on-surface-variant">
                in {card.message.match(/to (.+)$/)?.[1] ?? ""}
              </Label>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
