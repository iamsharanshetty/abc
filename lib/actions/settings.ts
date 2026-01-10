"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(updates: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Get existing profile to merge JSON
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("onboarding_answers")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    return { success: false, error: "Failed to fetch profile" };
  }

  // Ensure currentAnswers is an object (type guard)
  const currentAnswers =
    profile?.onboarding_answers &&
    typeof profile.onboarding_answers === "object"
      ? profile.onboarding_answers
      : {};

  // 2. Merge updates
  // We do a shallow merge of top-level keys.
  // If specific deep merging is needed, we should handle it per-key.
  const newAnswers = {
    ...(currentAnswers as Record<string, any>),
    ...(updates as Record<string, any>),
  };

  // 3. Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ onboarding_answers: newAnswers })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateProfileBasic(updates: {
  full_name?: string;
  website_url?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
