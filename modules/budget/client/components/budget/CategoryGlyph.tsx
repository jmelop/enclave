import {
  Utensils, Car, Home, Heart, Film, Repeat, Package,
} from 'lucide-react';
import type { Category } from '@/types/budget';

const ICON_MAP: Record<string, React.ReactNode> = {
  utensils:      <Utensils size={14} />,
  car:           <Car size={14} />,
  home:          <Home size={14} />,
  heart:         <Heart size={14} />,
  film:          <Film size={14} />,
  repeat:        <Repeat size={14} />,
  package:       <Package size={14} />,
};

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
