import { useState } from "react";
import { signIn, signUp } from "../lib/auth";
import { listTasks, addTask } from "../lib/tasks";

export default function TaskPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  return (
    <div>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
      <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="password" />
      <button onClick={async ()=>{
        await signUp(email, pw);
        alert("가입 완료. 로그인 해주세요.");
      }}>회원가입</button>
      <button onClick={async ()=>{
        await signIn(email, pw);
        setTasks(await listTasks());
      }}>로그인</button>

      <form onSubmit={async e=>{
        e.preventDefault();
        await addTask(title);
        setTitle("");
        setTasks(await listTasks());
      }}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" />
        <button>추가</button>
      </form>

      <ul>
        {tasks.map(t => <li key={t.id}>{t.title}</li>)}
      </ul>
    </div>
  );
}
