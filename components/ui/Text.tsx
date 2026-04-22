import { Text as RNText, TextProps } from "react-native";

import { cn } from "@/lib/cn";

/**
 * Semantic typography primitives aligned with the Modern Curator scale.
 * Use these instead of raw <Text className="..."> so variants stay consistent.
 */

type BaseProps = Omit<TextProps, "style"> & {
  className?: string;
};

export function Display({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-display text-on-surface",
        "text-[44px] leading-[48px] tracking-tightest",
        className,
      )}
      {...rest}
    />
  );
}

export function Headline({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-headline text-on-surface",
        "text-[28px] leading-[32px] tracking-tighter",
        className,
      )}
      {...rest}
    />
  );
}

export function HeadlineItalic({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-headline-italic text-on-surface",
        "text-[24px] leading-[28px] tracking-tighter",
        className,
      )}
      {...rest}
    />
  );
}

export function Title({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-headline text-on-surface",
        "text-[20px] leading-[24px] tracking-tight",
        className,
      )}
      {...rest}
    />
  );
}

export function Body({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-body text-on-surface-variant",
        "text-[14px] leading-[20px]",
        className,
      )}
      {...rest}
    />
  );
}

export function BodyLarge({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-body text-on-surface-variant",
        "text-[16px] leading-[24px]",
        className,
      )}
      {...rest}
    />
  );
}

export function Label({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-label text-on-surface-variant",
        "text-[12px] leading-[14px]",
        className,
      )}
      {...rest}
    />
  );
}

export function LabelCaps({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-label-semibold text-on-surface-variant uppercase tracking-widest",
        "text-[10px] leading-[12px]",
        className,
      )}
      {...rest}
    />
  );
}

export function RankNumber({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-serif text-primary",
        "text-[28px] leading-[28px] tracking-tight",
        className,
      )}
      {...rest}
    />
  );
}

export function PullQuote({ className, ...rest }: BaseProps) {
  return (
    <RNText
      className={cn(
        "font-headline text-on-surface",
        "text-[20px] leading-[28px] tracking-tight",
        className,
      )}
      {...rest}
    />
  );
}
