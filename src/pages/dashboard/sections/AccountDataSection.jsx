import React, { useState } from 'react';

const maskedPrivateValue = '••••••••';
const inputClass = 'w-full bg-transparent px-0 py-2 text-[14px] text-white placeholder-gray-600 outline-none focus:text-white';
const pillInputClass = 'w-full rounded-full border border-gray-800 bg-transparent px-4 py-2 text-center text-[14px] text-white placeholder-gray-600 outline-none focus:border-primary/50 focus:text-white';
const saveButtonClass = 'shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[12px] font-normal uppercase text-primary disabled:opacity-50';

function DataRow({ label, children, action, last = false }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 sm:px-6 ${last ? '' : 'border-b border-gray-800'}`}>
      <span className="w-[74px] shrink-0 py-2 text-[14px] leading-5 text-gray-500">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
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

  const salvarEmailVisivel = async () => {
    await Promise.resolve(salvarEmail());
    setEmailVisivel(false);
  };

  return (
    <div className="-m-6">
      <DataRow
        label="NOME"
        action={(
          <button type="button" onClick={salvarNomePerfil} disabled={savingPerfil} className={saveButtonClass}>
            {savingPerfil ? 'SALVANDO' : 'SALVAR'}
          </button>
        )}
      >
        <input
          type="text"
          value={nomePerfil}
          onChange={(e) => setNomePerfil(e.target.value)}
          className={inputClass}
          placeholder="Nome da conta"
        />
      </DataRow>

      <DataRow
        label="E-MAIL"
        action={emailVisivel ? (
          <button type="button" disabled={savingDados} onClick={salvarEmailVisivel} className={saveButtonClass}>
            {savingDados ? 'SALVANDO' : 'SALVAR'}
          </button>
        ) : (
          <button type="button" onClick={() => setEmailVisivel(true)} className={saveButtonClass}>
            VER E-MAIL
          </button>
        )}
      >
        <input
          type={emailVisivel ? 'email' : 'text'}
          value={emailVisivel ? novoEmail : maskedPrivateValue}
          onChange={(e) => setNovoEmail(e.target.value)}
          readOnly={!emailVisivel}
          className={inputClass}
          placeholder="E-mail de acesso"
        />
      </DataRow>

      <div className="px-4 py-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[14px] leading-5 text-gray-500">SENHA</span>
          <button type="button" disabled={savingDados} onClick={salvarSenha} className="shrink-0 rounded-full border border-green-500/40 px-3 py-1 text-[12px] font-normal uppercase text-green-300 disabled:opacity-50">
            {savingDados ? 'SALVANDO' : 'SALVAR'}
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
    </div>
  );
}
