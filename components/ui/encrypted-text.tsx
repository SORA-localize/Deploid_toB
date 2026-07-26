"use client";
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  /**
   * Time in milliseconds between revealing each subsequent real character.
   * Lower is faster. Defaults to 50ms per character.
   */
  revealDelayMs?: number;
  /** Optional custom character set to use for the gibberish effect. */
  charset?: string;
  /**
   * Time in milliseconds between gibberish flips for unrevealed characters.
   * Lower is more jittery. Defaults to 50ms.
   */
  flipDelayMs?: number;
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string;
  /** CSS class for styling the revealed characters */
  revealedClassName?: string;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(
  original: string,
  charset: string,
): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];
    result += ch === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

// マウント後フラグ。useEffect + setState ではなく useSyncExternalStore で表現する
// （react-hooks/set-state-in-effect回避。購読不要な「hydration後は常にtrue」の定番パターン）。
const subscribeMountedNoop = () => () => {};
const getMountedSnapshot = () => true;
const getMountedServerSnapshot = () => false;
function useHasMounted(): boolean {
  return useSyncExternalStore(subscribeMountedNoop, getMountedSnapshot, getMountedServerSnapshot);
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}) => {
  const isMounted = useHasMounted();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  const [revealCount, setRevealCount] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);
  // Math.random()ベースのscramble文字列はrender pathで生成しない（Server/Client双方の
  // 初回レンダリングで非決定的処理に当たるため）。isMounted前はdisplayCharが常に元の
  // 文字を返すので、空配列で初期化しても表示には影響しない。
  const [scrambleChars, setScrambleChars] = useState<string[]>([]);

  useEffect(() => {
    // reduced motionはアニメーションさせず全開示するので、このエフェクトは不要
    // （revealCountの実効値はレンダー側でshouldReduceMotionから直接導出する）。
    if (!isInView || !isMounted || shouldReduceMotion) return;

    // Reset state for a fresh animation whenever dependencies change
    const initial = text
      ? generateGibberishPreservingSpaces(text, charset)
      : "";
    let currentScrambleChars = initial.split("");
    const resetAnimationState = () => {
      setScrambleChars(currentScrambleChars);
      setRevealCount(0);
    };
    resetAnimationState();
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;

    let isCancelled = false;

    const update = (now: number) => {
      if (isCancelled) return;

      const elapsedMs = now - startTimeRef.current;
      const totalLength = text.length;
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor(elapsedMs / Math.max(1, revealDelayMs)),
      );

      setRevealCount(currentRevealCount);

      if (currentRevealCount >= totalLength) {
        return;
      }

      // Re-randomize unrevealed scramble characters on an interval
      const timeSinceLastFlip = now - lastFlipTimeRef.current;
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        currentScrambleChars = currentScrambleChars.map((ch, index) => {
          if (index < currentRevealCount) return ch;
          return text[index] !== " " ? generateRandomCharacter(charset) : " ";
        });
        setScrambleChars(currentScrambleChars);
        lastFlipTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInView, isMounted, shouldReduceMotion, text, revealDelayMs, charset, flipDelayMs]);

  if (!text) return null;

  // reduced motion時はアニメーションさせず全開示する（元のuseEffectのreduced-motion分岐と
  // 同じ結果を、setStateを介さずレンダー時点の導出値として表現する）。
  const effectiveRevealCount = shouldReduceMotion ? text.length : revealCount;

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      aria-label={text}
      role="text"
    >
      {text.split("").map((char, index) => {
        const isRevealed = index < effectiveRevealCount;

        // Fix Hydration: Render the original character until mounted on the client.
        const displayChar = !isMounted
          ? char
          : isRevealed
            ? char
            : char === " "
              ? " "
              : (scrambleChars[index] ?? char);

        return (
          <span
            key={index}
            className={cn(isRevealed || !isMounted ? revealedClassName : encryptedClassName)}
          >
            {displayChar}
          </span>
        );
      })}
    </motion.span>
  );
};
