import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import { ptBR } from '../feedback/messages/ptBR';

const msgs = ptBR.parceiroLogin;

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

export default function ParceiroLogin({ onLogin, suppressAuthRef, inRecovery: inRecoveryProp = false }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isRecovery, setIsRecovery] = useState(inRecoveryProp);
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryAlerta, setRecoveryAlerta] = useState(null);

  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setIsRecovery(!!inRecoveryProp);
  }, [inRecoveryProp]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setAlerta(null);
      }
    });
    return () => { data?.subscription?.unsubscribe?.(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerta(null);

    const emailClean = email.trim().toLowerCase();
    const slugClean = slug.trim().toLowerCase();

    if (!emailClean || !emailClean.includes('@')) return setAlerta(msgs.email_invalid);
    if (senha.length < 6) return setAlerta(msgs.senha_too_short);
    if (!slugClean) return setAlerta(msgs.slug_required);

    setLoading(true);
    if (suppressAuthRef) suppressAuthRef.current = true;

    try {
      const { data: negocio, error: negErr } = await supabase
        .from('negocios')
        .select('id')
        .eq('slug', slugClean)
        .maybeSingle();

      if (negErr) throw negErr;
      if (!negocio) return setAlerta(msgs.negocio_not_found);

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password: senha,
      });

      if (signInErr) {
        if (String(signInErr.message || '').toLowerCase().includes('invalid')) {
          return setAlerta(msgs.credentials_invalid);
        }
        throw signInErr;
      }

      const uid = signInData?.user?.id;
      if (!uid) throw new Error(msgs.auth_error.body);

      const { data: prof, error: profErr } = await supabase
        .from('profissionais')
        .select('id, status, negocio_id')
        .eq('negocio_id', negocio.id)
        .eq('user_id', uid)
        .maybeSingle();

      if (profErr) throw profErr;

      if (!prof) {
        await supabase.auth.signOut();
        return setAlerta(msgs.not_partner);
      }
      if (prof.status === 'pendente') {
        await supabase.auth.signOut();
        return setAlerta(msgs.pending_approval);
      }
      if (prof.status === 'inativo') {
        await supabase.auth.signOut();
        return setAlerta(msgs.access_inactive);
      }

      if (suppressAuthRef) suppressAuthRef.current = false;
      onLogin(signInData.user, 'professional');
      navigate('/dashboard', { state: { negocioId: negocio.id } });
    } catch (e) {
      setAlerta({ body: e?.message || msgs.unexpected_error.body, variant: 'erro' });
      await supabase.auth.signOut();
    } finally {
      if (suppressAuthRef) suppressAuthRef.current = false;
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (resetLoading) return;
    const emailClean = email.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setAlerta(msgs.reset_email_required);
      return;
    }
    setResetLoading(true);
    setAlerta(null);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailClean, {
        redirectTo: `${window.location.origin}/parceiro/login`,
      });
      if (resetErr) throw resetErr;
      setAlerta(msgs.reset_sent);
    } catch {
      setAlerta(msgs.reset_error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (recoveryLoading) return;
    setRecoveryAlerta(null);

    if (newPassword.length < 6) return setRecoveryAlerta(msgs.recovery_password_too_short);
    if (newPassword !== newPassword2) return setRecoveryAlerta(msgs.recovery_password_mismatch);

    setRecoveryLoading(true);
    try {
      const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
      if (upErr) throw upErr;
      await supabase.auth.signOut();
      setIsRecovery(false);
      setNewPassword('');
      setNewPassword2('');
      setAlerta(msgs.recovery_password_updated);
    } catch {
      setRecoveryAlerta(msgs.recovery_password_update_error);
    } finally {
      setRecoveryLoading(false);
    }
  };

  if (isRecovery) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/Comvaga Logo.png" alt="COMVAGA" className="h-20 w-auto object-contain mx-auto mb-4" />
            <h1 className="text-3xl font-normal text-white uppercase">Nova senha</h1>
            <p className="text-gray-500 text-sm mt-2 font-normal">Defina sua nova senha de acesso</p>
          </div>

          <div className="bg-dark-100 border border-gray-800 rounded-custom p-8">
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Confirmar nova senha</label>
                <input
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal"
                  required
                />
              </div>

              <Alerta msg={recoveryAlerta} />

              <button
                type="submit"
                disabled={recoveryLoading}
                className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {recoveryLoading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/Comvaga Logo.png" alt="COMVAGA" className="h-20 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-normal text-white uppercase">Login Parceiro</h1>
          <p className="text-gray-500 text-sm mt-2 font-normal">Acesse o painel do seu negócio agora</p>
        </div>

        <div className="bg-dark-100 border border-gray-800 rounded-custom p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Slug do negócio</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: barbearia-do-ze"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none transition-colors font-normal"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-xs text-primary hover:text-yellow-500 transition-colors disabled:opacity-50"
              >
                {resetLoading ? 'ENVIANDO...' : 'Esqueceu a senha?'}
              </button>
            </div>

            <Alerta msg={alerta} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6 font-normal">
          Ainda não tem cadastro?{' '}
          <Link to="/parceiro/login" className="text-primary hover:text-yellow-500 transition-colors">
            Solicitar acesso
          </Link>
        </p>
      </div>
    </div>
  );
}
