import { supabase } from '../../../supabase';

function isAdminRemovedProfessional(row) {
  return row?.status === 'inativo'
    && row?.motivo_inativo === 'excluido_admin'
    && !row?.user_id;
}

export function getPublicUrl(bucket, path) {
  if (!bucket || !path) return null;
  try {
    const stripped = path.replace(new RegExp(`^${bucket}/`), '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(stripped);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

export function normalizeAgRow(a) {
  return {
    ...a,
    data: a?.data ?? null,
    horario_inicio: a?.horario_inicio ?? null,
    horario_fim: a?.horario_fim ?? null,
    entregas: {
      nome: a?.entrega_nome ?? null,
      preco: a?.entrega_preco ?? null,
      preco_promocional: a?.entrega_promo ?? null,
    },
    profissionais: {
      id: a?.prof_id ?? null,
      nome: a?.prof_nome ?? null,
    },
    cliente: {
      id: a?.cliente_id_ref ?? null,
      nome: a?.cliente_nome ?? null,
      avatar_path: a?.cliente_avatar ?? null,
      type: a?.cliente_type ?? null,
    },
  };
}

export async function fetchOfficialDate(rpcNames) {
  let lastErr = null;

  for (const rpcName of rpcNames) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await supabase.rpc(rpcName);
      if (error) {
        lastErr = error;
        continue;
      }

      const payload = data?.[0] ?? data;
      if (!payload || !payload.date) {
        lastErr = new Error(`${rpcName} vazio`);
        continue;
      }

      return {
        ...payload,
        source: payload?.source || rpcName,
      };
    }
  }

  throw lastErr || new Error('Falha ao obter data oficial do banco');
}

export async function fetchOwnerBusinessCount(userId) {
  const { count, error } = await supabase
    .from('negocios')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  if (error) throw error;
  return Number(count || 0);
}

export async function fetchNegocioById(negocioId) {
  const { data, error } = await supabase
    .from('negocios')
    .select('*')
    .eq('id', negocioId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function fetchOwnerNegocio(ownerId) {
  const { data, error } = await supabase
    .from('negocios')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function fetchPartnerNegocioIds(userId) {
  const { data, error } = await supabase
    .from('profissionais')
    .select('negocio_id, created_at')
    .eq('user_id', userId)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return [...new Set((data || []).map((item) => item.negocio_id).filter(Boolean))];
}

export async function fetchGaleria(negocioId) {
  const { data, error } = await supabase
    .from('galerias')
    .select('id, path, ordem')
    .eq('negocio_id', negocioId)
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: true });

  return { data: data || [], error };
}

export async function fetchProfissionaisComStatus(negocioId) {
  const { data, error } = await supabase.rpc('get_profissionais_com_status', { p_negocio_id: negocioId });
  if (error) throw error;
  return (data || []).filter((row) => !isAdminRemovedProfessional(row));
}

export async function removeProfissionalSeguramente(profissionalId) {
  const { data, error } = await supabase.rpc('remove_profissional_seguro', { p_profissional_id: profissionalId });
  if (error) throw error;
  return data;
}

export async function fetchEntregas(negocioId, profissionalIds) {
  const { data, error } = await supabase
    .from('entregas')
    .select('*, profissionais (id, nome)')
    .eq('negocio_id', negocioId)
    .in('profissional_id', profissionalIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAgendamentosNegocio({
  negocioId,
  profissionalIds,
  dataInicio,
  dataFim = null,
  limit = null,
  offset = 0,
}) {
  const { data, error } = await supabase.rpc('get_agendamentos_negocio', {
    p_negocio_id: negocioId,
    p_profissional_ids: profissionalIds,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  return (data || []).map(normalizeAgRow);
}

export async function fetchDashboardToday(negocioId, profissionalId = null) {
  const params = { p_negocio_id: negocioId };
  if (profissionalId) params.p_profissional_id = profissionalId;
  const { data, error } = await supabase.rpc('get_dashboard_today', params);
  if (error) throw error;
  return data;
}

export async function fetchDashboardDay(negocioId, dateISO, profissionalId = null) {
  const params = { p_negocio_id: negocioId, p_date: dateISO };
  if (profissionalId) params.p_profissional_id = profissionalId;
  const { data, error } = await supabase.rpc('get_dashboard_day', params);
  if (error) throw error;
  return data;
}

export async function fetchDashboardPeriod(negocioId, refDateISO, periodo, profissionalId = null) {
  const params = { p_negocio_id: negocioId, p_ref_date: refDateISO, p_periodo: periodo };
  if (profissionalId) params.p_profissional_id = profissionalId;
  const { data, error } = await supabase.rpc('get_dashboard_period', params);
  if (error) throw error;
  return data;
}

export async function fetchDashboardUtilizacao(negocioId, refDateISO, profissionalId = null) {
  const params = { p_negocio_id: negocioId, p_ref_date: refDateISO, p_periodo: 'amanha' };
  if (profissionalId) params.p_profissional_id = profissionalId;
  const { data, error } = await supabase.rpc('get_dashboard_utilizacao', params);
  if (error) throw error;
  return data;
}

export async function fetchDashboardFutureBookings(negocioId, refDateISO, profissionalId = null) {
  const params = { p_negocio_id: negocioId, p_ref_date: refDateISO, p_periodo: 'amanha' };
  if (profissionalId) params.p_profissional_id = profissionalId;
  const { data, error } = await supabase.rpc('get_dashboard_future_bookings', params);
  if (error) throw error;
  return data;
}
