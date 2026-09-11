import { MapPin, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";

function VenueListModal({ venueList, onSelect, closeModal }) {
  return (
    <Modal title="Choose a venue" onClose={closeModal}>
      <div className="-mx-1 max-h-80 space-y-2 overflow-y-auto px-1">
        {venueList.map((venue) => (
          <button
            type="button"
            key={venue.id}
            onClick={() => {
              onSelect(venue);
              closeModal();
            }}
            className="w-full rounded-panel border border-surface-border bg-surface-strong p-4 text-left transition hover:border-primary hover:bg-white"
          >
            <span className="block font-medium">{venue.name}</span>
            <span className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden /> {venue.address}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" aria-hidden /> {venue.capacity} seats
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default VenueListModal;
