import React from 'react';
import { Clock } from 'lucide-react';

function StarChar({ size = 18, className = '' }) {
  return <span className={className || 'text-primary'} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">★</span>;
}

export default function VitrineProfessionalsSection({
  cards,
  counterSingular,
  counterPlural,
  profissaoTag,
  mediaColor,
  almocoBadge,
}) {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-normal mb-6">Profissionais</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {cards.map((prof) => (
            <div key={prof.id} className="mb-6 break-inside-avoid bg-vcard border border-vborder rounded-custom p-6 hover:border-vprimary/50 transition-all">
              <div className="flex items-start gap-4 mb-4">
                {prof.avatarUrl ? (
                  <div className="w-14 h-14 rounded-custom overflow-hidden border border-vborder bg-vcard2 shrink-0">
                    <img src={prof.avatarUrl} alt={prof.nome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-vprimary rounded-custom flex items-center justify-center text-2xl font-normal text-vprimary-text shrink-0">
                    {prof.nome?.[0] || 'P'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg font-normal">{prof.nome}</h3>
                    {prof.profissaoLabel && (
                      <span className={`inline-block px-2 py-1 rounded-button text-[10px] font-normal uppercase whitespace-nowrap shrink-0 border ${profissaoTag}`}>
                        {prof.profissaoLabel}
                      </span>
                    )}
                  </div>
                  {prof.status?.label && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${prof.status.color}`} />
                      <span className="text-xs text-vsub font-normal uppercase">{prof.status.label}</span>
                    </div>
                  )}
                  {prof.depInfo?.media && (
                    <div className="flex items-center gap-2 mb-1">
                      <StarChar size={16} className="text-primary" />
                      <span className={`text-lg font-normal ${mediaColor}`}>{prof.depInfo.media}</span>
                      <span className="text-xs text-vmuted">({prof.depInfo.count})</span>
                    </div>
                  )}
                  {prof.anos_experiencia != null && (
                    <p className="text-sm text-vmuted font-normal">{prof.anos_experiencia} ano(s) de experiência</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal">
                  <Clock className="w-3 h-3 shrink-0" />
                  {prof.horarioIni} - {prof.horarioFim}
                </span>
                {prof.almoco?.ini && prof.almoco?.fim && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal">
                    <span className={`ml-1 ${almocoBadge}`}> • {String(prof.almoco.ini).slice(0, 5)} - {String(prof.almoco.fim).slice(0, 5)}</span>
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal">
                  {prof.totalEntregas} {prof.totalEntregas === 1 ? counterSingular : counterPlural}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
