import { Alert } from "react-native";

import type { ReportReason, ReportSubjectType } from "@/lib/api";

/**
 * Small, dependency-free helpers that wrap `Alert.alert` into a two-step
 * report / block flow. Putting the flow here lets every overflow menu
 * — post, short, comment, profile — share the same copy and spacing
 * without each screen re-rolling its own sheet. iOS's native destructive
 * style is the only affordance Apple's review is looking for on UGC
 * apps, so we stick with `Alert.alert` and avoid adding a modal library.
 *
 * Return type is a Promise so callers can `await` and know when the
 * user made (or dismissed) a choice — that pair with `useMutation`
 * naturally.
 */

const REASON_LABELS: Array<{ id: ReportReason; label: string }> = [
  { id: "spam", label: "Spam or scam" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "hate", label: "Hate speech" },
  { id: "sexual", label: "Sexual content" },
  { id: "violence", label: "Violence" },
  { id: "self_harm", label: "Self-harm" },
  { id: "misinformation", label: "Misinformation" },
  { id: "ip_violation", label: "Intellectual property" },
  { id: "other", label: "Something else" },
];

/**
 * Two-step report flow:
 *   1. Reason picker (Alert with one action per top-4 reasons + More...)
 *   2. If "More", show the rest in a second Alert.
 *
 * Apple's native alert caps comfortably at ~5 actions on iOS. We pick the
 * four most common reasons + a More... fallback so the primary sheet
 * stays usable; power reporters can dig deeper without a full modal.
 */
export function promptReportReason(
  subjectLabel: string,
): Promise<ReportReason | null> {
  return new Promise((resolve) => {
    Alert.alert(
      `Report this ${subjectLabel}?`,
      "Thanks for looking out. Tell us what's going on — we review every report.",
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
        {
          text: "Spam",
          onPress: () => resolve("spam"),
        },
        {
          text: "Harassment",
          onPress: () => resolve("harassment"),
        },
        {
          text: "Hate speech",
          onPress: () => resolve("hate"),
        },
        {
          text: "More...",
          onPress: () => {
            const extra = REASON_LABELS.filter(
              (r) => !["spam", "harassment", "hate"].includes(r.id),
            );
            const buttons: Parameters<typeof Alert.alert>[2] = [
              { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
              ...extra.map((r) => ({
                text: r.label,
                onPress: () => resolve(r.id),
              })),
            ];
            Alert.alert(
              `Report this ${subjectLabel}?`,
              "Pick the closest match.",
              buttons,
            );
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

/** Final confirmation shown after a reason is picked. Resolves `true` on OK. */
export function confirmReportSubmitted(subjectLabel: string): Promise<void> {
  return new Promise((resolve) => {
    Alert.alert(
      "Thanks for reporting",
      `We've received your report about this ${subjectLabel} and our team will review it.`,
      [{ text: "OK", onPress: () => resolve() }],
      { cancelable: true, onDismiss: () => resolve() },
    );
  });
}

/**
 * Block confirmation. Returns `true` if the user confirmed, `false`
 * otherwise. `displayName` may be empty — the copy still reads fine.
 */
export function confirmBlock(displayName: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Block this person?",
      displayName
        ? `${displayName} won't be able to see your content and you won't see theirs. You can unblock from Settings anytime.`
        : "They won't be able to see your content and you won't see theirs. You can unblock from Settings anytime.",
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Block",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/**
 * Compose a Report entry (reason picker → mutation → acknowledgement).
 * Abstracts the three-step flow so every overflow menu can just call
 * `runReportFlow(...)`.
 */
export async function runReportFlow(opts: {
  subjectLabel: string;
  subjectType: ReportSubjectType;
  subjectId: string;
  submit: (input: {
    subjectType: ReportSubjectType;
    subjectId: string;
    reason: ReportReason;
  }) => Promise<unknown>;
}): Promise<void> {
  const reason = await promptReportReason(opts.subjectLabel);
  if (!reason) return;
  try {
    await opts.submit({
      subjectType: opts.subjectType,
      subjectId: opts.subjectId,
      reason,
    });
    await confirmReportSubmitted(opts.subjectLabel);
  } catch (err) {
    Alert.alert(
      "Couldn't send report",
      err instanceof Error ? err.message : "Please try again.",
    );
  }
}
