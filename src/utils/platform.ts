export function isMobile(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.maxTouchPoints > 0 &&
    typeof window !== "undefined" &&
    window.innerWidth < 768
  );
}
