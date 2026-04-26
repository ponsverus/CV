import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';
import { CrownIcon } from '../components/icons';

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

function ResumeFieldRow({ label, children, last = false }) {
  return (
    <div className={`flex items-start gap-3 px-5 py-3 ${last ? '' : 'border-b border-gray-800/50'}`}>
      <label className="w-[96px] shrink-0 py-2 text-sm tracking-wide text-white">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ResumeSplitRow({ children, last = false }) {
  return (
    <div className={`grid grid-cols-2 ${last ? '' : 'border-b border-gray-800/50'}`}>
      {children}
    </div>
  );
}

function ResumeSplitField({ label, children, divider = false }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${divider ? 'border-r border-gray-800/50' : ''}`}>
      <label className="w-[62px] shrink-0 text-sm tracking-wide text-white">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const fieldInputClass = 'w-full bg-transparent px-0 py-2 text-sm text-white placeholder-gray-600 outline-none focus:text-white';

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
            .select('id, nome, slug, tipo_negocio, telefone, endereco, created_at')
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
    const nomeUpper = value.toUpperCase();
    setFormData((prev) => ({
      ...prev,
      nomeNegocio: nomeUpper,
      urlNegocio: generateSlug(nomeUpper),
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
      const telefone = onlyTrim(formData.telefone);
      const anosExperiencia = parseInt(String(formData.anosExperiencia || ''), 10) || 0;
      const isWaitingRoom = !resumeContexts.length;

      if (!nome) { showMessage('signupProfessional.name_required'); return; }
      if (!telefone) { showMessage('signupProfessional.phone_required'); return; }
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

      if (isWaitingRoom) {
        const { data: existingNegocio, error: slugError } = await supabase
          .rpc('get_negocio_vitrine_by_slug', { p_slug: slug });

        if (slugError) throw slugError;
        if (existingNegocio?.[0]) { showMessage('signupProfessional.business_slug_taken'); return; }

        const { data: fnData, error: fnError } = await supabase.functions.invoke('signup-professional', {
          body: {
            source: 'waiting_room',
            preserve_auth_user: true,
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

        if (fnError) {
          const payload = await fnError.context?.json?.().catch(() => null);
          const code = payload?.error || '';

          if (code === 'slug_indisponivel') {
            showMessage('signupProfessional.business_slug_taken');
            return;
          }
          if (code === 'slug_invalido') {
            showMessage('signupProfessional.business_slug_invalid');
            return;
          }
          if (code === 'usuario_nao_encontrado') {
            showMessage('signupProfessional.profile_not_created');
            return;
          }
          if (code === 'horario_invalido' || code === 'dias_trabalho_invalidos') {
            showMessage('signupProfessional.professional_create_error');
            return;
          }

          console.error('signup-professional waiting room error:', fnError, payload);
          showMessage('signupProfessional.business_create_error');
          return;
        }

        if (!fnData?.negocio_id || !fnData?.profissional_id) {
          console.error('signup-professional waiting room incomplete payload:', fnData);
          showMessage('signupProfessional.business_create_error');
          return;
        }

        onLogin(user, 'professional', 'completed');
        navigate('/dashboard');
        return;
      }

      if (!negocioId) { showMessage('signupProfessional.profile_not_created'); return; }

      const { data, error } = await supabase.rpc('resume_professional_onboarding', {
        p_negocio_id: negocioId,
        p_nome_usuario: nome,
        p_nome_negocio: nomeNegocio,
        p_slug: slug,
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

  const selectClass = 'w-full px-4 py-3 bg-dark-100/40 border border-gray-800/50 rounded-custom text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:bg-dark-100/60 transition-all backdrop-blur-sm text-sm';
  const labelClass = 'block text-sm text-gray-400 mb-2 tracking-wide';
  const isWaitingRoom = !resumeContexts.length;
  const hasMultipleContexts = resumeContexts.length > 1;

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
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
          <CrownIcon className="mx-auto mb-4 text-primary w-12 h-12" />
          <h1 className="text-4xl font-normal mb-3 tracking-wide">{isWaitingRoom ? 'CRIAR VITRINE' : 'RETOMAR VITRINE'}</h1>
          <p className="text-gray-500 text-base font-normal">
            {isWaitingRoom ? 'FINALIZE OS DADOS DO SEU NEGÓCIO PARA LIBERAR O DASHBOARD.' : 'SEU CADASTRO FICOU INCOMPLETO. FINALIZE OS DADOS PARA LIBERAR O DASHBOARD.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {hasMultipleContexts && (
            <div>
              <label className={labelClass}>QUAL NEGOCIO DESEJA RETOMAR?</label>
              <select
                value={selectedNegocioId}
                onChange={(e) => setSelectedNegocioId(e.target.value)}
                className={selectClass}
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

          <div className="overflow-hidden rounded-custom border border-gray-800/50 bg-dark-100/40 backdrop-blur-sm">
            <ResumeFieldRow label="SEU NOME">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value.toUpperCase())}
                className={`${fieldInputClass} uppercase`}
                required
              />
            </ResumeFieldRow>

            <ResumeFieldRow label="EXPERIÊNCIA">
              <input
                type="number"
                value={formData.anosExperiencia}
                onChange={(e) => setFormData((prev) => ({ ...prev, anosExperiencia: e.target.value }))}
                min="0"
                max="50"
                className={fieldInputClass}
                required
                placeholder="ANOS"
              />
            </ResumeFieldRow>

            <ResumeFieldRow label="NOME">
              <input
                type="text"
                value={formData.nomeNegocio}
                onChange={(e) => handleNegocioNameChange(e.target.value)}
                className={`${fieldInputClass} uppercase`}
                required
                placeholder="NOME DO NEGÓCIO"
              />
            </ResumeFieldRow>

            <ResumeFieldRow label="TELEFONE">
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                className={fieldInputClass}
                required
              />
            </ResumeFieldRow>

            <ResumeFieldRow label="TIPO">
              <input
                type="text"
                value={formData.tipoNegocio}
                onChange={(e) => setFormData((prev) => ({ ...prev, tipoNegocio: e.target.value.toUpperCase() }))}
                className={`${fieldInputClass} uppercase`}
                required
                placeholder="EX: BARBEARIA, CLÍNICA..."
              />
            </ResumeFieldRow>

            <ResumeFieldRow label="SUA URL">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-sm text-gray-600">COMVAGA.COM.BR/V/</span>
                <input
                  type="text"
                  value={formData.urlNegocio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, urlNegocio: generateSlug(e.target.value) }))}
                  className={`${fieldInputClass} uppercase`}
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                />
              </div>
            </ResumeFieldRow>

            <ResumeSplitRow>
              <ResumeSplitField label="RUA" divider>
                <input
                  type="text"
                  value={formData.rua}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rua: e.target.value }))}
                  className={fieldInputClass}
                  required
                />
              </ResumeSplitField>

              <ResumeSplitField label="NÚM.">
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                  className={fieldInputClass}
                  required
                />
              </ResumeSplitField>
            </ResumeSplitRow>

            <ResumeSplitRow last>
              <ResumeSplitField label="CIDADE" divider>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                  className={fieldInputClass}
                  required
                />
              </ResumeSplitField>

              <ResumeSplitField label="ESTADO">
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value }))}
                  className={fieldInputClass}
                  required
                />
              </ResumeSplitField>
            </ResumeSplitRow>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary/10 border border-primary/30 hover:border-primary/60 hover:bg-primary/20 text-primary rounded-full font-normal text-sm tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'FINALIZANDO...' : isWaitingRoom ? 'CRIAR VITRINE' : 'FINALIZAR CADASTRO'}
          </button>
        </form>
      </div>
    </div>
  );
}
