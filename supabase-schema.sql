-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  departments TEXT[],
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 업무 테이블
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  assignee VARCHAR(255),
  department VARCHAR(100),
  tags TEXT[],
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,
  next_due_date DATE,
  last_completed_date DATE,
  completed_instances INTEGER DEFAULT 0,
  total_instances INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (개발용)
CREATE POLICY "Enable all operations for all users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON tasks FOR ALL USING (true);

-- 샘플 데이터 삽입
INSERT INTO users (name, departments, email, role) VALUES
('관리자', ARRAY['IT', '관리'], 'admin@addiction-forum.org', 'admin'),
('김철수', ARRAY['개발'], 'kim@addiction-forum.org', 'user'),
('이영희', ARRAY['기획'], 'lee@addiction-forum.org', 'user');

INSERT INTO tasks (title, description, status, priority, start_date, end_date, progress, assignee, department) VALUES
('웹사이트 리뉴얼', '중독포럼 웹사이트 전면 리뉴얼 프로젝트', 'in_progress', 'high', '2024-01-15', '2024-03-15', 65, '김철수', '개발'),
('교육 프로그램 기획', '새로운 중독 예방 교육 프로그램 기획', 'pending', 'medium', '2024-02-01', '2024-04-30', 0, '이영희', '기획'),
('데이터베이스 마이그레이션', '기존 데이터베이스를 새로운 시스템으로 이전', 'completed', 'high', '2024-01-01', '2024-01-31', 100, '김철수', 'IT'),
('사용자 매뉴얼 작성', '새 시스템 사용자 매뉴얼 작성', 'in_progress', 'low', '2024-02-15', '2024-03-31', 30, '이영희', '기획');
