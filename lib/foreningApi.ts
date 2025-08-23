// lib/foreningApi.ts
import { supabase } from "../utils/supabase";
import { Foreningsmedlem } from "../types/forening";

/**
 * Henter medlemmer for en bestemt forening
 * @param foreningId string
 */
export async function fetchMedlemmer(foreningId: string): Promise<Foreningsmedlem[]> {
  const { data, error } = await supabase
    .from("foreningsmedlemmer")
    .select("*, users(name, email, avatar_url)")
    .eq("forening_id", foreningId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fejl ved hentning af medlemmer:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Eksempel på fremtidig funktion – hent foreningens info
 */
export async function fetchForening(foreningId: string) {
  const { data, error } = await supabase
    .from("foreninger")
    .select("*")
    .eq("id", foreningId)
    .single();

  if (error) {
    console.error("Fejl ved hentning af forening:", error.message);
    return null;
  }

  return data;
}