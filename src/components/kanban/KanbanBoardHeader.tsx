import { ArrowUpDown } from 'lucide-react';
import { TaskSearch } from '../TaskSearch';
import { TaskFilters } from '../TaskFilters';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Category, Tag, TaskStatus } from '@/types/task';

type SortField = 'deadline' | 'priority' | 'none';
type SortOrder = 'asc' | 'desc';

interface KanbanBoardHeaderProps {
  viewMode: 'kanban' | 'table' | 'categories' | 'archive';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  kanbanFilter: string | 'all';
  onKanbanFilterChange: (filter: string | 'all') => void;
  kanbanTagFilter: string | 'all';
  onKanbanTagFilterChange: (filter: string | 'all') => void;
  tableFilters: {
    category: string | 'all';
    status: TaskStatus | 'all';
    tag: string | 'all';
  };
  onTableFiltersChange: (filters: {
    category?: string | 'all';
    status?: TaskStatus | 'all';
    tag?: string | 'all';
  }) => void;
  categoryViewStatus: TaskStatus | 'all';
  onCategoryViewStatusChange: (status: TaskStatus | 'all') => void;
  categoryViewTag: string | 'all';
  onCategoryViewTagChange: (tag: string | 'all') => void;
  categories: Category[];
  tags: Tag[];
}

export function KanbanBoardHeader({
  viewMode,
  searchQuery,
  onSearchChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  kanbanFilter,
  onKanbanFilterChange,
  kanbanTagFilter,
  onKanbanTagFilterChange,
  tableFilters,
  onTableFiltersChange,
  categoryViewStatus,
  onCategoryViewStatusChange,
  categoryViewTag,
  onCategoryViewTagChange,
  categories,
  tags
}: KanbanBoardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <TaskSearch
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search task titles and descriptions..."
        />

        <Select
          value={sortField}
          onValueChange={(value) => onSortFieldChange(value as SortField)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Sorting</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>

        {sortField !== 'none' && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-10 w-10"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {viewMode === 'kanban' && (
        <TaskFilters
          selectedCategory={kanbanFilter}
          selectedTag={kanbanTagFilter}
          onCategoryChange={onKanbanFilterChange}
          onTagChange={onKanbanTagFilterChange}
          showStatusFilter={false}
          categories={categories}
          tags={tags}
        />
      )}
      {viewMode === 'table' && (
        <TaskFilters
          selectedCategory={tableFilters.category}
          selectedStatus={tableFilters.status}
          selectedTag={tableFilters.tag}
          onCategoryChange={(category) => onTableFiltersChange({ ...tableFilters, category })}
          onStatusChange={(status) => onTableFiltersChange({ ...tableFilters, status })}
          onTagChange={(tag) => onTableFiltersChange({ ...tableFilters, tag })}
          showStatusFilter={true}
          categories={categories}
          tags={tags}
        />
      )}
      {viewMode === 'categories' && (
        <TaskFilters
          selectedStatus={categoryViewStatus}
          selectedTag={categoryViewTag}
          onStatusChange={onCategoryViewStatusChange}
          onTagChange={onCategoryViewTagChange}
          showStatusFilter={true}
          showCategoryFilter={false}
          categories={categories}
          tags={tags}
        />
      )}
    </div>
  );
}