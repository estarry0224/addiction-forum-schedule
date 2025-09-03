
import { Link, useLocation } from 'react-router-dom';
import { Home, ListTodo, BarChart3, Plus, Settings, Users } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: '대시보드', description: '전체 현황 요약' },
    { path: '/tasks', icon: ListTodo, label: '업무 목록', description: '모든 업무 관리' },
    { path: '/gantt', icon: BarChart3, label: '간트 차트', description: '일정 진행 현황' },
    { path: '/tasks/new', icon: Plus, label: '새 업무 등록', description: '새로운 업무 추가' },
    { path: '/users', icon: Users, label: '사용자 관리', description: '팀원 정보 관리' },
    { path: '/settings', icon: Settings, label: '설정', description: '시스템 설정' },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="mt-8">
        <div className="px-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            메인 메뉴
          </h2>
        </div>
        
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${
                      isActive ? 'text-primary-600' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">시스템 상태</h3>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-gray-600">정상 운영 중</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
