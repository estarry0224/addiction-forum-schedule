import { useState, useMemo, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTaskContext } from '../contexts/TaskContextSupabase';
import { Task } from '../types';

interface CalendarProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ isOpen, onClose, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    // 로컬 스토리지에서 현재 날짜 복원
    const savedDate = localStorage.getItem('addictionForum_calendar_currentDate');
    return savedDate ? new Date(savedDate) : new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // 로컬 스토리지에서 선택된 날짜 복원
    const savedSelectedDate = localStorage.getItem('addictionForum_calendar_selectedDate');
    return savedSelectedDate ? new Date(savedSelectedDate) : null;
  });
  const { state } = useTaskContext();

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const daysInMonth = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  // 달의 첫 주 시작일을 맞추기 위한 빈 칸 계산
  const startDay = useMemo(() => monthStart.getDay(), [monthStart]);
  const emptyStartDays = useMemo(() => Array.from({ length: startDay }, (_, i) => i), [startDay]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('addictionForum_calendar_currentDate', currentDate.toISOString());
      if (selectedDate) {
        localStorage.setItem('addictionForum_calendar_selectedDate', selectedDate.toISOString());
      } else {
        localStorage.removeItem('addictionForum_calendar_selectedDate');
      }
    } catch (error) {
      console.error('달력 상태 저장 실패:', error);
    }
  }, [currentDate, selectedDate]);

  // TaskContext에서 실제 업무 데이터 사용
  const tasks = state.tasks;

  // 특정 날짜의 업무 우선순위 요약
  const getDateTaskSummary = (date: Date) => {
    const dayTasks = tasks.filter((task: Task) => {
      // 취소된 업무는 달력에 표시하지 않음
      if (task.status === 'cancelled') {
        return false;
      }
      
      // 날짜만 비교하기 위해 시간을 제거하고 날짜만 추출
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      
      // UTC 기반으로 날짜만 비교 (시간대 문제 해결)
      const startDateOnly = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
      const endDateOnly = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
      const currentDateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      
      
      return currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly;
    });

    if (dayTasks.length === 0) return null;

    // 우선순위 순서로 정렬된 업무 목록
    const sortedDayTasks = sortTasksByPriorityAndDate(dayTasks);

    // 우선순위별 업무 개수
    const urgent = dayTasks.filter((task: Task) => task.priority === 'urgent').length;
    const high = dayTasks.filter((task: Task) => task.priority === 'high').length;
    const medium = dayTasks.filter((task: Task) => task.priority === 'medium').length;
    const low = dayTasks.filter((task: Task) => task.priority === 'low').length;
    const cancelled = dayTasks.filter((task: Task) => task.priority === 'cancelled' || task.priority === 'none').length;

    return { 
      urgent, 
      high, 
      medium, 
      low, 
      cancelled,
      total: dayTasks.length,
      sortedTasks: sortedDayTasks // 정렬된 업무 목록 추가
    };
  };

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

  // 선택된 날짜의 업무 목록 (정렬된)
  const selectedDateTasks = selectedDate ? sortTasksByPriorityAndDate(tasks.filter((task: Task) => {
    // 취소된 업무는 달력에 표시하지 않음
    if (task.status === 'cancelled') {
      return false;
    }
    
    // 날짜만 비교하기 위해 시간을 제거하고 날짜만 추출
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    
          // UTC 기반으로 날짜만 비교 (시간대 문제 해결)
      const startDateOnly = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
      const endDateOnly = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
      const currentDateOnly = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));
    
    return currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly;
  })) : [];

  if (!isOpen) return null;

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg shadow-xl p-6 w-[700px] max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">달력</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 월 네비게이션 */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

                {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-3">
          {/* 빈 시작일 */}
          {emptyStartDays.map((_, index) => (
            <div key={`empty-${index}`} className="h-24" />
          ))}
          
          {/* 월의 날짜들 */}
          {daysInMonth.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isCurrentDay = isToday(date);
            const taskSummary = getDateTaskSummary(date);
            
            return (
              <div key={date.toISOString()} className="relative">
                <button
                  onClick={() => handleDateClick(date)}
                  className={`
                    h-24 w-full rounded-lg text-sm font-medium transition-colors border-2
                    ${isCurrentMonth ? 'text-gray-900 border-gray-200' : 'text-gray-400 border-gray-100'}
                    ${isCurrentDay ? 'bg-primary-50 text-primary-600 border-primary-300' : ''}
                    ${isSelected ? 'bg-primary-600 text-white border-primary-600' : ''}
                    ${!isSelected && !isCurrentDay && isCurrentMonth ? 'hover:bg-gray-50 hover:border-gray-300' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full p-1">
                    <span className="text-lg font-semibold mb-2">{format(date, 'd')}</span>
                    
                                                              {/* 업무 우선순위를 점으로 표시 */}
                      {taskSummary && (
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {taskSummary.urgent > 0 && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" title={`긴급: ${taskSummary.urgent}`} />
                          )}
                          {taskSummary.high > 0 && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full" title={`높음: ${taskSummary.high}`} />
                          )}
                          {taskSummary.low > 0 && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title={`낮음: ${taskSummary.low}`} />
                          )}
                          {taskSummary.cancelled > 0 && (
                            <div className="w-2 h-2 bg-gray-500 rounded-full" title={`취소/없음: ${taskSummary.cancelled}`} />
                          )}
                        </div>
                      )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* 선택된 날짜 표시 */}
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              선택된 날짜: {format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
            </p>
            
            {/* 선택된 날짜의 업무 목록 */}
            {selectedDateTasks.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">업무 목록</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedDateTasks.map((task) => (
                    <div key={task.id} className={`p-2 bg-gray-50 rounded-md ${task.status === 'completed' ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {/* 우선순위 표시 */}
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-medium
                              ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' : ''}
                              ${task.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                              ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                            `}>
                              {task.priority === 'urgent' ? '긴급' : ''}
                              {task.priority === 'high' ? '높음' : ''}
                              {task.priority === 'medium' ? '보통' : ''}
                              {task.priority === 'low' ? '낮음' : ''}
                            </span>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {task.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {task.assignee} • {task.department}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          {/* 상태 표시 */}
                          <div className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${task.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                            ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${task.status === 'delayed' ? 'bg-red-100 text-red-800' : ''}
                            ${task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                          `}>
                            {task.status === 'completed' ? '완료' : ''}
                            {task.status === 'in-progress' ? '진행중' : ''}
                            {task.status === 'pending' ? '대기' : ''}
                            {task.status === 'delayed' ? '지연' : ''}
                            {task.status === 'cancelled' ? '취소' : ''}
                          </div>
                          
                          {/* 진행률 */}
                          <div className="text-xs text-gray-500">
                            {task.progress}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">해당 날짜에 예정된 업무가 없습니다.</p>
            )}
          </div>
        )}
        
                 {/* 업무 우선순위 범례 */}
         <div className="mt-4 pt-4 border-t border-gray-200">
           <h4 className="text-sm font-medium text-gray-700 mb-3">업무 우선순위</h4>
           <div className="flex flex-wrap gap-6 text-sm">
             <div className="flex items-center space-x-3">
               <div className="w-3 h-3 bg-red-500 rounded-full"></div>
               <span className="text-gray-600 font-medium">긴급</span>
             </div>
             <div className="flex items-center space-x-3">
               <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
               <span className="text-gray-600 font-medium">높음</span>
             </div>
             <div className="flex items-center space-x-3">
               <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
               <span className="text-gray-600 font-medium">보통</span>
             </div>
             <div className="flex items-center space-x-3">
               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
               <span className="text-gray-600 font-medium">낮음</span>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};

export default Calendar;
