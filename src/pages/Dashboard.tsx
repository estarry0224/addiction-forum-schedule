import { useState, useEffect } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  ArrowLeft,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TaskStatus } from '../types';

const Dashboard: React.FC = () => {
  const { state } = useTaskContext();
  const { tasks } = state;
  
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all' | null>(() => {
    // 로컬 스토리지에서 선택된 상태 복원
    const savedStatus = localStorage.getItem('addictionForum_dashboard_status');
    return savedStatus ? (savedStatus as TaskStatus | 'all') : null;
  });
  const [showTaskList, setShowTaskList] = useState(() => {
    // 로컬 스토리지에서 목록 표시 상태 복원
    const savedShowList = localStorage.getItem('addictionForum_dashboard_showList');
    return savedShowList ? JSON.parse(savedShowList) : false;
  });

  // 통계 계산 (취소된 업무 제외)
  const activeTasks = tasks.filter(task => task.status !== 'cancelled');
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = activeTasks.filter(task => task.status === 'in-progress').length;

  const delayedTasks = activeTasks.filter(task => task.status === 'delayed').length;
  
  // 취소된 업무 개수 (별도 계산)
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled').length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const averageProgress = totalTasks > 0 
    ? Math.round(activeTasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks)
    : 0;

  // 오늘 마감 예정 업무 (취소된 업무 제외)
  const today = new Date();
  const todayTasks = activeTasks.filter(task => {
    const endDate = new Date(task.endDate);
    return endDate.toDateString() === today.toDateString();
  });

  // 이번 주 진행률 (취소된 업무 제외)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekTasks = activeTasks.filter(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    return taskStart <= weekEnd && taskEnd >= weekStart;
  });

  const weekProgress = weekTasks.length > 0
    ? Math.round(weekTasks.reduce((sum, task) => sum + task.progress, 0) / weekTasks.length)
    : 0;

  // 카드 클릭 핸들러
  const handleCardClick = (status: TaskStatus | 'all') => {
    setSelectedStatus(status);
    setShowTaskList(true);
  };

  // 뒤로가기 핸들러
  const handleBackClick = () => {
    setShowTaskList(false);
    setSelectedStatus(null);
  };

  // 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      if (selectedStatus) {
        localStorage.setItem('addictionForum_dashboard_status', selectedStatus);
      } else {
        localStorage.removeItem('addictionForum_dashboard_status');
      }
      localStorage.setItem('addictionForum_dashboard_showList', JSON.stringify(showTaskList));
    } catch (error) {
      console.error('대시보드 상태 저장 실패:', error);
    }
  }, [selectedStatus, showTaskList]);

  // 선택된 상태에 따른 업무 필터링
  const getFilteredTasks = () => {
    if (selectedStatus === 'all') return activeTasks;
    if (selectedStatus === 'cancelled') return tasks.filter(task => task.status === 'cancelled');
    return activeTasks.filter(task => task.status === selectedStatus);
  };

  // 상태별 제목과 설명
  const getStatusInfo = () => {
    switch (selectedStatus) {
      case 'all':
        return { title: '전체 업무', description: '모든 업무 목록' };
      case 'completed':
        return { title: '완료된 업무', description: '완료된 업무 목록' };
      case 'in-progress':
        return { title: '진행 중인 업무', description: '현재 진행 중인 업무 목록' };
      case 'delayed':
        return { title: '지연된 업무', description: '지연된 업무 목록' };
      case 'cancelled':
        return { title: '취소된 업무', description: '취소된 업무 목록' };
      default:
        return { title: '업무 목록', description: '업무 목록' };
    }
  };

  return (
    <div className="space-y-6">
      {!showTaskList ? (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
              <p className="text-gray-600 mt-2">
                {format(today, 'yyyy년 MM월 dd일 EEEE', { locale: ko })} 업무 현황
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">마지막 업데이트</p>
              <p className="text-sm font-medium text-gray-900">
                {format(today, 'HH:mm')}
              </p>
            </div>
          </div>

             {/* 통계 카드 */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
         <div 
           className="card cursor-pointer hover:shadow-lg transition-shadow"
           onClick={() => handleCardClick('all')}
         >
           <div className="flex items-center">
             <div className="p-3 rounded-full bg-blue-100 text-blue-600">
               <FileText className="h-6 w-6" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">전체 업무</p>
               <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
             </div>
           </div>
         </div>

         <div 
           className="card cursor-pointer hover:shadow-lg transition-shadow"
           onClick={() => handleCardClick('completed')}
         >
           <div className="flex items-center">
             <div className="p-3 rounded-full bg-green-100 text-green-600">
               <CheckCircle className="h-6 w-6" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">완료된 업무</p>
               <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
             </div>
           </div>
         </div>

         <div 
           className="card cursor-pointer hover:shadow-lg transition-shadow"
           onClick={() => handleCardClick('in-progress')}
         >
           <div className="flex items-center">
             <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
               <Clock className="h-6 w-6" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">진행 중</p>
               <p className="text-2xl font-bold text-gray-900">{inProgressTasks}</p>
             </div>
           </div>
         </div>

         <div 
           className="card cursor-pointer hover:shadow-lg transition-shadow"
           onClick={() => handleCardClick('delayed')}
         >
           <div className="flex items-center">
             <div className="p-3 rounded-full bg-red-100 text-red-600">
               <AlertTriangle className="h-6 w-6" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">지연된 업무</p>
               <p className="text-2xl font-bold text-gray-900">{delayedTasks}</p>
             </div>
           </div>
         </div>

         <div 
           className="card cursor-pointer hover:shadow-lg transition-shadow"
           onClick={() => handleCardClick('cancelled')}
         >
           <div className="flex items-center">
             <div className="p-3 rounded-full bg-gray-100 text-gray-600">
               <X className="h-6 w-6" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">취소된 업무</p>
               <p className="text-2xl font-bold text-gray-900">{cancelledTasks}</p>
             </div>
           </div>
         </div>
       </div>

             {/* 진행률 및 차트 */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="card">
           <h3 className="text-lg font-medium text-gray-900 mb-4">전체 진행률</h3>
           <p className="text-sm text-gray-600 mb-4">* 취소된 업무는 제외하고 계산됩니다</p>
           <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>완료율</span>
                <span>{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>평균 진행률</span>
                <span>{averageProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${averageProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

                 <div className="card">
           <h3 className="text-lg font-medium text-gray-900 mb-4">이번 주 진행률</h3>
           <p className="text-sm text-gray-600 mb-4">* 취소된 업무는 제외하고 계산됩니다</p>
           <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>주간 진행률</span>
                <span>{weekProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${weekProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>주간 업무 수: {weekTasks.length}개</p>
              <p>시작일: {format(weekStart, 'MM/dd')}</p>
              <p>종료일: {format(weekEnd, 'MM/dd')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 오늘 마감 예정 업무 */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">오늘 마감 예정 업무</h3>
        {todayTasks.length > 0 ? (
          <div className="space-y-3">
            {todayTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'in-progress' ? 'bg-blue-500' :
                    task.status === 'delayed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="font-medium text-gray-900">{task.title}</span>
                  <span className="text-sm text-gray-500">담당: {task.assignee}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    진행률: {task.progress}%
                  </span>
                  <span className={`status-badge ${
                    task.status === 'completed' ? 'status-completed' :
                    task.status === 'in-progress' ? 'status-in-progress' :
                    task.status === 'delayed' ? 'status-delayed' : 'status-pending'
                  }`}>
                    {task.status === 'completed' ? '완료' :
                     task.status === 'in-progress' ? '진행중' :
                     task.status === 'delayed' ? '지연' : '대기중'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">오늘 마감 예정인 업무가 없습니다.</p>
        )}
      </div>
        </>
      ) : (
        <>
          {/* 업무 목록 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>대시보드로 돌아가기</span>
              </button>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">{getStatusInfo().title}</h1>
              <p className="text-gray-600">{getStatusInfo().description}</p>
            </div>
          </div>

          {/* 업무 목록 */}
          <div className="card">
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
                      진행률
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredTasks().map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                          <div className="text-xs text-gray-400 mt-1">{task.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{task.assignee}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>{format(new Date(task.startDate), 'yyyy/MM/dd')}</div>
                          <div className="text-gray-500">~ {format(new Date(task.endDate), 'yyyy/MM/dd')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900 w-12">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'urgent' ? '긴급' :
                           task.priority === 'high' ? '높음' :
                           task.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {getFilteredTasks().length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">해당 상태의 업무가 없습니다.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
