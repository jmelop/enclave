import {
  Utensils, Car, Home, Heart, Film, Repeat, Package,
  ShoppingCart, ShoppingBag, Plane, Gift, Briefcase, GraduationCap,
  Coffee, PawPrint, Wifi, Smartphone, Shirt, Gamepad2, Music,
  Dumbbell, Baby, Wrench, PiggyBank,
} from 'lucide-react';
import type { Category } from '@/types/budget';

const ICON_MAP: Record<string, React.ReactNode> = {
  utensils:        <Utensils size={14} />,
  car:             <Car size={14} />,
  home:            <Home size={14} />,
  heart:           <Heart size={14} />,
  film:            <Film size={14} />,
  repeat:          <Repeat size={14} />,
  package:         <Package size={14} />,
  'shopping-cart': <ShoppingCart size={14} />,
  'shopping-bag':  <ShoppingBag size={14} />,
  plane:           <Plane size={14} />,
  gift:            <Gift size={14} />,
  briefcase:       <Briefcase size={14} />,
  'graduation-cap': <GraduationCap size={14} />,
  coffee:          <Coffee size={14} />,
  'paw-print':     <PawPrint size={14} />,
  wifi:            <Wifi size={14} />,
  smartphone:      <Smartphone size={14} />,
  shirt:           <Shirt size={14} />,
  gamepad:         <Gamepad2 size={14} />,
  music:           <Music size={14} />,
  dumbbell:        <Dumbbell size={14} />,
  baby:            <Baby size={14} />,
  wrench:          <Wrench size={14} />,
  'piggy-bank':    <PiggyBank size={14} />,
};

// Icon ids offered when creating a new category.
export const CATEGORY_ICONS = Object.keys(ICON_MAP);

interface Props {
  cat: Pick<Category, 'icon' | 'color'>;
  size?: number;
}

export function CategoryGlyph({ cat, size = 32 }: Props) {
  return (
    <span
      style={{
        display: 'grid', placeItems: 'center',
        width: size, height: size, borderRadius: 8, flexShrink: 0,
        background: cat.color + '22', color: cat.color,
      }}
    >
      {ICON_MAP[cat.icon] ?? <Package size={14} />}
    </span>
  );
}
