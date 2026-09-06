import { supabase } from '../supabase';

export const isValidType = (t) => t === 'client' || t === 'professional';
export const isValidOnboardingStatus = (s) => s === 'pending' || s === 'completed';
export const isValidProfessionalRole = (s) => s === 'owner' || s === 'partner';
export const isValidAccessState = (s) => s === 'active' || s === 'owner_resume' || s === 'partner_pending';

export function normalizeOnboardingStatus(type, onboardingStatus) {
  if (type !== 'professional') return 'completed';
  return isValidOnboardingStatus(onboardingStatus) ? onboardingStatus : 'pending';
}

function normalizeProfessionalRole(value) {
  return isValidProfessionalRole(value) ? value : null;
}

export async function fetchUserAccessProfile() {
  const { data, error } = await supabase.rpc('get_user_access_profile');
  if (error) throw error;
  if (!data) return null;

  const type = data.type;
  if (!isValidType(type)) return null;

  const onboardingStatus = data.onboardingStatus ?? data.onboarding_status;
  const professionalRole = data.professionalRole ?? data.professional_role;
  const accessState = data.accessState ?? data.access_state;

  if (!isValidAccessState(accessState)) {
    throw new Error('invalid_user_access_profile_contract');
  }

  return {
    type,
    professionalRole: normalizeProfessionalRole(professionalRole),
    onboardingStatus: normalizeOnboardingStatus(type, onboardingStatus),
    accessState,
  };
}
