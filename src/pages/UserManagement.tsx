import { useState } from 'react';
import { useTaskContext, User } from '../contexts/TaskContextSupabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building,
  Save,
  X,
  User as UserIcon
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { state, addUser, updateUser, deleteUser } = useTaskContext();
  const { users } = state;
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    name: '',
    departments: [],
    email: '',
    phone: '',
    role: ''
  });

  const departments = ['이사장', '고문', '이사 및 감사', '운영(실행)위원회', '사무국', '정책 위원회', '출판 위원회', '연구지원실'];

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUser(editingUser.id, editingUser);
      setEditingUser(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.departments.length > 0) {
      addUser(newUser);
      setNewUser({ name: '', departments: [], email: '', phone: '', role: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      deleteUser(userId);
    }
  };

  const handleInputChange = (field: keyof User, value: string | string[]) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: value });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const handleNewUserInputChange = (field: keyof Omit<User, 'id'>, value: string | string[]) => {
    setNewUser({ ...newUser, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-2">담당자별 부서 정보를 관리하고 설정하세요</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>새 사용자 추가</span>
        </button>
      </div>

      {/* 새 사용자 추가 폼 */}
      {showAddForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">새 사용자 추가</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                             <input
                 type="text"
                 value={newUser.name}
                 onChange={(e) => handleNewUserInputChange('name', e.target.value)}
                 onKeyPress={(e) => handleKeyPress(e, handleAddUser)}
                 className="input-field"
                 placeholder="사용자 이름"
               />
            </div>
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">부서 *</label>
               <div className="space-y-2">
                 {departments.map(dept => (
                   <label key={dept} className="flex items-center">
                     <input
                       type="checkbox"
                       checked={newUser.departments.includes(dept)}
                       onChange={(e) => {
                         if (e.target.checked) {
                           handleNewUserInputChange('departments', [...newUser.departments, dept]);
                         } else {
                           handleNewUserInputChange('departments', newUser.departments.filter(d => d !== dept));
                         }
                       }}
                       className="mr-2"
                     />
                     <span className="text-sm text-gray-700">{dept}</span>
                   </label>
                 ))}
               </div>
             </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                             <input
                 type="email"
                 value={newUser.email}
                 onChange={(e) => handleNewUserInputChange('email', e.target.value)}
                 onKeyPress={(e) => handleKeyPress(e, handleAddUser)}
                 className="input-field"
                 placeholder="이메일 주소"
               />
            </div>
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                               <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => handleNewUserInputChange('phone', e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddUser)}
                  className="input-field"
                  placeholder="전화번호"
                />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">역할/소속</label>
                               <input
                  type="text"
                  value={newUser.role}
                  onChange={(e) => handleNewUserInputChange('role', e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddUser)}
                  className="input-field"
                  placeholder="역할 또는 소속 기관"
                />
             </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
            >
              취소
            </button>
                         <button
               onClick={handleAddUser}
               disabled={!newUser.name || newUser.departments.length === 0}
               className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
             >
               추가
             </button>
          </div>
        </div>
      )}

      {/* 사용자 목록 */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   연락처
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   역할/소속
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   작업
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?.id === user.id ? (
                                             <input
                         type="text"
                         value={editingUser.name}
                         onChange={(e) => handleInputChange('name', e.target.value)}
                         onKeyPress={(e) => handleKeyPress(e, handleSaveUser)}
                         className="input-field w-32"
                       />
                    ) : (
                      <div className="flex items-center">
                                                 <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    )}
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     {editingUser?.id === user.id ? (
                       <div className="space-y-2">
                         {departments.map(dept => (
                           <label key={dept} className="flex items-center">
                             <input
                               type="checkbox"
                               checked={editingUser.departments.includes(dept)}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   handleInputChange('departments', [...editingUser.departments, dept]);
                                 } else {
                                   handleInputChange('departments', editingUser.departments.filter(d => d !== dept));
                                 }
                               }}
                               className="mr-2"
                             />
                             <span className="text-sm text-gray-700">{dept}</span>
                           </label>
                         ))}
                       </div>
                     ) : (
                       <div className="flex items-center">
                         <Building className="h-5 w-5 text-gray-400 mr-3" />
                         <div className="text-sm text-gray-900">
                           {user.departments.map((dept, index) => (
                             <span key={dept}>
                               {dept}{index < user.departments.length - 1 ? ', ' : ''}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?.id === user.id ? (
                      <div className="space-y-2">
                                                 <input
                           type="email"
                           value={editingUser.email || ''}
                           onChange={(e) => handleInputChange('email', e.target.value)}
                           onKeyPress={(e) => handleKeyPress(e, handleSaveUser)}
                           className="input-field w-48"
                           placeholder="이메일"
                         />
                                                 <input
                           type="tel"
                           value={editingUser.phone || ''}
                           onChange={(e) => handleInputChange('phone', e.target.value)}
                           onKeyPress={(e) => handleKeyPress(e, handleSaveUser)}
                           className="input-field w-48"
                           placeholder="전화번호"
                         />
                      </div>
                                         ) : (
                       <div className="text-sm text-gray-900">
                         {user.email && <div>{user.email}</div>}
                         {user.phone && <div>{user.phone}</div>}
                       </div>
                     )}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     {editingUser?.id === user.id ? (
                                               <input
                          type="text"
                          value={editingUser.role || ''}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, handleSaveUser)}
                          className="input-field w-48"
                          placeholder="역할 또는 소속"
                        />
                     ) : (
                       <div className="text-sm text-gray-900">
                         {user.role && <div className="text-xs text-gray-600">{user.role}</div>}
                       </div>
                     )}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingUser?.id === user.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveUser}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 부서별 사용자 통계 */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">부서별 사용자 현황</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {departments.map(dept => {
             const userCount = users.filter(user => user.departments.includes(dept)).length;
             return (
               <div key={dept} className="text-center p-4 bg-gray-50 rounded-lg">
                 <div className="text-2xl font-bold text-gray-900">{userCount}</div>
                 <div className="text-sm text-gray-600">{dept}</div>
               </div>
             );
           })}
         </div>
      </div>
    </div>
  );
};

export default UserManagement;
