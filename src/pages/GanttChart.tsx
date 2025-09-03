import React, { useState, useMemo, useEffect } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { Task, TaskStatus } from '../types';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const GanttChart: React.FC = () => {
  const { state, updateProgress, toggleTaskCancellation } = useTaskContext();
  const { tasks } = state;
  
  const [currentDate, setCurrentDate] = useState(() => {
    // 로컬 스토리지에서 현재 날짜 복원
    const savedDate = localStorage.getItem('addictionForum_gantt_currentDate');
    return savedDate ? new Date(savedDate) : new Date();
  });
  const [showFilters, setShowFilters] = useState(() => {
    // 로컬 스토리지에서 필터 표시 상태 복원
    const savedShowFilters = localStorage.getItem('addictionForum_gantt_showFilters');
    return savedShowFilters ? JSON.parse(savedShowFilters) : false;
  });
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>(() => {
    // 로컬 스토리지에서 상태 필터 복원
    const savedStatusFilter = localStorage.getItem('addictionForum_gantt_statusFilter');
    return savedStatusFilter ? JSON.parse(savedStatusFilter) : [];
  });
  const [departmentFilter, setDepartmentFilter] = useState<string[]>(() => {
    // 로컬 스토리지에서 부서 필터 복원
    const savedDepartmentFilter = localStorage.getItem('addictionForum_gantt_departmentFilter');
    return savedDepartmentFilter ? JSON.parse(savedDepartmentFilter) : [];
  });


  // 현재 주의 시작과 끝 계산
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // 월요일 시작
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  // 주간 날짜 배열 생성
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 우선순위와 시작 기간에 따른 업무 정렬 함수
  const sortTasksByPriorityAndDate = (taskList: Task[]) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, cancelled: 4, none: 5 };
    
    return taskList.sort((a, b) => {
      // 우선순위 비교
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 같은 우선순위라면 시작 기간 순서로 정렬
      const aStartDate = new Date(a.startDate);
      const bStartDate = new Date(b.startDate);
      const aStartDateOnly = new Date(aStartDate.getFullYear(), aStartDate.getMonth(), aStartDate.getDate());
      const bStartDateOnly = new Date(bStartDate.getFullYear(), bStartDate.getMonth(), bStartDate.getDate());
      return aStartDateOnly.getTime() - bStartDateOnly.getTime();
    });
  };

  // 필터링된 업무 (정렬된)
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      // 취소된 업무는 간트 차트에 표시하지 않음
      if (task.status === 'cancelled') {
        return false;
      }
      
      if (statusFilter.length > 0 && !statusFilter.includes(task.status)) {
        return false;
      }
      if (departmentFilter.length > 0 && !departmentFilter.includes(task.department)) {
        return false;
      }
      return true;
    });
    
    // 우선순위와 시작 기간 순서로 정렬
    return sortTasksByPriorityAndDate(filtered);
  }, [tasks, statusFilter, departmentFilter]);

  // 날짜 이동 함수
  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('addictionForum_gantt_currentDate', currentDate.toISOString());
      localStorage.setItem('addictionForum_gantt_showFilters', JSON.stringify(showFilters));
      localStorage.setItem('addictionForum_gantt_statusFilter', JSON.stringify(statusFilter));
      localStorage.setItem('addictionForum_gantt_departmentFilter', JSON.stringify(departmentFilter));
    } catch (error) {
      console.error('간트 차트 상태 저장 실패:', error);
    }
  }, [currentDate, showFilters, statusFilter, departmentFilter]);

  // 진행률 변경 처리
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

  // 업무의 시작일과 종료일이 현재 주에 포함되는지 확인
  const isTaskInWeek = (task: Task) => {
    // 날짜만 비교하기 위해 시간을 제거하고 날짜만 추출
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
          // UTC 기반으로 날짜만 비교 (시간대 문제 해결)
      const taskStartOnly = new Date(Date.UTC(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate()));
      const taskEndOnly = new Date(Date.UTC(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate()));
    
    return taskStartOnly <= weekEnd && taskEndOnly >= weekStart;
  };

  // 특정 날짜에 업무가 진행 중인지 확인
  const isTaskActiveOnDate = (task: Task, date: Date) => {
    // 날짜만 비교하기 위해 시간을 제거하고 날짜만 추출
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
          // UTC 기반으로 날짜만 비교 (시간대 문제 해결)
      const taskStartOnly = new Date(Date.UTC(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate()));
      const taskEndOnly = new Date(Date.UTC(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate()));
      const currentDateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    
    return currentDateOnly >= taskStartOnly && currentDateOnly <= taskEndOnly;
  };

  // 업무 상태에 따른 색상 반환
  const getTaskColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-400';
      default:
        return 'bg-yellow-500';
    }
  };

  // 진행률과 상태에 따른 투명도 계산
  const getTaskOpacity = (task: Task) => {
    // 완료된 업무나 취소된 업무는 반투명하게 표시
    if (task.status === 'completed' || task.status === 'cancelled') {
      return 'opacity-40';
    }
    
    // 진행률에 따른 투명도
    if (task.progress === 0) return 'opacity-30';
    if (task.progress < 50) return 'opacity-60';
    if (task.progress < 100) return 'opacity-80';
    return 'opacity-100';
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">간트 차트</h1>
          <p className="text-gray-600 mt-2">업무 일정과 진행 상황을 시각적으로 확인하세요</p>
          <p className="text-sm text-primary-600 mt-1">
            💡 각 업무의 진행률을 슬라이더로 조정하면 상태가 자동으로 업데이트됩니다
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>필터</span>
          </button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태별 필터</label>
              <div className="space-y-2">
                {(['pending', 'in-progress', 'completed', 'delayed', 'cancelled'] as TaskStatus[]).map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter(prev => [...prev, status]);
                        } else {
                          setStatusFilter(prev => prev.filter(s => s !== status));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {status === 'completed' ? '완료' :
                       status === 'in-progress' ? '진행중' :
                       status === 'delayed' ? '지연' :
                       status === 'cancelled' ? '취소' : '대기중'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">부서별 필터</label>
              <div className="space-y-2">
                {['기획팀', '개발팀', '마케팅팀', '운영팀'].map(dept => (
                  <label key={dept} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={departmentFilter.includes(dept)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDepartmentFilter(prev => [...prev, dept]);
                        } else {
                          setDepartmentFilter(prev => prev.filter(d => d !== dept));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{dept}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 주간 네비게이션 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
                                     <button
              onClick={goToToday}
              className="btn-secondary"
            >
              오늘 ({format(new Date(), 'MM/dd', { locale: ko })} {format(new Date(), 'EEE', { locale: ko })})
            </button>
            
            <button
              onClick={goToNextWeek}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
                     <div className="text-center">
             <h2 className="text-lg font-semibold text-gray-900">
               {format(weekStart, 'yyyy년 MM월 dd일', { locale: ko })} ~ {format(weekEnd, 'MM월 dd일', { locale: ko })}
             </h2>
             <p className="text-sm text-gray-500">
               {format(currentDate, 'yyyy년 MM월', { locale: ko })}
             </p>

           </div>
        </div>

        {/* 간트 차트 */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* 헤더 */}
            <div className="grid grid-cols-[300px_repeat(7,1fr)] gap-1 mb-2">
              <div className="p-2 font-medium text-gray-700 bg-gray-50 rounded">업무</div>
              {weekDays.map((day, index) => (
                <div key={index} className="p-2 text-center font-medium text-gray-700 bg-gray-50 rounded">
                  <div className="text-sm">{format(day, 'MM/dd', { locale: ko })}</div>
                  <div className="text-xs text-gray-500">{format(day, 'EEE', { locale: ko })}</div>
                </div>
              ))}
            </div>

            {/* 업무 행 */}
            {filteredTasks.filter(isTaskInWeek).map((task) => (
              <div key={task.id} className="grid grid-cols-[300px_repeat(7,1fr)] gap-1 mb-2">
                {/* 업무 정보 */}
                <div className={`p-3 border rounded-lg shadow-sm min-h-[120px] ${
                  task.status === 'cancelled' || task.priority === 'cancelled' 
                    ? 'bg-gray-100 opacity-60' 
                    : 'bg-white'
                }`}>
                  {/* 업무명과 우선순위 */}
                  <div className="mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 leading-tight flex-1 mr-2">
                        {task.title}
                      </h3>
                      {/* 우선순위 표시 */}
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0
                        ${task.priority === 'urgent' ? 'bg-red-100 text-red-800 border border-red-200' : ''}
                        ${task.priority === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-200' : ''}
                        ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : ''}
                        ${task.priority === 'low' ? 'bg-green-100 text-green-800 border border-green-200' : ''}
                        ${task.priority === 'cancelled' ? 'bg-gray-100 text-gray-800 border border-gray-200' : ''}
                        ${task.priority === 'none' ? 'bg-gray-50 text-gray-600 border border-gray-200' : ''}
                      `}>
                        {task.priority === 'urgent' ? '🔥 긴급' : ''}
                        {task.priority === 'high' ? '⚡ 높음' : ''}
                        {task.priority === 'medium' ? '📋 보통' : ''}
                        {task.priority === 'low' ? '✅ 낮음' : ''}
                        {task.priority === 'cancelled' ? '❌ 취소' : ''}
                        {task.priority === 'none' ? '⚪ 없음' : ''}
                      </span>
                    </div>
                    
                    {/* 담당자와 부서 */}
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                        {task.assignee}
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                        {task.department}
                      </span>
                    </div>
                  </div>

                  {/* 상태와 진행률 */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${getTaskColor(task.status)}`}></span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'delayed' ? 'bg-red-100 text-red-800' :
                          task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status === 'completed' ? '완료' :
                           task.status === 'in-progress' ? '진행중' :
                           task.status === 'delayed' ? '지연' :
                           task.status === 'cancelled' ? '취소' :
                           '대기중'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                  
                  {/* 진행률 슬라이더 */}
                  <div className="mt-2">
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
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${task.progress}%, #e5e7eb ${task.progress}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      진행률 조정 시 상태 자동 업데이트
                    </div>
                  </div>
                  
                  {/* 완료/취소 체크박스 */}
                  <div className="mt-2 flex items-center justify-center space-x-4">
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
                </div>

                {/* 일정 바 */}
                {weekDays.map((day, dayIndex) => {
                  const isActive = isTaskActiveOnDate(task, day);
                  const isStart = isSameDay(new Date(task.startDate), day);
                  const isEnd = isSameDay(new Date(task.endDate), day);
                  
                  return (
                    <div key={dayIndex} className="p-1">
                      {isActive && (
                        <div className={`
                          h-8 rounded ${getTaskColor(task.status)} ${getTaskOpacity(task)}
                          flex items-center justify-center text-white text-xs font-medium
                          ${isStart ? 'rounded-l-lg' : ''}
                          ${isEnd ? 'rounded-r-lg' : ''}
                        `}>
                          {isStart && (
                            <div className="text-center">
                              <div className="text-xs font-bold">시작</div>
                            </div>
                          )}
                          {isEnd && !isStart && (
                            <div className="text-center">
                              <div className="text-xs font-bold">완료</div>
                            </div>
                          )}
                          {!isStart && !isEnd && (
                            <div className="text-center">
                              <div className="text-xs">{task.progress}%</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {filteredTasks.filter(isTaskInWeek).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                이번 주에 진행 예정인 업무가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">범례</h3>
        
        {/* 상태별 범례 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">업무 상태</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">대기중</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">진행중</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">완료</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">지연</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span className="text-sm text-gray-700">취소</span>
            </div>
          </div>
        </div>
        
        {/* 우선순위별 범례 */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">우선순위</h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">긴급</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-700">높음</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">보통</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">낮음</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded opacity-60"></div>
              <span className="text-sm text-gray-700">취소</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm text-gray-700">없음</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
