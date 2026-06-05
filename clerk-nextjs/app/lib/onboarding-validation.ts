/**
 * STRYK Onboarding Validation Utilities
 * 
 * Provides validation logic and payload construction for the multi-step
 * onboarding flow.
 */

// ============================================================================
// Interfaces
// ============================================================================

export interface OnboardingFormState {
  fullName: string;
  username: string;
  position: string;
  secondaryPosition: string | null;
  strongFoot: "Left" | "Right";
  playStyle: string;
  avatarUrl: string | null;
  bio: string;
}

export interface PlayerCreatePayload {
  auth_user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  position: string;
  secondary_position: string | null;
  strong_foot: string;
  play_style: string;
  bio: string | null;
  rating: number;
}

// ============================================================================
// Constants
// ============================================================================

export const VALID_POSITIONS = [
  "GK",
  "LB",
  "CB",
  "RB",
  "CDM",
  "CM",
  "LM",
  "RM",
  "CAM",
  "LW",
  "RW",
  "ST",
  "CF",
  "LAM",
] as const;

export const VALID_PLAY_STYLES = [
  "Playmaker",
  "Dribbler",
  "Target Man",
  "Box-to-Box",
  "Sweeper",
  "Shot-stopper",
] as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates the form fields for a given step in the onboarding flow.
 * 
 * @param step - The current step number (1-5)
 * @param form - The current form state
 * @returns A record mapping field names to error messages. Empty object means valid.
 * 
 * Validation rules by step:
 * - Step 1: fullName (2-100 chars), username (3-40 chars, alphanumeric + dots/underscores)
 * - Step 2: position (must be in VALID_POSITIONS)
 * - Step 3: strongFoot ("Left" or "Right"), playStyle (must be in VALID_PLAY_STYLES)
 * - Steps 4-5: no required fields
 */
export function validateStep(
  step: number,
  form: OnboardingFormState
): Record<string, string> {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1:
      // Validate fullName
      if (!form.fullName || form.fullName.trim().length === 0) {
        errors.fullName = "Full name is required";
      } else if (form.fullName.length < 2) {
        errors.fullName = "Full name must be at least 2 characters";
      } else if (form.fullName.length > 100) {
        errors.fullName = "Full name must be at most 100 characters";
      }

      // Validate username
      if (!form.username || form.username.trim().length === 0) {
        errors.username = "Username is required";
      } else if (form.username.length < 3) {
        errors.username = "Username must be at least 3 characters";
      } else if (form.username.length > 40) {
        errors.username = "Username must be at most 40 characters";
      } else if (/\s/.test(form.username)) {
        errors.username = "Username cannot contain spaces";
      } else if (!/^[a-zA-Z0-9._]+$/.test(form.username)) {
        errors.username =
          "Username can only contain letters, numbers, dots, and underscores";
      } else if (form.username.startsWith(".") || form.username.endsWith(".")) {
        errors.username = "Username cannot start or end with a dot";
      }
      break;

    case 2:
      // Validate position
      if (!form.position || form.position.trim().length === 0) {
        errors.position = "Position is required";
      } else if (!VALID_POSITIONS.includes(form.position as any)) {
        errors.position = "Invalid position selected";
      }
      break;

    case 3:
      // Validate strongFoot
      if (form.strongFoot !== "Left" && form.strongFoot !== "Right") {
        errors.strongFoot = "Strong foot must be Left or Right";
      }

      // Validate playStyle
      if (!form.playStyle || form.playStyle.trim().length === 0) {
        errors.playStyle = "Play style is required";
      } else if (!VALID_PLAY_STYLES.includes(form.playStyle as any)) {
        errors.playStyle = "Invalid play style selected";
      }
      break;

    case 4:
    case 5:
      // No required fields for steps 4 and 5
      break;

    default:
      // Invalid step number
      break;
  }

  return errors;
}

// ============================================================================
// Payload Construction
// ============================================================================

/**
 * Builds the PlayerCreatePayload from the onboarding form state.
 * 
 * @param userId - The Clerk user ID (auth_user_id)
 * @param form - The completed onboarding form state
 * @returns A PlayerCreatePayload ready to be sent to POST /players/
 */
export function buildPayload(
  userId: string,
  form: OnboardingFormState
): PlayerCreatePayload {
  return {
    auth_user_id: userId,
    full_name: form.fullName,
    username: form.username,
    avatar_url: form.avatarUrl,
    position: form.position,
    secondary_position: form.secondaryPosition,
    strong_foot: form.strongFoot,
    play_style: form.playStyle,
    bio: form.bio || null,
    rating: 80, // Hardcoded initial rating for new players
  };
}
