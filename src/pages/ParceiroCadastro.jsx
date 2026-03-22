import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ParceiroCadastro({ suppressAuthRef }) {
  const navigate = useNavigate();

  const [nome,      setNome]      = useState('');
  const [email,     setEmail]     = useState('');
  const [senha,     setSenha]     = useState('');
  const [slug,      setSlug]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [erro,      setErro]      = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const nomeClean  = nome.trim().toUpperCase().replace(/\s+/g, ' ');
    const emailClean = email.trim().toLowerCase();
    const slugClean  = slug.trim().toLowerCase();

    if (!nomeClean)                               return setErro('Informe seu nome.');
    if (!emailClean || !emailClean.includes('@')) return setErro('Email inválido.');
    if (senha.length < 6)                         return setErro('Senha deve ter ao menos 6 caracteres.');
    if (!slugClean)                               return setErro('Informe o slug do negócio.');

    setLoading(true);
    if (suppressAuthRef) suppressAuthRef.current = true;

    try {
      const { data: negocio, error: negErr } = await supabase
        .from('negocios')
        .select('id, nome')
        .eq('slug', slugClean)
        .maybeSingle();

      if (negErr) throw negErr;
      if (!negocio) return setErro('Negócio não encontrado. Verifique o slug informado.');

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailClean,
        password: senha,
      });

      if (signUpErr) {
        if (String(signUpErr.message || '').toLowerCase().includes('already')) {
          return setErro('Este email já possui uma conta. Use a página de login de parceiro.');
        }
        throw signUpErr;
      }

      const uid = signUpData?.user?.id;
      if (!uid) throw new Error('Falha ao criar conta. Tente novamente.');

      const { data: profExiste } = await supabase
        .from('profissionais')
        .select('id, status')
        .eq('negocio_id', negocio.id)
        .eq('user_id', uid)
        .maybeSingle();

      if (profExiste) {
        await supabase.auth.signOut();
        if (profExiste.status === 'pendente') return setErro('Você já tem um cadastro aguardando aprovação neste negócio.');
        if (profExiste.status === 'ativo')    return setErro('Você já está cadastrado. Use a página de login.');
        if (profExiste.status === 'inativo')  return setErro('Seu acesso está inativo. Entre em contato com o responsável.');
      }

      for (let i = 0; i < 6; i++) {
        const { data } = await supabase.from('users').select('id, type').eq('id', uid).maybeSingle();
        if (data?.id) {
          await supabase.from('users').update({ nome: nomeClean, type: 'professional' }).eq('id', uid);
          break;
        }
        await sleep(400);
      }

      const { error: profErr } = await supabase.from('profissionais').insert({
        negocio_id:     negocio.id,
        user_id:        uid,
        nome:           nomeClean,
        status:         'pendente',
        horario_inicio: '08:00',
        horario_fim:    '18:00',
        dias_trabalho:  [1, 2, 3, 4, 5, 6],
      });

      if (profErr) throw profErr;

      await supabase.auth.signOut();

      setShowAlert(true);

    } catch (e) {
      console.error('ParceiroCadastro error:', e);
      setErro(e?.message || 'Erro inesperado. Tente novamente.');
      await supabase.auth.signOut();
    } finally {
      if (suppressAuthRef) suppressAuthRef.current = false;
      setLoading(false);
    }
  };

  if (showAlert) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-400 text-4xl">✓</span>
          </div>
          <h1 className="text-3xl font-normal text-white uppercase mb-4">Cadastro enviado!</h1>
          <p className="text-gray-400 font-normal mb-8">
            Aguarde a aprovação do responsável pelo negócio para acessar o painel.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-2xl font-normal">C</span>
          </div>
          <h1 className="text-3xl font-normal text-white uppercase">Cadastro Parceiro</h1>
          <p className="text-gray-500 text-sm mt-2 font-normal">Solicite acesso ao negócio</p>
        </div>

        <div className="bg-dark-100 border border-gray-800 rounded-custom p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Seu nome</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal" required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal" required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Crie uma senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal" required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Slug do negócio</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: barbearia-do-ze"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal" required />
              <p className="text-xs text-gray-600 mt-1 font-normal">Fornecido pelo responsável do negócio</p>
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-custom px-4 py-3 text-red-400 text-sm font-normal">
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'ENVIANDO...' : 'SOLICITAR ACESSO'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6 font-normal">
          Já aprovado?{' '}
          <Link to="/parceiro/login" className="text-primary hover:text-yellow-500 transition-colors">
            Fazer login
          </Link>
        </p>

      </div>
    </div>
  );
}
