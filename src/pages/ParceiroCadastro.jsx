import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ParceiroCadastro({ onLogin }) {
  const navigate = useNavigate();

  const [nome,   setNome]   = useState('');
  const [email,  setEmail]  = useState('');
  const [senha,  setSenha]  = useState('');
  const [slug,   setSlug]   = useState('');
  const [loading, setLoading] = useState(false);
  const [erro,   setErro]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const nomeClean  = nome.trim().toUpperCase().replace(/\s+/g, ' ');
    const emailClean = email.trim().toLowerCase();
    const slugClean  = slug.trim().toLowerCase();

    if (!nomeClean)  return setErro('Informe seu nome.');
    if (!emailClean || !emailClean.includes('@')) return setErro('Email inválido.');
    if (senha.length < 6) return setErro('Senha deve ter ao menos 6 caracteres.');
    if (!slugClean)  return setErro('Informe o slug do negócio.');

    setLoading(true);
    try {
      const { data: negocio, error: negErr } = await supabase
        .from('negocios')
        .select('id, nome')
        .eq('slug', slugClean)
        .maybeSingle();

      if (negErr) throw negErr;
      if (!negocio) return setErro('Negócio não encontrado. Verifique o slug informado.');

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password: senha,
      });

      let uid;

      if (!signInErr && signInData?.user) {
        uid = signInData.user.id;
        const { data: prof } = await supabase
          .from('profissionais')
          .select('id, status')
          .eq('negocio_id', negocio.id)
          .eq('user_id', uid)
          .maybeSingle();

        if (!prof) {
          await supabase.auth.signOut();
          return setErro('Você não é parceiro deste negócio.');
        }
        if (prof.status === 'pendente') {
          await supabase.auth.signOut();
          return setErro('Seu acesso ainda não foi aprovado pelo responsável do negócio.');
        }
        if (prof.status === 'inativo') {
          await supabase.auth.signOut();
          return setErro('Seu acesso está inativo. Entre em contato com o responsável.');
        }

        onLogin(signInData.user, 'professional');
        navigate('/dashboard', { state: { negocioId: negocio.id } });
        return;
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailClean,
        password: senha,
      });

      if (signUpErr) throw signUpErr;
      uid = signUpData?.user?.id;
      if (!uid) throw new Error('Falha ao criar conta. Tente novamente.');

      let perfil = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase
          .from('users')
          .select('id, type')
          .eq('id', uid)
          .maybeSingle();
        if (data?.id) { perfil = data; break; }
        await sleep(400);
      }

      if (perfil && perfil.type !== 'professional') {
        await supabase.from('users').update({ type: 'professional', nome: nomeClean }).eq('id', uid);
      } else if (perfil) {
        await supabase.from('users').update({ nome: nomeClean }).eq('id', uid);
      }

      const { error: profErr } = await supabase.from('profissionais').insert({
        negocio_id:      negocio.id,
        user_id:         uid,
        nome:            nomeClean,
        email:           emailClean,
        status:          'pendente',
        ativo:           false,
        horario_inicio:  '08:00',
        horario_fim:     '18:00',
        dias_trabalho:   [1, 2, 3, 4, 5, 6],
      });

      if (profErr) {
        if (!String(profErr.message || '').includes('duplicate')) throw profErr;
      }

      await supabase.auth.signOut();
      setErro('');
      setNome(''); setEmail(''); setSenha(''); setSlug('');
      alert('Solicitação enviada! Aguarde a aprovação do responsável pelo negócio.');

    } catch (e) {
      console.error('ParceiroCadastro error:', e);
      setErro(e?.message || 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-2xl font-normal">C</span>
          </div>
          <h1 className="text-3xl font-normal text-white uppercase">Acesso Parceiro</h1>
          <p className="text-gray-500 text-sm mt-2">
            Cadastro e login em uma só etapa
          </p>
        </div>

        <div className="bg-dark-100 border border-gray-800 rounded-custom p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Seu nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Slug do negócio</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: barbearia-do-ze"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-600 mt-1">Fornecido pelo responsável do negócio</p>
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-custom px-4 py-3 text-red-400 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? 'VERIFICANDO...' : 'ENTRAR / CADASTRAR'}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Se for a primeira vez, seu cadastro será enviado para aprovação.
        </p>

      </div>
    </div>
  );
}
