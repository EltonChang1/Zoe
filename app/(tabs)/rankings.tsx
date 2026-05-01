import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
  Text,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import {
  Body,
  Display,
  HeadlineItalic,
  Label,
  LabelCaps,
  RankNumber,
  Title,
} from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/time";
import { displayObjectType } from "@/lib/objects/display";
import { currentUserId, getUser } from "@/data/users";
import {
  mapUser,
  useAuth,
  useCreateRankingList,
  usePersonalRankHubQuery,
  useQuickVoteQuery,
  useRankHubCitiesQuery,
  useRankHubCityQuery,
  useRestaurantMapQuery,
  useRestaurantRecommendationsQuery,
  useSubmitQuickVote,
} from "@/lib/api";
import type {
  ApiCity,
  ApiCityRankingCard,
  ApiCityRankingEntry,
  ApiCommunityPulseItem,
  ApiOfficialRankingSuggestion,
  ApiQuickVoteMatchup,
  ApiRankingListSummary,
  ApiRestaurantMapPin,
  ApiRestaurantRecommendation,
} from "@/lib/api/types";

type Mode = "city" | "personal" | "map";

const DEFAULT_CITY_ID = "city_pittsburgh";

export default function RankingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const me = user ? mapUser(user) : getUser(currentUserId);
  const [mode, setMode] = useState<Mode>("city");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(
    DEFAULT_CITY_ID,
  );

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} className="active:opacity-70">
            <Icon name="menu" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[22px]">
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
        <View className="px-6 pt-2 pb-4 items-center">
          <LabelCaps className="text-primary">Rank Hub</LabelCaps>
          <Display className="mt-3 text-center text-[42px] leading-[46px]">
            {mode === "city"
              ? "City Rankings"
              : mode === "map"
                ? "Restaurant Map"
                : "Your Rankings"}
          </Display>
          <Body className="mt-3 text-center max-w-[330px]">
            {mode === "city"
              ? "Answer-first city guides shaped by local personal rankings."
              : mode === "map"
                ? "Restaurants you ranked, saved, or should try next."
              : "Create official city rankings or keep custom lists for your profile."}
          </Body>
        </View>

        <RankHubSegmentedControl mode={mode} onChange={setMode} />

        {mode === "city" ? (
          <CityRankHub
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
            onOpenList={(id) =>
              router.push(`/city-ranking-list/${id}` as never)
            }
          />
        ) : mode === "map" ? (
          <RestaurantMapHub
            selectedCityId={selectedCityId}
            onOpenObject={(id) => router.push(`/object/${id}`)}
          />
        ) : (
          <PersonalRankHub
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
            onOpenList={(id) => router.push(`/ranking-list/${id}`)}
            onRankInList={(id) => router.push(`/rank/add?listId=${id}`)}
            onCreateCustom={() => router.push("/rank/add")}
          />
        )}
      </ScrollView>
    </View>
  );
}

function RankHubSegmentedControl({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <View className="flex-row self-center mb-5 bg-surface-container-low rounded-full p-1">
      {(["city", "map", "personal"] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          className={cn(
            "px-6 py-2 rounded-full",
            mode === m ? "bg-primary" : "bg-transparent",
          )}
        >
          <Text
            className={cn(
              "font-label-semibold uppercase tracking-widest text-[11px]",
              mode === m ? "text-on-primary" : "text-on-surface-variant",
            )}
          >
            {m === "city" ? "City" : m === "map" ? "Map" : "Personal"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function RestaurantMapHub({
  selectedCityId,
  onOpenObject,
}: {
  selectedCityId: string | null;
  onOpenObject: (id: string) => void;
}) {
  const mapQuery = useRestaurantMapQuery({ cityId: selectedCityId, limit: 150 });
  const recommendationsQuery = useRestaurantRecommendationsQuery({
    cityId: selectedCityId,
    limit: 8,
  });
  const pins = mapQuery.data?.pins ?? [];
  const recommendations = recommendationsQuery.data?.recommendations ?? [];
  const region = regionForPins(pins);

  return (
    <View>
      <View className="mx-5 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low">
        {mapQuery.isLoading && pins.length === 0 ? (
          <View className="h-80 items-center justify-center">
            <ActivityIndicator color="#55343B" />
          </View>
        ) : pins.length === 0 ? (
          <View className="h-80 items-center justify-center px-6">
            <HeadlineItalic className="text-center text-[22px]">
              No restaurant pins yet
            </HeadlineItalic>
            <Body className="mt-2 text-center text-[13px]">
              Rank restaurants or save want-to-try spots to light up the map.
            </Body>
          </View>
        ) : (
          <MapView
            style={{ height: 360, width: "100%" }}
            initialRegion={region}
          >
            {pins.map((pin) => (
              <Marker
                key={pin.id}
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                pinColor={pinColor(pin.status)}
                title={pin.object.title}
                description={pin.object.city ?? undefined}
                onCalloutPress={() => onOpenObject(pin.object.id)}
              />
            ))}
          </MapView>
        )}
      </View>

      {pins.length > 0 ? (
        <View className="px-5 mt-5 gap-3">
          {pins.slice(0, 6).map((pin) => (
            <MapPinRow key={pin.id} pin={pin} onPress={() => onOpenObject(pin.object.id)} />
          ))}
        </View>
      ) : null}

      <View className="px-5 mt-8">
        <View className="flex-row items-center justify-between">
          <Title className="text-[19px]">Recommended next</Title>
          {recommendationsQuery.isFetching ? (
            <ActivityIndicator size="small" color="#55343B" />
          ) : null}
        </View>
        <View className="mt-3 gap-3">
          {recommendations.map((item) => (
            <RecommendationRow
              key={item.object.id}
              recommendation={item}
              onPress={() => onOpenObject(item.object.id)}
            />
          ))}
          {!recommendationsQuery.isLoading && recommendations.length === 0 ? (
            <Body className="text-[13px] text-on-surface-variant">
              Rank a few restaurants to get taste-based suggestions.
            </Body>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function MapPinRow({
  pin,
  onPress,
}: {
  pin: ApiRestaurantMapPin;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-3 active:opacity-80"
    >
      {pin.object.heroImage ? (
        <Image
          source={{ uri: pin.object.heroImage }}
          style={{ width: 52, height: 52, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : (
        <View className="h-[52px] w-[52px] items-center justify-center rounded-lg bg-surface-container-low">
          <Icon name="restaurant" size={20} color="#827475" />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className="font-headline text-on-surface text-[15px]" numberOfLines={1}>
          {pin.object.title}
        </Text>
        <Label className="mt-0.5 text-[11px]">
          {pin.status.replace(/_/g, " ")} · {pin.stats.rankedCount} rankings
        </Label>
      </View>
      <Icon name="chevron-right" size={20} color="#827475" />
    </Pressable>
  );
}

function RecommendationRow({
  recommendation,
  onPress,
}: {
  recommendation: ApiRestaurantRecommendation;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-headline text-on-surface text-[16px]">
            {recommendation.object.title}
          </Text>
          <Label className="mt-0.5 text-[11px]">
            {recommendation.reasons.join(" · ") || "Zoe pick"}
          </Label>
        </View>
        <RankNumber className="text-[22px]">
          {recommendation.score.toFixed(1)}
        </RankNumber>
      </View>
      {recommendation.topDishes.length > 0 ? (
        <Label className="mt-2 text-[11px]">
          Try {recommendation.topDishes.map((dish) => dish.name).join(", ")}
        </Label>
      ) : null}
    </Pressable>
  );
}

function regionForPins(pins: ApiRestaurantMapPin[]) {
  if (pins.length === 0) {
    return {
      latitude: 40.4406,
      longitude: -79.9959,
      latitudeDelta: 0.14,
      longitudeDelta: 0.14,
    };
  }
  const latitudes = pins.map((pin) => pin.latitude);
  const longitudes = pins.map((pin) => pin.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.04, (maxLat - minLat) * 1.6),
    longitudeDelta: Math.max(0.04, (maxLng - minLng) * 1.6),
  };
}

function pinColor(status: ApiRestaurantMapPin["status"]) {
  if (status === "ranked") return "#55343B";
  if (status === "want_to_try") return "#B56B76";
  if (status === "friend") return "#547C65";
  return "#827475";
}

function CityRankHub({
  selectedCityId,
  onSelectCity,
  onOpenList,
}: {
  selectedCityId: string | null;
  onSelectCity: (cityId: string | null) => void;
  onOpenList: (id: string) => void;
}) {
  const cityQuery = useRankHubCityQuery(selectedCityId);
  const lists = cityQuery.data?.featuredLists ?? [];
  const city = cityQuery.data?.city ?? null;

  if (!selectedCityId) {
    return <CitySetupEmptyState onSelectCity={onSelectCity} />;
  }

  return (
    <View>
      <CitySelector
        selectedCityId={selectedCityId}
        onSelectCity={onSelectCity}
        onAddCity={() => onSelectCity(null)}
      />

      {cityQuery.isLoading && lists.length === 0 && (
        <LoadingBlock label="Loading city rankings" />
      )}

      {cityQuery.isError && lists.length === 0 && (
        <EmptyState
          label="Couldn't load city rankings"
          body="Pull to refresh in a moment."
        />
      )}

      {city && !cityQuery.isLoading && (
        <View className="px-6 mb-6">
          <LabelCaps className="text-primary">{city.name}</LabelCaps>
          <Title className="mt-1 text-[18px]">
            Ranked by {formatCount(city.activeRankersCount)} local Zoe users
          </Title>
          <Body className="mt-1">Updated as city rankings change.</Body>
        </View>
      )}

      <View className="px-5">
        <SectionHeader label="Featured Rankings" />

        {!cityQuery.isLoading && !cityQuery.isError && lists.length === 0 && (
          <EmptyState
            label="This city is just getting started"
            body="Be one of the first people to shape its rankings."
          />
        )}

        {lists.map((list) => (
          <CityRankingCard
            key={list.id}
            list={list}
            onPress={() => onOpenList(list.id)}
          />
        ))}

        {city && lists[0] ? (
          <QuickVoteModule city={city} list={lists[0]} />
        ) : null}

        <CommunityPulseModule items={cityQuery.data?.communityPulse ?? []} />
      </View>
    </View>
  );
}

function PersonalRankHub({
  selectedCityId,
  onSelectCity,
  onOpenList,
  onRankInList,
  onCreateCustom,
}: {
  selectedCityId: string | null;
  onSelectCity: (cityId: string | null) => void;
  onOpenList: (id: string) => void;
  onRankInList: (id: string) => void;
  onCreateCustom: () => void;
}) {
  const { isSignedIn } = useAuth();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const personalQuery = usePersonalRankHubQuery(selectedCityId);
  const createList = useCreateRankingList();
  const suggestions = personalQuery.data?.officialSuggestions ?? [];
  const customLists = personalQuery.data?.customLists ?? [];
  const officialPersonalLists =
    personalQuery.data?.officialPersonalLists ?? [];

  const startOfficial = async (suggestion: ApiOfficialRankingSuggestion) => {
    if (!isSignedIn) {
      Alert.alert("Sign in to rank", "Official city rankings live on your account.");
      return;
    }
    if (suggestion.userListId) {
      onRankInList(suggestion.userListId);
      return;
    }
    if (!selectedCityId) return;
    try {
      const cityName =
        suggestion.officialList.title.split("'s ")[0] ?? "My City";
      const res = await createList.mutateAsync({
        title: `My ${suggestion.officialList.title.replace(`${cityName}'s `, "")}`,
        category: suggestion.officialList.category,
        cityId: selectedCityId,
        listType: "official_city_connected",
        linkedCityRankingListId: suggestion.officialList.id,
        visibility: "public",
      });
      onRankInList(res.list.id);
    } catch (e) {
      Alert.alert(
        "Couldn't start ranking",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  return (
    <View>
      <CitySelector
        selectedCityId={selectedCityId}
        onSelectCity={onSelectCity}
        onAddCity={() => onSelectCity(null)}
      />

      <View className="px-5">
        <View className="bg-surface-container-low rounded-xl p-5 mb-5">
          <LabelCaps className="text-primary">Your Rankings</LabelCaps>
          <Pressable
            onPress={() => setSelectorOpen((open) => !open)}
            className="mt-3 flex-row items-center justify-between active:opacity-80"
          >
            <HeadlineItalic className="text-primary text-[25px]">
              Rank something
            </HeadlineItalic>
            <Icon
              name={selectorOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={24}
              color="#55343B"
            />
          </Pressable>
        </View>

        {selectorOpen && (
          <RankSelectorSheet
            suggestions={suggestions}
            customLists={customLists}
            onPickOfficial={startOfficial}
            onPickCustom={onRankInList}
            onCreateCustom={onCreateCustom}
          />
        )}

        {personalQuery.isLoading && <LoadingBlock label="Loading your rankings" />}

        {personalQuery.isError && (
          <EmptyState
            label="Couldn't load your rankings"
            body="Pull to refresh in a moment."
          />
        )}

        {!personalQuery.isLoading && (
          <>
            <SectionHeader label="Official City Rankings" />
            {suggestions.map((suggestion) => (
              <OfficialRankingSuggestionCard
                key={suggestion.officialList.id}
                suggestion={suggestion}
                loading={createList.isPending}
                onPress={() => startOfficial(suggestion)}
              />
            ))}

            <SectionHeader label="Your Lists" />
            {officialPersonalLists.map((list) => (
              <PersonalRankingListCard
                key={list.id}
                list={list}
                label="Counts toward city ranking"
                onPress={() => onOpenList(list.id)}
              />
            ))}
            {customLists.map((list) => (
              <PersonalRankingListCard
                key={list.id}
                list={list}
                label="Personal only"
                onPress={() => onOpenList(list.id)}
              />
            ))}

            {officialPersonalLists.length === 0 && customLists.length === 0 && (
              <EmptyState
                label="Your taste starts here"
                body="Start an official city ranking or create a custom personal list."
              />
            )}
            <View className="mt-1 mb-5">
              <Button
                label="Create Custom List"
                variant="secondary"
                onPress={onCreateCustom}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function CitySetupEmptyState({
  onSelectCity,
}: {
  onSelectCity: (cityId: string) => void;
}) {
  const { data, isLoading } = useRankHubCitiesQuery();
  const cities = data?.cities ?? [];
  return (
    <View className="px-6">
      <View className="bg-surface-container-low rounded-xl p-6">
        <LabelCaps className="text-primary">Where do you live?</LabelCaps>
        <HeadlineItalic className="mt-2 text-primary">
          Find the best places where you live.
        </HeadlineItalic>
        <Body className="mt-3">
          Set a city to see official community rankings and start contributing.
        </Body>
        <View className="mt-5 gap-3">
          <Button
            label="Use Pittsburgh"
            onPress={() => onSelectCity(DEFAULT_CITY_ID)}
          />
          <Button
            label="Use current location"
            variant="secondary"
            onPress={() => onSelectCity(DEFAULT_CITY_ID)}
          />
        </View>
      </View>

      <LabelCaps className="mt-7 mb-3">Popular</LabelCaps>
      {isLoading && <ActivityIndicator color="#55343B" />}
      {cities.slice(0, 5).map((city) => (
        <CityOption key={city.id} city={city} onPress={() => onSelectCity(city.id)} />
      ))}
    </View>
  );
}

function CitySelector({
  selectedCityId,
  onSelectCity,
  onAddCity,
}: {
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
  onAddCity: () => void;
}) {
  const { data } = useRankHubCitiesQuery();
  const cities = data?.cities ?? [];
  const selected = cities.find((city) => city.id === selectedCityId);
  return (
    <View className="px-5 mb-6">
      <View className="flex-row items-center gap-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ gap: 8 }}
        >
          {cities.slice(0, 5).map((city) => (
            <Pressable
              key={city.id}
              onPress={() => onSelectCity(city.id)}
              className={cn(
                "px-4 py-2 rounded-full active:opacity-80",
                city.id === selectedCityId
                  ? "bg-primary"
                  : "bg-surface-container-low",
              )}
            >
              <Text
                className={cn(
                  "font-label-semibold text-[12px]",
                  city.id === selectedCityId
                    ? "text-on-primary"
                    : "text-on-surface-variant",
                )}
              >
                {city.name}
              </Text>
            </Pressable>
          ))}
          {!selected && selectedCityId ? (
            <View className="px-4 py-2 rounded-full bg-primary">
              <Text className="font-label-semibold text-[12px] text-on-primary">
                {selectedCityId}
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <Pressable
          onPress={onAddCity}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-container-low active:opacity-80"
          accessibilityLabel="Add city"
        >
          <Icon name="add-location-alt" size={19} color="#55343B" />
        </Pressable>
      </View>
    </View>
  );
}

function CityOption({ city, onPress }: { city: ApiCity; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 active:opacity-80"
    >
      <View className="w-9 h-9 rounded-full bg-surface-container-low items-center justify-center mr-3">
        <Icon name="location-city" size={18} color="#55343B" />
      </View>
      <View>
        <Title className="text-[17px] leading-[20px]">{city.name}</Title>
        <Label className="mt-0.5">
          {city.state ? `${city.state} · ` : ""}
          {formatCount(city.activeRankersCount)} rankers
        </Label>
      </View>
    </Pressable>
  );
}

function CityRankingCard({
  list,
  onPress,
}: {
  list: ApiCityRankingCard;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-5 rounded-xl overflow-hidden bg-surface-container-lowest active:opacity-90"
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
        elevation: 2,
      }}
    >
      {list.entries[0]?.object.heroImage ? (
        <Image
          source={{ uri: list.entries[0].object.heroImage }}
          style={{ aspectRatio: 16 / 9 }}
          contentFit="cover"
          transition={220}
          className="w-full"
        />
      ) : null}
      <View className="p-5">
        <LabelCaps className="text-primary">
          Ranked by {formatCount(list.activeRankersCount)} locals
        </LabelCaps>
        <Title className="mt-2">{list.title}</Title>
        <Body className="mt-1">
          {list.lastRecalculatedAt
            ? `Updated ${formatRelativeTime(list.lastRecalculatedAt)}`
            : "Updated today"}
        </Body>
        <View className="mt-4 gap-2">
          {list.entries.slice(0, 5).map((entry) => (
            <MiniRankRow key={entry.id} entry={entry} />
          ))}
        </View>
        <View className="mt-5">
          <Button label="Open List" dense onPress={onPress} />
        </View>
      </View>
    </Pressable>
  );
}

function MiniRankRow({ entry }: { entry: ApiCityRankingEntry }) {
  return (
    <View className="flex-row items-center">
      <RankNumber className="w-9 text-[23px] leading-[24px]">
        #{entry.rank}
      </RankNumber>
      <Text
        className="flex-1 font-body-medium text-on-surface text-[14px]"
        numberOfLines={1}
      >
        {entry.object.title}
      </Text>
      <Label className="ml-2">Score {Math.round(entry.citytasteScore)}</Label>
    </View>
  );
}

function QuickVoteModule({
  city,
  list,
}: {
  city: ApiCity;
  list: ApiCityRankingCard;
}) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [votes, setVotes] = useState<
    {
      objectAId: string;
      objectBId: string;
      selectedObjectId?: string | null;
      skipped?: boolean;
      contextPrompt: string;
    }[]
  >([]);
  const query = useQuickVoteQuery({
    cityId: city.id,
    listId: list.id,
    count: 5,
  });
  const submit = useSubmitQuickVote();
  const matchup = query.data?.matchups[index];

  const answer = async (
    selectedObjectId?: string,
  ) => {
    if (!matchup) return;
    const nextVotes = [
      ...votes,
      {
        objectAId: matchup.objectA.id,
        objectBId: matchup.objectB.id,
        selectedObjectId: selectedObjectId ?? null,
        skipped: !selectedObjectId,
        contextPrompt: matchup.contextPrompt,
      },
    ];
    setVotes(nextVotes);
    if (index + 1 < (query.data?.matchups.length ?? 0)) {
      setIndex(index + 1);
      return;
    }
    try {
      await submit.mutateAsync({
        cityId: city.id,
        listId: list.id,
        votes: nextVotes,
      });
      Alert.alert("Thanks", `You helped improve ${city.name}'s rankings.`);
      setStarted(false);
      setIndex(0);
      setVotes([]);
    } catch (e) {
      Alert.alert(
        "Couldn't save quick vote",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  return (
    <View className="bg-surface-container-low rounded-xl p-5 mb-5">
      <LabelCaps className="text-primary">Help Rank {city.name}</LabelCaps>
      {!started ? (
        <>
          <HeadlineItalic className="mt-2 text-primary">
            Answer 5 quick matchups.
          </HeadlineItalic>
          <Body className="mt-2">
            Quick votes help improve city rankings with a lighter signal than
            full personal lists.
          </Body>
          <View className="mt-4">
            <Button label="Start Quick Vote" dense onPress={() => setStarted(true)} />
          </View>
        </>
      ) : query.isLoading ? (
        <View className="py-6 items-center">
          <ActivityIndicator color="#55343B" />
        </View>
      ) : matchup ? (
        <View className="mt-4">
          <Body className="mb-4">{matchup.contextPrompt}</Body>
          <View className="gap-3">
            <QuickVoteChoice
              object={matchup.objectA}
            onPress={() => answer(matchup.objectA.id)}
            />
            <QuickVoteChoice
              object={matchup.objectB}
            onPress={() => answer(matchup.objectB.id)}
            />
          </View>
          <Pressable
            onPress={() => answer()}
            className="mt-3 py-2 items-center active:opacity-70"
          >
            <Label>Skip</Label>
          </Pressable>
        </View>
      ) : (
        <Body className="mt-3">Not enough city objects for a matchup yet.</Body>
      )}
    </View>
  );
}

function QuickVoteChoice({
  object,
  onPress,
}: {
  object: ApiQuickVoteMatchup["objectA"];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-surface-container-lowest rounded-xl p-3 active:opacity-85"
    >
      {object.heroImage ? (
        <Image
          source={{ uri: object.heroImage }}
          style={{ width: 54, height: 54, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : null}
      <View className="flex-1 ml-3">
        <Title className="text-[16px] leading-[19px]" numberOfLines={1}>
          {object.title}
        </Title>
        <Label className="mt-1" numberOfLines={1}>
          {[object.neighborhood, displayObjectType(object.type)]
            .filter(Boolean)
            .join(" · ")}
        </Label>
      </View>
    </Pressable>
  );
}

function CommunityPulseModule({ items }: { items: ApiCommunityPulseItem[] }) {
  if (items.length === 0) return null;
  return (
    <View className="mb-4">
      <SectionHeader label="Community Pulse" />
      <View className="bg-surface-container-low rounded-xl p-5 gap-4">
        {items.slice(0, 3).map((item) => (
          <View key={item.id} className="flex-row items-start">
            <Icon
              name={
                item.movement === "up"
                  ? "trending-up"
                  : item.movement === "down"
                    ? "trending-down"
                    : "fiber-new"
              }
              size={18}
              color={item.movement === "down" ? "#8B5D5D" : "#547C65"}
            />
            <View className="ml-3 flex-1">
              <Text className="font-body-medium text-on-surface text-[14px]">
                {item.object.title}
                {item.movementDelta
                  ? ` moved ${item.movement} ${item.movementDelta}`
                  : " joined the ranking"}
              </Text>
              <Label className="mt-1">{item.cityRankingList.title}</Label>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function RankSelectorSheet({
  suggestions,
  customLists,
  onPickOfficial,
  onPickCustom,
  onCreateCustom,
}: {
  suggestions: ApiOfficialRankingSuggestion[];
  customLists: ApiRankingListSummary[];
  onPickOfficial: (suggestion: ApiOfficialRankingSuggestion) => void;
  onPickCustom: (id: string) => void;
  onCreateCustom: () => void;
}) {
  return (
    <View className="bg-surface-container-lowest rounded-xl p-5 mb-6">
      <LabelCaps className="text-primary">What do you want to rank?</LabelCaps>
      <Title className="mt-4 text-[17px]">Official City Rankings</Title>
      <Body className="mt-1">These help shape the city rankings.</Body>
      <View className="mt-3 gap-2">
        {suggestions.map((suggestion) => (
          <Pressable
            key={suggestion.officialList.id}
            onPress={() => onPickOfficial(suggestion)}
            className="flex-row items-center py-3 active:opacity-80"
          >
            <View className="flex-1">
              <Text className="font-body-medium text-on-surface text-[15px]">
                {labelForOfficialCategory(suggestion.officialList.category)}
              </Text>
              <Label className="mt-1">
                {suggestion.entryCount > 0
                  ? `${suggestion.entryCount} places ranked`
                  : "Not started"}
              </Label>
            </View>
            <Icon name="chevron-right" size={20} color="#827475" />
          </Pressable>
        ))}
      </View>

      <Title className="mt-5 text-[17px]">Personal Lists</Title>
      <Body className="mt-1">These are for your profile only.</Body>
      <View className="mt-3 gap-2">
        {customLists.map((list) => (
          <Pressable
            key={list.id}
            onPress={() => onPickCustom(list.id)}
            className="flex-row items-center py-3 active:opacity-80"
          >
            <View className="flex-1">
              <Text className="font-body-medium text-on-surface text-[15px]">
                {list.title}
              </Text>
              <Label className="mt-1">Personal only</Label>
            </View>
            <Icon name="chevron-right" size={20} color="#827475" />
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={onCreateCustom}
        className="mt-4 flex-row items-center justify-center rounded-xl p-4 border border-dashed border-outline-variant/50 active:opacity-80"
      >
        <Icon name="add" size={18} color="#55343B" />
        <Text className="ml-2 font-label-semibold text-primary uppercase tracking-widest text-[12px]">
          Create Custom Ranking List
        </Text>
      </Pressable>
    </View>
  );
}

function OfficialRankingSuggestionCard({
  suggestion,
  loading,
  onPress,
}: {
  suggestion: ApiOfficialRankingSuggestion;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 bg-surface-container-low rounded-xl p-4 active:opacity-85"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <LabelCaps className="text-primary">Counts toward city ranking</LabelCaps>
          <Title className="mt-1 text-[18px] leading-[21px]">
            {labelForOfficialCategory(suggestion.officialList.category)}
          </Title>
          <Body className="mt-1">
            {suggestion.entryCount > 0
              ? `${suggestion.entryCount} places ranked`
              : "Not started"}
          </Body>
        </View>
        {loading ? (
          <ActivityIndicator color="#55343B" />
        ) : (
          <Icon name="chevron-right" size={22} color="#827475" />
        )}
      </View>
    </Pressable>
  );
}

function PersonalRankingListCard({
  list,
  label,
  onPress,
}: {
  list: ApiRankingListSummary;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 bg-surface-container-lowest rounded-xl p-4 active:opacity-85"
    >
      <LabelCaps className="text-primary">{label}</LabelCaps>
      <Title className="mt-1 text-[18px] leading-[21px]">{list.title}</Title>
      <Body className="mt-1">
        {list._count.entries} ranked {list._count.entries === 1 ? "item" : "items"} ·{" "}
        {list.category}
      </Body>
    </Pressable>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View className="mb-3 mt-1">
      <HeadlineItalic className="text-primary text-[24px]">
        {label}
      </HeadlineItalic>
    </View>
  );
}

function EmptyState({ label, body }: { label: string; body: string }) {
  return (
    <View className="bg-surface-container-low rounded-xl p-5 mb-5">
      <LabelCaps>{label}</LabelCaps>
      <Body className="mt-2">{body}</Body>
    </View>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <View className="py-14 items-center">
      <ActivityIndicator color="#55343B" />
      <LabelCaps className="mt-3">{label}</LabelCaps>
    </View>
  );
}

function labelForOfficialCategory(category: string) {
  switch (category) {
    case "places_to_go":
      return "Best Places to Go";
    case "restaurant":
      return "Best Restaurants";
    case "cafe":
      return "Best Cafés";
    default:
      return category;
  }
}

function formatCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}
