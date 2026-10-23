// Decorative background: a faint diagonal-line texture behind the top of the
// page that fades out towards the bottom of the screen.
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-96 bg-lines mask-b-from-10% mask-b-to-100%" />
    </div>
  );
}
