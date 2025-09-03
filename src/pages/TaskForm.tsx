import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTaskContext } from '../contexts/TaskContext';
import { TaskFormData, TaskStatus, TaskPriority } from '../types';
import { ArrowLeft, Save, X } from 'lucide-react';

const TaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state, addTask, updateTask } = useTaskContext();
  const { tasks } = state;

  const isEditing = Boolean(id);
  const existingTask = isEditing ? tasks.find(task => task.id === id) : null;

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    startDate: '',
    endDate: '',
    assignee: '',
    department: '',
    tags: [],
    notes: '',
    isRecurring: false,
    recurrencePattern: undefined
  });

  const [errors, setErrors] = useState<Partial<TaskFormData>>({});
  const [tagInput, setTagInput] = useState('');
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  const [customRecurrence, setCustomRecurrence] = useState({
    interval: 1,
    dayOfWeek: [] as number[],
    weekOfMonth: 1,
    monthOfYear: 1,
    mode: 'none', // 'weekly', 'monthly', 또는 'none'
    monthlyInterval: 1 // 월간 반복 주기 (매월, 2개월마다, 3개월마다...)
  });
  const [autoSetDepartment, setAutoSetDepartment] = useState(true); // 담당자 선택 시 부서 자동 설정
  const [assigneeInputMode, setAssigneeInputMode] = useState<'select' | 'manual'>('select'); // 담당자 입력 모드

  useEffect(() => {
    if (existingTask) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description,
        status: existingTask.status,
        priority: existingTask.priority,
        startDate: existingTask.startDate.split('T')[0],
        endDate: existingTask.endDate.split('T')[0],
        assignee: existingTask.assignee,
        department: existingTask.department,
        tags: existingTask.tags,
        notes: existingTask.notes || '',
        isRecurring: existingTask.isRecurring || false,
        recurrencePattern: existingTask.recurrencePattern
      });
      
      // 기존 업무의 담당자가 사용자 목록에 있는지 확인하여 입력 모드 설정
      const userExists = state.users.some(user => user.name === existingTask.assignee);
      setAssigneeInputMode(userExists ? 'select' : 'manual');
    } else {
      // 새 업무 등록 시 기본값 설정
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      setFormData(prev => ({
        ...prev,
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0]
      }));
      
      // 새 업무 등록 시 기본적으로 사용자 목록에서 선택 모드
      setAssigneeInputMode('select');
    }
  }, [existingTask, state.users]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = '업무명을 입력해주세요.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '업무 설명을 입력해주세요.';
    }

    if (!formData.startDate) {
      newErrors.startDate = '시작일을 선택해주세요.';
    }

    if (!formData.endDate) {
      newErrors.endDate = '종료일을 선택해주세요.';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '종료일은 시작일보다 늦어야 합니다.';
    }

    if (!formData.assignee.trim()) {
      newErrors.assignee = '담당자를 입력해주세요.';
    }

    if (!formData.department) {
      newErrors.department = '부서를 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isEditing && existingTask && id) {
      updateTask(id, formData);
    } else {
      addTask(formData);
    }

    navigate('/tasks');
  };

  const handleInputChange = (field: keyof TaskFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleRecurrenceChange = (type: string, interval: number, dayOfWeek?: number[], weekOfMonth?: number, monthOfYear?: number) => {
    if (type === 'none') {
      setFormData(prev => ({
        ...prev,
        isRecurring: false,
        recurrencePattern: undefined
      }));
    } else {
      const recurrencePattern: any = {
        type: type as any,
        interval: interval,
        endDate: formData.endDate
      };
      
      if (dayOfWeek && dayOfWeek.length > 0) {
        recurrencePattern.dayOfWeek = dayOfWeek;
      }
      
      if (weekOfMonth) {
        recurrencePattern.weekOfMonth = weekOfMonth;
      }
      
      if (monthOfYear) {
        recurrencePattern.monthOfYear = monthOfYear;
      }
      
      setFormData(prev => ({
        ...prev,
        isRecurring: true,
        recurrencePattern: recurrencePattern
      }));
    }
  };

  const handleCustomRecurrenceSave = () => {
    if (customRecurrence.mode === 'none') {
      // 설정 안함 선택 시 반복 설정 제거
      setFormData(prev => ({
        ...prev,
        isRecurring: false,
        recurrencePattern: undefined
      }));
      setShowCustomRecurrence(false);
      return;
    }
    
    if (customRecurrence.dayOfWeek.length > 0) {
      let recurrencePattern: any = {
        type: 'custom' as any,
        dayOfWeek: customRecurrence.dayOfWeek,
        endDate: formData.endDate
      };
      
      if (customRecurrence.mode === 'weekly') {
        // 주간 모드: 반복 주기만 설정
        recurrencePattern.interval = customRecurrence.interval;
      } else if (customRecurrence.mode === 'monthly') {
        // 월간 모드: 월간 반복 주기, 월 중 주차, 년 중 월 설정
        recurrencePattern.interval = customRecurrence.monthlyInterval;
        recurrencePattern.weekOfMonth = customRecurrence.weekOfMonth;
        recurrencePattern.monthOfYear = customRecurrence.monthOfYear;
      }
      
      setFormData(prev => ({
        ...prev,
        isRecurring: true,
        recurrencePattern: recurrencePattern
      }));
      
      setShowCustomRecurrence(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? '업무 수정' : '새 업무 등록'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing ? '기존 업무 정보를 수정하세요' : '새로운 업무를 등록하세요'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업무명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="업무명을 입력하세요"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 담당자 <span className="text-red-500">*</span>
               </label>
               
               {/* 담당자 입력 모드 선택 */}
               <div className="mb-3">
                 <div className="flex space-x-4">
                   <label className="flex items-center">
                     <input
                       type="radio"
                       name="assigneeMode"
                       value="select"
                       checked={assigneeInputMode === 'select'}
                       onChange={(_e) => {
                         setAssigneeInputMode('select');
                         // 모드 변경 시 담당자와 부서 초기화
                         setFormData(prev => ({
                           ...prev,
                           assignee: '',
                           department: ''
                         }));
                       }}
                       className="mr-2"
                     />
                     <span className="text-sm text-gray-700">사용자 목록에서 선택</span>
                   </label>
                   <label className="flex items-center">
                     <input
                       type="radio"
                       name="assigneeMode"
                       value="manual"
                       checked={assigneeInputMode === 'manual'}
                       onChange={(_e) => {
                         setAssigneeInputMode('manual');
                         // 모드 변경 시 담당자와 부서 초기화
                         setFormData(prev => ({
                           ...prev,
                           assignee: '',
                           department: ''
                         }));
                       }}
                       className="mr-2"
                     />
                     <span className="text-sm text-gray-700">직접 입력</span>
                   </label>
                 </div>
               </div>
               
               {/* 담당자 입력 필드 */}
               {assigneeInputMode === 'select' ? (
                 <div>
                   <select
                     value={formData.assignee}
                     onChange={(e) => {
                       const selectedUser = state.users.find(user => user.name === e.target.value);
                       if (selectedUser) {
                         if (autoSetDepartment && selectedUser.departments.length > 0) {
                           // 자동 설정이 활성화되어 있으면 첫 번째 부서를 자동으로 설정
                           setFormData(prev => ({
                             ...prev,
                             assignee: selectedUser.name,
                             department: selectedUser.departments[0]
                           }));
                         } else {
                           // 자동 설정이 비활성화되어 있으면 부서 초기화
                           setFormData(prev => ({
                             ...prev,
                             assignee: selectedUser.name,
                             department: ''
                           }));
                         }
                       } else {
                         handleInputChange('assignee', e.target.value);
                       }
                     }}
                     className={`input-field ${errors.assignee ? 'border-red-500' : ''}`}
                   >
                     <option value="">담당자를 선택하세요</option>
                     {state.users.map((user) => (
                       <option key={user.id} value={user.name}>
                         {user.name} ({user.departments.join(', ')}) 
                       </option>
                     ))}
                   </select>
                   
                   {/* 담당자 선택 시 부서 자동 설정 옵션 */}
                   <div className="mt-2">
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={autoSetDepartment}
                         onChange={(e) => setAutoSetDepartment(e.target.checked)}
                         className="mr-2"
                       />
                       <span className="text-sm text-gray-600">담당자 선택 시 부서 자동 설정</span>
                     </label>
                   </div>
                 </div>
               ) : (
                 <div>
                   <input
                     type="text"
                     value={formData.assignee}
                     onChange={(e) => handleInputChange('assignee', e.target.value)}
                     className={`input-field ${errors.assignee ? 'border-red-500' : ''}`}
                     placeholder="담당자명을 직접 입력하세요"
                   />
                 </div>
               )}
               
               {errors.assignee && (
                 <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>
               )}
             </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              업무 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`input-field ${errors.description ? 'border-red-500' : ''}`}
              placeholder="업무에 대한 상세한 설명을 입력하세요"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">일정 및 상태</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`input-field ${errors.startDate ? 'border-red-500' : ''}`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`input-field ${errors.endDate ? 'border-red-500' : ''}`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as TaskStatus)}
                className="input-field"
              >
                <option value="pending">대기중</option>
                <option value="in-progress">진행중</option>
                <option value="completed">완료</option>
                <option value="delayed">지연</option>
                <option value="cancelled">취소</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
                className="input-field"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">반복 설정</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // 체크할 때는 기본값으로 매일 설정
                      handleRecurrenceChange('daily', 1);
                    } else {
                      // 체크 해제할 때는 반복 설정 제거
                      handleRecurrenceChange('none', 1);
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">반복 업무로 설정</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">반복 패턴</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecurrenceChange('daily', 1)}
                      className={`px-3 py-2 text-sm rounded border ${
                        formData.recurrencePattern?.type === 'daily'
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      매일
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecurrenceChange('weekly', 1)}
                      className={`px-3 py-2 text-sm rounded border ${
                        formData.recurrencePattern?.type === 'weekly'
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      매주
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecurrenceChange('monthly', 1)}
                      className={`px-3 py-2 text-sm rounded border ${
                        formData.recurrencePattern?.type === 'monthly'
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      매월
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // 맞춤 설정 열 때 기본값 초기화
                        setCustomRecurrence({
                          interval: 1,
                          dayOfWeek: [],
                          weekOfMonth: 1,
                          monthOfYear: 1,
                          mode: 'none',
                          monthlyInterval: 1
                        });
                        setShowCustomRecurrence(true);
                      }}
                      className={`px-3 py-2 text-sm rounded border ${
                        formData.recurrencePattern?.type === 'custom'
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      맞춤 설정
                    </button>
                  </div>
                </div>

                {formData.recurrencePattern && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">현재 설정:</span> 
                    {formData.recurrencePattern.type === 'daily' && ' 매일'}
                    {formData.recurrencePattern.type === 'weekly' && ' 매주'}
                    {formData.recurrencePattern.type === 'monthly' && ' 매월'}
                    {formData.recurrencePattern.type === 'custom' && ' 맞춤 설정'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">부서 및 태그</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 부서 <span className="text-red-500">*</span>
               </label>
               
               {assigneeInputMode === 'select' ? (
                 // 사용자 목록에서 선택한 경우
                 <div>
                   <select
                     value={formData.department}
                     onChange={(e) => handleInputChange('department', e.target.value)}
                     className={`input-field ${errors.department ? 'border-red-500' : ''} ${!formData.assignee ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                     disabled={!formData.assignee} // 담당자가 선택되지 않으면 비활성화
                   >
                     <option value="">부서를 선택하세요</option>
                     {formData.assignee && (() => {
                       const selectedUser = state.users.find(user => user.name === formData.assignee);
                       return selectedUser ? selectedUser.departments.map((dept, index) => (
                         <option key={index} value={dept}>
                           {dept}
                         </option>
                       )) : null;
                     })()}
                   </select>
                   
                   {!formData.assignee && (
                     <p className="mt-1 text-sm text-gray-500">
                       담당자를 먼저 선택해주세요
                     </p>
                   )}
                   {formData.assignee && !formData.department && (
                     <p className="mt-1 text-sm text-blue-600">
                       {(() => {
                         const selectedUser = state.users.find(user => user.name === formData.assignee);
                         return selectedUser ? 
                           `${selectedUser.name}님의 부서를 선택해주세요 (${selectedUser.departments.join(', ')})` :
                           '담당자의 부서를 선택해주세요';
                       })()}
                     </p>
                   )}
                 </div>
               ) : (
                 // 직접 입력한 경우
                 <div>
                   <input
                     type="text"
                     value={formData.department}
                     onChange={(e) => handleInputChange('department', e.target.value)}
                     className={`input-field ${errors.department ? 'border-red-500' : ''}`}
                     placeholder="부서명을 직접 입력하세요"
                   />
                   <p className="mt-1 text-sm text-gray-500">
                     담당자와 함께 부서명을 직접 입력해주세요
                   </p>
                 </div>
               )}
               
               {errors.department && (
                 <p className="mt-1 text-sm text-red-600">{errors.department}</p>
               )}
             </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="input-field flex-1"
                    placeholder="태그를 입력하고 Enter를 누르세요"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn-secondary"
                  >
                    추가
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-primary-600 hover:text-primary-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">추가 정보</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="input-field"
              placeholder="추가적인 메모나 참고사항을 입력하세요"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            취소
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{isEditing ? '수정' : '등록'}</span>
          </button>
        </div>
      </form>

      {/* 맞춤 반복 설정 팝업 */}
      {showCustomRecurrence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">맞춤 반복 설정</h3>
              <button
                onClick={() => setShowCustomRecurrence(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 반복 모드 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">반복 모드</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recurrenceMode"
                      value="weekly"
                      checked={customRecurrence.mode === 'weekly'}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, mode: e.target.value as 'weekly' | 'monthly' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">주간 반복</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recurrenceMode"
                      value="monthly"
                      checked={customRecurrence.mode === 'monthly'}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, mode: e.target.value as 'weekly' | 'monthly' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">월간 반복</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recurrenceMode"
                      value="none"
                      checked={customRecurrence.mode === 'none'}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, mode: e.target.value as 'weekly' | 'monthly' | 'none' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 text-gray-500">설정 안함</span>
                  </label>
                </div>
              </div>

              {/* 반복 주기 (주간 모드일 때만 표시) */}
              {customRecurrence.mode === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">반복 주기</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">매</span>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={customRecurrence.interval}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">주마다</span>
                  </div>
                </div>
              )}

              {/* 반복 요일 (주간 또는 월간 모드일 때만 표시) */}
              {(customRecurrence.mode === 'weekly' || customRecurrence.mode === 'monthly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">반복 요일</label>
                  <div className="grid grid-cols-7 gap-1">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const newDayOfWeek = customRecurrence.dayOfWeek.includes(index)
                            ? customRecurrence.dayOfWeek.filter(d => d !== index)
                            : [...customRecurrence.dayOfWeek, index];
                          setCustomRecurrence(prev => ({ ...prev, dayOfWeek: newDayOfWeek }));
                        }}
                        className={`p-2 text-xs rounded ${
                          customRecurrence.dayOfWeek.includes(index)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 월간 반복 주기 (월간 모드일 때만 표시) */}
              {customRecurrence.mode === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월간 반복 주기</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">매</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={customRecurrence.monthlyInterval}
                      onChange={(e) => setCustomRecurrence(prev => ({ ...prev, monthlyInterval: parseInt(e.target.value) || 1 }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">개월마다</span>
                  </div>
                </div>
              )}

              {/* 월 중 주차 (월간 모드일 때만 표시) */}
              {customRecurrence.mode === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월 중 주차</label>
                  <select
                    value={customRecurrence.weekOfMonth}
                    onChange={(e) => setCustomRecurrence(prev => ({ ...prev, weekOfMonth: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value={1}>첫째주</option>
                    <option value={2}>둘째주</option>
                    <option value={3}>셋째주</option>
                    <option value={4}>넷째주</option>
                    <option value={5}>다섯째주</option>
                  </select>
                </div>
              )}

              {/* 년 중 월 (월간 모드일 때만 표시) */}
              {customRecurrence.mode === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">년 중 월</label>
                  <select
                    value={customRecurrence.monthOfYear}
                    onChange={(e) => setCustomRecurrence(prev => ({ ...prev, monthOfYear: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value={1}>1월</option>
                    <option value={2}>2월</option>
                    <option value={3}>3월</option>
                    <option value={4}>4월</option>
                    <option value={5}>5월</option>
                    <option value={6}>6월</option>
                    <option value={7}>7월</option>
                    <option value={8}>8월</option>
                    <option value={9}>9월</option>
                    <option value={10}>10월</option>
                    <option value={11}>11월</option>
                    <option value={12}>12월</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCustomRecurrence(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCustomRecurrenceSave}
                disabled={customRecurrence.dayOfWeek.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskForm;
