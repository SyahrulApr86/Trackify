import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TaskStatus, Category, Tag } from '@/types/task';

interface TaskFiltersProps {
  selectedCategory?: string | 'all';
  selectedStatus?: TaskStatus | 'all';
  selectedTag?: string | 'all';
  onCategoryChange?: (category: string | 'all') => void;
  onStatusChange?: (status: TaskStatus | 'all') => void;
  onTagChange?: (tag: string | 'all') => void;
  showStatusFilter?: boolean;
  showCategoryFilter?: boolean;
  showTagFilter?: boolean;
  categories: Category[];
  tags: Tag[];
}

export function TaskFilters({
  selectedCategory = 'all',
  selectedStatus = 'all',
  selectedTag = 'all',
  onCategoryChange,
  onStatusChange,
  onTagChange,
  showStatusFilter = true,
  showCategoryFilter = true,
  showTagFilter = true,
  categories,
  tags,
}: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        {showCategoryFilter && onCategoryChange && (
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showStatusFilter && onStatusChange && (
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        )}

        {showTagFilter && onTagChange && tags.length > 0 && (
          <Select value={selectedTag} onValueChange={onTagChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.name}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}