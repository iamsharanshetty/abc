// lib/actions/user.ts - User Management Actions
"use server";

<<<<<<< HEAD
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
=======
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { revalidatePath } from "next/cache";
>>>>>>> chat-backup

/**
 * Save onboarding data for a user
 */
export async function saveOnboardingData(data: {
  domain_occupation: string;
  project_idea: string;
  referral_source: string;
  onboarding_answers?: Array<{
    question_id: string;
    answer: string;
  }>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

<<<<<<< HEAD
    // Upsert profile (create if missing)
    const { error } = await (supabase
        .from('profiles') as any)
        .upsert({
            id: user.id, // Required for upsert
            email: user.email, // Good practice to ensure email is set
            domain_occupation: data.domain_occupation,
            project_idea: data.project_idea,
            referral_source: data.referral_source,
            onboarding_answers: data.onboarding_answers,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error saving profile:', error)
        throw new Error('Failed to save profile data: ' + error.message)
    }

    console.log("Successfully updated profile for user:", user.id, "with data:", data);

    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');
    return { success: true }
=======
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from("profiles")
        .update({
          domain_occupation: data.domain_occupation,
          project_idea: data.project_idea,
          referral_source: data.referral_source,
          onboarding_completed: true,
          onboarding_answers: data.onboarding_answers || [],
        } as any)
        .eq("id", user.id);

      if (error) {
        logger.error("Error updating profile", { error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      // Create new profile
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email || "",
        domain_occupation: data.domain_occupation,
        project_idea: data.project_idea,
        referral_source: data.referral_source,
        onboarding_completed: true,
        onboarding_answers: data.onboarding_answers || [],
      } as any);

      if (error) {
        logger.error("Error creating profile", { error: error.message });
        return { success: false, error: error.message };
      }
    }

    logger.info("Onboarding data saved", { userId: user.id });

    return { success: true };
  } catch (error) {
    logger.error("Exception in saveOnboardingData", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save data",
    };
  }
}

/**
 * Get user profile
 */
export async function getUserProfile() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      logger.error("Error fetching profile", { error: error.message });
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Exception in getUserProfile", { error });
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: {
  full_name?: string;
  avatar_url?: string;
  company?: string;
  website?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates as any)
      .eq("id", user.id);

    if (error) {
      logger.error("Error updating profile", { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info("Profile updated", { userId: user.id });

    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (error) {
    logger.error("Exception in updateUserProfile", { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
>>>>>>> chat-backup
}
