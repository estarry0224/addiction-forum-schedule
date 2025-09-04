import { createClient } from '@supabase/supabase-js';

// 환경 변수 안전하게 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// URL 유효성 검사 함수
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 환경 변수가 없거나 유효하지 않을 때 더미 클라이언트 생성
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
  console.warn('Missing or invalid Supabase environment variables. Please check your .env file or GitHub Secrets.');
  console.warn('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  
  // 개발 환경에서는 더미 클라이언트 사용
  if (import.meta.env.DEV) {
    console.warn('Running in development mode with mock client.');
    supabase = {
      auth: {
        signInWithPassword: () => Promise.resolve({ error: null }),
        signUp: () => Promise.resolve({ error: null }),
        signOut: () => Promise.resolve(),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null })
      })
    };
  } else {
    // 프로덕션에서는 오류 발생
    throw new Error('Supabase configuration is required for production deployment');
  }
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}

export { supabase };

// 데이터베이스 테이블 타입 정의
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          start_date: string;
          end_date: string;
          progress: number;
          assignee: string | null;
          department: string | null;
          tags: string[] | null;
          is_recurring: boolean | null;
          recurrence_pattern: any | null;
          next_due_date: string | null;
          last_completed_date: string | null;
          completed_instances: number | null;
          total_instances: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          start_date: string;
          end_date: string;
          progress?: number;
          assignee?: string | null;
          department?: string | null;
          tags?: string[] | null;
          is_recurring?: boolean | null;
          recurrence_pattern?: any | null;
          next_due_date?: string | null;
          last_completed_date?: string | null;
          completed_instances?: number | null;
          total_instances?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          start_date?: string;
          end_date?: string;
          progress?: number;
          assignee?: string | null;
          department?: string | null;
          tags?: string[] | null;
          is_recurring?: boolean | null;
          recurrence_pattern?: any | null;
          next_due_date?: string | null;
          last_completed_date?: string | null;
          completed_instances?: number | null;
          total_instances?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          departments: string[] | null;
          email: string | null;
          phone: string | null;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          departments?: string[] | null;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          departments?: string[] | null;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
