export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  assignee: string;
  department: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  // 반복 업무 관련 필드 추가
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  nextDueDate?: string;
  lastCompletedDate?: string;
  completedInstances?: number;
  totalInstances?: number;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'cancelled' | 'none';

// 반복 패턴 타입 추가
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'weekdays' | 'custom';
  interval: number; // 간격 (예: 2주마다면 2)
  dayOfWeek?: number[]; // 요일 (0=일요일, 1=월요일...)
  dayOfMonth?: number; // 월 중 일자
  weekOfMonth?: number; // 월 중 몇 번째 주 (1=첫째주, 2=둘째주...)
  monthOfYear?: number; // 년 중 월 (1=1월, 2=2월...)
  endAfter?: number; // 몇 번 반복 후 종료
  endDate?: string; // 종료 날짜
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  assignee: string;
  department: string;
  tags: string[];
  notes?: string;
  // 반복 업무 관련 필드 추가
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface Department {
  id: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  department?: string[];
  assignee?: string[];
  searchTerm?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
