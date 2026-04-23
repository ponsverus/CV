import { useCallback, useEffect, useState } from 'react';
import {
  addFavoritoNegocio,
  createDepoimento,
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

  useEffect(() => {
    if (!user || userType !== 'client' || !negocioId) {
      setIsFavorito(false);
    }
  }, [negocioId, user, userType]);

  const checkFavorito = useCallback(async () => {
    if (!user || userType !== 'client' || !negocioId) {
      setIsFavorito(false);
      return false;
    }
    try {
      const favorito = await fetchFavoritoNegocio({ clienteId: user.id, negocioId });
      setIsFavorito(favorito);
      return favorito;
    } catch {
      setIsFavorito(false);
      return false;
    }
  }, [negocioId, user, userType]);

  const toggleFavorito = useCallback(async () => {
    if (!user || userType !== 'client' || !negocioId) return false;
    if (isFavorito) {
      await removeFavoritoNegocio({ clienteId: user.id, negocioId });
      setIsFavorito(false);
      return false;
    }
    await addFavoritoNegocio({ clienteId: user.id, negocioId });
    setIsFavorito(true);
    return true;
  }, [isFavorito, negocioId, user, userType]);

  const enviarDepoimento = useCallback(async () => {
    if (!user || userType !== 'client' || !negocioId) return false;
    setDepoimentoLoading(true);
    try {
      const payload = {
        cliente_id: user.id,
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
