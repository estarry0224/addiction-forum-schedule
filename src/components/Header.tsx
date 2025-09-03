import { useState } from 'react';
import { Calendar, Bell, User, LogOut } from 'lucide-react';
import CalendarModal from './Calendar';
import TodayTasksModal from './TodayTasksModal';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTodayTasksOpen, setIsTodayTasksOpen] = useState(false);

  const handleCalendarClick = () => {
    setIsCalendarOpen(true);
  };

  const handleCalendarClose = () => {
    setIsCalendarOpen(false);
  };

  const handleTodayTasksClick = () => {
    setIsTodayTasksOpen(true);
  };

  const handleTodayTasksClose = () => {
    setIsTodayTasksOpen(false);
  };



  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary-600">
                (사)중독포럼
              </h1>
              <p className="text-sm text-gray-500">업무 일정관리 시스템</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={handleCalendarClick}
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
              >
                <Calendar className="h-6 w-6" />
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={handleTodayTasksClick}
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">관리자</p>
                <p className="text-xs text-gray-500">시스템 관리자</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md transition-colors"
                title="로그아웃"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 달력 모달 */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={handleCalendarClose}
      />
      
      {/* 오늘의 업무 모달 */}
      <TodayTasksModal
        isOpen={isTodayTasksOpen}
        onClose={handleTodayTasksClose}
      />
    </header>
  );
};

export default Header;
