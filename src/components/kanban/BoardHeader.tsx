import React from 'react';
import { LayoutGrid, Table as TableIcon, FolderKanban, Archive } from 'lucide-react';
import { Button } from '../ui/button';

interface BoardHeaderProps {
  title: string;
  viewMode: 'kanban' | 'table' | 'categories' | 'archive';
  onViewModeChange: (mode: 'kanban' | 'table' | 'categories' | 'archive') => void;
}

export function BoardHeader({ title, viewMode, onViewModeChange }: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('kanban')}
          className="flex items-center gap-2"
        >
          <LayoutGrid className="w-4 h-4" />
          Kanban
        </Button>
        <Button
          variant={viewMode === 'categories' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('categories')}
          className="flex items-center gap-2"
        >
          <FolderKanban className="w-4 h-4" />
          Categories
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          className="flex items-center gap-2"
        >
          <TableIcon className="w-4 h-4" />
          Table
        </Button>
        <Button
          variant={viewMode === 'archive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('archive')}
          className="flex items-center gap-2"
        >
          <Archive className="w-4 h-4" />
          Archive
        </Button>
      </div>
    </div>
  );
}