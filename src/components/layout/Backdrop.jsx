// Decorative background: a hairline grid with a soft blue glow near the top,
// both fading out towards the bottom of the screen.
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-grid mask-b-from-20% mask-b-to-100%" />
      <div className="absolute -top-40 left-1/3 h-[36rem] w-[48rem] rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
    </div>
  );
}
