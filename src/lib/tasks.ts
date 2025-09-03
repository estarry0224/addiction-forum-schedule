import { supabase } from "./supabase";

export async function listTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addTask(title: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase.from("tasks").insert({
    title,
    user_id: user.id,
  });
  if (error) throw error;
}
