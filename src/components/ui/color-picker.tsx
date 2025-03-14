import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { availableColors, type CategoryColor } from '@/types/task';

interface ColorPickerProps {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('grid grid-cols-6 gap-2', className)}>
      {availableColors.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            `bg-${color}-100 hover:bg-${color}-200 border border-${color}-200`,
            value === color && 'ring-2 ring-offset-2 ring-primary'
          )}
          onClick={() => onChange(color)}
        >
          {value === color && (
            <Check className={`w-4 h-4 text-${color}-700`} />
          )}
        </button>
      ))}
    </div>
  );
}