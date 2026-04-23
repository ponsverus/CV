import { supabase } from '../../../supabase';

export async function fetchReviewedBookings(agendamentoIds) {
  const ids = Array.isArray(agendamentoIds) ? agendamentoIds.filter(Boolean) : [];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('depoimentos')
    .select('id, agendamento_id')
    .in('agendamento_id', ids);

  if (error) throw error;
  return data || [];
}

export async function createBookingReview({ agendamentoId, nota, comentario }) {
  const { data, error } = await supabase.rpc('create_depoimento_agendamento', {
    p_agendamento_id: agendamentoId,
    p_nota: nota,
    p_comentario: comentario ?? null,
  });

  if (error) throw error;
  return data;
}
