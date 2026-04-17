import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function onlyTrim(v) {
  return String(v || '').trim();
}

function montarEnderecoUnico({ rua, numero, cidade, estado }) {
  return `${onlyTrim(rua)}, ${onlyTrim(numero)} - ${onlyTrim(cidade)}, ${onlyTrim(estado)}`;
}

function FieldRow({ label, children, last = false, alignStart = false }) {
  return (
    <div className={`flex ${alignStart ? 'items-start' : 'items-center'} gap-3 px-5 py-3 ${last ? '' : 'border-b border-gray-800'}`}>
      <label className="w-[96px] shrink-0 pt-2 text-sm tracking-wide text-gray-500">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SplitRow({ children, last = false }) {
  return (
    <div className={`grid grid-cols-2 ${last ? '' : 'border-b border-gray-800'}`}>
      {children}
    </div>
  );
}

function SplitField({ label, children, divider = false }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${divider ? 'border-r border-gray-800' : ''}`}>
      <label className="w-[62px] shrink-0 text-sm tracking-wide text-gray-500">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const fieldInputClass = 'w-full bg-transparent px-0 py-2 text-sm text-white placeholder-gray-600 outline-none focus:text-white';

export default function CriarNegocio({ user }) {
  const navigate = useNavigate();
  const { showMessage } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [ownerBusinessCount, setOwnerBusinessCount] = useState(0);

  const [formData, setFormData] = useState({
    nomeNegocio: '',
    urlNegocio: '',
    tipoNegocio: '',
    telefone: '',
    rua: '',
    numero: '',
    cidade: '',
    estado: '',
  });

  React.useEffect(() => {
    let active = true;

    async function loadOwnerBusinessCount() {
      if (!user?.id) return;

      const { count, error } = await supabase
        .from('negocios')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if (!error && active) {
        setOwnerBusinessCount(Number(count || 0));
      }
    }

    loadOwnerBusinessCount();
    return () => { active = false; };
  }, [user?.id]);

  const generateSlug = (text) =>
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleNomeChange = (value) => {
    setFormData(prev => ({ ...prev, nomeNegocio: value, urlNegocio: generateSlug(value) }));
  };

  const validarEndereco = () => {
    if (!onlyTrim(formData.rua)) return 'signupProfessional.address_street_required';
    if (!onlyTrim(formData.numero)) return 'signupProfessional.address_number_required';
    if (!onlyTrim(formData.cidade)) return 'signupProfessional.address_city_required';
    if (!onlyTrim(formData.estado)) return 'signupProfessional.address_state_required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const nomeNegocio = onlyTrim(formData.nomeNegocio);
    const slug = onlyTrim(formData.urlNegocio);
    const tipoNegocio = onlyTrim(formData.tipoNegocio);
    const telefone = onlyTrim(formData.telefone);

    if (!nomeNegocio) { showMessage('signupProfessional.business_name_required'); return; }
    if (!slug || slug.length < 3) { showMessage('signupProfessional.business_slug_invalid'); return; }
    if (!tipoNegocio) { showMessage('signupProfessional.business_type_required'); return; }
    if (!telefone) { showMessage('signupProfessional.phone_required'); return; }

    const enderecoKey = validarEndereco();
    if (enderecoKey) { showMessage(enderecoKey); return; }

    const endereco = montarEnderecoUnico({
      rua: formData.rua,
      numero: formData.numero,
      cidade: formData.cidade,
      estado: formData.estado,
    });

    setLoading(true);

    try {
      const { data: slugExiste, error: slugErr } = await supabase
        .from('negocios')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (slugErr) throw slugErr;
      if (slugExiste) {
        showMessage('signupProfessional.business_slug_taken');
        setLoading(false);
        return;
      }

      const { error: insErr } = await supabase.from('negocios').insert([{
        owner_id: user.id,
        nome: nomeNegocio,
        slug,
        tipo_negocio: tipoNegocio,
        telefone,
        endereco,
      }]);

      if (insErr) throw insErr;

      await sleep(300);
      navigate('/selecionar-negocio');
    } catch (err) {
      console.error('CriarNegocio error:', err);
      showMessage('alerts.action_failed_support');
    } finally {
      setLoading(false);
    }
  };

  const backTarget = ownerBusinessCount > 1 ? '/selecionar-negocio' : '/dashboard';

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(backTarget)}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-12 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-normal tracking-wider">VOLTAR</span>
        </button>

        <div className="flex justify-center mb-8">
          <img src="/Comvaga Logo.png" alt="COMVAGA" className="h-20 w-auto object-contain" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-normal mb-3 tracking-wide">NOVO NEGÓCIO</h1>
          <p className="text-gray-500 text-base font-normal">
            <span>AGORA, PREENCHA OS DADOS DO SEU</span>
            <span className="block text-primary sm:inline"> SEGUNDO NEGÓCIO</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="overflow-hidden rounded-custom border border-gray-800 bg-dark-100">
            <FieldRow label="NOME">
              <input
                type="text"
                value={formData.nomeNegocio}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="EX: CLÍNICA VIDA"
                className={fieldInputClass}
                required
              />
            </FieldRow>

            <FieldRow label="URL">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-sm text-gray-600">comvaga.app/v/</span>
                <input
                  type="text"
                  value={formData.urlNegocio}
                  onChange={(e) => setFormData(prev => ({ ...prev, urlNegocio: generateSlug(e.target.value) }))}
                  placeholder="clinica-vida"
                  className={fieldInputClass}
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                />
              </div>
            </FieldRow>

            <FieldRow label="TIPO">
              <input
                type="text"
                value={formData.tipoNegocio}
                onChange={(e) => setFormData(prev => ({ ...prev, tipoNegocio: e.target.value }))}
                placeholder="EX: CLÍNICA, ESCRITÓRIO, PET SHOP"
                className={fieldInputClass}
                required
              />
            </FieldRow>

            <FieldRow label="TELEFONE">
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(31) 90000 - 0000"
                className={fieldInputClass}
                required
              />
            </FieldRow>

            <SplitRow>
              <SplitField label="RUA" divider>
                <input
                  type="text"
                  value={formData.rua}
                  onChange={(e) => setFormData(prev => ({ ...prev, rua: e.target.value }))}
                  placeholder="RUA DOS CAETÉS"
                  className={fieldInputClass}
                  required
                />
              </SplitField>

              <SplitField label="NUM.">
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                  placeholder="200"
                  className={fieldInputClass}
                  required
                />
              </SplitField>
            </SplitRow>

            <SplitRow last>
              <SplitField label="CIDADE" divider>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="BELO HORIZONTE"
                  className={fieldInputClass}
                  required
                />
              </SplitField>

              <SplitField label="ESTADO">
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  placeholder="MINAS GERAIS"
                  className={fieldInputClass}
                  required
                />
              </SplitField>
            </SplitRow>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary/10 border border-primary/30 hover:border-primary/60 hover:bg-primary/20 text-primary rounded-full font-normal text-sm tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'CRIANDO...' : 'CRIAR NEGÓCIO'}
          </button>
        </form>
      </div>
    </div>
  );
}
