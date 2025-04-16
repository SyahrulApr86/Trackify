import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { 
  ArrowUpDown,
  Check,
  Pencil,
  Trash2,
  AlertTriangle,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskStatus, Category, getCategoryColors } from '../types/task';
import { TagInput } from './TagInput';

interface TaskTableProps {
  tasks: Task[];
  categories: Category[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onBulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
}

// Interface untuk nilai edit yang disiapkan untuk TagInput
interface EditValues extends Omit<Partial<Task>, 'tags'> {
  tags?: string[];
}

type SortField = 'deadline' | 'category' | 'status' | 'priority';
type SortOrder = 'asc' | 'desc';

export function TaskTable({ 
  tasks, 
  categories,
  onUpdateTask, 
  onDeleteTask,
  onBulkUpdateTasks 
}: TaskTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editValues, setEditValues] = useState<EditValues>({});
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to get category color from the categories list
  const getCategoryColorByName = (categoryName: string): string | undefined => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortField) return 0;
    
    if (sortField === 'priority') {
      return sortOrder === 'asc' 
        ? a.priority - b.priority
        : b.priority - a.priority;
    }
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return sortOrder === 'asc' ? 1 : -1;
    if (!bValue) return sortOrder === 'asc' ? -1 : 1;
    
    return sortOrder === 'asc' 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task.id);
    setEditValues({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      category: task.category,
      status: task.status,
      tags: task.tags?.map(tag => tag.name) || [],
      priority: task.priority
    });
  };

  const handleSaveEdit = async (taskId: string) => {
    // Konversi tags dari string[] ke Tag[] sebelum mengirim ke API
    const updatedTask = { ...editValues };
    
    // Ubah properti tags untuk sesuai dengan tipe Tag[]
    if (updatedTask.tags && Array.isArray(updatedTask.tags)) {
      const tagObjects = (updatedTask.tags as string[]).map(tagName => ({
        id: '',
        name: tagName,
        user_id: '',
        created_at: ''
      }));
      
      // Ganti dengan nilai yang telah dikonversi
      const taskToUpdate = { ...updatedTask };
      delete taskToUpdate.tags;
      
      await onUpdateTask(taskId, {
        ...taskToUpdate,
        tags: tagObjects
      });
    } else {
      await onUpdateTask(taskId, updatedTask as Partial<Task>);
    }
    
    setEditingTask(null);
    setEditValues({});
  };

  const handleDelete = async (task: Task) => {
    try {
      setIsDeleting(true);
      await onDeleteTask(task.id);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'status' | 'category', value: string) => {
    const updates: Partial<Task> = {};
    if (action === 'status') {
      updates.status = value as TaskStatus;
    } else {
      updates.category = value;
    }
    await onBulkUpdateTasks(Array.from(selectedTasks), updates);
    setSelectedTasks(new Set());
  };

  return (
    <div className="space-y-4">
      {selectedTasks.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg animate-slide-in">
          <span className="text-sm font-medium">
            {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Set Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkAction('status', 'To Do')}>
                To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('status', 'In Progress')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('status', 'Done')}>
                Done
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Set Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map(category => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => handleBulkAction('category', category.name)}
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.size === tasks.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort('deadline')}>
                <div className="flex items-center gap-1">
                  Deadline
                  <ArrowUpDown size={16} />
                </div>
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('category')}>
                <div className="flex items-center gap-1">
                  Category
                  <ArrowUpDown size={16} />
                </div>
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown size={16} />
                </div>
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('priority')}>
                <div className="flex items-center gap-1">
                  Priority
                  <ArrowUpDown size={16} />
                </div>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map(task => {
              // Get the category color from the categories list
              const categoryColor = getCategoryColorByName(task.category || '');
              const categoryColors = getCategoryColors(task.category, categoryColor);
              
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => handleSelectTask(task.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {editingTask === task.id ? (
                      <Input
                        value={editValues.title}
                        onChange={e => setEditValues({ ...editValues, title: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      task.title
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTask === task.id ? (
                      <Input
                        value={editValues.description}
                        onChange={e => setEditValues({ ...editValues, description: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      task.description || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTask === task.id ? (
                      <Input
                        type="datetime-local"
                        value={editValues.deadline?.slice(0, 16) || ''}
                        onChange={e => setEditValues({ ...editValues, deadline: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy HH:mm') : '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTask === task.id ? (
                      <Select
                        value={editValues.category}
                        onValueChange={value => setEditValues({ ...editValues, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      task.category ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
                          {task.category}
                        </span>
                      ) : '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTask === task.id ? (
                      <Select
                        value={editValues.status}
                        onValueChange={value => setEditValues({ ...editValues, status: value as TaskStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To Do">To Do</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${task.status === 'Done' ? 'bg-green-100 text-green-700' :
                          task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {task.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTask === task.id ? (
                      <Select
                        value={editValues.priority?.toString()}
                        onValueChange={value => setEditValues({ ...editValues, priority: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="99999">No Priority</SelectItem>
                          {[1, 2, 3, 4, 5].map((p) => (
                            <SelectItem key={p} value={p.toString()}>
                              <div className="flex items-center gap-2">
                                <Flag className="w-4 h-4" />
                                Priority {p}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      task.priority < 99999 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          <Flag className="w-3 h-3" />
                          P{task.priority}
                        </span>
                      ) : '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTask === task.id ? (
                      <TagInput
                        tags={editValues.tags || []}
                        onTagsChange={(tags) => setEditValues({ ...editValues, tags })}
                        placeholder="Add tags..."
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {task.tags?.map(tag => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingTask === task.id ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveEdit(task.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(task)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTaskToDelete(task)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Task
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => taskToDelete && handleDelete(taskToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}