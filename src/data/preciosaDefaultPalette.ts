import { BeadColor, PreciosaCatalogCategory } from '../types/beads';

export const PRECIOSA_CATALOG: PreciosaCatalogCategory[] = [
  {
    artNo: '331 19 001',
    category: 'Opaque (Непрозорий / Sfinx)',
    colors: [
      { code: '03050', hex: '#FFFFFF', name: 'White (Білий)' },
      { code: '23980', hex: '#1B1B1B', name: 'Jet Black (Чорний)' },
      { code: '93190', hex: '#D11D27', name: 'Red (Червоний)' },
      { code: '93210', hex: '#9C151B', name: 'Dark Red (Темно-червоний)' },
      { code: '83110', hex: '#F4C430', name: 'Butter Yellow (Жовтий)' },
      { code: '13600', hex: '#E65100', name: 'Orange (Помаранчевий)' },
      { code: '53250', hex: '#55B359', name: 'Light Green (Світло-зелений)' },
      { code: '53270', hex: '#277738', name: 'Forest Green (Зелений)' },
      { code: '53430', hex: '#14452F', name: 'Dark Pine (Темно-хвойний)' },
      { code: '33070', hex: '#5DA3D5', name: 'Sky Blue (Блакитний)' },
      { code: '33080', hex: '#1B458F', name: 'Cobalt Blue (Синій кобальт)' },
      { code: '43020', hex: '#6A2875', name: 'Violet (Фіолетовий)' },
      { code: '13710', hex: '#793A24', name: 'Terra Brown (Коричневий)' },
      { code: '23020', hex: '#8E8E93', name: 'Dove Grey (Сірий)' },
    ],
  },
  {
    artNo: '331 19 001',
    category: 'Transparent - Rainbow (Прозорий райдужний)',
    colors: [
      { code: '58205', hex: '#8FB7C9', name: 'Light Blue Rainbow' },
      { code: '11050', hex: '#E6E2D8', name: 'Crystal Rainbow Ivory' },
      { code: '98110', hex: '#B31B34', name: 'Ruby Rainbow' },
      { code: '88130', hex: '#F39C12', name: 'Amber Rainbow' },
      { code: '58430', hex: '#16A085', name: 'Emerald Rainbow' },
      { code: '48102', hex: '#8E44AD', name: 'Amethyst Rainbow' },
      { code: '38102', hex: '#2980B9', name: 'Sapphire Rainbow' },
      { code: '08210', hex: '#E0D0C0', name: 'Champagne Rainbow' },
    ],
  },
  {
    artNo: '331 19 001',
    category: 'Silver Lined (Зі срібною серцевиною / Вогник)',
    colors: [
      { code: '17050', hex: '#D9D9D9', name: 'Crystal Silver Lined' },
      { code: '78102', hex: '#C27D38', name: 'Topaz Silver Lined' },
      { code: '97070', hex: '#E74C3C', name: 'Light Siam Silver Lined' },
      { code: '57102', hex: '#8DB600', name: 'Light Olive Silver Lined' },
      { code: '37100', hex: '#00A896', name: 'Aqua Silver Lined' },
      { code: '47010', hex: '#BA68C8', name: 'Lilac Silver Lined' },
      { code: '87010', hex: '#F1C40F', name: 'Gold Yellow Silver Lined' },
    ],
  },
  {
    artNo: '331 19 001',
    category: 'Iris / Metallic (Ірис / Металік)',
    colors: [
      { code: '49102', hex: '#4A235A', name: 'Purple Iris' },
      { code: '59115', hex: '#1E4620', name: 'Green Iris' },
      { code: '01700', hex: '#825A2C', name: 'Metallic Bronze' },
      { code: '01710', hex: '#3D3D3D', name: 'Metallic Hematite' },
      { code: '01720', hex: '#D4AF37', name: 'Metallic Gold' },
      { code: '29010', hex: '#2C3E50', name: 'Metallic Gunmetal' },
    ],
  },
  {
    artNo: '331 19 001',
    category: 'Alabaster / Chalk (Алебастр / Пастель)',
    colors: [
      { code: '02090', hex: '#F8F9FA', name: 'Chalk White' },
      { code: '02110', hex: '#FFFDD0', name: 'Cream Alabaster' },
      { code: '62020', hex: '#F8BBD0', name: 'Baby Pink Alabaster' },
      { code: '32010', hex: '#B3E5FC', name: 'Sky Blue Alabaster' },
      { code: '52020', hex: '#C8E6C9', name: 'Mint Alabaster' },
      { code: '72010', hex: '#D7CCC8', name: 'Tan Alabaster' },
    ],
  },
];

export const ALL_PRECIOSA_COLORS: BeadColor[] = PRECIOSA_CATALOG.flatMap(cat =>
  cat.colors.map(col => ({
    code: col.code,
    name: col.name || `Preciosa ${col.code}`,
    hex: col.hex,
    category: cat.category,
    artNo: cat.artNo,
  }))
);

export function findColorByCode(code: string | null, customColors: BeadColor[] = []): BeadColor | null {
  if (!code) return null;
  const custom = customColors.find(c => c.code === code);
  if (custom) return custom;
  const standard = ALL_PRECIOSA_COLORS.find(c => c.code === code);
  return standard || {
    code,
    name: `Колір ${code}`,
    hex: '#777777',
    category: 'Невідома',
    artNo: '—',
  };
}
