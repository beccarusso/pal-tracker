import { supabase } from "./supabase";

export const loadPals = async (userId: string) => {
  const { data, error } = await supabase
    .from("pals")
    .select("data")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data?.data ?? null;
};

export const savePals = async (userId: string, pals: unknown) => {
  const { error } = await supabase
    .from("pals")
    .upsert({ user_id: userId, data: pals, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) throw error;
};