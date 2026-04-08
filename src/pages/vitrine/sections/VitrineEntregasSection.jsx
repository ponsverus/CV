import React from 'react';

export default function VitrineEntregasSection({
  profissionais,
  entregasPorProf,
  sectionTitle,
  emptyListMsg,
  counterSingular,
  counterPlural,
  getPrecoFinalServico,
  ServicosCarousel,
  selecaoProfId,
  servicosSelecionados,
  isProfessional,
  handleAgendarAgora,
  handleToggleSelecao,
  isLight,
}) {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-normal mb-6">{sectionTitle}</h2>
        {profissionais.length === 0 ? (
          <p className="text-vmuted font-normal">{emptyListMsg}</p>
        ) : (
          <div className="space-y-4">
            {profissionais.map((p) => {
              const lista = (entregasPorProf.get(p.id) || []).slice().sort((a, b) => {
                const pa = Number(getPrecoFinalServico(a) ?? 0);
                const pb = Number(getPrecoFinalServico(b) ?? 0);
                if (pb !== pa) return pb - pa;
                return String(a.nome || '').localeCompare(String(b.nome || ''));
              });
              return (
                <div key={p.id} className="bg-vcard border border-vborder rounded-custom p-6 hover:border-vprimary/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-normal text-lg">{p.nome}</div>
                    <div className="text-xs text-vmuted font-normal">{lista.length} {lista.length === 1 ? counterSingular : counterPlural}</div>
                  </div>
                  <ServicosCarousel lista={lista} profissional={p} selecaoProfId={selecaoProfId} servicosSelecionados={servicosSelecionados} isProfessional={isProfessional} onAgendarAgora={handleAgendarAgora} onToggleSelecao={handleToggleSelecao} emptyMsg={emptyListMsg} isLight={isLight} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
