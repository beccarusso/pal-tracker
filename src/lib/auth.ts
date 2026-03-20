import { supabase } from "./supabase";

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: "google" });

export const signOut = () => supabase.auth.signOut();

export const getUser = () =>
  supabase.auth.getUser().then(({ data }) => data.user);