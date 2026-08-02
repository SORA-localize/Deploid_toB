"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useCallback, useId, useRef, useState, useSyncExternalStore } from "react";

export type AnimatedTooltipPlacement = "top" | "bottom" | "left" | "right";

export interface AnimatedTooltipProps {
  /** The trigger element the tooltip is anchored to */
  children: ReactNode;
  /** Additional CSS class names for the tooltip container */
  className?: string;
  /** Content displayed inside the tooltip */
  content: ReactNode;
  /** Delay in milliseconds before the tooltip appears */
  delay?: number;
  /** Placement of the tooltip relative to the trigger */
  placement?: AnimatedTooltipPlacement;
}

const placementStyles: Record<AnimatedTooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles: Record<AnimatedTooltipPlacement, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-foreground border-x-transparent border-b-transparent",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-b-foreground border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-foreground border-y-transparent border-r-transparent",
  right:
    "right-full top-1/2 -translate-y-1/2 border-r-foreground border-y-transparent border-l-transparent",
};

const arrowBorderSize: Record<AnimatedTooltipPlacement, string> = {
  top: "border-4",
  bottom: "border-4",
  left: "border-4",
  right: "border-4",
};

// hover可能なポインタデバイス判定。useEffect + setState ではなく
// useSyncExternalStore で表現し、変更イベントにも購読する
// （react-hooks/set-state-in-effect回避）。
const HOVER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";
function subscribeHoverDevice(callback: () => void) {
  const mediaQuery = window.matchMedia(HOVER_MEDIA_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}
function getHoverDeviceSnapshot() {
  return window.matchMedia(HOVER_MEDIA_QUERY).matches;
}
function getHoverDeviceServerSnapshot() {
  return false;
}
function useHoverDevice(): boolean {
  return useSyncExternalStore(
    subscribeHoverDevice,
    getHoverDeviceSnapshot,
    getHoverDeviceServerSnapshot,
  );
}

// 非表示時のずらし方向。旧実装の initial/exit transform（4px）と同じ向きに合わせる。
// placementStyles 側の中央寄せ（-translate-x-1/2 等）とは別軸なので競合しない。
const enterFrom: Record<AnimatedTooltipPlacement, string> = {
  top: "translate-y-1",
  bottom: "-translate-y-1",
  left: "translate-x-1",
  right: "-translate-x-1",
};

const AnimatedTooltip = ({
  content,
  placement = "top",
  delay = 0,
  children,
  className,
}: AnimatedTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const isHoverDevice = useHoverDevice();
  const tooltipId = useId();
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (delay > 0) {
      delayTimerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  }, [delay]);

  const hide = useCallback(() => {
    if (delayTimerRef.current !== null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
      }
    },
    [hide]
  );

  return (
    <span
      className="relative inline-flex"
      onBlur={hide}
      onFocus={show}
      onKeyDown={handleKeyDown}
      onMouseEnter={isHoverDevice ? show : undefined}
      onMouseLeave={isHoverDevice ? hide : undefined}
    >
      <span aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </span>

      {/* 常時mountし可視状態をclassで切り替える。display:none だと transition が効かず
          exit のアニメーションが表現できないため、opacity と pointer-events で隠す。 */}
      <span
        aria-hidden={!isVisible}
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-xs rounded-md bg-foreground px-3 py-1.5 text-background text-sm shadow-md",
          "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
          isVisible
            ? "scale-100 opacity-100"
            : cn("scale-95 opacity-0", enterFrom[placement]),
          placementStyles[placement],
          className
        )}
        id={tooltipId}
        role="tooltip"
      >
        {content}
        <span
          aria-hidden="true"
          className={cn(
            "absolute block h-0 w-0",
            arrowBorderSize[placement],
            arrowStyles[placement]
          )}
        />
      </span>
    </span>
  );
};

export default AnimatedTooltip;
