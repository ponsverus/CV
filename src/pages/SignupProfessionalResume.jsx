import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';

function onlyTrim(v) {
  return String(v || '').trim();
}

function montarEnderecoUnico({ rua, numero, cidade, estado }) {
  return `${onlyTrim(rua)}, ${onlyTrim(numero)} - ${onlyTrim(cidade)}, ${onlyTrim(estado)}`;
}

function parseEndereco(endereco) {
  const raw = onlyTrim(endereco);
  const match = raw.match(/^(.*?),\s*(.*?)\s*-\s*(.*?),\s*(.*?)$/);
  if (!match) {
    return { rua: '', numero: '', cidade: '', estado: '' };
  }

  return {
    rua: onlyTrim(match[1]),
    numero: onlyTrim(match[2]),
    cidade: onlyTrim(match[3]),
    estado: onlyTrim(match[4]),
  };
}

export default function SignupProfessionalResume({ user, onLogin }) {
  const navigate = useNavigate();
  const { showMessage } = useFeedback();

  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [resumeContexts, setResumeContexts] = useState([]);
  const [selectedNegocioId, setSelectedNegocioId] = useState('');
  const [formData, setFormData] = useState({
    nomeNegocio: '',
    urlNegocio: '',
    tipoNegocio: '',
    anosExperiencia: '',
    descricao: '',
    telefone: '',
    rua: '',
    numero: '',
    cidade: '',
    estado: '',
  });

  useEffect(() => {
    let active = true;

    async function loadResumeData() {
      if (!user?.id) return;

      try {
        const [
          { data: userData, error: userErr },
          { data: negocioRows, error: negocioErr },
          { data: profissionalRows, error: profissionalErr },
        ] = await Promise.all([
          supabase.from('users').select('nome').eq('id', user.id).maybeSingle(),
          supabase.from('negocios')
            .select('id, nome, slug, tipo_negocio, descricao, telefone, endereco, created_at')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true }),
          supabase.from('profissionais')
            .select('id, negocio_id, anos_experiencia, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
        ]);

        if (userErr) throw userErr;
        if (negocioErr) throw negocioErr;
        if (profissionalErr) throw profissionalErr;
        if (!active) return;

        const profissionaisPorNegocio = new Map();
        for (const profissional of profissionalRows || []) {
          if (!profissional?.negocio_id || profissionaisPorNegocio.has(profissional.negocio_id)) continue;
          profissionaisPorNegocio.set(profissional.negocio_id, profissional);
        }

        const contexts = (negocioRows || [])
          .map((negocio) => ({
            negocio,
            profissional: profissionaisPorNegocio.get(negocio.id) || null,
          }))
          .filter((item) => item.profissional);

        const initialContext = contexts[0] || null;
        const endereco = parseEndereco(initialContext?.negocio?.endereco);

        setProfileName(onlyTrim(userData?.nome || user?.user_metadata?.nome || ''));
        setResumeContexts(contexts);
        setSelectedNegocioId(initialContext?.negocio?.id || '');
        setFormData({
          nomeNegocio: onlyTrim(initialContext?.negocio?.nome),
          urlNegocio: onlyTrim(initialContext?.negocio?.slug),
          tipoNegocio: onlyTrim(initialContext?.negocio?.tipo_negocio),
          anosExperiencia: initialContext?.profissional?.anos_experiencia != null ? String(initialContext.profissional.anos_experiencia) : '',
          descricao: onlyTrim(initialContext?.negocio?.descricao),
          telefone: onlyTrim(initialContext?.negocio?.telefone),
          rua: endereco.rua,
          numero: endereco.numero,
          cidade: endereco.cidade,
          estado: endereco.estado,
        });
      } catch (err) {
        console.error('SignupProfessionalResume load error:', err);
        showMessage('alerts.action_failed_support');
      } finally {
        if (active) setBooting(false);
      }
    }

    loadResumeData();
    return () => { active = false; };
  }, [showMessage, user?.id, user?.user_metadata?.nome]);

  useEffect(() => {
    if (!selectedNegocioId) return;
    const selectedContext = resumeContexts.find((item) => item.negocio.id === selectedNegocioId);
    if (!selectedContext) return;
    const endereco = parseEndereco(selectedContext.negocio?.endereco);
    setFormData({
      nomeNegocio: onlyTrim(selectedContext.negocio?.nome),
      urlNegocio: onlyTrim(selectedContext.negocio?.slug),
      tipoNegocio: onlyTrim(selectedContext.negocio?.tipo_negocio),
      anosExperiencia: selectedContext.profissional?.anos_experiencia != null ? String(selectedContext.profissional.anos_experiencia) : '',
      descricao: onlyTrim(selectedContext.negocio?.descricao),
      telefone: onlyTrim(selectedContext.negocio?.telefone),
      rua: endereco.rua,
      numero: endereco.numero,
      cidade: endereco.cidade,
      estado: endereco.estado,
    });
  }, [selectedNegocioId, resumeContexts]);

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
      urlNegocio: prev.urlNegocio ? prev.urlNegocio : generateSlug(value),
    }));
  };

  const validarEnderecoCompleto = () => {
    if (!onlyTrim(formData.rua)) return 'signupProfessional.address_street_required';
    if (!onlyTrim(formData.numero)) return 'signupProfessional.address_number_required';
    if (!onlyTrim(formData.cidade)) return 'signupProfessional.address_city_required';
    if (!onlyTrim(formData.estado)) return 'signupProfessional.address_state_required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const nome = onlyTrim(profileName || user?.user_metadata?.nome);
      const negocioId = String(selectedNegocioId || '').trim();
      const nomeNegocio = onlyTrim(formData.nomeNegocio);
      const slug = onlyTrim(formData.urlNegocio);
      const tipoNegocio = onlyTrim(formData.tipoNegocio);
      const descricao = onlyTrim(formData.descricao);
      const telefone = onlyTrim(formData.telefone);
      const anosExperiencia = parseInt(String(formData.anosExperiencia || ''), 10) || 0;

      if (!nome) { showMessage('signupProfessional.name_required'); return; }
      if (!negocioId) { showMessage('signupProfessional.profile_not_created'); return; }
      if (!telefone) { showMessage('signupProfessional.phone_required'); return; }
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

      const { data, error } = await supabase.rpc('resume_professional_onboarding', {
        p_negocio_id: negocioId,
        p_nome_usuario: nome,
        p_nome_negocio: nomeNegocio,
        p_slug: slug,
        p_descricao: descricao,
        p_telefone: telefone,
        p_endereco: enderecoUnico,
        p_tipo_negocio: tipoNegocio,
        p_nome_prof: nome,
        p_profissao: tipoNegocio,
        p_anos_experiencia: anosExperiencia,
      });

      if (error) {
        const code = String(error.message || '').split(':')[0].trim();

        if (code === 'slug_indisponivel') {
          showMessage('signupProfessional.business_slug_taken');
          return;
        }
        if (code === 'usuario_nao_encontrado' || code === 'negocio_nao_encontrado' || code === 'negocio_nao_informado' || code === 'profissional_nao_encontrado') {
          showMessage('signupProfessional.profile_not_created');
          return;
        }
        if (code === 'slug_invalido') {
          showMessage('signupProfessional.business_slug_invalid');
          return;
        }
        if (code === 'horario_invalido' || code === 'dias_trabalho_invalidos') {
          showMessage('signupProfessional.professional_create_error');
          return;
        }

        console.error('resume_professional_onboarding error:', error);
        showMessage('signupProfessional.business_create_error');
        return;
      }

      if (!data?.profissional_id) {
        console.error('resume_professional_onboarding incomplete payload:', data);
        showMessage('signupProfessional.business_create_error');
        return;
      }

      onLogin(user, 'professional', 'completed');
      navigate('/dashboard');
    } catch (err) {
      console.error('SignupProfessionalResume error:', err);
      showMessage('alerts.action_failed_support');
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-primary text-xl">CARREGANDO...</div>
        </div>
      </div>
    );
  }

  if (!resumeContexts.length) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-100 border border-gray-800 rounded-custom p-8 text-center">
          <Award className="mx-auto mb-4 text-primary w-12 h-12" />
          <h1 className="text-2xl font-normal text-white mb-3">Nenhum cadastro para retomar</h1>
          <p className="text-gray-400 mb-6">NÃ£o encontramos um contexto de retomada vinculado Ã sua conta.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button font-normal uppercase"
          >
            IR PARA O DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm text-sm';
  const inputIconClass = 'w-full pl-10 pr-4 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm text-sm';
  const labelClass = 'block text-sm text-gray-400 mb-2 tracking-wide';
  const labelSmClass = 'block text-xs text-gray-500 mb-2 tracking-wide';
  const hasMultipleContexts = resumeContexts.length > 1;

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-12 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-normal tracking-wider">VOLTAR</span>
        </Link>

        <div className="flex justify-center mb-8">
          <img src="/Comvaga Logo.png" alt="COMVAGA" className="h-24 w-auto object-contain" />
        </div>

        <div className="text-center mb-10">
          <Award className="mx-auto mb-4 text-primary w-12 h-12" />
          <h1 className="text-4xl font-normal mb-3 tracking-wide">Retomar vitrine</h1>
          <p className="text-gray-500 text-base font-normal">Seu cadastro ficou incompleto. Finalize os dados para liberar o dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {hasMultipleContexts && (
            <div>
              <label className={labelClass}>Qual negócio deseja retomar?</label>
              <select
                value={selectedNegocioId}
                onChange={(e) => setSelectedNegocioId(e.target.value)}
                className={inputClass}
                required
              >
                {resumeContexts.map((context) => (
                  <option key={context.negocio.id} value={context.negocio.id}>
                    {context.negocio.nome || context.negocio.slug || context.negocio.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Seu Nome Completo</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className={inputClass}
              placeholder="Seu nome completo"
              required
            />
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
                onChange={(e) => setFormData((prev) => ({ ...prev, urlNegocio: generateSlug(e.target.value) }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, tipoNegocio: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, anosExperiencia: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva brevemente seus serviços..."
              rows={3}
              className="w-full px-4 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm resize-none text-sm"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Telefone (WhatsApp) *</label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
              placeholder="(31) 90000 - 0000"
              className={inputClass}
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, rua: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value }))}
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
                  {formData.rua || 'Rua X'}, {formData.numero || '000'} - {formData.cidade || 'Cidade'}, {formData.estado || 'Estado'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary/10 border border-primary/30 hover:border-primary/60 hover:bg-primary/20 text-primary rounded-full font-normal text-sm tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'FINALIZANDO...' : 'FINALIZAR CADASTRO'}
          </button>
        </form>
      </div>
    </div>
  );
}
