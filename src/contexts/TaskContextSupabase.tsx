import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Task, TaskFormData, TaskFilter, TaskStatus, TaskPriority, RecurrencePattern } from '../types';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  departments: string[];
  email?: string;
  phone?: string;
  role?: string;
}

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  filter: TaskFilter;
  loading: boolean;
  error: string | null;
  users: User[];
}

type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_FILTER'; payload: TaskFilter }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'UPDATE_PROGRESS_AND_STATUS'; payload: { id: string; progress: number; status: TaskStatus; priority: TaskPriority } }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string };

// 샘플 데이터 (초기 로딩용)
const sampleTasks: Task[] = [
  {
    id: '1',
    title: '웹사이트 리뉴얼 프로젝트',
    description: '중독포럼 공식 웹사이트를 현대적인 디자인으로 개편하고 사용자 경험을 개선합니다.',
    status: 'in-progress',
    priority: 'high',
    startDate: '2025-09-01T00:00:00.000Z',
    endDate: '2025-09-30T00:00:00.000Z',
    progress: 65,
    assignee: '김에스더',
    department: '운영(실행)위원회',
    tags: ['웹사이트', '리뉴얼', 'UX/UI'],
    createdAt: '2025-09-01T00:00:00.000Z',
    updatedAt: '2025-09-15T00:00:00.000Z',
    notes: '사용자 피드백을 반영하여 반응형 디자인 적용 필요'
  }
];

const initialState: TaskState = {
  tasks: [],
  filteredTasks: [],
  filter: {},
  loading: false,
  error: null,
  users: []
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        filteredTasks: action.payload,
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
        filteredTasks: [...state.filteredTasks, action.payload],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        ),
        filteredTasks: state.filteredTasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        filteredTasks: state.filteredTasks.filter(task => task.id !== action.payload),
      };
    case 'SET_FILTER':
      const filtered = applyFilter(state.tasks, action.payload);
      return {
        ...state,
        filter: action.payload,
        filteredTasks: filtered,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_PROGRESS':
      const updatedTasks = state.tasks.map(task =>
        task.id === action.payload.id
          ? { ...task, progress: action.payload.progress }
          : task
      );
      return {
        ...state,
        tasks: updatedTasks,
        filteredTasks: applyFilter(updatedTasks, state.filter),
      };
    case 'UPDATE_PROGRESS_AND_STATUS':
      const updatedTasksWithStatus = state.tasks.map(task =>
        task.id === action.payload.id
          ? { 
              ...task, 
              progress: action.payload.progress,
              status: action.payload.status,
              priority: action.payload.priority,
              updatedAt: new Date().toISOString()
            }
          : task
      );
      return {
        ...state,
        tasks: updatedTasksWithStatus,
        filteredTasks: applyFilter(updatedTasksWithStatus, state.filter),
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
      };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    default:
      return state;
  }
};

const applyFilter = (tasks: Task[], filter: TaskFilter): Task[] => {
  return tasks.filter(task => {
    if (filter.searchTerm && filter.searchTerm.trim()) {
      const searchTerm = filter.searchTerm.toLowerCase();
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.assignee.toLowerCase().includes(searchTerm) ||
        task.department.toLowerCase().includes(searchTerm) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    if (filter.status && filter.status.length > 0 && !filter.status.includes(task.status)) {
      return false;
    }
    
    if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(task.priority)) {
      return false;
    }
    
    if (filter.department && filter.department.length > 0 && !filter.department.includes(task.department)) {
      return false;
    }
    
    if (filter.assignee && filter.assignee.length > 0 && !filter.assignee.includes(task.assignee)) {
      return false;
    }
    
    if (filter.dateRange) {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const filterStart = new Date(filter.dateRange.start);
      const filterEnd = new Date(filter.dateRange.end);
      
      if (taskStart > filterEnd || taskEnd < filterStart) {
        return false;
      }
    }
    
    return true;
  });
};

interface TaskContextType {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  addTask: (taskData: TaskFormData) => Promise<void>;
  updateTask: (id: string, taskData: Partial<TaskFormData>) => Promise<void>;
  updateTaskStatus: (id: string, newStatus: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateProgress: (id: string, progress: number) => Promise<void>;
  toggleTaskCancellation: (id: string) => Promise<void>;
  applyFilter: (filter: TaskFilter) => void;
  updateAllTaskStatuses: () => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  completeRecurringTask: (taskId: string) => Promise<void>;
  loadTasks: () => Promise<void>;
  loadUsers: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Supabase에서 데이터 로드
  const loadTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Supabase 데이터를 Task 형식으로 변환
      const tasks: Task[] = data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        status: row.status as TaskStatus,
        priority: row.priority as TaskPriority,
        startDate: row.start_date,
        endDate: row.end_date,
        progress: row.progress,
        assignee: row.assignee || '',
        department: row.department || '',
        tags: row.tags || [],
        isRecurring: row.is_recurring || false,
        recurrencePattern: row.recurrence_pattern,
        nextDueDate: row.next_due_date,
        lastCompletedDate: row.last_completed_date,
        completedInstances: row.completed_instances || 0,
        totalInstances: row.total_instances || 0,
        notes: row.notes || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('업무 로드 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '업무를 불러오는데 실패했습니다.' });
      // 샘플 데이터로 폴백
      dispatch({ type: 'SET_TASKS', payload: sampleTasks });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const users: User[] = data.map(row => ({
        id: row.id,
        name: row.name,
        departments: row.departments || [],
        email: row.email || undefined,
        phone: row.phone || undefined,
        role: row.role || undefined
      }));

      dispatch({ type: 'SET_USERS', payload: users });
    } catch (error) {
      console.error('사용자 로드 실패:', error);
      // 기본 사용자 데이터로 폴백
      const defaultUsers: User[] = [
        { id: '1', name: '김에스더', departments: ['운영(실행)위원회'] },
        { id: '2', name: '안유석', departments: ['운영(실행)위원회'] },
        { id: '3', name: '김민한', departments: ['연구지원실'] }
      ];
      dispatch({ type: 'SET_USERS', payload: defaultUsers });
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  // 실시간 기능은 현재 사용할 수 없으므로 주기적으로 데이터 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      // 30초마다 데이터 새로고침 (선택사항)
      // loadTasks();
      // loadUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const addTask = async (taskData: TaskFormData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const newTask = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        start_date: taskData.startDate,
        end_date: taskData.endDate,
        progress: 0,
        assignee: taskData.assignee,
        department: taskData.department,
        tags: taskData.tags || [],
        is_recurring: taskData.isRecurring || false,
        recurrence_pattern: taskData.recurrencePattern || null,
        next_due_date: taskData.nextDueDate || null,
        last_completed_date: null,
        completed_instances: 0,
        total_instances: taskData.totalInstances || 0,
        notes: taskData.notes || ''
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      // 성공적으로 추가된 업무를 상태에 반영
      const addedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        startDate: data.start_date,
        endDate: data.end_date,
        progress: data.progress,
        assignee: data.assignee || '',
        department: data.department || '',
        tags: data.tags || [],
        isRecurring: data.is_recurring || false,
        recurrencePattern: data.recurrence_pattern,
        nextDueDate: data.next_due_date,
        lastCompletedDate: data.last_completed_date,
        completedInstances: data.completed_instances || 0,
        totalInstances: data.total_instances || 0,
        notes: data.notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      dispatch({ type: 'ADD_TASK', payload: addedTask });
    } catch (error) {
      console.error('업무 추가 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '업무를 추가하는데 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateTask = async (id: string, taskData: Partial<TaskFormData>) => {
    try {
      const updateData: any = {};
      
      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined) updateData.description = taskData.description;
      if (taskData.status !== undefined) updateData.status = taskData.status;
      if (taskData.priority !== undefined) updateData.priority = taskData.priority;
      if (taskData.startDate !== undefined) updateData.start_date = taskData.startDate;
      if (taskData.endDate !== undefined) updateData.end_date = taskData.endDate;
      if (taskData.assignee !== undefined) updateData.assignee = taskData.assignee;
      if (taskData.department !== undefined) updateData.department = taskData.department;
      if (taskData.tags !== undefined) updateData.tags = taskData.tags;
      if (taskData.isRecurring !== undefined) updateData.is_recurring = taskData.isRecurring;
      if (taskData.recurrencePattern !== undefined) updateData.recurrence_pattern = taskData.recurrencePattern;
      if (taskData.nextDueDate !== undefined) updateData.next_due_date = taskData.nextDueDate;
      if (taskData.totalInstances !== undefined) updateData.total_instances = taskData.totalInstances;
      if (taskData.notes !== undefined) updateData.notes = taskData.notes;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // 로컬 상태 업데이트
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        const updatedTask: Task = {
          ...task,
          ...taskData,
          updatedAt: updateData.updated_at
        };
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      }
    } catch (error) {
      console.error('업무 업데이트 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '업무를 업데이트하는데 실패했습니다.' });
    }
  };

  const updateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    try {
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        let updateData: any = { status: newStatus };
        
        if (newStatus === 'cancelled') {
          updateData.progress = 0;
          updateData.priority = 'none';
        } else if (newStatus === 'completed') {
          updateData.progress = 100;
          updateData.priority = 'low';
        }
        
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        // 로컬 상태 업데이트
        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { 
            id, 
            progress: updateData.progress || task.progress, 
            status: newStatus, 
            priority: updateData.priority || task.priority 
          } 
        });
      }
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '상태를 업데이트하는데 실패했습니다.' });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('업무 삭제 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '업무를 삭제하는데 실패했습니다.' });
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        if (task.status === 'cancelled') {
          // 취소된 업무는 진행률만 업데이트
          const { error } = await supabase
            .from('tasks')
            .update({ 
              progress, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', id);

          if (error) throw error;

          dispatch({ 
            type: 'UPDATE_PROGRESS_AND_STATUS', 
            payload: { id, progress, status: 'cancelled', priority: 'none' } 
          });
          return;
        }

        // 진행률에 따른 자동 상태 업데이트
        let newStatus = task.status;
        let newPriority = task.priority;

        if (progress === 100) {
          newStatus = 'completed';
          newPriority = 'low';
        } else if (progress === 0) {
          newStatus = task.status; // 기존 상태 유지
        }

        const { error } = await supabase
          .from('tasks')
          .update({ 
            progress, 
            status: newStatus,
            priority: newPriority,
            updated_at: new Date().toISOString() 
          })
          .eq('id', id);

        if (error) throw error;

        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { id, progress, status: newStatus, priority: newPriority } 
        });
      }
    } catch (error) {
      console.error('진행률 업데이트 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '진행률을 업데이트하는데 실패했습니다.' });
    }
  };

  const toggleTaskCancellation = async (id: string) => {
    try {
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        let updateData: any = {};
        
        if (task.status === 'cancelled') {
          // 취소 상태를 해제하고 진행중으로 변경
          updateData = {
            status: 'in-progress',
            progress: 50,
            priority: 'medium',
            updated_at: new Date().toISOString()
          };
        } else {
          // 취소 상태로 변경
          updateData = {
            status: 'cancelled',
            progress: 0,
            priority: 'none',
            updated_at: new Date().toISOString()
          };
        }

        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { 
            id, 
            progress: updateData.progress, 
            status: updateData.status, 
            priority: updateData.priority 
          } 
        });
      }
    } catch (error) {
      console.error('취소 상태 토글 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '취소 상태를 변경하는데 실패했습니다.' });
    }
  };

  const applyFilter = (filter: TaskFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const updateAllTaskStatuses = async () => {
    try {
      const now = new Date();
      const updatedTasks = state.tasks.map(task => {
        if (task.status === 'cancelled') {
          return task;
        }

        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
        let newStatus = task.status;

        if (task.progress === 100) {
          newStatus = 'completed';
        } else if (now < startDate) {
          newStatus = task.progress === 0 ? 'pending' : 'in-progress';
        } else if (task.progress === 0) {
          newStatus = 'delayed';
        } else if (now > endDate && task.progress < 100) {
          newStatus = 'delayed';
        } else {
          newStatus = 'in-progress';
        }

        if (newStatus !== task.status) {
          return {
            ...task,
            status: newStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      });

      const hasChanges = updatedTasks.some((task, index) => task.status !== state.tasks[index].status);
      if (hasChanges) {
        // 변경된 업무들을 Supabase에 일괄 업데이트
        const tasksToUpdate = updatedTasks.filter((task, index) => task.status !== state.tasks[index].status);
        
        for (const task of tasksToUpdate) {
          const { error } = await supabase
            .from('tasks')
            .update({ 
              status: task.status, 
              updated_at: task.updatedAt 
            })
            .eq('id', task.id);

          if (error) {
            console.error(`업무 ${task.id} 상태 업데이트 실패:`, error);
          }
        }

        dispatch({ type: 'SET_TASKS', payload: updatedTasks });
      }
    } catch (error) {
      console.error('전체 상태 업데이트 실패:', error);
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      const newUser: User = {
        id: data.id,
        name: data.name,
        departments: data.departments || [],
        email: data.email || undefined,
        phone: data.phone || undefined,
        role: data.role || undefined
      };

      dispatch({ type: 'ADD_USER', payload: newUser });
    } catch (error) {
      console.error('사용자 추가 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '사용자를 추가하는데 실패했습니다.' });
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const updateData: any = {};
      
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.departments !== undefined) updateData.departments = userData.departments;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.phone !== undefined) updateData.phone = userData.phone;
      if (userData.role !== undefined) updateData.role = userData.role;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      const existingUser = state.users.find(user => user.id === id);
      if (existingUser) {
        const updatedUser = { ...existingUser, ...userData };
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }
    } catch (error) {
      console.error('사용자 업데이트 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '사용자를 업데이트하는데 실패했습니다.' });
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_USER', payload: id });
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '사용자를 삭제하는데 실패했습니다.' });
    }
  };

  const completeRecurringTask = async (taskId: string) => {
    try {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task || !task.isRecurring || !task.recurrencePattern) return;

      const now = new Date();
      const nextDueDate = calculateNextDueDate(task.recurrencePattern, now);
      
      if (nextDueDate) {
        // 현재 인스턴스 완료 처리
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            progress: 100,
            last_completed_date: now.toISOString(),
            completed_instances: (task.completedInstances || 0) + 1,
            updated_at: now.toISOString()
          })
          .eq('id', taskId);

        if (updateError) throw updateError;

        // 다음 차례 생성
        const nextInstance = {
          title: task.title,
          description: task.description,
          status: 'pending',
          priority: task.priority,
          start_date: nextDueDate.toISOString(),
          end_date: new Date(nextDueDate.getTime() + (new Date(task.endDate).getTime() - new Date(task.startDate).getTime())).toISOString(),
          progress: 0,
          assignee: task.assignee,
          department: task.department,
          tags: task.tags,
          is_recurring: true,
          recurrence_pattern: task.recurrencePattern,
          next_due_date: nextDueDate.toISOString(),
          last_completed_date: null,
          completed_instances: 0,
          total_instances: task.totalInstances,
          notes: task.notes
        };

        const { data: newTask, error: insertError } = await supabase
          .from('tasks')
          .insert([nextInstance])
          .select()
          .single();

        if (insertError) throw insertError;

        // 로컬 상태 업데이트
        const updatedTask = {
          ...task,
          status: 'completed' as TaskStatus,
          progress: 100,
          lastCompletedDate: now.toISOString(),
          completedInstances: (task.completedInstances || 0) + 1,
          updatedAt: now.toISOString()
        };

        const nextTask: Task = {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description || '',
          status: newTask.status as TaskStatus,
          priority: newTask.priority as TaskPriority,
          startDate: newTask.start_date,
          endDate: newTask.end_date,
          progress: newTask.progress,
          assignee: newTask.assignee || '',
          department: newTask.department || '',
          tags: newTask.tags || [],
          isRecurring: newTask.is_recurring || false,
          recurrencePattern: newTask.recurrence_pattern,
          nextDueDate: newTask.next_due_date,
          lastCompletedDate: newTask.last_completed_date,
          completedInstances: newTask.completed_instances || 0,
          totalInstances: newTask.total_instances || 0,
          notes: newTask.notes || '',
          createdAt: newTask.created_at,
          updatedAt: newTask.updated_at
        };

        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
        dispatch({ type: 'ADD_TASK', payload: nextTask });
      }
    } catch (error) {
      console.error('반복 업무 완료 처리 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '반복 업무를 완료하는데 실패했습니다.' });
    }
  };

  // 다음 마감일 계산 함수 (기존과 동일)
  const calculateNextDueDate = (pattern: RecurrencePattern, fromDate: Date): Date | null => {
    const nextDate = new Date(fromDate);
    
    switch (pattern.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * pattern.interval));
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + (pattern.interval * 7));
        break;
      case 'monthly':
        if (pattern.weekOfMonth) {
          const targetMonth = new Date(fromDate);
          targetMonth.setMonth(targetMonth.getMonth() + pattern.interval);
          
          const firstDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
          const firstDayOfWeek = firstDay.getDay();
          
          const targetDayOfWeek = pattern.dayOfWeek && pattern.dayOfWeek.length > 0 
            ? pattern.dayOfWeek[0] 
            : fromDate.getDay();
          
          let daysToAdd = (targetDayOfWeek - firstDayOfWeek + 7) % 7;
          daysToAdd += (pattern.weekOfMonth - 1) * 7;
          
          nextDate.setDate(1);
          nextDate.setMonth(nextDate.getMonth() + pattern.interval);
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        } else {
          nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        }
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * pattern.interval));
        break;
      case 'yearly':
        if (pattern.monthOfYear) {
          nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
          nextDate.setMonth(pattern.monthOfYear - 1);
          
          if (pattern.dayOfWeek && pattern.dayOfWeek.length > 0) {
            const targetDayOfWeek = pattern.dayOfWeek[0];
            const currentDayOfWeek = nextDate.getDay();
            const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
            nextDate.setDate(nextDate.getDate() + daysToAdd);
          }
        } else {
          nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
        }
        break;
      case 'weekdays':
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;
      case 'custom':
        if (pattern.dayOfWeek && pattern.dayOfWeek.length > 0) {
          let daysToAdd = 1;
          while (daysToAdd <= 7) {
            const testDate = new Date(fromDate);
            testDate.setDate(testDate.getDate() + daysToAdd);
            if (pattern.dayOfWeek.includes(testDate.getDay())) {
              nextDate.setDate(fromDate.getDate() + daysToAdd);
              break;
            }
            daysToAdd++;
          }
          if (pattern.interval > 1) {
            nextDate.setDate(nextDate.getDate() + ((pattern.interval - 1) * 7));
          }
        }
        break;
      default:
        return null;
    }

    if (pattern.endDate && nextDate > new Date(pattern.endDate)) {
      return null;
    }
    if (pattern.endAfter && (pattern.endAfter <= 0)) {
      return null;
    }

    return nextDate;
  };

  const value: TaskContextType = {
    state,
    dispatch,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    updateProgress,
    toggleTaskCancellation,
    applyFilter,
    updateAllTaskStatuses,
    addUser,
    updateUser,
    deleteUser,
    completeRecurringTask,
    loadTasks,
    loadUsers
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
