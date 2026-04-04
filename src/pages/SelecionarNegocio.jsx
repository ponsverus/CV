import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, LogOut, Plus } from 'lucide-react';
import { supabase } from '../supabase';

function getPublicUrl(bucket, path) {
  if (!bucket || !path) return null;
  try {
    const stripped = path.replace(new RegExp(`^${bucket}/`), '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(stripped);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

export default function SelecionarNegocio({ user, onLogout }) {
  const navigate = useNavigate();
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('negocios')
      .select('id, nome, slug, logo_path, tipo_negocio, endereco')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setNegocios(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!loading && negocios.length === 1) {
      navigate('/dashboard', { state: { negocioId: negocios[0].id }, replace: true });
    }
  }, [loading, negocios, navigate]);

  const handleSelecionar = (negocioId) => {
    navigate('/dashboard', { state: { negocioId }, replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-primary text-xl">CARREGANDO...</div>
        </div>
      </div>
    );
  }

  if (negocios.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-6">Nenhum negócio encontrado.</p>
          <button
            onClick={() => navigate('/criar-negocio')}
            className="px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button font-normal uppercase"
          >
            CRIAR NEGÓCIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/Comvaga Logo.png" alt="COMVAGA" className="h-16 w-auto object-contain" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-normal mb-2 tracking-wide">Qual negócio?</h1>
          <p className="text-gray-500 text-sm font-normal">Selecione o negócio que deseja gerenciar</p>
        </div>

        <div className="space-y-3 mb-6">
          {negocios.map((neg) => {
            const logoUrl = getPublicUrl('logos', neg.logo_path);
            return (
              <button
                key={neg.id}
                type="button"
                onClick={() => handleSelecionar(neg.id)}
                className="w-full flex items-center gap-4 p-4 bg-dark-100 border border-gray-800 hover:border-primary/50 hover:bg-dark-100/80 rounded-custom transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-custom overflow-hidden border border-gray-700 bg-dark-200 shrink-0 flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt={neg.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
                      <Award className="w-6 h-6 text-black" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-normal text-white group-hover:text-primary transition-colors truncate">{neg.nome}</div>
                  {neg.tipo_negocio && (
                    <div className="text-xs text-gray-500 uppercase mt-0.5">{neg.tipo_negocio}</div>
                  )}
                  {neg.endereco && (
                    <div className="text-xs text-gray-600 truncate mt-0.5">{neg.endereco}</div>
                  )}
                </div>
                <div className="text-gray-600 group-hover:text-primary transition-colors shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => navigate('/criar-negocio')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-normal uppercase tracking-normal hover:border-primary/70 hover:bg-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          CRIAR OUTRO NEGÓCIO
        </button>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-normal transition-colors"
          >
            <LogOut className="w-4 h-4" />
            SAIR
          </button>
        </div>
      </div>
    </div>
  );
}
