import Image from "next/image";
import { Mic, Trophy } from "lucide-react";
import rockIndoor from "../../public/images/events/rock-indoor.jpg";
import rockOutdoor from "../../public/images/events/rock-outdoor.jpg";
import jazz from "../../public/images/events/jazz.jpg";
import theater from "../../public/images/events/theater.jpg";
import { cn } from "@/lib/cn";

// Default photos until organizers can upload their own. Categories with no
// photo yet get a branded placeholder instead of a mismatched picture.
const PLACEHOLDER_ICONS = { comedy: Mic, sports: Trophy };

function defaultPhoto(event) {
  if (event.category === "theater") return theater;
  if (event.category !== "music") return null;
  if (/jazz|blues|swing/i.test(`${event.name} ${event.artist ?? ""}`)) return jazz;
  // Alternate the two rock photos so neighbouring cards differ, while each
  // event keeps the same photo everywhere it appears.
  const hash = [...event.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % 2 === 0 ? rockIndoor : rockOutdoor;
}

// event: { id, name, artist, category }. Fills its parent, which needs
// position: relative and a size.
export default function EventImage({ event, sizes, priority = false, className }) {
  const photo = defaultPhoto(event);

  if (photo) {
    return (
      <Image
        src={photo}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        className={cn("object-cover", className)}
      />
    );
  }

  const Icon = PLACEHOLDER_ICONS[event.category] ?? Mic;
  return (
    <div
      className={cn("absolute inset-0 grid place-items-center", className)}
      style={{
        background:
          "radial-gradient(circle at 30% 20%, oklch(0.77 0.15 169 / 45%), transparent 60%), linear-gradient(135deg, oklch(0.32 0.06 200), var(--foreground))",
      }}
    >
      <Icon className="size-14 text-primary" strokeWidth={1.5} aria-hidden />
    </div>
  );
}
