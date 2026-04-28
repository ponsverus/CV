import { useCallback, useEffect, useState } from 'react';
import {
  addFavoritoNegocio,
  createDepoimento,
  fetchCurrentClienteId,
  fetchFavoritoNegocio,
  removeFavoritoNegocio,
} from '../api/vitrineApi';

export function useVitrineInteractions({
  user,
  userType,
  negocioId,
  depoimentoNota,
  depoimentoTexto,
  refreshDepoimentos,
}) {
  const [isFavorito, setIsFavorito] = useState(false);
  const [depoimentoLoading, setDepoimentoLoading] = useState(false);
  const [clienteId, setClienteId] = useState(null);

  useEffect(() => {
    if (!user || userType !== 'client' || !negocioId) {
      setIsFavorito(false);
      setClienteId(null);
    }
  }, [negocioId, user, userType]);

  const ensureClienteId = useCallback(async () => {
    if (!user || userType !== 'client') return null;
    if (clienteId) return clienteId;
    const currentClienteId = await fetchCurrentClienteId();
    setClienteId(currentClienteId);
    return currentClienteId;
  }, [clienteId, user, userType]);

  const checkFavorito = useCallback(async () => {
    if (!user || userType !== 'client' || !negocioId) {
      setIsFavorito(false);
      return false;
    }
    try {
      const currentClienteId = await ensureClienteId();
      if (!currentClienteId) return false;
      const favorito = await fetchFavoritoNegocio({ clienteId: currentClienteId, negocioId });
      setIsFavorito(favorito);
      return favorito;
    } catch {
      setIsFavorito(false);
      return false;
    }
  }, [ensureClienteId, negocioId, user, userType]);

  const toggleFavorito = useCallback(async () => {
    if (!user || userType !== 'client' || !negocioId) return false;
    const currentClienteId = await ensureClienteId();
    if (!currentClienteId) return false;
    if (isFavorito) {
      await removeFavoritoNegocio({ clienteId: currentClienteId, negocioId });
      setIsFavorito(false);
      return false;
    }
    await addFavoritoNegocio({ clienteId: currentClienteId, negocioId });
    setIsFavorito(true);
    return true;
  }, [ensureClienteId, isFavorito, negocioId, user, userType]);

  const enviarDepoimento = useCallback(async () => {
    if (!user || userType !== 'client' || !negocioId) return false;
    const currentClienteId = await ensureClienteId();
    if (!currentClienteId) return false;
    setDepoimentoLoading(true);
    try {
      const payload = {
        cliente_id: currentClienteId,
        tipo: 'negocio',
        nota: depoimentoNota,
        comentario: depoimentoTexto || null,
        negocio_id: negocioId,
        profissional_id: null,
      };
      await createDepoimento(payload);
      await refreshDepoimentos(negocioId);
      return true;
    } finally {
      setDepoimentoLoading(false);
    }
  }, [
    depoimentoNota,
    depoimentoTexto,
    negocioId,
    ensureClienteId,
    refreshDepoimentos,
    user,
    userType,
  ]);

  return {
    isFavorito,
    depoimentoLoading,
    checkFavorito,
    toggleFavorito,
    enviarDepoimento,
  };
}
