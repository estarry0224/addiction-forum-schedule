import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경 변수가 없을 때 더미 클라이언트 생성
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Creating mock client.');
  // 더미 클라이언트 생성 (실제 Supabase 없이도 앱이 작동하도록)
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
  supabase = createClient(supabaseUrl, supabaseAnonKey);
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
