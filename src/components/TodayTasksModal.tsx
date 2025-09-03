import React from 'react';
import { X, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTaskContext } from '../contexts/TaskContext';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TodayTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodayTasksModal: React.FC<TodayTasksModalProps> = ({ isOpen, onClose }) => {
  const { state } = useTaskContext();
  const { tasks } = state;

  // 오늘 날짜
  const today = new Date();

  // 오늘 진행 중인 업무 (시작일과 종료일 사이에 오늘이 포함되는 업무)
  const todayActiveTasks = tasks.filter((task: Task) => {
    if (task.status === 'cancelled') return false;
    
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    
    // UTC 기반으로 날짜만 비교
    const startDateOnly = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
    const endDateOnly = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    const todayOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    return todayOnly >= startDateOnly && todayOnly <= endDateOnly;
  });

  // 오늘 마감 예정 업무
  const todayDeadlineTasks = tasks.filter((task: Task) => {
    if (task.status === 'cancelled') return false;
    
    const endDate = new Date(task.endDate);
    const endDateOnly = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    const todayOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    return endDateOnly.getTime() === todayOnly.getTime();
  });

  // 우선순위별 정렬
  const priorityOrder = {
    urgent: 1,
    high: 2,
    medium: 3,
    low: 4,
    none: 5,
    cancelled: 6, // ★ 반드시 추가
  } as const satisfies Record<TaskPriority, number>;
  const sortedActiveTasks = todayActiveTasks.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const sortedDeadlineTasks = todayDeadlineTasks.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (!isOpen) return null;

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'none': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      case 'none': return '없음';
      case 'cancelled': return '취소';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in-progress': return '진행중';
      case 'pending': return '대기';
      case 'delayed': return '지연';
      case 'cancelled': return '취소';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">오늘의 업무</h2>
              <p className="text-sm text-gray-600">
                {format(today, 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 오늘 진행 중인 업무 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              오늘 진행 중인 업무 ({sortedActiveTasks.length}개)
            </h3>
            {sortedActiveTasks.length > 0 ? (
              <div className="space-y-3">
                {sortedActiveTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>담당: {task.assignee}</span>
                          <span>부서: {task.department}</span>
                          <span>진행률: {task.progress}%</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-4">
                        <div>시작: {format(new Date(task.startDate), 'MM/dd')}</div>
                        <div>마감: {format(new Date(task.endDate), 'MM/dd')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">오늘 진행 중인 업무가 없습니다.</p>
            )}
          </div>

          {/* 오늘 마감 예정 업무 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              오늘 마감 예정 업무 ({sortedDeadlineTasks.length}개)
            </h3>
            {sortedDeadlineTasks.length > 0 ? (
              <div className="space-y-3">
                {sortedDeadlineTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>담당: {task.assignee}</span>
                          <span>부서: {task.department}</span>
                          <span>진행률: {task.progress}%</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-4">
                        <div>시작: {format(new Date(task.startDate), 'MM/dd')}</div>
                        <div className="font-medium text-red-600">마감: {format(new Date(task.endDate), 'MM/dd')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">오늘 마감 예정인 업무가 없습니다.</p>
            )}
          </div>

          {/* 요약 정보 */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">오늘 업무 요약</h4>
            <div className="grid grid-cols-3 gap-4 text-xs text-blue-800">
              <div>
                <span className="font-medium">진행 중:</span> {sortedActiveTasks.length}개
              </div>
              <div>
                <span className="font-medium">마감 예정:</span> {sortedDeadlineTasks.length}개
              </div>
              <div>
                <span className="font-medium">총 업무:</span> {sortedActiveTasks.length + sortedDeadlineTasks.length}개
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayTasksModal;
