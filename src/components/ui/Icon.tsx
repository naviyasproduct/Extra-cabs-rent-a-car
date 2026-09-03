import {
  Bus,
  CalendarRange,
  Car,
  CarFront,
  CarTaxiFront,
  Clock,
  Gem,
  HeartHandshake,
  KeyRound,
  LayoutGrid,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * String -> icon registry.
 *
 * Data files reference icons by name so they stay serialisable and can move
 * to a database without dragging React imports along with them.
 */
const registry: Record<string, LucideIcon> = {
  // Services
  key: KeyRound,
  steering: CarTaxiFront,
  plane: Plane,
  rings: HeartHandshake,
  calendar: CalendarRange,
  // Value props
  shield: ShieldCheck,
  tag: Tag,
  clock: Clock,
  sparkle: Sparkles,
  map: MapPin,
  wrench: Wrench,
  // Vehicle categories, keyed to match CarCategory
  all: LayoutGrid,
  micro: Car,
  hatchback: CarFront,
  sedan: CarTaxiFront,
  suv: Truck,
  van: Bus,
  luxury: Gem,
  electric: Zap,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Component = registry[name] ?? Sparkles;
  return <Component className={className} aria-hidden />;
}
