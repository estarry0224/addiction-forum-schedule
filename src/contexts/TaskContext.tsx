import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Task, TaskFormData, TaskFilter, TaskStatus, TaskPriority, RecurrencePattern } from '../types';

export interface User {
  id: string;
  name: string;
  departments: string[]; // 여러 부서를 가질 수 있도록 배열로 변경
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

// 샘플 데이터
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
  },
  {
    id: '2',
    title: '연례 심포지엄 준비',
    description: '2025년 중독예방 및 치료 심포지엄 기획 및 준비 작업을 진행합니다.',
    status: 'pending',
    priority: 'urgent',
    startDate: '2025-09-20T00:00:00.000Z',
    endDate: '2025-10-15T00:00:00.000Z',
    progress: 0,
    assignee: '안유석',
    department: '운영(실행)위원회',
    tags: ['심포지엄', '이벤트', '기획'],
    createdAt: '2025-09-10T00:00:00.000Z',
    updatedAt: '2025-09-10T00:00:00.000Z',
    notes: '전문가 초청 및 프로그램 구성 계획 수립 필요'
  },
  {
    id: '3',
    title: '마케팅 캠페인 기획',
    description: '중독예방 인식 제고를 위한 온라인 마케팅 캠페인을 기획하고 실행합니다.',
    status: 'completed',
    priority: 'medium',
    startDate: '2025-08-15T00:00:00.000Z',
    endDate: '2025-09-10T00:00:00.000Z',
    progress: 100,
    assignee: '이수비',
    department: '운영(실행)위원회',
    tags: ['마케팅', '캠페인', '온라인'],
    createdAt: '2025-08-15T00:00:00.000Z',
    updatedAt: '2025-09-10T00:00:00.000Z',
    completedAt: '2025-09-10T00:00:00.000Z',
    notes: '소셜미디어 반응도가 예상보다 높았음'
  },
  {
    id: '4',
    title: '데이터베이스 시스템 업그레이드',
    description: '기존 회원 관리 시스템의 데이터베이스를 최신 버전으로 업그레이드합니다.',
    status: 'delayed',
    priority: 'high',
    startDate: '2025-09-05T00:00:00.000Z',
    endDate: '2025-09-25T00:00:00.000Z',
    progress: 30,
    assignee: '김민한',
    department: '연구지원실',
    tags: ['데이터베이스', '시스템', '업그레이드'],
    createdAt: '2025-09-05T00:00:00.000Z',
    updatedAt: '2025-09-15T00:00:00.000Z',
    notes: '호환성 문제로 인해 일정 지연, 추가 테스트 필요'
  },
  {
    id: '5',
    title: '직원 교육 프로그램 개발',
    description: '중독상담사 자격증 취득을 위한 내부 교육 프로그램을 개발합니다.',
    status: 'in-progress',
    priority: 'medium',
    startDate: '2025-09-10T00:00:00.000Z',
    endDate: '2025-10-20T00:00:00.000Z',
    progress: 45,
    assignee: '김민한',
    department: '연구지원실',
    tags: ['교육', '프로그램', '자격증'],
    createdAt: '2025-09-10T00:00:00.000Z',
    updatedAt: '2025-09-15T00:00:00.000Z',
    notes: '교육 자료 제작 및 실습 과정 설계 진행 중'
  },
  // 반복 업무 샘플 추가
  {
    id: '6',
    title: '중독예방 콘텐츠 업로드',
    description: '중독포럼 공식 블로그에 중독예방 관련 콘텐츠를 정기적으로 업로드합니다.',
    status: 'pending',
    priority: 'medium',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-12-31T00:00:00.000Z',
    progress: 0,
    assignee: '김에스더',
    department: '운영(실행)위원회',
    tags: ['콘텐츠', '블로그', '중독예방'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    notes: '2주마다 새로운 중독예방 콘텐츠 작성 및 업로드',
    isRecurring: true,
    recurrencePattern: {
      type: 'biweekly',
      interval: 2,
      dayOfWeek: [1], // 월요일
      endDate: '2025-12-31T00:00:00.000Z'
    },
    nextDueDate: '2025-01-13T00:00:00.000Z',
    lastCompletedDate: undefined,
    completedInstances: 0,
    totalInstances: 26 // 2025년 2주마다 = 26회
  },
  {
    id: '7',
    title: '연구 동향 리포트 작성',
    description: '중독 관련 최신 연구 동향을 분석하여 정기 리포트를 작성합니다.',
    status: 'pending',
    priority: 'high',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-12-31T00:00:00.000Z',
    progress: 0,
    assignee: '김민한',
    department: '연구지원실',
    tags: ['연구', '리포트', '동향분석'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    notes: '2주마다 국내외 중독 관련 연구 동향 분석 및 리포트 작성',
    isRecurring: true,
    recurrencePattern: {
      type: 'biweekly',
      interval: 2,
      dayOfWeek: [3], // 수요일
      endDate: '2025-12-31T00:00:00.000Z'
    },
    nextDueDate: '2025-01-15T00:00:00.000Z',
    lastCompletedDate: undefined,
    completedInstances: 0,
    totalInstances: 26
  }
];

// 로컬 스토리지에서 데이터 로드
const loadFromLocalStorage = (): TaskState => {
  try {
    const savedTasks = localStorage.getItem('addictionForum_tasks');
    const savedUsers = localStorage.getItem('addictionForum_users');
    const savedFilter = localStorage.getItem('addictionForum_filter');
    
    return {
      tasks: savedTasks ? JSON.parse(savedTasks) : sampleTasks,
      filteredTasks: savedTasks ? JSON.parse(savedTasks) : sampleTasks,
      filter: savedFilter ? JSON.parse(savedFilter) : {},
      loading: false,
      error: null,
      users: savedUsers ? JSON.parse(savedUsers) : [
         // 이사장
     { id: '1', name: '신영철', departments: ['이사장'], email: 'shin@addictionforum.org', phone: '010-0001-0001', role: '이사장 (강북삼성병원, 정신과 전문의)' },
     
     // 고문
     { id: '2', name: '김광기', departments: ['고문'], email: 'kim.kw@addictionforum.org', phone: '010-0002-0001', role: '이화여자대학교' },
     { id: '3', name: '박병주', departments: ['고문'], email: 'park.bj@addictionforum.org', phone: '010-0002-0002', role: '서울시 공공보건의료지원단' },
     { id: '4', name: '윤명숙', departments: ['고문'], email: 'yoon.ms@addictionforum.org', phone: '010-0002-0003', role: '전북대학교' },
     { id: '5', name: '조성남', departments: ['고문'], email: 'jo.sn@addictionforum.org', phone: '010-0002-0004', role: '서울마약관리센터' },
     { id: '6', name: '허근', departments: ['고문'], email: 'heo.g@addictionforum.org', phone: '010-0002-0005', role: '천주교서울대교구' },
     
     // 이사 및 감사
     { id: '7', name: '김용진', departments: ['이사 및 감사'], email: 'kim.yj@addictionforum.org', phone: '010-0003-0001', role: '복지와사람들 중독예방연구소 소장' },
     { id: '8', name: '권선중', departments: ['이사 및 감사'], email: 'kwon.sj@addictionforum.org', phone: '010-0003-0002', role: '한국침례신학대학교 교수' },
     { id: '9', name: '이인숙', departments: ['이사 및 감사'], email: 'lee.is@addictionforum.org', phone: '010-0003-0003', role: '수원시중독통합관리센터장' },
     { id: '10', name: '이해국', departments: ['이사 및 감사'], email: 'lee.hg@addictionforum.org', phone: '010-0003-0004', role: '가톨릭대학교 의과대학 교수' },
     { id: '11', name: '임현우', departments: ['이사 및 감사'], email: 'lim.hw@addictionforum.org', phone: '010-0003-0005', role: '가톨릭대학교 예방의학교실 교수' },
     { id: '12', name: '정슬기', departments: ['이사 및 감사'], email: 'jung.sg@addictionforum.org', phone: '010-0003-0006', role: '중앙대학교 사회복지학과 교수' },
     
           // 운영(실행)위원회
      { id: '13', name: '김에스더', departments: ['운영(실행)위원회', '연구지원실'], email: 'kim.esther@addictionforum.org', phone: '010-0004-0001', role: '한국침례신학대학교' },
     { id: '14', name: '안유석', departments: ['운영(실행)위원회'], email: 'ahn.ys@addictionforum.org', phone: '010-0004-0002', role: '서울대학교병원' },
     { id: '15', name: '이수비', departments: ['운영(실행)위원회'], email: 'lee.sb@addictionforum.org', phone: '010-0004-0003', role: '대진대학교' },
     
           // 사무국
      { id: '16', name: '신윤재', departments: ['사무국'], email: 'secretariat@addictionforum.org', phone: '010-0005-0001', role: '사무국장' },
     
     // 정책 위원회
     { id: '17', name: '정책위원장', departments: ['정책 위원회'], email: 'policy@addictionforum.org', phone: '010-0006-0001', role: '정책 위원회 위원장' },
     
          // 출판 위원회
      { id: '18', name: '출판위원장', departments: ['출판 위원회'], email: 'publication@addictionforum.org', phone: '010-0007-0001', role: '출판 위원회 위원장' },
      
                           // 연구지원실
        { id: '19', name: '김민한', departments: ['연구지원실'], email: 'kim.mh@addictionforum.org', phone: '010-0009-0004', role: '연구간사 (연구 프로젝트 지원)' },
      ],
    };
  } catch (error) {
    console.error('로컬 스토리지에서 데이터 로드 실패:', error);
    return {
      tasks: sampleTasks,
      filteredTasks: sampleTasks,
      filter: {},
      loading: false,
      error: null,
      users: [
        // 이사장
        { id: '1', name: '신영철', departments: ['이사장'], email: 'shin@addictionforum.org', phone: '010-0001-0001', role: '이사장 (강북삼성병원, 정신과 전문의)' },
        
        // 고문
        { id: '2', name: '김광기', departments: ['고문'], email: 'kim.kw@addictionforum.org', phone: '010-0002-0001', role: '이화여자대학교' },
        { id: '3', name: '박병주', departments: ['고문'], email: 'park.bj@addictionforum.org', phone: '010-0002-0002', role: '서울시 공공보건의료지원단' },
        { id: '4', name: '윤명숙', departments: ['고문'], email: 'yoon.ms@addictionforum.org', phone: '010-0002-0003', role: '전북대학교' },
        { id: '5', name: '조성남', departments: ['고문'], email: 'jo.sn@addictionforum.org', phone: '010-0002-0004', role: '서울마약관리센터' },
        { id: '6', name: '허근', departments: ['고문'], email: 'heo.g@addictionforum.org', phone: '010-0002-0005', role: '천주교서울대교구' },
        
        // 이사 및 감사
        { id: '7', name: '김용진', departments: ['이사 및 감사'], email: 'kim.yj@addictionforum.org', phone: '010-0003-0001', role: '복지와사람들 중독예방연구소 소장' },
        { id: '8', name: '권선중', departments: ['이사 및 감사'], email: 'kwon.sj@addictionforum.org', phone: '010-0003-0002', role: '한국침례신학대학교 교수' },
        { id: '9', name: '이인숙', departments: ['이사 및 감사'], email: 'lee.is@addictionforum.org', phone: '010-0003-0003', role: '수원시중독통합관리센터장' },
        { id: '10', name: '이해국', departments: ['이사 및 감사'], email: 'lee.hg@addictionforum.org', phone: '010-0003-0004', role: '가톨릭대학교 의과대학 교수' },
        { id: '11', name: '임현우', departments: ['이사 및 감사'], email: 'lim.hw@addictionforum.org', phone: '010-0003-0005', role: '가톨릭대학교 예방의학교실 교수' },
        { id: '12', name: '정슬기', departments: ['이사 및 감사'], email: 'jung.sg@addictionforum.org', phone: '010-0003-0006', role: '중앙대학교 사회복지학과 교수' },
        
        // 운영(실행)위원회
        { id: '13', name: '김에스더', departments: ['운영(실행)위원회', '연구지원실'], email: 'kim.esther@addictionforum.org', phone: '010-0004-0001', role: '한국침례신학대학교' },
        { id: '14', name: '안유석', departments: ['운영(실행)위원회'], email: 'ahn.ys@addictionforum.org', phone: '010-0004-0002', role: '서울대학교병원' },
        { id: '15', name: '이수비', departments: ['운영(실행)위원회'], email: 'lee.sb@addictionforum.org', phone: '010-0004-0003', role: '대진대학교' },
        
        // 사무국
        { id: '16', name: '신윤재', departments: ['사무국'], email: 'secretariat@addictionforum.org', phone: '010-0005-0001', role: '사무국장' },
        
        // 정책 위원회
        { id: '17', name: '정책위원장', departments: ['정책 위원회'], email: 'policy@addictionforum.org', phone: '010-0006-0001', role: '정책 위원회 위원장' },
        
        // 출판 위원회
        { id: '18', name: '출판위원장', departments: ['출판 위원회'], email: 'publication@addictionforum.org', phone: '010-0007-0001', role: '출판 위원회 위원장' },
        
        // 연구지원실
        { id: '19', name: '김민한', departments: ['연구지원실'], email: 'kim.mh@addictionforum.org', phone: '010-0009-0004', role: '연구간사 (연구 프로젝트 지원)' },
      ],
    };
  }
};

const initialState: TaskState = loadFromLocalStorage();

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
    // 검색어 필터링
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
    
    // 상태 필터링
    if (filter.status && filter.status.length > 0 && !filter.status.includes(task.status)) {
      return false;
    }
    
    // 우선순위 필터링
    if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(task.priority)) {
      return false;
    }
    
    // 부서 필터링
    if (filter.department && filter.department.length > 0 && !filter.department.includes(task.department)) {
      return false;
    }
    
    // 담당자 필터링
    if (filter.assignee && filter.assignee.length > 0 && !filter.assignee.includes(task.assignee)) {
      return false;
    }
    
    // 날짜 범위 필터링
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
  addTask: (taskData: TaskFormData) => void;
  updateTask: (id: string, taskData: Partial<TaskFormData>) => void;
  updateTaskStatus: (id: string, newStatus: TaskStatus) => void;
  deleteTask: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  toggleTaskCancellation: (id: string) => void;
  applyFilter: (filter: TaskFilter) => void;
  updateAllTaskStatuses: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  completeRecurringTask: (taskId: string) => void;
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

  // 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('addictionForum_tasks', JSON.stringify(state.tasks));
      localStorage.setItem('addictionForum_users', JSON.stringify(state.users));
      localStorage.setItem('addictionForum_filter', JSON.stringify(state.filter));
    } catch (error) {
      console.error('로컬 스토리지에 데이터 저장 실패:', error);
    }
  }, [state.tasks, state.users, state.filter]);

  const addTask = (taskData: TaskFormData) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      progress: 0,
      tags: taskData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  };

  const updateTask = (id: string, taskData: Partial<TaskFormData>) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      const updatedTask: Task = {
        ...task,
        ...taskData,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    }
  };

  // 상태 변경 시 진행률과 우선순위도 함께 업데이트
  const updateTaskStatus = (id: string, newStatus: TaskStatus) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      if (newStatus === 'cancelled') {
        // 상태를 '취소'로 변경할 때는 진행률을 0%로, 우선순위를 '없음'으로 자동 설정
        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { id, progress: 0, status: newStatus, priority: 'none' } 
        });
      } else if (newStatus === 'completed') {
        // 상태를 '완료'로 변경할 때는 진행률을 100%로, 우선순위를 '낮음'으로 설정
        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { id, progress: 100, status: newStatus, priority: 'low' } 
        });
      } else {
        // 다른 상태로 변경할 때는 기존 진행률과 우선순위 유지
        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { id, progress: task.progress, status: newStatus, priority: task.priority } 
        });
      }
    }
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  // 진행률과 기간에 따라 자동으로 상태 업데이트
  const getAutoStatus = (task: Task, progress: number): TaskStatus => {
    // 취소된 업무는 자동 상태 업데이트를 하지 않음
    if (task.status === 'cancelled') {
      return 'cancelled';
    }
    
    const now = new Date();
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    
    // 진행률 100%일 때는 무조건 '완료'
    if (progress === 100) {
      return 'completed';
    }
    
    // 진행률이 0%일 때는 기존 상태 유지 (자동 취소하지 않음)
    if (progress === 0) {
      return task.status;
    }
    
    // 시작 기간이 도래하지 않은 경우
    if (now < startDate) {
      // 진행률이 0%면 '대기중', 아니면 '진행중'
      return progress === 0 ? 'pending' : 'in-progress';
    }
    
    // 시작 기간이 도래했지만 진행률이 0%인 경우
    if (progress === 0) {
      return 'delayed';
    }
    
    // 마감 기간이 지났는데 100%가 아닌 경우
    if (now > endDate && progress < 100) {
      return 'delayed';
    }
    
    // 그 외의 경우는 '진행중'
    return 'in-progress';
  };

  const updateProgress = (id: string, progress: number) => {
    // 진행률 업데이트와 함께 자동 상태 업데이트
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      // 취소된 업무는 진행률만 업데이트하고 상태는 변경하지 않음
      if (task.status === 'cancelled') {
        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { id, progress, status: 'cancelled', priority: 'none' } 
        });
        return;
      }
      
      const autoStatus = getAutoStatus(task, progress);
      let newPriority = task.priority;
      
      // 상태가 완료로 변경되면 우선순위를 낮음으로 설정
      if (autoStatus === 'completed') {
        newPriority = 'low';
      }
      // 진행률 0%일 때는 기존 우선순위 유지 (자동 취소하지 않음)
      // else if (autoStatus === 'cancelled') {
      //   newPriority = 'cancelled';
      // }
      
      dispatch({ 
        type: 'UPDATE_PROGRESS_AND_STATUS', 
        payload: { id, progress, status: autoStatus, priority: newPriority } 
      });
    }
  };

  const toggleTaskCancellation = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      if (task.status === 'cancelled') {
        // 취소 상태를 해제하고 진행중으로 변경
        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { id, progress: 50, status: 'in-progress', priority: 'medium' } 
        });
      } else {
        // 취소 상태로 변경하고 우선순위를 '없음'으로 설정
        dispatch({ 
          type: 'UPDATE_PROGRESS_AND_STATUS', 
          payload: { id, progress: 0, status: 'cancelled', priority: 'none' } 
        });
      }
    }
  };

  const applyFilter = (filter: TaskFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  // 모든 업무의 상태를 자동으로 업데이트
  const updateAllTaskStatuses = () => {
    const now = new Date();
    const updatedTasks = state.tasks.map(task => {
      // 취소된 업무는 자동 상태 업데이트를 하지 않음
      if (task.status === 'cancelled') {
        return task;
      }
      
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      let newStatus = task.status;
      
      // 진행률 100%일 때는 무조건 '완료'
      if (task.progress === 100) {
        newStatus = 'completed';
      }
      // 시작 기간이 도래하지 않은 경우
      else if (now < startDate) {
        newStatus = task.progress === 0 ? 'pending' : 'in-progress';
      }
      // 시작 기간이 도래했지만 진행률이 0%인 경우
      else if (task.progress === 0) {
        newStatus = 'delayed';
      }
      // 마감 기간이 지났는데 100%가 아닌 경우
      else if (now > endDate && task.progress < 100) {
        newStatus = 'delayed';
      }
      // 그 외의 경우는 '진행중'
      else {
        newStatus = 'in-progress';
      }
      
      // 상태가 변경된 경우에만 업데이트
      if (newStatus !== task.status) {
        return {
          ...task,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });
    
    // 변경된 업무가 있으면 상태 업데이트
    const hasChanges = updatedTasks.some((task, index) => task.status !== state.tasks[index].status);
    if (hasChanges) {
      dispatch({ type: 'SET_TASKS', payload: updatedTasks });
    }
  };

  // 사용자 관리 함수들
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
    };
    dispatch({ type: 'ADD_USER', payload: newUser });
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    const existingUser = state.users.find(user => user.id === id);
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    }
  };

  const deleteUser = (id: string) => {
    dispatch({ type: 'DELETE_USER', payload: id });
  };

  // 반복 업무 완료 처리 함수
  const completeRecurringTask = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.isRecurring || !task.recurrencePattern) return;

    const now = new Date();
    const nextDueDate = calculateNextDueDate(task.recurrencePattern, now);
    
    if (nextDueDate) {
      // 현재 인스턴스 완료 처리
      const updatedTask = {
        ...task,
        status: 'completed' as TaskStatus,
        progress: 100,
        lastCompletedDate: now.toISOString(),
        completedInstances: (task.completedInstances || 0) + 1,
        updatedAt: now.toISOString()
      };

      // 다음 차례 생성
      const nextInstance = {
        ...task,
        id: Date.now().toString(),
        status: 'pending' as TaskStatus,
        progress: 0,
        nextDueDate: nextDueDate.toISOString(),
        lastCompletedDate: undefined,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      // 현재 인스턴스 업데이트 및 다음 인스턴스 추가
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      dispatch({ type: 'ADD_TASK', payload: nextInstance });
    }
  };

  // 다음 마감일 계산 함수
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
          // 특정 주차의 요일로 설정
          const targetMonth = new Date(fromDate);
          targetMonth.setMonth(targetMonth.getMonth() + pattern.interval);
          
          // 해당 월의 첫 번째 요일 찾기
          const firstDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
          const firstDayOfWeek = firstDay.getDay();
          
          // 목표 요일 계산 (pattern.dayOfWeek가 있다면 해당 요일, 없다면 fromDate의 요일)
          const targetDayOfWeek = pattern.dayOfWeek && pattern.dayOfWeek.length > 0 
            ? pattern.dayOfWeek[0] 
            : fromDate.getDay();
          
          // 첫 번째 목표 요일까지의 일수
          let daysToAdd = (targetDayOfWeek - firstDayOfWeek + 7) % 7;
          
          // 목표 주차까지의 일수 추가
          daysToAdd += (pattern.weekOfMonth - 1) * 7;
          
          nextDate.setDate(1);
          nextDate.setMonth(nextDate.getMonth() + pattern.interval);
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        } else {
          // 일반적인 월간 반복
          nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        }
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * pattern.interval));
        break;
      case 'yearly':
        if (pattern.monthOfYear) {
          // 특정 월로 설정
          nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
          nextDate.setMonth(pattern.monthOfYear - 1); // 0-based index
          
          // 특정 요일이 있다면 해당 요일로 설정
          if (pattern.dayOfWeek && pattern.dayOfWeek.length > 0) {
            const targetDayOfWeek = pattern.dayOfWeek[0];
            const currentDayOfWeek = nextDate.getDay();
            const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
            nextDate.setDate(nextDate.getDate() + daysToAdd);
          }
        } else {
          // 일반적인 년간 반복
          nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
        }
        break;
      case 'weekdays':
        // 다음 평일로 이동 (토,일 제외)
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;
      case 'custom':
        if (pattern.dayOfWeek && pattern.dayOfWeek.length > 0) {
          // 지정된 요일 중 가장 가까운 다음 날짜 찾기
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
          // 주기 적용
          if (pattern.interval > 1) {
            nextDate.setDate(nextDate.getDate() + ((pattern.interval - 1) * 7));
          }
        }
        break;
      default:
        return null;
    }

    // 종료 조건 확인
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
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
