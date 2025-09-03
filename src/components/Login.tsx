import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 실제 운영환경에서는 이 비밀번호를 환경변수나 서버에서 관리해야 합니다
  const CORRECT_PASSWORD = 'wndehrvhfja2025';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 비밀번호 확인 (실제로는 서버에서 검증해야 합니다)
    if (password === CORRECT_PASSWORD) {
      // 로그인 성공 시 로컬 스토리지에 로그인 상태 저장
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // 부모 컴포넌트에 로그인 성공 알림
      onLogin();
    } else {
      setError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
    
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            (사)중독포럼
          </h1>
          <p className="text-lg text-gray-600">업무 일정관리 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              시스템 접근
            </h2>
            <p className="text-gray-600">
              비밀번호를 입력하여 시스템에 접근하세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>확인 중...</span>
                </div>
              ) : (
                '시스템 접근'
              )}
            </button>
          </form>

          {/* 안내 메시지 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              시스템 관리자에게 문의하여 비밀번호를 확인하세요
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8">
                     <p className="text-sm text-gray-500">
             © 2025 (사)중독포럼. All rights reserved.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
