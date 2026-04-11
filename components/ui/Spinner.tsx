export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="spinnerWrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      <span className="visuallyHidden">{label}</span>
    </span>
  );
}
