import { supabase } from '../../../supabase';

export const withTimeout = (promise, ms, label = 'timeout') => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout (${label}) em ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export function getPublicUrl(bucket, path) {
  if (!path) return null;
  try {
    const stripped = path.replace(new RegExp(`^${bucket}/`), '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(stripped);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

export async function fetchOfficialDate(rpcSequence) {
  let lastErr = null;

  for (const rpcName of rpcSequence) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { data, error } = await supabase.rpc(rpcName);
      if (error) {
        lastErr = error;
        continue;
      }

      const payload = data?.[0] ?? data;
      if (!payload?.date) {
        lastErr = new Error(`${rpcName} vazio`);
        continue;
      }

      return {
        ts: payload?.ts ?? null,
        dow: Number(payload?.dow ?? 0),
        date: String(payload.date),
        source: payload?.source || rpcName,
        minutes: Number(payload?.minutes ?? 0),
      };
    }
  }

  throw lastErr || new Error('Falha ao obter horario oficial');
}

export async function fetchVitrineNegocioBySlug(slug) {
  const { data, error } = await withTimeout(
    supabase.rpc('get_negocio_vitrine_by_slug', { p_slug: slug }),
    7000,
    'negocio'
  );
  if (error) throw error;
  return data?.[0] || null;
}

export async function fetchVitrineProfissionais(negocioId) {
  const { data, error } = await withTimeout(
    supabase.rpc('get_profissionais_vitrine', { p_negocio_id: negocioId }),
    7000,
    'profissionais'
  );
  if (error) throw error;
  return data || [];
}

export async function fetchVitrineEntregas(profissionalIds) {
  if (!profissionalIds.length) return [];
  const { data, error } = await withTimeout(
    supabase
      .from('entregas')
      .select('id, negocio_id, profissional_id, nome, duracao_minutos, preco, preco_promocional, ativo')
      .in('profissional_id', profissionalIds)
      .eq('ativo', true),
    7000,
    'entregas'
  );
  if (error) throw error;
  return data || [];
}

export async function fetchVitrineGaleria(negocioId) {
  const { data, error } = await withTimeout(
    supabase
      .from('galerias')
      .select('id, path, ordem')
      .eq('negocio_id', negocioId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true }),
    7000,
    'galerias'
  );
  if (error) throw error;
  return data || [];
}

export async function fetchVitrineDepoimentos(negocioId) {
  const { data, error } = await withTimeout(
    supabase.rpc('get_depoimentos_vitrine', { p_negocio_id: negocioId }),
    7000,
    'depoimentos'
  );
  if (error) throw error;
  return (data || []).map((d) => ({
    ...d,
    users: d.cliente_nome
      ? { nome: d.cliente_nome, avatar_path: d.cliente_avatar_path, type: d.cliente_type }
      : null,
    profissionais: d.profissional_nome ? { nome: d.profissional_nome } : null,
    entrega_nome: d.entrega_nome || null,
    agendamento_data: d.agendamento_data || null,
  }));
}

export async function fetchFavoritoNegocio({ clienteId, negocioId }) {
  const { data, error } = await withTimeout(
    supabase
      .from('favoritos')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'negocio')
      .eq('negocio_id', negocioId)
      .maybeSingle(),
    6000,
    'favorito'
  );
  if (error) throw error;
  return !!data;
}

export async function addFavoritoNegocio({ clienteId, negocioId }) {
  const { error } = await withTimeout(
    supabase
      .from('favoritos')
      .insert({ cliente_id: clienteId, tipo: 'negocio', negocio_id: negocioId, profissional_id: null }),
    6000,
    'favorito-insert'
  );
  if (error) throw error;
}

export async function removeFavoritoNegocio({ clienteId, negocioId }) {
  const { error } = await withTimeout(
    supabase
      .from('favoritos')
      .delete()
      .eq('cliente_id', clienteId)
      .eq('tipo', 'negocio')
      .eq('negocio_id', negocioId),
    6000,
    'favorito-delete'
  );
  if (error) throw error;
}

export async function createDepoimento(payload) {
  const { error } = await withTimeout(
    supabase.from('depoimentos').insert(payload),
    7000,
    'enviar-depoimento'
  );
  if (error) throw error;
}
