import {
  Trees,
  Umbrella,
  Waves,
  Landmark,
  UtensilsCrossed,
  Compass,
  Hotel,
  CircleCheck,
  Footprints,
  Mountain,
  Accessibility,
  type LucideProps,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Trees,
  Umbrella,
  Waves,
  Landmark,
  UtensilsCrossed,
  Compass,
  Hotel,
  CircleCheck,
  Footprints,
  Mountain,
  Accessibility,
};

export default function CategoryIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}
