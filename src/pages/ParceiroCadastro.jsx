import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { ptBR } from '../feedback/messages/ptBR';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const msgs = ptBR.parceiroCadastro;

function Alerta({ msg }) {
  if (!msg) return null;
  const estilos = {
    erro: 'bg-red-500/10 border-red-500/30 text-red-400',
    aviso: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    sucesso: 'bg-green-500/10 border-green-500/30 text-green-400',
  };
  const classe = estilos[msg.variant] || estilos.erro;
  return (
    <div className={`border rounded-custom px-4 py-3 text-sm font-normal ${classe}`}>
      {msg.body}
    </div>
  );
}

function FieldRow({ label, children, last = false }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${last ? '' : 'border-b border-gray-800'}`}>
      <label className="w-[82px] shrink-0 text-sm tracking-wide text-gray-500">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const fieldInputClass = 'w-full bg-transparent px-0 py-2 text-sm text-white placeholder-gray-600 outline-none focus:text-white';

export default function ParceiroCadastro({ suppressAuthRef }) {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerta(null);

    const nomeClean = nome.trim().toUpperCase().replace(/\s+/g, ' ');
    const emailClean = email.trim().toLowerCase();
    const slugClean = slug.trim().toLowerCase();

    if (!nomeClean) return setAlerta(msgs.nome_required);
    if (!emailClean || !emailClean.includes('@')) return setAlerta(msgs.email_invalid);
    if (senha.length < 6) return setAlerta(msgs.senha_too_short);
    if (!slugClean) return setAlerta(msgs.slug_required);

    setLoading(true);
    if (suppressAuthRef) suppressAuthRef.current = true;

    try {
      const { data: signupStatus, error: signupStatusErr } = await supabase.rpc('get_partner_signup_context', {
        p_slug: slugClean,
      });

      if (signupStatusErr) throw signupStatusErr;
      if (signupStatus?.status === 'negocio_not_found') return setAlerta(msgs.negocio_not_found);
      if (signupStatus?.status !== 'available' || !signupStatus?.negocio_id) {
        throw new Error(msgs.unexpected_error.body);
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailClean,
        password: senha,
        options: {
          data: {
            nome: nomeClean,
            type: 'professional',
          },
        },
      });

      if (signUpErr) {
        if (String(signUpErr.message || '').toLowerCase().includes('already')) {
          return setAlerta(msgs.access_unavailable);
        }
        throw signUpErr;
      }

      const uid = signUpData?.user?.id;
      if (!uid) throw new Error(msgs.account_create_error.body);

      let userReady = false;
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase.from('users').select('id').eq('id', uid).maybeSingle();
        if (data?.id) {
          userReady = true;
          break;
        }
        await sleep(400);
      }

      if (!userReady) {
        await supabase.auth.signOut();
        throw new Error(msgs.account_create_error.body);
      }

      const { error: profErr } = await supabase.rpc('solicitar_acesso_parceiro', {
        p_negocio_id: signupStatus.negocio_id,
        p_nome: nomeClean,
      });

      if (profErr) {
        await supabase.auth.signOut();
        throw profErr;
      }

      await supabase.auth.signOut();
      setShowAlert(true);
    } catch (e) {
      setAlerta({ body: e?.message || msgs.unexpected_error.body, variant: 'erro' });
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
            <span className="text-green-400 text-2xl font-normal">:)</span>
          </div>
          <h1 className="text-3xl font-normal text-white uppercase mb-4">{msgs.success_title}</h1>
          <p className="text-gray-400 font-normal mb-8">{msgs.success_body}</p>
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
          <img src="/Comvaga Logo.png" alt="COMVAGA" className="h-20 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-normal text-white uppercase">CADASTRO PARCEIRO</h1>
          <p className="text-gray-500 text-sm mt-2 font-normal">SOLICITE ACESSO AO NEGÓCIO</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="overflow-hidden rounded-custom border border-gray-800 bg-dark-100">
            <FieldRow label="NOME">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value.toUpperCase())}
                placeholder="NOME COMPLETO"
                className={`${fieldInputClass} uppercase`}
                required
              />
            </FieldRow>

            <FieldRow label="E-MAIL">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="SEU E-MAIL"
                className={fieldInputClass}
                required
              />
            </FieldRow>

            <FieldRow label="SENHA">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="MÍNIMO 6 CARACTERES"
                className={fieldInputClass}
                required
              />
            </FieldRow>

            <FieldRow label="SLUG" last>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="SLUG DO NEGÓCIO"
                className={fieldInputClass}
                required
              />
            </FieldRow>
          </div>

          <Alerta msg={alerta} />

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'ENVIANDO...' : 'SOLICITAR ACESSO'}
            </button>

            <Link
              to="/parceiro/login"
              className="flex w-full items-center justify-center rounded-button border border-primary/30 bg-transparent py-3 text-sm font-normal uppercase tracking-wider text-primary transition-all hover:border-primary hover:text-yellow-500"
            >
              FAZER LOGIN
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
