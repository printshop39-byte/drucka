import { useEffect, useRef } from "react";

/* ── Shared modal accessibility ──
   Every full-screen editor and dialog on the site hand-rolled (or skipped)
   the same four behaviours, so some trapped focus and some did not, and Esc
   worked in roughly half of them. One hook now:

     1. Esc closes.
     2. Tab is trapped inside the dialog.
     3. Focus moves in on open and returns to the trigger on close.
     4. The page behind stops scrolling.

   Usage: const ref = useModalA11y(onClose); <div ref={ref} role="dialog" …>

   `enabled` exists for dialogs that stack — a nested crop modal takes the
   trap while it is open, and the parent hands it back afterwards. */
const FOCUSABLE = [
  "a[href]", "button:not([disabled])", "input:not([disabled])",
  "select:not([disabled])", "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function useModalA11y(onClose, enabled = true) {
  const ref = useRef(null);
  /* kept in a ref so changing the handler does not re-run the effect and
     re-steal focus mid-interaction */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!enabled) return undefined;
    const node = ref.current;
    const restoreTo = document.activeElement;

    const visible = () =>
      [...(node?.querySelectorAll(FOCUSABLE) ?? [])].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    /* Move focus in, but don't fight an autofocused field if one exists. */
    if (node && !node.contains(document.activeElement)) {
      const first = visible()[0];
      if (first) first.focus();
      else { node.setAttribute("tabindex", "-1"); node.focus(); }
    }

    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current?.(); return; }
      if (e.key !== "Tab" || !node) return;
      const items = visible();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      /* focus may be outside the dialog entirely (a stray programmatic
         blur); pull it back rather than letting Tab escape into the page */
      if (!node.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      /* the trigger may have unmounted with the view that opened us */
      if (restoreTo instanceof HTMLElement && document.contains(restoreTo)) restoreTo.focus();
    };
  }, [enabled]);

  return ref;
}
