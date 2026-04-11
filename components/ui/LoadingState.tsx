import { Spinner } from "./Spinner";

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="loadingState" role="status" aria-live="polite" aria-busy="true">
      <Spinner label={message} />
      <span className="loadingStateMessage">{message}</span>
    </div>
  );
}
