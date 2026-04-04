import React from 'react';
import { Plus, Save } from 'lucide-react';
import TemaToggle from '../components/TemaToggle';

export default function InfoNegocioSection({
  salvarInfoNegocio,
  infoSaving,
  formInfo,
  setFormInfo,
  salvarTema,
  temaSaving,
  galleryUploading,
  uploadGaleria,
  galeriaItems,
  getPublicUrl,
  removerImagemGaleria,
  novoEmail,
  setNovoEmail,
  savingDados,
  salvarEmail,
  novaSenha,
  setNovaSenha,
  confirmarSenha,
  setConfirmarSenha,
  salvarSenha,
  navigate,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-normal">Info do Negócio</h2>
        <button onClick={salvarInfoNegocio} disabled={infoSaving}
          className={`px-5 py-2.5 rounded-button font-normal border flex items-center gap-2 uppercase ${infoSaving ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'}`}>
          <Save className="w-4 h-4" />{infoSaving ? 'SALVANDO...' : 'SALVAR'}
        </button>
      </div>
      <div className="flex justify-start"><TemaToggle value={formInfo.tema} onChange={salvarTema} loading={temaSaving} /></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><label className="block text-sm mb-2">Negócio</label><input value={formInfo.nome} onChange={(e) => setFormInfo(prev => ({ ...prev, nome: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="Nome" /></div>
        <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><label className="block text-sm mb-2">Telefone</label><input value={formInfo.telefone} onChange={(e) => setFormInfo(prev => ({ ...prev, telefone: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="(xx) xxxxx-xxxx" /></div>
        <div className="bg-dark-200 border border-gray-800 rounded-custom p-5 md:col-span-2"><label className="block text-sm mb-2">Endereço</label><input value={formInfo.endereco} onChange={(e) => setFormInfo(prev => ({ ...prev, endereco: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder='Ex.: Rua Serra do Sincorá, 1038 - Belo Horizonte, Minas Gerais' /><p className="text-[12px] text-yellow-300 mt-2">Use o formato: <span className="text-gray-300">"RUA, NÚMERO - CIDADE, ESTADO"</span><span className="text-gray-500"> Ex.: Rua Serra do Sincorá, 1038 - Belo Horizonte, Minas Gerais</span></p></div>
        <div className="bg-dark-200 border border-gray-800 rounded-custom p-5 md:col-span-2"><label className="block text-sm mb-2">Sobre</label><textarea value={formInfo.descricao} onChange={(e) => setFormInfo(prev => ({ ...prev, descricao: e.target.value }))} rows={3} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white resize-none" placeholder="Sobre o negócio..." /></div>
      </div>
      <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
        <div className="text-sm font-normal text-white tracking-wide mb-1">REDES</div>
        <p className="text-sm text-gray-500 mb-4">Seus links aparecem na vitrine pública. Deixe em branco para ocultar.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm mb-2">Instagram</label><input value={formInfo.instagram} onChange={(e) => setFormInfo(prev => ({ ...prev, instagram: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="@seuinstagram" /></div>
          <div><label className="block text-sm mb-2">Facebook</label><input value={formInfo.facebook} onChange={(e) => setFormInfo(prev => ({ ...prev, facebook: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="facebook.com/..." /></div>
        </div>
      </div>
      <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-normal text-white tracking-wide">GALERIA</div>
          <label className="hidden sm:inline-block">
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => uploadGaleria(e.target.files)} disabled={galleryUploading} />
            <span className={`inline-flex items-center gap-2 rounded-button font-normal border cursor-pointer transition-all uppercase ${galleryUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'} px-4 py-2 text-sm`}><Plus className="w-4 h-4" />{galleryUploading ? 'ENVIANDO...' : 'ADICIONAR'}</span>
          </label>
        </div>
        <p className="text-sm text-gray-500 mb-4">Adicione fotos do seu local e do que você oferece. Elas aparecem na sua vitrine pública para atrair novos clientes.</p>
        {galeriaItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {galeriaItems.map((item) => (
              <div key={item.id || item.path} className="relative bg-dark-100 border border-gray-800 rounded-custom overflow-hidden">
                <img src={getPublicUrl('galerias', item.path)} alt="Galeria" className="w-full h-28 object-cover" />
                <button onClick={() => removerImagemGaleria(item)} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:left-auto sm:top-2 sm:right-2 sm:translate-x-0 sm:translate-y-0 px-3 py-1 rounded-full bg-black/60 border border-gray-700 hover:border-red-400 text-[12px] text-red-200 font-normal uppercase">REMOVER</button>
              </div>
            ))}
          </div>
        ) : <div className="text-gray-500">Nenhuma imagem ainda.</div>}
        <label className="sm:hidden mt-4 block">
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => uploadGaleria(e.target.files)} disabled={galleryUploading} />
          <span className={`w-full inline-flex items-center justify-center gap-2 rounded-button font-normal border cursor-pointer transition-all uppercase ${galleryUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'} px-4 py-3 text-sm`}><Plus className="w-4 h-4" />{galleryUploading ? 'ENVIANDO...' : 'ADICIONAR FOTOS'}</span>
        </label>
      </div>
      <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-4">CREDENCIAIS</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">EMAIL</label>
            <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="seu@email.com" />
            <button type="button" disabled={savingDados} onClick={salvarEmail} className="mt-3 w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase font-normal">SALVAR NOVO EMAIL</button>
          </div>
          <div>
            <label className="block text-sm mb-2">NOVA SENHA</label>
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="••••••••" />
            <label className="block text-sm mb-2 mt-3">CONFIRMAR SENHA</label>
            <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="••••••••" />
            <button type="button" disabled={savingDados} onClick={salvarSenha} className="mt-3 w-full py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 rounded-button text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase font-normal">SALVAR NOVA SENHA</button>
          </div>
        </div>
      </div>
      <div className="pt-2 pb-4">
        <button type="button" onClick={() => navigate('/criar-negocio')} className="w-full py-4 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-normal uppercase tracking-normal hover:border-primary/70 hover:bg-primary/20 transition-all">
          + CRIAR OUTRO NEGÓCIO
        </button>
      </div>
    </div>
  );
}
