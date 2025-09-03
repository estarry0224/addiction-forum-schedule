import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import TaskList from './pages/TaskList'
import GanttChart from './pages/GanttChart'
import TaskForm from './pages/TaskForm'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'
import Login from './components/Login'
import { TaskProvider } from './contexts/TaskContext'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 로그인 상태 확인
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem('isLoggedIn');
      const loginTime = localStorage.getItem('loginTime');
      
      if (loginStatus === 'true' && loginTime) {
        // 로그인 시간이 24시간 이내인지 확인
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setIsLoggedIn(true);
        } else {
          // 24시간이 지났으면 로그인 상태 초기화
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('loginTime');
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

    checkLoginStatus();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    setIsLoggedIn(false);
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시스템을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // 로그인된 경우 메인 애플리케이션 표시
  return (
    <TaskProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header onLogout={handleLogout} />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/gantt" element={<GanttChart />} />
                <Route path="/tasks/new" element={<TaskForm />} />
                <Route path="/tasks/edit/:id" element={<TaskForm />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </TaskProvider>
  )
}

export default App
