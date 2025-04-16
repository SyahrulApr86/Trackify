import { Search } from 'lucide-react';
import { Input } from './ui/input';

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TaskSearch({ value, onChange, placeholder = "Search tasks..." }: TaskSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}