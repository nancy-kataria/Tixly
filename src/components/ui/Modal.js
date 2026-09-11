import { X } from "lucide-react";

// Centered dialog over a blurred backdrop.
export default function Modal({ title, description, onClose, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
    >
      <div className="glass-strong relative w-full max-w-md rounded-card p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-5" aria-hidden />
        </button>
        <h2 id="modal-title" className="pr-8 text-2xl font-medium tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
