import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTaskContext } from '../contexts/TaskContextSupabase';
import { TaskStatus, TaskPriority, TaskFilter } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';

const TaskList: React.FC = () => {
  const { state, deleteTask, updateProgress, applyFilter, updateTask, updateTaskStatus, updateAllTaskStatuses, toggleTaskCancellation } = useTaskContext();
  const { filteredTasks, filter } = state;
  
  const [searchTerm, setSearchTerm] = useState(() => {
    // 로컬 스토리지에서 검색어 복원
    const savedSearchTerm = localStorage.getItem('addictionForum_taskList_search');
    return savedSearchTerm || '';
  });
  const [showFilters, setShowFilters] = useState(false);
  const [localFilter, setLocalFilter] = useState<TaskFilter>(() => {
    // 로컬 스토리지에서 필터 상태 복원
    const savedFilter = localStorage.getItem('addictionForum_taskList_filter');
    return savedFilter ? JSON.parse(savedFilter) : filter;
  });
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [editingDates, setEditingDates] = useState<string | null>(null);
  const [editingDateType, setEditingDateType] = useState<'start' | 'end' | null>(null);
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);
  const [editingRecurrence, setEditingRecurrence] = useState<string | null>(null);
  const [showCustomRecurrence, setShowCustomRecurrence] = useState<string | null>(null);
  const [customRecurrence, setCustomRecurrence] = useState({
    interval: 1,
    dayOfWeek: [] as number[],
    weekOfMonth: 1,
    monthOfYear: 1,
    mode: 'none', // 'weekly', 'monthly', 또는 'none'
    monthlyInterval: 1 // 월간 반복 주기 (매월, 2개월마다, 3개월마다...)
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = (newFilter: Partial<TaskFilter>) => {
    const updatedFilter = { ...localFilter, ...newFilter };
    setLocalFilter(updatedFilter);
    applyFilter(updatedFilter);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    // 검색어가 없으면 모든 업무 표시
    if (!term.trim()) {
      applyFilter(localFilter);
      return;
    }
    
    // 검색 결과를 필터에 적용
    applyFilter({ ...localFilter, searchTerm: term });
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-in-progress';
      case 'delayed': return 'status-delayed';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'status-pending';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'none': return 'bg-gray-50 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in-progress': return '진행중';
      case 'delayed': return '지연';
      case 'cancelled': return '취소';
      default: return '대기중';
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      case 'cancelled': return '취소';
      case 'none': return '없음';
      default: return '보통';
    }
  };

  const handleProgressChange = (taskId: string, progress: number) => {
    if (progress === 100) {
      // 100%일 때는 확인 다이얼로그 표시
      if (window.confirm('진행률을 100%로 설정하시겠습니까?\n\n이 업무를 완료하시겠습니까?')) {
        updateProgress(taskId, progress);
      }
    } else {
      // 100%가 아닐 때는 바로 업데이트
    updateProgress(taskId, progress);
    }
  };

  const handleRecurrenceClick = (taskId: string) => {
    setEditingRecurrence(editingRecurrence === taskId ? null : taskId);
    setEditingStatus(null); // 다른 드롭다운 닫기
    setEditingPriority(null); // 다른 드롭다운 닫기
    setEditingDates(null); // 날짜 편집 닫기
    setEditingAssignee(null); // 담당자 편집 닫기
  };

  const handleRecurrenceChange = (taskId: string, type: string, interval: number, dayOfWeek?: number[], weekOfMonth?: number, monthOfYear?: number) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      const recurrencePattern: any = {
        type: type as any,
        interval: interval,
        endDate: task.endDate
      };
      
      if (dayOfWeek && dayOfWeek.length > 0) {
        recurrencePattern.dayOfWeek = dayOfWeek;
      }
      
      if (weekOfMonth) {
        recurrencePattern.weekOfMonth = weekOfMonth;
      }
      
      if (monthOfYear) {
        recurrencePattern.monthOfYear = monthOfYear;
      }
      
      updateTask(taskId, {
        isRecurring: true,
        recurrencePattern: recurrencePattern
      });
      
      setEditingRecurrence(null);
    }
  };

  const handleCustomRecurrenceSave = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    
    if (customRecurrence.mode === 'none') {
      // 설정 안함 선택 시 반복 설정 제거
      updateTask(taskId, {
        isRecurring: false,
        recurrencePattern: undefined
      });
      setShowCustomRecurrence(null);
      setCustomRecurrence({ 
        interval: 1, 
        dayOfWeek: [], 
        weekOfMonth: 1, 
        monthOfYear: 1, 
        mode: 'none',
        monthlyInterval: 1
      });
      return;
    }
    
    if (task && customRecurrence.dayOfWeek.length > 0) {
      let recurrencePattern: any = {
        type: 'custom' as any,
        dayOfWeek: customRecurrence.dayOfWeek,
        endDate: task.endDate
      };
      
      if (customRecurrence.mode === 'weekly') {
        // 주간 모드: 반복 주기만 설정
        recurrencePattern.interval = customRecurrence.interval;
      } else if (customRecurrence.mode === 'monthly') {
        // 월간 모드: 월간 반복 주기, 월 중 주차, 년 중 월 설정
        recurrencePattern.interval = customRecurrence.monthlyInterval;
        recurrencePattern.weekOfMonth = customRecurrence.weekOfMonth;
        recurrencePattern.monthOfYear = customRecurrence.monthOfYear;
      }
      
      updateTask(taskId, {
        isRecurring: true,
        recurrencePattern: recurrencePattern
      });
      
      setShowCustomRecurrence(null);
      setCustomRecurrence({ 
        interval: 1, 
        dayOfWeek: [], 
        weekOfMonth: 1, 
        monthOfYear: 1, 
        mode: 'none',
        monthlyInterval: 1
      });
    }
  };

  const handleRemoveRecurrence = (taskId: string) => {
    updateTask(taskId, {
      isRecurring: false,
      recurrencePattern: undefined
    });
    setEditingRecurrence(null);
  };



  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('정말로 이 업무를 삭제하시겠습니까?')) {
      deleteTask(taskId);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    // updateTaskStatus 함수를 사용하여 상태 변경 시 진행률과 우선순위도 함께 업데이트
    updateTaskStatus(taskId, newStatus);
    setEditingStatus(null);
  };

  const handleStatusClick = (taskId: string) => {
    setEditingStatus(editingStatus === taskId ? null : taskId);
    setEditingPriority(null); // 다른 드롭다운 닫기
    setEditingDates(null); // 날짜 편집 닫기
    setEditingAssignee(null); // 담당자 편집 닫기
  };

  const handlePriorityChange = (taskId: string, newPriority: TaskPriority) => {
    updateTask(taskId, { priority: newPriority });
    setEditingPriority(null);
  };

  const handlePriorityClick = (taskId: string) => {
    setEditingPriority(editingPriority === taskId ? null : taskId);
    setEditingStatus(null); // 다른 드롭다운 닫기
    setEditingDates(null); // 날짜 편집 닫기
  };

  const handleDateClick = (taskId: string, dateType: 'start' | 'end') => {
    setEditingDates(editingDates === taskId ? null : taskId);
    setEditingDateType(dateType);
    setEditingStatus(null); // 다른 드롭다운 닫기
    setEditingPriority(null); // 다른 드롭다운 닫기
  };

  const handleDateChange = (taskId: string, dateType: 'start' | 'end', newDate: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        [dateType === 'start' ? 'startDate' : 'endDate']: newDate,
        updatedAt: new Date().toISOString()
      };
      updateTask(taskId, updatedTask);
    }
    setEditingDates(null);
    setEditingDateType(null);
  };

  const handleAssigneeClick = (taskId: string) => {
    setEditingAssignee(editingAssignee === taskId ? null : taskId);
    setEditingStatus(null); // 다른 드롭다운 닫기
    setEditingPriority(null); // 다른 드롭다운 닫기
    setEditingDates(null); // 날짜 편집 닫기
  };

  const handleAssigneeChange = (taskId: string, newAssignee: string, newDepartment: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        assignee: newAssignee,
        department: newDepartment,
        updatedAt: new Date().toISOString()
      };
      updateTask(taskId, updatedTask);
    }
    setEditingAssignee(null);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingStatus(null);
        setEditingPriority(null);
        setEditingDates(null);
        setEditingAssignee(null);
        setEditingRecurrence(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 컴포넌트 마운트 시 모든 업무 상태 자동 업데이트
  useEffect(() => {
    updateAllTaskStatuses();
  }, [updateAllTaskStatuses]);

  // 컴포넌트 마운트 시 저장된 검색어와 필터 적용
  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    }
    if (Object.keys(localFilter).length > 0) {
      applyFilter(localFilter);
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 사용자 관리 데이터가 변경될 때 필터 옵션 업데이트
  useEffect(() => {
    // 현재 필터에서 사용자 관리에 없는 부서나 담당자가 선택되어 있다면 초기화
    const currentUsers = state.users;
    const currentDepartments = Array.from(new Set(currentUsers.flatMap(user => user.departments)));
    const currentAssignees = currentUsers.map(user => user.name);

    let updatedFilter = { ...localFilter };

    // 부서 필터가 현재 사용자 관리에 없는 부서를 가리키고 있다면 초기화
    if (localFilter.department && localFilter.department.length > 0) {
      const invalidDepartment = localFilter.department.some(dept => !currentDepartments.includes(dept));
      if (invalidDepartment) {
        updatedFilter.department = undefined;
      }
    }

    // 담당자 필터가 현재 사용자 관리에 없는 담당자를 가리키고 있다면 초기화
    if (localFilter.assignee && localFilter.assignee.length > 0) {
      const invalidAssignee = localFilter.assignee.some(assignee => !currentAssignees.includes(assignee));
      if (invalidAssignee) {
        updatedFilter.assignee = undefined;
      }
    }

    // 필터가 변경되었다면 업데이트
    if (JSON.stringify(updatedFilter) !== JSON.stringify(localFilter)) {
      setLocalFilter(updatedFilter);
      applyFilter(updatedFilter);
    }
  }, [state.users, localFilter, applyFilter]);

  // 필터가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('addictionForum_taskList_filter', JSON.stringify(localFilter));
    } catch (error) {
      console.error('필터 상태 저장 실패:', error);
    }
  }, [localFilter]);

  // 검색어가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('addictionForum_taskList_search', searchTerm);
    } catch (error) {
      console.error('검색어 저장 실패:', error);
    }
  }, [searchTerm]);

  return (
    <div className="space-y-6" ref={dropdownRef}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">업무 목록</h1>
          <p className="text-gray-600 mt-2">모든 업무를 관리하고 진행 상황을 확인하세요</p>
        </div>
        <Link
          to="/tasks/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>새 업무 등록</span>
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
               placeholder="업무명, 설명, 담당자, 부서, 태그로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field pl-10"
            />
             {searchTerm && (
               <button
                 onClick={() => {
                   setSearchTerm('');
                   handleSearch('');
                 }}
                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
               >
                 ✕
               </button>
             )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-5 w-5" />
            <span>필터</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={localFilter.status?.[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    status: e.target.value ? [e.target.value as TaskStatus] : undefined 
                  })}
                  className="input-field"
                >
                  <option value="">모든 상태</option>
                  <option value="pending">대기중</option>
                  <option value="in-progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="delayed">지연</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                <select
                  value={localFilter.priority?.[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    priority: e.target.value ? [e.target.value as TaskPriority] : undefined 
                  })}
                  className="input-field"
                >
                  <option value="">모든 우선순위</option>
                  <option value="urgent">긴급</option>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
                <select
                  value={localFilter.department?.[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    department: e.target.value ? [e.target.value] : undefined 
                  })}
                  className="input-field"
                  disabled={state.users.length === 0}
                >
                  <option value="">모든 부서</option>
                  {state.users.length === 0 ? (
                    <option value="" disabled>사용자 관리에서 부서를 먼저 설정해주세요</option>
                  ) : (
                    Array.from(new Set(state.users.flatMap(user => user.departments))).map(dept => {
                      const userCount = state.users.filter(user => user.departments.includes(dept)).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({userCount}명)
                        </option>
                      );
                    })
                  )}
                </select>
                {state.users.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">사용자 관리에서 부서를 먼저 설정해주세요</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                <select
                  value={localFilter.assignee?.[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    assignee: e.target.value ? [e.target.value] : undefined 
                  })}
                  className="input-field"
                  disabled={state.users.length === 0}
                >
                  <option value="">모든 담당자</option>
                  {state.users.length === 0 ? (
                    <option value="" disabled>사용자 관리에서 담당자를 먼저 설정해주세요</option>
                  ) : (
                    state.users.map(user => (
                      <option key={user.id} value={user.name}>
                        {user.name} ({user.departments.join(', ')})
                      </option>
                    ))
                  )}
                </select>
                {state.users.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">사용자 관리에서 담당자를 먼저 설정해주세요</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 업무 목록 */}
      <div className="card">
         {/* 검색 결과 및 필터 요약 */}
         {(searchTerm || localFilter.status || localFilter.priority || localFilter.department || localFilter.assignee) && (
           <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <Search className="h-4 w-4 text-blue-600" />
                 <span className="text-sm text-blue-800">
                   {searchTerm && (
                     <span className="font-medium">"{searchTerm}"</span>
                   )}
                   {searchTerm && (localFilter.status || localFilter.priority || localFilter.department || localFilter.assignee) && (
                     <span> + </span>
                   )}
                   {(localFilter.status || localFilter.priority || localFilter.department || localFilter.assignee) && (
                     <span>필터 적용됨</span>
                   )}
                   에 대한 검색 결과: 
                   <span className="font-bold ml-1">{filteredTasks.length}개</span>
                 </span>
               </div>
               <div className="flex items-center space-x-2">
                 {(localFilter.status || localFilter.priority || localFilter.department || localFilter.assignee) && (
                   <button
                     onClick={() => {
                       setLocalFilter({});
                       applyFilter({});
                     }}
                     className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                   >
                     필터 초기화
                   </button>
                 )}
                 {searchTerm && (
                   <button
                     onClick={() => {
                       setSearchTerm('');
                       handleSearch('');
                     }}
                     className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                   >
                     검색어 지우기
                   </button>
                 )}
               </div>
             </div>
             
             {/* 필터 상세 정보 */}
             {(localFilter.status || localFilter.priority || localFilter.department || localFilter.assignee) && (
               <div className="mt-2 pt-2 border-t border-blue-200">
                 <div className="flex flex-wrap gap-2 text-xs text-blue-700">
                   {localFilter.status && localFilter.status.map(status => (
                     <span key={status} className="px-2 py-1 bg-blue-100 rounded-full">
                       상태: {getStatusText(status)}
                     </span>
                   ))}
                   {localFilter.priority && localFilter.priority.map(priority => (
                     <span key={priority} className="px-2 py-1 bg-blue-100 rounded-full">
                       우선순위: {getPriorityText(priority)}
                     </span>
                   ))}
                   {localFilter.department && localFilter.department.map(dept => (
                     <span key={dept} className="px-2 py-1 bg-blue-100 rounded-full">
                       부서: {dept}
                     </span>
                   ))}
                   {localFilter.assignee && localFilter.assignee.map(assignee => (
                     <span key={assignee} className="px-2 py-1 bg-blue-100 rounded-full">
                       담당자: {assignee}
                     </span>
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}
         
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업무명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  진행률
                   <div className="text-xs font-normal text-gray-400 mt-1">
                     (자동 상태 업데이트)
                   </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  완료/취소
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  반복
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">{task.department}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleAssigneeClick(task.id)}
                        className="flex items-center hover:bg-gray-100 p-1 rounded transition-colors"
                        title="담당자 변경"
                      >
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{task.assignee}</span>
                      </button>
                    </div>
                    
                                         {/* 담당자 선택 드롭다운 */}
                     {editingAssignee === task.id && (
                       <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                         <div className="py-1">
                           {state.users.map((user) => (
                             <button
                               key={user.id}
                               onClick={() => handleAssigneeChange(task.id, user.name, user.departments[0])}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <User className="h-4 w-4 text-gray-400" />
                               <div className="flex flex-col">
                                 <span className="font-medium">{user.name}</span>
                                 <span className="text-xs text-gray-500">
                                   {user.departments.join(', ')}
                                 </span>
                               </div>
                             </button>
                           ))}
                         </div>
                    </div>
                     )}
                  </td>
                  
                                     <td className="px-6 py-4 whitespace-nowrap relative">
                     <div className="flex items-center space-x-2">
                       <div className="flex items-center">
                         <button
                           onClick={() => handleDateClick(task.id, 'start')}
                           className="flex items-center hover:bg-gray-100 p-1 rounded transition-colors"
                           title="시작일 변경"
                         >
                           <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                           <span className="text-sm text-gray-900">{format(new Date(task.startDate), 'yyyy/MM/dd')}</span>
                         </button>
                       </div>
                       <span className="text-gray-400">~</span>
                    <div className="flex items-center">
                         <button
                           onClick={() => handleDateClick(task.id, 'end')}
                           className="flex items-center hover:bg-gray-100 p-1 rounded transition-colors"
                           title="종료일 변경"
                         >
                           <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                           <span className="text-sm text-gray-900">{format(new Date(task.endDate), 'yyyy/MM/dd')}</span>
                         </button>
                       </div>
                     </div>
                     
                     {/* 날짜 선택 드롭다운 */}
                     {editingDates === task.id && editingDateType && (
                       <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
                         <div className="mb-2">
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             {editingDateType === 'start' ? '시작일' : '종료일'} 선택
                           </label>
                           <input
                             type="date"
                             defaultValue={editingDateType === 'start' ? task.startDate.split('T')[0] : task.endDate.split('T')[0]}
                             onChange={(e) => handleDateChange(task.id, editingDateType, e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                           />
                         </div>
                         <div className="text-xs text-gray-500">
                           날짜를 선택하면 자동으로 저장됩니다.
                      </div>
                    </div>
                     )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="relative">
                       <button
                         onClick={() => handleStatusClick(task.id)}
                         className={`status-badge ${getStatusColor(task.status)} hover:opacity-80 transition-opacity cursor-pointer flex items-center space-x-1`}
                       >
                         <span>{getStatusText(task.status)}</span>
                         <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </button>
                       
                       {editingStatus === task.id && (
                         <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                           <div className="py-1">
                             <button
                               onClick={() => handleStatusChange(task.id, 'pending')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                               <span>대기중</span>
                             </button>
                             <button
                               onClick={() => handleStatusChange(task.id, 'in-progress')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                               <span>진행중</span>
                             </button>
                             <button
                               onClick={() => handleStatusChange(task.id, 'completed')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                               <span>완료</span>
                             </button>
                             <button
                               onClick={() => handleStatusChange(task.id, 'delayed')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                               <span>지연</span>
                             </button>
                             <button
                               onClick={() => handleStatusChange(task.id, 'cancelled')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                               <span>취소</span>
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={task.progress}
                        onChange={(e) => {
                          // 슬라이더 값이 변경될 때마다 처리
                          const target = e.target as HTMLInputElement;
                          const progressValue = parseInt(target.value);
                          handleProgressChange(task.id, progressValue);
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-900 w-12">{task.progress}%</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="relative">
                       <button
                         onClick={() => handlePriorityClick(task.id)}
                         className={`status-badge ${getPriorityColor(task.priority)} hover:opacity-80 transition-opacity cursor-pointer flex items-center space-x-1`}
                       >
                         <span>{getPriorityText(task.priority)}</span>
                         <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </button>
                       
                       {editingPriority === task.id && (
                         <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                           <div className="py-1">
                             <button
                               onClick={() => handlePriorityChange(task.id, 'urgent')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                               <span>긴급</span>
                             </button>
                             <button
                               onClick={() => handlePriorityChange(task.id, 'high')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                               <span>높음</span>
                             </button>
                             <button
                               onClick={() => handlePriorityChange(task.id, 'medium')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                               <span>보통</span>
                             </button>
                             <button
                               onClick={() => handlePriorityChange(task.id, 'low')}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                             >
                               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                               <span>낮음</span>
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                  </td>
                  
                  {/* 완료/취소 체크박스 컬럼 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => {
                            if (task.status === 'completed') {
                              // 완료 상태를 해제하고 진행중으로 변경
                              updateProgress(task.id, 50);
                            } else {
                              // 완료 상태로 변경
                              updateProgress(task.id, 100);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-xs text-gray-700 font-medium">완료</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.status === 'cancelled'}
                          onChange={() => {
                            toggleTaskCancellation(task.id);
                          }}
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                        />
                        <span className="text-xs text-gray-700 font-medium">취소</span>
                      </label>
                    </div>
                  </td>
                  
                  {/* 반복 업무 컬럼 추가 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      {task.isRecurring ? (
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-xs text-purple-700 font-medium">반복</span>
                          </div>
                                                  <div className="text-xs text-gray-600">
                          {task.recurrencePattern?.type === 'daily' && '매일'}
                          {task.recurrencePattern?.type === 'weekly' && '매주'}
                          {task.recurrencePattern?.type === 'biweekly' && '2주마다'}
                          {task.recurrencePattern?.type === 'monthly' && '매월'}
                          {task.recurrencePattern?.type === 'quarterly' && '분기마다'}
                          {task.recurrencePattern?.type === 'yearly' && '매년'}
                          {task.recurrencePattern?.type === 'weekdays' && '주중 매일'}
                          {task.recurrencePattern?.type === 'custom' && '맞춤 설정'}
                        </div>
                        {task.recurrencePattern?.type === 'monthly' && task.recurrencePattern.weekOfMonth && (
                          <div className="text-xs text-gray-500">
                            {task.recurrencePattern.weekOfMonth}째주
                          </div>
                        )}
                        {task.recurrencePattern?.type === 'yearly' && task.recurrencePattern.monthOfYear && (
                          <div className="text-xs text-gray-500">
                            {task.recurrencePattern.monthOfYear}월
                          </div>
                        )}
                          {task.nextDueDate && (
                            <div className="text-xs text-gray-500">
                              다음: {format(new Date(task.nextDueDate), 'MM/dd')}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {task.completedInstances || 0}/{task.totalInstances || 0} 완료
                          </div>
                          <button
                            onClick={() => handleRecurrenceClick(task.id)}
                            className="text-xs text-purple-600 hover:text-purple-800 underline"
                          >
                            설정 변경
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRecurrenceClick(task.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          반복 설정
                        </button>
                      )}
                      
                      {/* 반복일정 설정 드롭다운 */}
                      {editingRecurrence === task.id && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="py-2">
                            <div className="px-3 py-2 text-xs font-medium text-gray-700 border-b border-gray-100">반복 설정</div>
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleRecurrenceChange(task.id, 'daily', 1)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors block"
                              >
                                매일
                              </button>
                              <button
                                onClick={() => handleRecurrenceChange(task.id, 'weekly', 1)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors block"
                              >
                                매주
                              </button>
                              <button
                                onClick={() => handleRecurrenceChange(task.id, 'monthly', 1)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors block"
                              >
                                매월
                              </button>
                              <button
                                onClick={() => {
                                  // 맞춤 설정 열 때 기본값 초기화
                                  setCustomRecurrence({
                                    interval: 1,
                                    dayOfWeek: [],
                                    weekOfMonth: 1,
                                    monthOfYear: 1,
                                    mode: 'none',
                                    monthlyInterval: 1
                                  });
                                  setShowCustomRecurrence(task.id);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 transition-colors block"
                              >
                                맞춤 설정
                              </button>
                              {task.isRecurring && (
                                <button
                                  onClick={() => handleRemoveRecurrence(task.id)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors block"
                                >
                                  반복 해제
                                </button>
                                )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/tasks/edit/${task.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
             {searchTerm ? (
               <>
                 <p className="text-gray-500 mb-2">
                   <span className="font-medium">"{searchTerm}"</span>에 대한 검색 결과가 없습니다.
                 </p>
                 <p className="text-gray-400 text-sm mb-4">
                   다른 검색어를 시도해보거나 검색어를 지워보세요.
                 </p>
                 <button
                   onClick={() => {
                     setSearchTerm('');
                     handleSearch('');
                   }}
                   className="btn-secondary"
                 >
                   검색어 지우기
                 </button>
               </>
             ) : (
               <>
            <p className="text-gray-500">표시할 업무가 없습니다.</p>
            <Link to="/tasks/new" className="btn-primary mt-4 inline-block">
              새 업무 등록하기
            </Link>
               </>
             )}
          </div>
        )}
      </div>

      {/* 맞춤 반복 설정 팝업 */}
      {showCustomRecurrence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">맞춤 반복 설정</h3>
              <button
                onClick={() => setShowCustomRecurrence(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 반복 모드 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">반복 모드</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recurrenceMode"
                      value="weekly"
                      checked={customRecurrence.mode === 'weekly'}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, mode: e.target.value as 'weekly' | 'monthly' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">주간 반복</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recurrenceMode"
                      value="monthly"
                      checked={customRecurrence.mode === 'monthly'}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, mode: e.target.value as 'weekly' | 'monthly' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">월간 반복</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recurrenceMode"
                      value="none"
                      checked={customRecurrence.mode === 'none'}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, mode: e.target.value as 'weekly' | 'monthly' | 'none' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 text-gray-500">설정 안함</span>
                  </label>
                </div>
              </div>

              {/* 반복 주기 (주간 모드일 때만 표시) */}
              {customRecurrence.mode === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">반복 주기</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">매</span>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={customRecurrence.interval}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">주마다</span>
                  </div>
                </div>
              )}

              {/* 반복 요일 (주간 또는 월간 모드일 때만 표시) */}
              {(customRecurrence.mode === 'weekly' || customRecurrence.mode === 'monthly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">반복 요일</label>
                  <div className="grid grid-cols-7 gap-1">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const newDayOfWeek = customRecurrence.dayOfWeek.includes(index)
                            ? customRecurrence.dayOfWeek.filter(d => d !== index)
                            : [...customRecurrence.dayOfWeek, index];
                          setCustomRecurrence(prev => ({ ...prev, dayOfWeek: newDayOfWeek }));
                        }}
                        className={`p-2 text-xs rounded ${
                          customRecurrence.dayOfWeek.includes(index)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 월간 반복 주기 (월간 모드일 때만 표시) */}
              {customRecurrence.mode === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월간 반복 주기</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">매</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={customRecurrence.monthlyInterval}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, monthlyInterval: parseInt(e.target.value) || 1 }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">개월마다</span>
                  </div>
                </div>
              )}

              {/* 월 중 주차 (월간 모드일 때만 표시) */}
              {customRecurrence.mode === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월 중 주차</label>
                  <select
                    value={customRecurrence.mode === 'monthly' ? customRecurrence.weekOfMonth : 1}
                    onChange={(e) => setCustomRecurrence(prev => ({ ...prev, weekOfMonth: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value={1}>첫째주</option>
                    <option value={2}>둘째주</option>
                    <option value={3}>셋째주</option>
                    <option value={4}>넷째주</option>
                    <option value={5}>다섯째주</option>
                  </select>
                </div>
              )}

              {/* 년 중 월 (월간 모드일 때만 표시) */}
              {customRecurrence.mode === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">년 중 월</label>
                  <select
                    value={customRecurrence.mode === 'monthly' ? customRecurrence.monthOfYear : 1}
                    onChange={(e) => setCustomRecurrence(prev => ({ ...prev, monthOfYear: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value={1}>1월</option>
                    <option value={2}>2월</option>
                    <option value={3}>3월</option>
                    <option value={4}>4월</option>
                    <option value={5}>5월</option>
                    <option value={6}>6월</option>
                    <option value={7}>7월</option>
                    <option value={8}>8월</option>
                    <option value={9}>9월</option>
                    <option value={10}>10월</option>
                    <option value={11}>11월</option>
                    <option value={12}>12월</option>
                  </select>
          </div>
        )}
      </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCustomRecurrence(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={() => handleCustomRecurrenceSave(showCustomRecurrence)}
                disabled={customRecurrence.dayOfWeek.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
