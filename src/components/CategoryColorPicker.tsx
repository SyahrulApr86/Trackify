import { Label } from './ui/label';
import { ColorPicker } from './ui/color-picker';
import { CategoryColor } from '@/types/task';

interface CategoryColorPickerProps {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
  label?: string;
  className?: string;
}

export function CategoryColorPicker({ value, onChange, label = 'Color', className }: CategoryColorPickerProps) {
  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <ColorPicker value={value} onChange={onChange} />
    </div>
  );
}