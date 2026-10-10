"use client";
import {useContext, useEffect, useEffectEvent, useRef, useState} from "react";
import {OverlayTriggerStateContext, Popover, PopoverContext, useSlottedContext, type PopoverProps} from "react-aria-components";
import {useInteractOutside} from "react-aria/useInteractOutside";

/** Anchored menus keep the page scrollable, with outside dismissal for nested menus. */
export function AnchoredPopover(props: Omit<PopoverProps, "isNonModal">) {
  const state = useContext(OverlayTriggerStateContext);
  const context = useSlottedContext(PopoverContext);
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const isOpen = state?.isOpen;
  // Escape should also cancel a menu before its opening frames have finished.
  const cancelOpening = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape" && !props.isKeyboardDismissDisabled) {
      event.preventDefault();
      event.stopPropagation();
      state?.close();
    }
  });
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", cancelOpening, true);
    // Let scrolling that brought the trigger into view finish before the
    // popover starts listening for page scrolls that should dismiss it.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        document.removeEventListener("keydown", cancelOpening, true);
        setReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", cancelOpening, true);
      setReady(false);
    };
  }, [isOpen]);
  function shouldDismiss(event: PointerEvent) {
    const popovers = ref.current?.ownerDocument.querySelectorAll("[data-anchored-popover]");
    // A click outside a child menu dismisses that menu before its parent.
    if (!popovers || popovers[popovers.length - 1] !== ref.current) return false;
    const target = event.target;
    const trigger = props.triggerRef?.current ?? context?.triggerRef?.current;
    return target instanceof Element && !trigger?.contains(target) && props.shouldCloseOnInteractOutside?.(target) !== false;
  }
  useInteractOutside({
    ref,
    isDisabled: !state?.isOpen,
    onInteractOutsideStart: event => {
      if (shouldDismiss(event)) {
        // Dismiss first, without activating a control underneath the menu.
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onInteractOutside: event => {
      if (shouldDismiss(event)) {
        event.preventDefault();
        event.stopPropagation();
        state?.close();
      }
    },
  });
  return <Popover {...props} ref={ref} isOpen={Boolean(state?.isOpen && ready)} onOpenChange={state?.setOpen} isNonModal data-anchored-popover/>;
}
