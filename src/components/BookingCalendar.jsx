/**
 * BookingCalendar.jsx
 * Calendário de agendamento — tudo em uma única página (scroll).
 *
 * Props:
 *   profissional  — objeto profissional completo
 *   entrega       — { id, nome, duracao_minutos, preco, preco_promocional }
 *   todayISO      — "YYYY-MM-DD" de serverNow.date
 *   negocioId     — uuid do negócio
 *   clienteId     — uuid do cliente logado
 *   onConfirm     — ({ inicio, fim, label, dataISO }) => void
 *   onClose       — () => void
 *
 * Regras dos slots (rpc_get_slots_v4):
 *   is_heat  → zona de calor (evita buracos na agenda) — borda amarela
 *   is_raio  → janela de cancelamento reaproveitada — ícone ⚡ discreto
 *
 * Fluxo visual (tudo na mesma tela, scroll):
 *   1. Calendário → usuário escolhe o dia
 *   2. Slots aparecem abaixo, automaticamente
 *      - Zona de calor visível imediatamente (is_heat / is_raio)
 *      - Botão "VER MAIS HORÁRIOS" expande todos os slots
 *   3. Ao clicar num slot → resumo aparece abaixo dos slots
 *   4. Botão confirmar → fecha e chama onConfirm
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Check, Loader2, Zap } from 'lucide-react';
import { supabase } from '../supabase';

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

function toISO(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatBR(iso) {
  const p = parseISO(iso);
  if (!p) return '';
  return `${String(p.day).padStart(2, '0')}.${String(p.month).padStart(2, '0')}.${p.year}`;
}

function daysInMonth(y, m)    { return new Date(y, m, 0).getDate(); }
function firstDow(y, m)       { return new Date(y, m - 1, 1).getDay(); }
function isoLt(a, b)          { return String(a) < String(b); }
function isoEq(a, b)          { return String(a) === String(b); }
function timeToMin(t)         { if (!t) return 0; const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); }

/**
 * Calcula horario_fim a partir do label (HH:MM) + duração + folga.
 * Não depende do navegador nem de conversão de timezone —
 * usa diretamente o label que o banco já entregou no fuso correto.
 */
function calcHorarioFim(labelHHMM, duracaoMin, folga) {
  const [h, m]   = labelHHMM.split(':').map(Number);
  const totalMin = h * 60 + m + Number(duracaoMin) + Number(folga);
  const fimH     = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const fimM     = String(totalMin % 60).padStart(2, '0');
  return `${fimH}:${fimM}`;
}

const MONTH_NAMES   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAY_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const FOLGA         = 5;

// ─── componente ───────────────────────────────────────────────────────────────

export default function BookingCalendar({
  profissional,
  entrega,
  todayISO,
  onConfirm,
  onClose,
  negocioId,
  clienteId,
}) {
  const today = parseISO(todayISO);

  // calendário
  const [viewYear,  setViewYear]  = useState(today?.year  ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(today?.month ?? new Date().getMonth() + 1);

  // seleções
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // slots
  const [horariosHot,  setHorariosHot]  = useState([]);   // is_heat ou is_raio
  const [horariosAll,  setHorariosAll]  = useState([]);   // todos
  const [showAll,      setShowAll]      = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError,   setSlotsError]   = useState(null);

  // confirmação
  const [confirming,   setConfirming]   = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  // refs para scroll e fechar ao clicar fora
  const containerRef = useRef(null);
  const slotsRef     = useRef(null);
  const resumeRef    = useRef(null);

  // fechar ao clicar fora — não fecha durante confirmação em andamento
  useEffect(() => {
    function handle(e) {
      if (confirming) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose?.();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose, confirming]);

  // ── buscar slots ────────────────────────────────────────────────────────────

  const fetchSlots = useCallback(async (dayISO) => {
    if (!profissional?.id || !entrega?.duracao_minutos || !dayISO) return;

    setSlotsLoading(true);
    setSlotsError(null);
    setHorariosHot([]);
    setHorariosAll([]);
    setShowAll(false);
    setSelectedSlot(null);
    setConfirmError(null);

    try {
      const dur = Number(entrega.duracao_minutos);

      const { data, error } = await supabase.rpc('rpc_get_slots_v4', {
        p_profissional_id: profissional.id,
        p_dia:             dayISO,
        p_entrega_min:     dur,
        p_folga_min:       FOLGA,
        p_margem_min:      5,
        p_modo:            'todos',
      });
      if (error) throw error;

      // RPC retorna: horario_inicio (timestamptz), horario_fim (timestamptz), label (HH:MM SP), is_heat, is_raio
      const list = (data || []).map(s => ({
        hora:           String(s.label || '').slice(0, 5), // "HH:MM" já no fuso SP
        isHeat:         !!s.is_heat,
        isRaio:         !!s.is_raio,
        horario_inicio: s.horario_inicio || null,          // timestamptz (referência interna)
        horario_fim:    s.horario_fim    || null,          // timestamptz (referência interna)
        duracaoMin:     dur,
      }));

      // desduplicação — mantém maior rank (raio > heat > normal)
      const rank = h => h.isRaio ? 3 : h.isHeat ? 2 : 1;
      const uniq = new Map();
      for (const h of list) {
        if (!h.hora) continue;
        if (!uniq.has(h.hora) || rank(h) > rank(uniq.get(h.hora))) uniq.set(h.hora, h);
      }
      const final = [...uniq.values()].sort((a, b) => timeToMin(a.hora) - timeToMin(b.hora));
      const hot   = final.filter(h => h.isHeat || h.isRaio);

      setHorariosAll(final);
      setHorariosHot(hot);

      if (!final.length) setSlotsError('Nenhum horário disponível neste dia.');

      setTimeout(() => slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    } catch (e) {
      setSlotsError('Erro ao buscar horários. Tente outro dia.');
    } finally {
      setSlotsLoading(false);
    }
  }, [profissional?.id, entrega?.duracao_minutos]);

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleSelectDay = iso => {
    setSelectedDay(iso);
    fetchSlots(iso);
  };

  const handleSelectSlot = slot => {
    setSelectedSlot(slot);
    setConfirmError(null);
    setTimeout(() => resumeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedDay || !clienteId || !negocioId) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      // horario_inicio vem do label da RPC — já em America/Sao_Paulo, sem conversão de timezone
      // horario_fim calculado localmente a partir do label + duração + folga
      const horarioInicio = selectedSlot.hora;
      const horarioFim    = calcHorarioFim(selectedSlot.hora, entrega.duracao_minutos, FOLGA);

      const { error } = await supabase.from('agendamentos').insert([{
        negocio_id:      negocioId,
        profissional_id: profissional.id,
        cliente_id:      clienteId,
        entrega_id:      entrega.id,
        data:            selectedDay,
        horario_inicio:  horarioInicio,
        horario_fim:     horarioFim,
        status:          'agendado',
        // preco_final omitido — o banco resolve no momento da conclusão via trigger set_agendamento_timestamps
      }]);

      if (error) throw error;

      onConfirm?.({
        inicio:  selectedSlot.horario_inicio,
        fim:     selectedSlot.horario_fim,
        label:   selectedSlot.hora,
        dataISO: selectedDay,
      });
    } catch (e) {
      const msg     = String(e?.message || '').toLowerCase();
      const overlap = String(e?.code || '') === '23P01'
        || msg.includes('overlap')
        || msg.includes('sobrepos')
        || msg.includes('exclusion')
        || msg.includes('almoco');
      if (overlap) {
        setConfirmError('Alguém acabou de reservar esse horário. Escolha outro.');
        fetchSlots(selectedDay);
      } else {
        setConfirmError('Não foi possível confirmar. Tente novamente.');
      }
    } finally {
      setConfirming(false);
    }
  };

  // mês
  function prevMonth() { if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); } else setViewMonth(m => m + 1); }

  const canGoPrev    = !(viewYear === today?.year && viewMonth === today?.month);
  const diasTrabalho = profissional?.dias_trabalho ?? [1, 2, 3, 4, 5, 6];
  const valorExibido = entrega?.preco_promocional
    ? Number(entrega.preco_promocional).toFixed(2)
    : Number(entrega?.preco ?? 0).toFixed(2);

  // grade do calendário
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow  = firstDow(viewYear, viewMonth);
  const cells     = [...Array(startDow).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="bg-dark-100 border border-gray-800 rounded-custom w-full max-w-md max-h-[92vh] overflow-y-auto"
      >

        {/* ── cabeçalho ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Agendamento</div>
            <div className="font-normal text-white truncate">{entrega?.nome}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {profissional?.nome}
              {entrega?.duracao_minutos && <span className="ml-2 text-gray-600">• {entrega.duracao_minutos} min</span>}
              <span className="ml-2 text-primary">• R$ {valorExibido}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 ml-4 p-1.5 rounded-button text-gray-500 hover:text-white hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── calendário ── */}
          <div>
            {/* navegação de mês */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="p-1.5 rounded hover:bg-dark-200 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-normal text-white uppercase tracking-wide select-none">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* labels dias da semana */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_SHORT.map((l, i) => (
                <div key={i} className="text-center text-[10px] text-gray-500 uppercase py-1 select-none">{l}</div>
              ))}
            </div>

            {/* grade de dias */}
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;
                const iso        = toISO(viewYear, viewMonth, day);
                const dow        = (startDow + day - 1) % 7;
                const isPast     = isoLt(iso, todayISO);
                const isToday    = isoEq(iso, todayISO);
                const isWorkday  = diasTrabalho.includes(dow);
                const isSelected = selectedDay && isoEq(iso, selectedDay);
                const isDisabled = isPast || !isWorkday;

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelectDay(iso)}
                    className={[
                      'h-9 w-9 mx-auto flex items-center justify-center text-sm font-normal transition-colors select-none rounded-full',
                      isSelected
                        ? 'bg-primary text-black'
                        : isToday && !isDisabled
                          ? 'text-primary'
                          : isDisabled
                            ? 'text-gray-700 cursor-not-allowed'
                            : 'text-gray-300 hover:bg-dark-200 hover:text-white cursor-pointer',
                    ].join(' ')}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── horários (aparecem quando um dia é selecionado) ── */}
          {selectedDay && (
            <div ref={slotsRef}>

              {/* loading */}
              {slotsLoading && (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Buscando horários...</span>
                </div>
              )}

              {/* erro / vazio */}
              {!slotsLoading && slotsError && (
                <div className="flex items-center justify-center bg-yellow-500/10 border border-yellow-500/30 rounded-button p-3 text-yellow-300 text-sm font-normal text-center">
                  {slotsError}
                </div>
              )}

              {/* slots */}
              {!slotsLoading && !slotsError && horariosAll.length > 0 && (() => {
                const hotHoras      = new Set(horariosHot.map(h => h.hora));
                const horariosExtra = horariosAll.filter(h => !hotHoras.has(h.hora));

                return (
                  <div>
                    {horariosHot.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                          {horariosHot.map((h, i) => (
                            <SlotButton
                              key={`hot-${i}`}
                              slot={h}
                              isSelected={selectedSlot?.hora === h.hora}
                              onClick={handleSelectSlot}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAll(v => !v)}
                          className="w-full py-2.5 rounded-full border border-gray-700 bg-dark-200 text-gray-300 text-sm font-normal uppercase hover:border-gray-500 hover:text-white transition-colors"
                        >
                          {showAll ? 'OCULTAR HORÁRIOS' : 'VER MAIS HORÁRIOS'}
                        </button>

                        {showAll && horariosExtra.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                            {horariosExtra.map((h, i) => (
                              <SlotButton
                                key={`extra-${i}`}
                                slot={h}
                                isSelected={selectedSlot?.hora === h.hora}
                                onClick={handleSelectSlot}
                              />
                            ))}
                          </div>
                        )}

                        {showAll && horariosExtra.length === 0 && (
                          <p className="text-center text-xs text-gray-600 mt-3">
                            Todos os horários disponíveis já estão listados acima.
                          </p>
                        )}
                      </>
                    ) : (
                      /* sem zona de calor: mostra todos direto */
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {horariosAll.map((h, i) => (
                          <SlotButton
                            key={`all-${i}`}
                            slot={h}
                            isSelected={selectedSlot?.hora === h.hora}
                            onClick={handleSelectSlot}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── resumo + confirmar (aparece quando slot selecionado) ── */}
          {selectedSlot && (
            <div ref={resumeRef} className="bg-dark-200 border border-gray-800 rounded-custom p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Resumo</div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">PROFISSIONAL</span>
                  <span className="text-white">{profissional?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">DATA</span>
                  <span className="text-white">{formatBR(selectedDay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HORÁRIO</span>
                  <span className="text-primary font-normal">{selectedSlot.hora}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">DURAÇÃO</span>
                  <span className="text-white">{(Number(entrega?.duracao_minutos) || 0) + FOLGA} MIN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">VALOR</span>
                  <span className="text-primary">R$ {valorExibido}</span>
                </div>
              </div>

              {confirmError && (
                <div className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded p-2">
                  {confirmError}
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {confirming
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> CONFIRMANDO...</>
                  : <><Check className="w-4 h-4" /> CONFIRMAR AGENDAMENTO</>
                }
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── SlotButton ───────────────────────────────────────────────────────────────

function SlotButton({ slot, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(slot)}
      className={[
        'relative p-3 rounded-custom transition-all border uppercase font-normal text-center',
        isSelected
          ? 'bg-primary text-black border-primary'
          : slot.isRaio
            ? 'bg-dark-200 border-gray-800 hover:border-primary text-white'
            : slot.isHeat
              ? 'bg-dark-200 border-primary/40 text-primary hover:bg-primary/10'
              : 'bg-dark-200 border-gray-800 hover:border-primary text-gray-300',
      ].join(' ')}
    >
      {slot.isRaio && !isSelected && (
        <Zap className="w-3 h-3 text-primary absolute top-1 right-1" />
      )}
      <div className="text-lg normal-case">{slot.hora}</div>
      <div className="text-[10px] text-gray-500 normal-case">{(Number(slot.duracaoMin) || 0) + FOLGA} MIN</div>
    </button>
  );
}
