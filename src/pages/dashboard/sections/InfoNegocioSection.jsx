import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import TemaToggle from '../components/TemaToggle';

function InfoRow({ label, children, action, last = false }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 sm:px-6 ${last ? '' : 'border-b border-gray-800'}`}>
      <span className="w-[86px] shrink-0 py-2 text-[14px] leading-5 text-gray-500">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

const inputClass = 'w-full bg-transparent px-0 py-2 text-[14px] text-white placeholder-gray-600 outline-none focus:text-white';
const pillInputClass = 'w-full rounded-full border border-gray-800 bg-transparent px-4 py-2 text-center text-[14px] text-white placeholder-gray-600 outline-none focus:border-primary/50 focus:text-white';
const saveButtonClass = 'shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[12px] font-normal uppercase text-primary disabled:opacity-50';
const maskedPrivateValue = '••••••••';

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
  deletingBusiness,
  excluirNegocio,
  navigate,
}) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [visiblePrivateFields, setVisiblePrivateFields] = useState({
    instagram: false,
    facebook: false,
    email: false,
  });
  const [savingBusinessField, setSavingBusinessField] = useState(null);
  const [savingAccountField, setSavingAccountField] = useState(null);
  const swipeStartRef = useRef(null);

  useEffect(() => {
    setGalleryIndex((current) => {
      if (!galeriaItems.length) return 0;
      return Math.min(current, galeriaItems.length - 1);
    });
  }, [galeriaItems.length]);

  const goToPreviousGalleryItem = useCallback(() => {
    setGalleryIndex((current) => (current === 0 ? galeriaItems.length - 1 : current - 1));
  }, [galeriaItems.length]);

  const goToNextGalleryItem = useCallback(() => {
    setGalleryIndex((current) => (current === galeriaItems.length - 1 ? 0 : current + 1));
  }, [galeriaItems.length]);

  const handleGalleryPointerDown = (event) => {
    if (galeriaItems.length <= 1) return;
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleGalleryPointerUp = (event) => {
    if (!swipeStartRef.current || galeriaItems.length <= 1) return;

    const deltaX = event.clientX - swipeStartRef.current.x;
    const deltaY = event.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) goToNextGalleryItem();
    else goToPreviousGalleryItem();
  };

  const handleGalleryPointerCancel = () => {
    swipeStartRef.current = null;
  };

  const activeGalleryItem = galeriaItems[galleryIndex] || null;

  const revealPrivateField = (field) => {
    setVisiblePrivateFields((current) => ({ ...current, [field]: true }));
  };

  const hidePrivateField = (field) => {
    setVisiblePrivateFields((current) => ({ ...current, [field]: false }));
  };

  const saveBusinessField = async (field) => {
    try {
      setSavingBusinessField(field);
      await Promise.resolve(salvarInfoNegocio());
      if (field === 'instagram' || field === 'facebook') hidePrivateField(field);
    } finally {
      setSavingBusinessField(null);
    }
  };

  const saveEmailPrivateField = async () => {
    try {
      setSavingAccountField('email');
      await Promise.resolve(salvarEmail());
      hidePrivateField('email');
    } finally {
      setSavingAccountField(null);
    }
  };

  const savePasswordField = async () => {
    try {
      setSavingAccountField('password');
      await Promise.resolve(salvarSenha());
    } finally {
      setSavingAccountField(null);
    }
  };

  const businessSaveAction = (field) => (
    <button type="button" onClick={() => saveBusinessField(field)} disabled={infoSaving} className={saveButtonClass}>
      {savingBusinessField === field ? 'SALVANDO' : 'SALVAR'}
    </button>
  );

  const privateBusinessAction = (field) => (
    visiblePrivateFields[field] ? (
      <button type="button" onClick={() => saveBusinessField(field)} disabled={infoSaving} className={saveButtonClass}>
        {savingBusinessField === field ? 'SALVANDO' : 'SALVAR'}
      </button>
    ) : (
      <button type="button" onClick={() => revealPrivateField(field)} className={saveButtonClass}>
        VER ID
      </button>
    )
  );

  const privateEmailAction = (
    visiblePrivateFields.email ? (
      <button type="button" disabled={savingDados} onClick={saveEmailPrivateField} className={saveButtonClass}>
        {savingAccountField === 'email' ? 'SALVANDO' : 'SALVAR'}
      </button>
    ) : (
      <button type="button" onClick={() => revealPrivateField('email')} className={saveButtonClass}>
        VER E-MAIL
      </button>
    )
  );

  return (
    <div className="-m-6">
      <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3 sm:px-6">
        <span className="w-[86px] shrink-0 text-[14px] leading-5 text-gray-500">TEMA</span>
        <div className="min-w-0 flex-1">
          <TemaToggle value={formInfo.tema} onChange={salvarTema} loading={temaSaving} />
        </div>
        <span className="shrink-0 text-[12px] uppercase text-gray-600">
          {temaSaving ? 'SALVANDO' : ''}
        </span>
      </div>

      <InfoRow label="NEGÓCIO" action={businessSaveAction('nome')}>
        <input
          value={formInfo.nome}
          onChange={(e) => setFormInfo((prev) => ({ ...prev, nome: e.target.value }))}
          className={`${inputClass} truncate pr-10 sm:pr-0`}
          placeholder="NOME DO NEGÓCIO"
        />
      </InfoRow>

      <InfoRow label="TELEFONE" action={businessSaveAction('telefone')}>
        <input
          value={formInfo.telefone}
          onChange={(e) => setFormInfo((prev) => ({ ...prev, telefone: e.target.value }))}
          className={inputClass}
          placeholder="CONTATO"
        />
      </InfoRow>

      <InfoRow label="ENDERE." action={businessSaveAction('endereco')}>
        <input
          value={formInfo.endereco}
          onChange={(e) => setFormInfo((prev) => ({ ...prev, endereco: e.target.value }))}
          className={`${inputClass} max-w-[calc(100vw-13.75rem)] truncate pr-4 sm:max-w-none sm:pr-0`}
          placeholder="RUA, NÚMERO - CIDADE, ESTADO"
        />
      </InfoRow>

      <div className="border-b border-gray-800 px-4 py-3 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[14px] leading-5 text-gray-500">SOBRE</span>
          {businessSaveAction('descricao')}
        </div>
        <textarea
          value={formInfo.descricao}
          onChange={(e) => setFormInfo((prev) => ({ ...prev, descricao: e.target.value }))}
          rows={4}
          className="max-h-32 w-full resize-none overflow-y-auto bg-transparent py-2 pl-0 pr-6 text-[14px] font-normal leading-5 text-white outline-none [scrollbar-width:none] placeholder-gray-600 focus:text-white sm:pr-0 [&::-webkit-scrollbar]:hidden"
          placeholder="Conte sobre seu negócio, atendimento e diferenciais"
        />
      </div>

      <InfoRow label="INSTAGRAM" action={privateBusinessAction('instagram')}>
        <input
          type="text"
          value={visiblePrivateFields.instagram ? formInfo.instagram : maskedPrivateValue}
          onChange={(e) => setFormInfo((prev) => ({ ...prev, instagram: e.target.value }))}
          readOnly={!visiblePrivateFields.instagram}
          className={inputClass}
          placeholder="@seuinstagram"
        />
      </InfoRow>

      <InfoRow label="FACEBOOK" action={privateBusinessAction('facebook')}>
        <input
          type="text"
          value={visiblePrivateFields.facebook ? formInfo.facebook : maskedPrivateValue}
          onChange={(e) => setFormInfo((prev) => ({ ...prev, facebook: e.target.value }))}
          readOnly={!visiblePrivateFields.facebook}
          className={inputClass}
          placeholder="barbearia-vikings"
        />
      </InfoRow>

      <div className="border-b border-gray-800 px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-[14px] text-gray-400">{galeriaItems.length ? `${galeriaItems.length} IMGS` : 'Nenhuma imagem ainda'}</span>
          <label>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadGaleria(e.target.files)} disabled={galleryUploading} />
            <span className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-[12px] uppercase ${galleryUploading ? 'border-gray-800 text-gray-600' : 'border-primary/30 text-primary'}`}>
              <Plus className="h-3.5 w-3.5" />
              {galleryUploading ? 'ENVIANDO' : 'ADICIONAR'}
            </span>
          </label>
        </div>

        {galeriaItems.length > 0 ? (
          <>
            <div className="hidden columns-2 gap-3 sm:block lg:columns-3">
              {galeriaItems.map((item) => (
                <div key={item.id || item.path} className="relative mb-3 w-full break-inside-avoid overflow-hidden rounded-custom border border-gray-800 bg-dark-200">
                  <img src={getPublicUrl('galerias', item.path)} alt="Galeria" className="h-auto w-full object-contain" loading="lazy" />
                  <button type="button" onClick={() => removerImagemGaleria(item)} className="absolute right-2 top-2 rounded-full border border-gray-700 bg-black/60 px-3 py-1 text-[12px] font-normal uppercase text-red-200 hover:border-red-400">
                    REMOVER
                  </button>
                </div>
              ))}
            </div>

            {activeGalleryItem ? (
          <div className="sm:hidden">
            <div className="relative flex justify-center">
              <div
                className="relative inline-flex max-w-full touch-pan-y overflow-hidden rounded-custom border border-gray-800"
                onPointerDown={handleGalleryPointerDown}
                onPointerUp={handleGalleryPointerUp}
                onPointerCancel={handleGalleryPointerCancel}
              >
                <img
                  key={activeGalleryItem.id || activeGalleryItem.path}
                  src={getPublicUrl('galerias', activeGalleryItem.path)}
                  alt="Galeria"
                  className="h-auto max-h-[70vh] max-w-full object-contain"
                  loading="lazy"
                />
                <button type="button" onClick={() => removerImagemGaleria(activeGalleryItem)} className="absolute right-2 top-2 rounded-full border border-gray-700 bg-black/60 px-3 py-1 text-[12px] font-normal uppercase text-red-200 hover:border-red-400">
                  REMOVER
                </button>
                {galeriaItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousGalleryItem}
                      className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-black/60 text-white hover:border-primary hover:text-primary"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextGalleryItem}
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-black/60 text-white hover:border-primary hover:text-primary"
                      aria-label="Proxima imagem"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-center gap-1.5">
              {galeriaItems.map((item, index) => (
                <button
                  key={item.id || item.path}
                  type="button"
                  onClick={() => setGalleryIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${index === galleryIndex ? 'w-5 bg-primary' : 'w-1.5 bg-gray-700'}`}
                  aria-label={`Ir para imagem ${index + 1}`}
                />
              ))}
            </div>
          </div>
            ) : null}
          </>
        ) : null}
      </div>

      <InfoRow
        label="E-MAIL"
        action={privateEmailAction}
      >
        <input
          type={visiblePrivateFields.email ? 'email' : 'text'}
          value={visiblePrivateFields.email ? novoEmail : maskedPrivateValue}
          onChange={(e) => setNovoEmail(e.target.value)}
          readOnly={!visiblePrivateFields.email}
          className={inputClass}
        />
      </InfoRow>

      <div className="border-b border-gray-800 px-4 py-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[14px] leading-5 text-gray-500">SENHA</span>
          <button type="button" disabled={savingDados} onClick={savePasswordField} className="shrink-0 rounded-full border border-green-500/40 px-3 py-1 text-[12px] font-normal uppercase text-green-300 disabled:opacity-50">
            {savingAccountField === 'password' ? 'SALVANDO' : 'SALVAR'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className={pillInputClass}
            placeholder="NOVA SENHA"
          />
          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className={pillInputClass}
            placeholder="CONFIRMAR"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
        <button type="button" onClick={() => navigate('/criar-negocio')} className="flex-1 rounded-button border border-primary/30 py-3 text-[12px] font-normal uppercase text-primary hover:border-primary">
          CRIAR OUTRO
        </button>
        <button
          type="button"
          onClick={excluirNegocio}
          disabled={deletingBusiness}
          className="flex-1 rounded-button border border-red-500/30 py-3 text-[12px] font-normal uppercase text-red-400 disabled:opacity-50"
        >
          {deletingBusiness ? 'EXCLUINDO' : 'EXCLUIR'}
        </button>
      </div>
    </div>
  );
}
