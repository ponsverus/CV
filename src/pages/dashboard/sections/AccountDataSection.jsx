import { useState } from 'react';

const maskedPrivateValue = '••••••••';
const inputClass = 'w-full bg-transparent px-0 py-2 text-[14px] text-white placeholder-gray-600 outline-none focus:text-white';
const pillInputClass = 'w-full rounded-full border border-gray-800 bg-transparent px-4 py-2 text-center text-[14px] text-white placeholder-gray-600 outline-none focus:border-primary/50 focus:text-white';
const editButtonClass = 'shrink-0 rounded-full bg-primary px-3 py-1 text-[12px] font-normal uppercase text-black transition-colors hover:bg-primary/90 disabled:opacity-50';
const saveButtonClass = 'shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[12px] font-normal uppercase text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40';

function DataRow({ label, children, action, last = false }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 sm:px-6 ${last ? '' : 'border-b border-gray-800'}`}>
      <span className="w-[74px] shrink-0 py-2 text-[14px] leading-5 text-gray-500">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

function normalizedFieldValue(value) {
  return String(value ?? '');
}

export default function AccountDataSection({
  nomePerfil,
  setNomePerfil,
  savingPerfil,
  salvarNomePerfil,
  novoEmail,
  setNovoEmail,
  savingDados,
  salvarEmail,
  novaSenha,
  setNovaSenha,
  confirmarSenha,
  setConfirmarSenha,
  salvarSenha,
}) {
  const [emailVisivel, setEmailVisivel] = useState(false);
  const [editingFields, setEditingFields] = useState({});
  const [fieldBaselines, setFieldBaselines] = useState({});

  const getFieldValue = (field) => {
    if (field === 'nome') return normalizedFieldValue(nomePerfil);
    if (field === 'email') return normalizedFieldValue(novoEmail);
    if (field === 'senha') return JSON.stringify([novaSenha || '', confirmarSenha || '']);
    return '';
  };

  const isEditing = (field) => Boolean(editingFields[field]);
  const fieldChanged = (field) => isEditing(field) && fieldBaselines[field] !== getFieldValue(field);

  const startEditing = (field) => {
    if (field === 'email') setEmailVisivel(true);
    setFieldBaselines((current) => ({ ...current, [field]: getFieldValue(field) }));
    setEditingFields((current) => ({ ...current, [field]: true }));
  };

  const stopEditing = (field) => {
    if (field === 'email') setEmailVisivel(false);
    setEditingFields((current) => ({ ...current, [field]: false }));
    setFieldBaselines((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const saveField = async (field, saveFn) => {
    if (!fieldChanged(field)) return;
    const saved = await Promise.resolve(saveFn());
    if (saved !== false) stopEditing(field);
  };

  const editAction = (field, saveFn, saving) => (
    isEditing(field) ? (
      <button type="button" onClick={() => saveField(field, saveFn)} disabled={saving || !fieldChanged(field)} className={saveButtonClass}>
        {saving ? 'SALVANDO' : 'SALVAR'}
      </button>
    ) : (
      <button type="button" onClick={() => startEditing(field)} disabled={saving} className={editButtonClass}>
        EDITAR
      </button>
    )
  );

  const inputStateClass = (editing) => editing ? '' : 'cursor-default text-gray-300 focus:text-gray-300';

  return (
    <div className="-m-6">
      <DataRow label="NOME" action={editAction('nome', salvarNomePerfil, savingPerfil)}>
        <input
          type="text"
          value={nomePerfil}
          onChange={(e) => setNomePerfil(e.target.value)}
          readOnly={!isEditing('nome')}
          className={`${inputClass} uppercase ${inputStateClass(isEditing('nome'))}`}
          placeholder="NOME COMPLETO"
        />
      </DataRow>

      <DataRow label="E-MAIL" action={editAction('email', salvarEmail, savingDados)}>
        <input
          type={emailVisivel ? 'email' : 'text'}
          value={emailVisivel ? novoEmail : maskedPrivateValue}
          onChange={(e) => setNovoEmail(e.target.value)}
          readOnly={!isEditing('email')}
          className={`${inputClass} uppercase ${inputStateClass(isEditing('email'))}`}
          placeholder="E-MAIL DE ACESSO"
        />
      </DataRow>

      <div className="px-4 py-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[14px] leading-5 text-gray-500">SENHA</span>
          {editAction('senha', salvarSenha, savingDados)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            readOnly={!isEditing('senha')}
            className={`${pillInputClass} ${inputStateClass(isEditing('senha'))}`}
            placeholder="NOVA SENHA"
          />
          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            readOnly={!isEditing('senha')}
            className={`${pillInputClass} ${inputStateClass(isEditing('senha'))}`}
            placeholder="CONFIRMAR"
          />
        </div>
      </div>
    </div>
  );
}
