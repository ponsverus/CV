import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';
import { CrownIcon } from '../components/icons';

const PROFILE_TABLE = 'users';
const isValidType = (t) => t === 'client' || t === 'professional';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchProfileTypeWithRetry(userId) {
  const delays = [200, 300, 400, 500, 600, 600, 700, 800];

  for (let i = 0; i < delays.length; i++) {
    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select('type')
      .eq('id', userId)
      .maybeSingle();

    if (!error && isValidType(data?.type)) return data.type;
    await sleep(delays[i]);
  }

  return null;
}

function onlyTrim(v) {
  return String(v || '').trim();
}

function montarEnderecoUnico({ rua, numero, cidade, estado }) {
  const r = onlyTrim(rua);
  const n = onlyTrim(numero);
  const c = onlyTrim(cidade);
  const e = onlyTrim(estado);
  return `${r}, ${n} - ${c}, ${e}`;
}

async function clearSignupSession() {
  try {
    await supabase.auth.signOut();
  } catch {}
}

function SignupFieldRow({ label, children, last = false }) {
  return (
    <div className={`flex items-start gap-3 px-5 py-3 ${last ? '' : 'border-b border-gray-800/50'}`}>
      <label className="w-[96px] shrink-0 py-2 text-sm tracking-wide text-white">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SplitRow({ children, last = false }) {
  return (
    <div className={`grid grid-cols-2 ${last ? '' : 'border-b border-gray-800/50'}`}>
      {children}
    </div>
  );
}

function SplitField({ label, children, divider = false }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${divider ? 'border-r border-gray-800/50' : ''}`}>
      <label className="w-[62px] shrink-0 text-sm tracking-wide text-white">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const fieldInputClass = 'w-full bg-transparent px-0 py-2 text-sm text-white placeholder-gray-600 outline-none focus:text-white';

export default function SignupProfessional({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    telefone: '',
    nomeNegocio: '',
    urlNegocio: '',
    tipoNegocio: '',
    anosExperiencia: '',
    rua: '',
    numero: '',
    cidade: '',
    estado: '',
  });

  const navigate = useNavigate();
  const { showMessage } = useFeedback();

  const generateSlug = (text) => {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNegocioNameChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      nomeNegocio: value,
      urlNegocio: generateSlug(value),
    }));
  };

  const validarEnderecoCompleto = () => {
    const rua = onlyTrim(formData.rua);
    const numero = onlyTrim(formData.numero);
    const cidade = onlyTrim(formData.cidade);
    const estado = onlyTrim(formData.estado);

    if (!rua) return 'signupProfessional.address_street_required';
    if (!numero) return 'signupProfessional.address_number_required';
    if (!cidade) return 'signupProfessional.address_city_required';
    if (!estado) return 'signupProfessional.address_state_required';
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const nome = onlyTrim(formData.nome);
      const email = onlyTrim(formData.email).toLowerCase();
      const password = String(formData.password || '');
      const telefone = onlyTrim(formData.telefone);

      const nomeNegocio = onlyTrim(formData.nomeNegocio);
      const slug = onlyTrim(formData.urlNegocio);
      const tipoNegocio = onlyTrim(formData.tipoNegocio);
      const anosExperiencia = parseInt(String(formData.anosExperiencia || ''), 10) || 0;

      if (!nome) { showMessage('signupProfessional.name_required'); return; }
      if (!telefone) { showMessage('signupProfessional.phone_required'); return; }
      if (!email || !email.includes('@')) { showMessage('signupProfessional.email_invalid'); return; }
      if (password.length < 7) { showMessage('signupProfessional.password_too_short'); return; }
      if (!nomeNegocio) { showMessage('signupProfessional.business_name_required'); return; }
      if (!slug || slug.length < 3) { showMessage('signupProfessional.business_slug_invalid'); return; }
      if (!tipoNegocio) { showMessage('signupProfessional.business_type_required'); return; }
      if (anosExperiencia < 0) { showMessage('signupProfessional.experience_invalid'); return; }

      const enderecoKey = validarEnderecoCompleto();
      if (enderecoKey) { showMessage(enderecoKey); return; }

      const enderecoUnico = montarEnderecoUnico({
        rua: formData.rua,
        numero: formData.numero,
        cidade: formData.cidade,
        estado: formData.estado,
      });

      const { data: existingNegocio, error: slugError } = await supabase
        .rpc('get_negocio_vitrine_by_slug', { p_slug: slug });

      if (slugError) throw slugError;
      if (existingNegocio?.[0]) { showMessage('signupProfessional.business_slug_taken'); return; }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { type: 'professional', nome } },
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('Usuario nao retornado pelo Supabase.');

      if (!authData.session) {
        showMessage('signupProfessional.confirm_email_needed');
        navigate('/login');
        return;
      }

      const sessionUser = authData.user;
      const userId = sessionUser.id;

      const dbType = await fetchProfileTypeWithRetry(userId);

      if (!dbType) { showMessage('signupProfessional.profile_not_created'); return; }
      if (dbType !== 'professional') { showMessage('signupProfessional.profile_wrong_type'); return; }

      const invokeSignupProfessional = async () => supabase.functions.invoke('signup-professional', {
        body: {
          nome_usuario: nome,
          nome_negocio: nomeNegocio,
          slug,
          telefone,
          endereco: enderecoUnico,
          tipo_negocio: tipoNegocio,
          nome_prof: nome,
          profissao: tipoNegocio,
          anos_experiencia: anosExperiencia,
          horario_inicio: '08:00',
          horario_fim: '18:00',
          dias_trabalho: [1, 2, 3, 4, 5, 6],
        },
      });

      let fnData = null;
      let fnError = null;

      for (let i = 0; i < 4; i++) {
        const { data, error } = await invokeSignupProfessional();
        fnData = data;
        fnError = error;

        if (!error) break;
        if (error?.context?.status !== 404) break;

        const code = await error.context.json().catch(() => null);
        if (code?.error !== 'usuario_nao_encontrado') break;

        await sleep(350);
      }

      if (fnError) {
        const payload = await fnError.context?.json?.().catch(() => null);
        const code = payload?.error || '';

        if (code === 'slug_indisponivel') {
          await clearSignupSession();
          showMessage('signupProfessional.business_slug_taken');
          return;
        }
        if (code === 'usuario_nao_encontrado') {
          onLogin(sessionUser, 'professional', 'pending');
          showMessage('signupProfessional.profile_not_created');
          navigate('/cadastro/profissional/retomada');
          return;
        }
        if (code === 'horario_invalido' || code === 'dias_trabalho_invalidos') {
          await clearSignupSession();
          showMessage('signupProfessional.professional_create_error');
          return;
        }

        console.error('signup-professional edge error:', fnError, payload);
        await clearSignupSession();
        showMessage('signupProfessional.business_create_error');
        return;
      }

      if (!fnData?.negocio_id || !fnData?.profissional_id) {
        console.error('signup-professional edge returned incomplete payload:', fnData);
        await clearSignupSession();
        showMessage('signupProfessional.business_create_error');
        return;
      }

      onLogin(sessionUser, 'professional', 'completed');
      navigate('/dashboard');
    } catch (err) {
      console.error('SignupProfessional error:', err);
      showMessage('alerts.action_failed_support');
      try { await supabase.auth.signOut(); } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <Link
          to="/cadastro"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-12 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-normal tracking-wider">VOLTAR</span>
        </Link>

        <div className="flex justify-center mb-8">
          <img
            src="/Comvaga Logo.png"
            alt="COMVAGA"
            className="h-24 w-auto object-contain"
          />
        </div>

        <div className="text-center mb-10">
          <CrownIcon className="mx-auto mb-4 text-primary w-12 h-12" />
          <h1 className="text-4xl font-normal mb-3 tracking-wide">CRIAR VITRINE</h1>
          <p className="text-gray-500 text-base font-normal">CADASTRO DE <span className="text-primary">PROFISSIONAL</span></p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="overflow-hidden rounded-custom border border-gray-800/50 bg-dark-100/40 backdrop-blur-sm">
            <SignupFieldRow label="SEU NOME">
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                className={`${fieldInputClass} uppercase`}
                required
              />
            </SignupFieldRow>

            <SignupFieldRow label="EXPERIÊNCIA">
              <input
                type="number"
                value={formData.anosExperiencia}
                onChange={(e) => setFormData({ ...formData, anosExperiencia: e.target.value })}
                min="0"
                max="50"
                className={fieldInputClass}
                required
                placeholder="ANOS"
              />
            </SignupFieldRow>

            <SignupFieldRow label="NOME">
              <input
                type="text"
                value={formData.nomeNegocio}
                onChange={(e) => handleNegocioNameChange(e.target.value.toUpperCase())}
                className={`${fieldInputClass} uppercase`}
                required
                placeholder="NOME DO NEGÓCIO"
              />
            </SignupFieldRow>

            <SignupFieldRow label="TELEFONE">
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className={fieldInputClass}
                required
              />
            </SignupFieldRow>

            <SignupFieldRow label="TIPO">
              <input
                type="text"
                value={formData.tipoNegocio}
                onChange={(e) => setFormData({ ...formData, tipoNegocio: e.target.value.toUpperCase() })}
                className={`${fieldInputClass} uppercase`}
                required
                placeholder="EX: BARBEARIA, CLÍNICA..."
              />
            </SignupFieldRow>

            <SignupFieldRow label="SUA URL">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-sm text-gray-600">COMVAGA.COM.BR/V/</span>
                <input
                  type="text"
                  value={formData.urlNegocio}
                  onChange={(e) => setFormData({ ...formData, urlNegocio: generateSlug(e.target.value) })}
                  className={`${fieldInputClass} uppercase`}
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                />
              </div>
            </SignupFieldRow>

            <SplitRow>
              <SplitField label="RUA" divider>
                <input
                  type="text"
                  value={formData.rua}
                  onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                  className={fieldInputClass}
                  required
                />
              </SplitField>

              <SplitField label="NÚM.">
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className={fieldInputClass}
                  required
                />
              </SplitField>
            </SplitRow>

            <SplitRow>
              <SplitField label="CIDADE" divider>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className={fieldInputClass}
                  required
                />
              </SplitField>

              <SplitField label="ESTADO">
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className={fieldInputClass}
                  required
                />
              </SplitField>
            </SplitRow>

            <SignupFieldRow label="E-MAIL">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={fieldInputClass}
                required
                placeholder="SEU E-MAIL"
              />
            </SignupFieldRow>

            <SignupFieldRow label="SENHA" last>
              <div className="relative min-w-0">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${fieldInputClass} pr-10`}
                  required
                  minLength={7}
                  placeholder="MÍNIMO 7 CARACTERES"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 transition-colors hover:text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </SignupFieldRow>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-yellow-500/70 bg-yellow-500 py-3 text-sm font-normal uppercase tracking-wider text-black transition-all hover:border-yellow-400 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'CRIANDO VITRINE...' : 'CRIAR MINHA VITRINE'}
            </button>

            <Link
              to="/login"
              className="flex w-full items-center justify-center rounded-full border border-yellow-500/40 bg-transparent py-3 text-sm font-normal uppercase tracking-wider text-yellow-400 transition-all hover:border-yellow-500 hover:text-yellow-300"
            >
              FAZER LOGIN
            </Link>
          </div>
        </form>

        <div className="text-center mt-12">
          <p className="text-xs text-gray-600 font-normal">
            AO CONTINUAR, VOCÊ CONCORDA COM NOSSOS{' '}
            <Link to="/termos" className="text-gray-500 hover:text-primary transition-colors">
              TERMOS DE USO
            </Link>
            {' '}E{' '}
            <Link to="/privacidade" className="text-gray-500 hover:text-primary transition-colors">
              POLÍTICA DE PRIVACIDADE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
