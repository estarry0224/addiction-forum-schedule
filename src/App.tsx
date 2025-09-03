import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom' // ← HashRouter로 전환
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import TaskList from './pages/TaskList'
import GanttChart from './pages/GanttChart'
import TaskForm from './pages/TaskForm'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'
import Login from './components/Login'
import { TaskProvider } from './contexts/TaskContextSupabase'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 🔸 배포 시마다 버전 문자열만 변경하세요 (캐시/이전 저장값 충돌 방지)
  const APP_VERSION = '2025-09-04-1'
  const K_LOGIN = `afs_${APP_VERSION}_isLoggedIn`
  const K_LOGTIME = `afs_${APP_VERSION}_loginTime`

  useEffect(() => {
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem(K_LOGIN)
      const loginTime = localStorage.getItem(K_LOGTIME)

      if (loginStatus === 'true' && loginTime) {
        const loginDate = new Date(loginTime)
        const now = new Date()
        const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)

        if (hoursDiff < 24) {
          setIsLoggedIn(true)
        } else {
          // 24시간 경과 → 로그인 만료
          localStorage.removeItem(K_LOGIN)
          localStorage.removeItem(K_LOGTIME)
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
      setIsLoading(false)
    }

    checkLoginStatus()
  }, []) // 최초 1회

  const handleLogin = () => {
    setIsLoggedIn(true)
    // 로그인 스탬프 저장(프리픽스 적용)
    localStorage.setItem(K_LOGIN, 'true')
    localStorage.setItem(K_LOGTIME, new Date().toISOString())
  }

  const handleLogout = () => {
    localStorage.removeItem(K_LOGIN)
    localStorage.removeItem(K_LOGTIME)
    setIsLoggedIn(false)
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시스템을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 미로그인 → 로그인 화면
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  // 로그인됨 → 메인 앱
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
