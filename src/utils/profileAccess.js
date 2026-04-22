import { supabase } from '../supabase';

const PROFILE_TABLE = 'users';

export const isValidType = (t) => t === 'client' || t === 'professional';
export const isValidOnboardingStatus = (s) => s === 'pending' || s === 'completed';

export function normalizeOnboardingStatus(type, onboardingStatus) {
  if (type !== 'professional') return 'completed';
  return isValidOnboardingStatus(onboardingStatus) ? onboardingStatus : 'pending';
}

function getProfessionalAccessState(statuses, onboardingStatus) {
  const hasPending = statuses.includes('pendente');
  const hasActive = statuses.includes('ativo');

  if (hasPending && !hasActive) return 'partner_pending';
  if (normalizeOnboardingStatus('professional', onboardingStatus) === 'pending' && !hasActive && !hasPending) {
    return 'owner_resume';
  }
  return 'active';
}

export async function fetchUserAccessProfile(userId) {
  try {
    const { data, error } = await supabase.rpc('get_user_access_profile');
    if (!error && data && isValidType(data.type)) {
      const onboardingStatus = data.onboardingStatus ?? data.onboarding_status;
      return {
        type: data.type,
        onboardingStatus: normalizeOnboardingStatus(data.type, onboardingStatus),
        accessState: data.accessState || 'active',
      };
    }
  } catch {
    // Fallback para a leitura direta atual enquanto o novo contrato estabiliza.
  }

  const { data: userData, error: userError } = await supabase
    .from(PROFILE_TABLE)
    .select('type, onboarding_status')
    .eq('id', userId)
    .maybeSingle();

  if (userError) throw userError;

  const type = userData?.type;
  if (!isValidType(type)) return null;

  if (type !== 'professional') {
    return {
      type,
      onboardingStatus: 'completed',
      accessState: 'active',
    };
  }

  const { data: professionalRows, error: professionalError } = await supabase
    .from('profissionais')
    .select('status')
    .eq('user_id', userId);

  if (professionalError) throw professionalError;

  const statuses = (professionalRows || []).map((row) => String(row.status || '').trim().toLowerCase());
  const onboardingStatus = normalizeOnboardingStatus(type, userData?.onboarding_status);

  return {
    type,
    onboardingStatus,
    accessState: getProfessionalAccessState(statuses, onboardingStatus),
  };
}
