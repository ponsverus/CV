import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function onlyTrim(v) {
  return String(v || '').trim();
}

function montarEnderecoUnico({ rua, numero, cidade, estado }) {
  return `${onlyTrim(rua)}, ${onlyTrim(numero)} - ${onlyTrim(cidade)}, ${onlyTrim(estado)}`;
}

export default function CriarNegocio({ user }) {
  const navigate = useNavigate();
  const { showMessage } = useFeedback();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nomeNegocio: '',
    urlNegocio: '',
    tipoNegocio: '',
    descricao: '',
    telefone: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

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
    if (!onlyTrim(formData.rua))    return 'signupProfessional.address_street_required';
    if (!onlyTrim(formData.numero)) return 'signupProfessional.address_number_required';
    if (!onlyTrim(formData.cidade)) return 'signupProfessional.address_city_required';
    if (!onlyTrim(formData.estado)) return 'signupProfessional.address_state_required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const nomeNegocio = onlyTrim(formData.nomeNegocio);
    const slug        = onlyTrim(formData.urlNegocio);
    const tipoNegocio = onlyTrim(formData.tipoNegocio);
    const descricao   = onlyTrim(formData.descricao);
    const telefone    = onlyTrim(formData.telefone);

    if (!nomeNegocio)             { showMessage('signupProfessional.business_name_required'); return; }
    if (!slug || slug.length < 3) { showMessage('signupProfessional.business_slug_invalid');  return; }
    if (!tipoNegocio)             { showMessage('signupProfessional.business_type_required'); return; }
    if (!descricao)               { showMessage('signupProfessional.description_required');   return; }
    if (!telefone)                { showMessage('signupProfessional.phone_required');         return; }

    const enderecoKey = validarEndereco();
    if (enderecoKey) { showMessage(enderecoKey); return; }

    const endereco = montarEnderecoUnico({
      rua: formData.rua, numero: formData.numero,
      cidade: formData.cidade, estado: formData.estado,
    });

    setLoading(true);

    try {
      const { data: slugExiste, error: slugErr } = await supabase
        .from('negocios').select('id').eq('slug', slug).maybeSingle();
      if (slugErr) throw slugErr;
      if (slugExiste) { showMessage('signupProfessional.business_slug_taken'); setLoading(false); return; }

      const { error: insErr } = await supabase.from('negocios').insert([{
        owner_id: user.id,
        nome: nomeNegocio,
        slug,
        tipo_negocio: tipoNegocio,
        descricao,
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
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-12 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-normal tracking-wider">VOLTAR</span>
        </button>

        <div className="flex justify-center mb-8">
          <img src="/Comvaga Logo.png" alt="COMVAGA" className="h-20 w-auto object-contain" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-normal mb-3 tracking-wide">Novo negócio</h1>
          <p className="text-gray-500 text-base font-normal">Agora, preencha os dados do seu <span className="text-primary">segundo negócio</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className={labelClass}>Nome do Negócio *</label>
            <input
              type="text"
              value={formData.nomeNegocio}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Clínica Vida"
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
                onChange={(e) => setFormData(prev => ({ ...prev, urlNegocio: generateSlug(e.target.value) }))}
                placeholder="clinica-vida"
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
              onChange={(e) => setFormData(prev => ({ ...prev, tipoNegocio: e.target.value }))}
              placeholder="Ex: clínica, estúdio, professor..."
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Sobre o Negócio *</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva brevemente os serviços oferecidos..."
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
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Endereço Completo *</label>
            <div className="bg-dark-100/40 border border-gray-800/50 rounded-custom p-4 backdrop-blur-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelSmClass}>Rua *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      value={formData.rua}
                      onChange={(e) => setFormData(prev => ({ ...prev, rua: e.target.value }))}
                      placeholder="Rua das Flores"
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
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="45"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelSmClass}>Bairro (opcional)</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                    placeholder="Centro"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelSmClass}>Cidade *</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Belo Horizonte"
                    className={inputClass}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelSmClass}>Estado *</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    placeholder="Minas Gerais"
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-3">
                Assim vai aparecer na vitrine:
                <span className="text-gray-400">
                  {' '}{formData.rua || 'Rua X'}, {formData.numero || '000'} - {formData.cidade || 'Cidade'}, {formData.estado || 'Estado'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary/10 border border-primary/30 hover:border-primary/60 hover:bg-primary/20 text-primary rounded-full font-normal text-sm tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'CRIANDO...' : 'CRIAR NEGÓCIO'}
          </button>

          <div className="text-center pt-4 border-t border-gray-800/50">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-400 text-sm font-normal transition-colors"
            >
              Cancelar e voltar ao dashboard
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
