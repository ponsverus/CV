import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, Eye, EyeOff, MapPin } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';

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
    descricao: '',
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
      const descricao = onlyTrim(formData.descricao);
      const anosExperiencia = parseInt(String(formData.anosExperiencia || ''), 10) || 0;

      if (!nome) { showMessage('signupProfessional.name_required'); return; }
      if (!telefone) { showMessage('signupProfessional.phone_required'); return; }
      if (!email || !email.includes('@')) { showMessage('signupProfessional.email_invalid'); return; }
      if (password.length < 6) { showMessage('signupProfessional.password_too_short'); return; }
      if (!nomeNegocio) { showMessage('signupProfessional.business_name_required'); return; }
      if (!slug || slug.length < 3) { showMessage('signupProfessional.business_slug_invalid'); return; }
      if (!tipoNegocio) { showMessage('signupProfessional.business_type_required'); return; }
      if (!descricao) { showMessage('signupProfessional.description_required'); return; }
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
        .from('negocios')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (slugError) throw slugError;
      if (existingNegocio) { showMessage('signupProfessional.business_slug_taken'); return; }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { type: 'professional', nome } },
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('Usuário não retornado pelo Supabase.');

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
          descricao,
          telefone,
          endereco: enderecoUnico,
          tipo_negocio: tipoNegocio,
          nome_prof: nome,
          profissao: tipoNegocio,
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

      const { error: expErr } = await supabase
        .from('profissionais')
        .update({ anos_experiencia: anosExperiencia })
        .eq('id', fnData.profissional_id)
        .eq('user_id', userId);

      if (expErr) {
        console.error('signup-professional experience update error:', expErr);
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

  const inputClass = 'w-full px-4 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm text-sm';
  const inputIconClass = 'w-full pl-10 pr-4 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm text-sm';
  const labelClass = 'block text-sm text-gray-400 mb-2 tracking-wide';
  const labelSmClass = 'block text-xs text-gray-500 mb-2 tracking-wide';

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
          <Award className="mx-auto mb-4 text-primary w-12 h-12" />
          <h1 className="text-4xl font-normal mb-3 tracking-wide">Criar vitrine</h1>
          <p className="text-gray-500 text-base font-normal">Cadastro de <span className="text-primary">Profissional</span></p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Seu Nome Completo *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Pedro Gomes"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Telefone (WhatsApp) *</label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(31) 90000 - 0000"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nome do Negócio *</label>
            <input
              type="text"
              value={formData.nomeNegocio}
              onChange={(e) => handleNegocioNameChange(e.target.value)}
              placeholder="Ex: Elite Barbers"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>URL Única *</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm whitespace-nowrap">comvaga.app/v/</span>
              <input
                type="text"
                value={formData.urlNegocio}
                onChange={(e) => setFormData({ ...formData, urlNegocio: generateSlug(e.target.value) })}
                placeholder="elite-barbers"
                className={inputClass}
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">Apenas letras minúsculas, números e hífens</p>
          </div>

          <div>
            <label className={labelClass}>Tipo de Negócio *</label>
            <input
              type="text"
              value={formData.tipoNegocio}
              onChange={(e) => setFormData({ ...formData, tipoNegocio: e.target.value })}
              placeholder="Ex: barbearia, estúdio, manicure..."
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Anos de Experiência *</label>
            <input
              type="number"
              value={formData.anosExperiencia}
              onChange={(e) => setFormData({ ...formData, anosExperiencia: e.target.value })}
              placeholder="5"
              min="0"
              max="50"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Sobre seus Serviços *</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Oferecemos serviços completos de barbearia: do corte clássico ao degradê..."
              rows={3}
              className="w-full px-4 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm resize-none text-sm"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Endereço Completo do Negócio *</label>
            <div className="bg-dark-100/40 border border-gray-800/50 rounded-custom p-4 backdrop-blur-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelSmClass}>Rua *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      value={formData.rua}
                      onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                      placeholder="Rua Serra do Sincorá"
                      className={inputIconClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelSmClass}>Número *</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="1038"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelSmClass}>Cidade *</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Belo Horizonte"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelSmClass}>Estado *</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="Minas Gerais"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="text-xs text-gray-600 mt-3">
                Assim vai aparecer no dashboard/vitrine:
                <span className="text-gray-400">
                  {' '}
                  {formData.rua || 'Rua X'}, {formData.numero || '000'} - {formData.cidade || 'Cidade'},{' '}
                  {formData.estado || 'Estado'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Senha *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 pr-12 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm text-sm"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary/10 border border-primary/30 hover:border-primary/60 hover:bg-primary/20 text-primary rounded-full font-normal text-sm tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'CRIANDO VITRINE...' : 'CRIAR MINHA VITRINE'}
          </button>

          <div className="text-center pt-6 border-t border-gray-800/50">
            <p className="text-sm text-gray-500 mb-2">Já tem uma conta?</p>
            <Link
              to="/login"
              className="text-primary hover:text-yellow-500 text-sm font-normal transition-colors inline-flex items-center gap-1"
            >
              Fazer login
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>
        </form>

        <div className="text-center mt-12">
          <p className="text-xs text-gray-600 font-normal">
            Ao continuar, você concorda com nossos{' '}
            <Link to="/termos" className="text-gray-500 hover:text-primary transition-colors">
              Termos de Uso
            </Link>
            {' '}e{' '}
            <Link to="/privacidade" className="text-gray-500 hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
