/**
 * BookingCalendar.jsx
 * Calendário de agendamento para uso na Vitrine.
 *
 * Props:
 *   profissional  — objeto profissional completo (id, nome, dias_trabalho, …)
 *   entrega       — objeto entrega (id, nome, duracao_minutos, preco, preco_promocional)
 *   todayISO      — "YYYY-MM-DD" vindo de serverNow.date — âncora do banco
 *   negocioId     — uuid do negócio
 *   clienteId     — uuid do cliente logado
 *   onConfirm     — (slot: { inicio, fim, label, dataISO }) => void
 *   onClose       — () => void — volta para o step anterior (selecionar serviços)
 *
 * Views internas:
 *   'calendar'  → usuário navega pelo calendário e escolhe um dia
 *   'slots'     → zona de calor (is_heat/is_raio) + todos os horários
 *   'confirm'   → resumo + botão confirmar
 *
 * Regras do banco (rpc_get_slots_v4):
 *   is_heat  → "zona de calor": slot que emenda início/fim de turno, pós-almoço
 *              ou adjacente a agendamento existente — evita buracos na agenda
 *   is_raio  → slot dentro de janela de cancelamento — horário reaproveitado
 *              aparece com ícone ⚡ (Zap)
 *   Um slot pode ter is_heat e is_raio simultaneamente.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, X, Check,
  Loader2, Zap, ArrowLeft,
} from 'lucide-react';
import { supabase } from '../supabase';

// ─── helpers de data ──────────────────────────────────────────────────────────

function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

function toISO(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayBR(iso) {
  const p = parseISO(iso);
  if (!p) return '';
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}`;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function firstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay(); // 0 = dom
}

function isoLt(a, b) { return String(a) < String(b); }
function isoEq(a, b) { return String(a) === String(b); }

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h * 60) + (m || 0);
}

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const WEEKDAY_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const FOLGA_MINUTOS = 5;

// ─── sub-componentes ──────────────────────────────────────────────────────────

function CalendarGrid({ viewYear, viewMonth, todayISO, selectedISO, diasTrabalho, onSelectDay }) {
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow  = firstDayOfMonth(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((l, i) => (
          <div key={i} className="text-center text-[10px] text-gray-500 uppercase py-1 select-none">{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;

          const iso        = toISO(viewYear, viewMonth, day);
          const dow        = (startDow + day - 1) % 7;
          const isPast     = isoLt(iso, todayISO);
          const isToday    = isoEq(iso, todayISO);
          const isWorkday  = Array.isArray(diasTrabalho) && diasTrabalho.includes(dow);
          const isSelected = selectedISO && isoEq(iso, selectedISO);
          const isDisabled = isPast || !isWorkday;

          return (
            <button
              key={day}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelectDay(iso)}
              className={[
                'h-9 w-full flex items-center justify-center text-sm font-normal transition-colors select-none',
                // dia selecionado: círculo amarelo preenchido
                isSelected
                  ? 'rounded-full bg-primary text-black'
                  // hoje (não selecionado e disponível): apenas número amarelo — sem borda, sem fundo
                  : isToday && !isDisabled
                    ? 'rounded-full text-primary'
                    : isDisabled
                      ? 'text-gray-700 cursor-not-allowed'
                      : 'rounded-full text-gray-300 hover:bg-dark-200 hover:text-white cursor-pointer',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// botão de slot individual
function SlotButton({ slot, isSelected, onClick }) {
  const isRaio = !!slot.isRaio;
  const isHeat = !!slot.isHeat;

  return (
    <button
      type="button"
      onClick={() => onClick(slot)}
      className={[
        'relative p-3 rounded-custom transition-all border uppercase font-normal text-center',
        isSelected
          ? 'bg-primary text-black border-primary'
          : isRaio
            // raio: borda normal, ícone ⚡ no canto
            ? 'bg-dark-200 border-gray-800 hover:border-primary text-white'
            : isHeat
              // zona de calor: borda amarela suave
              ? 'bg-dark-200 border-primary/40 text-primary hover:bg-primary/10'
              : 'bg-dark-200 border-gray-800 hover:border-primary text-gray-300',
      ].join(' ')}
    >
      {/* ícone raio — horário reaproveitado de cancelamento */}
      {isRaio && !isSelected && (
        <Zap className="w-3 h-3 text-primary absolute top-1 right-1" />
      )}
      <div className="text-lg normal-case">{slot.hora}</div>
      <div className="text-[10px] text-gray-500 normal-case">
        {slot.precisaMinutos} MIN
      </div>
    </button>
  );
}

// cabeçalho reutilizável
function Header({ title, entrega, profissional, valorExibido, onBack, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 p-1.5 rounded-button text-gray-400 hover:text-primary hover:bg-dark-200 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
          <div className="font-normal text-white truncate">{entrega?.nome}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {profissional?.nome}
            {entrega?.duracao_minutos && (
              <span className="ml-2 text-gray-600">• {entrega.duracao_minutos} min</span>
            )}
            <span className="ml-2 text-primary">• R$ {valorExibido}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 ml-4 p-1.5 rounded-button text-gray-500 hover:text-white hover:bg-dark-200 transition-colors"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

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

  // view interna: 'calendar' | 'slots' | 'confirm'
  const [view, setView] = useState('calendar');

  // calendário
  const [viewYear,  setViewYear]  = useState(today?.year  ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(today?.month ?? (new Date().getMonth() + 1));

  // seleção
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // slots
  const [horariosAll,  setHorariosAll]  = useState([]);
  const [horariosHot,  setHorariosHot]  = useState([]);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError,   setSlotsError]   = useState(null);

  // confirmação
  const [confirming,   setConfirming]   = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  const containerRef = useRef(null);

  // fechar ao clicar fora — somente na view 'calendar'
  useEffect(() => {
    if (view !== 'calendar') return;
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [view, onClose]);

  // ── buscar slots ──────────────────────────────────────────────────────────

  const fetchSlots = useCallback(async (dayISO) => {
    if (!profissional?.id || !entrega?.duracao_minutos || !dayISO) return;

    setSlotsLoading(true);
    setSlotsError(null);
    setHorariosAll([]);
    setHorariosHot([]);
    setShowAllSlots(false);
    setSelectedSlot(null);

    try {
      const durServicos    = Number(entrega.duracao_minutos);
      const precisaMinutos = durServicos + FOLGA_MINUTOS;

      const { data: slotsV4, error: errV4 } = await supabase.rpc('rpc_get_slots_v4', {
        p_profissional_id: profissional.id,
        p_dia:             dayISO,
        p_entrega_min:     durServicos,
        p_folga_min:       FOLGA_MINUTOS,
        p_margem_min:      5,
        p_modo:            'todos',
      });
      if (errV4) throw errV4;

      const list = (slotsV4 || []).map(s => ({
        hora:          String(s.label || '').slice(0, 5),
        isHeat:        !!s.is_heat,
        isRaio:        !!s.is_raio,
        inicio:        s.inicio || null,
        fim:           s.fim    || null,
        cabe:          true,
        precisaMinutos,
        maxMinutos:    precisaMinutos,
      }));

      // desduplicação por hora — mantém de maior rank
      const rank = (h) => (h?.isRaio ? 3 : h?.isHeat ? 2 : 1);
      const uniq = new Map();
      for (const h of list) {
        if (!h.hora) continue;
        if (!uniq.has(h.hora)) { uniq.set(h.hora, h); continue; }
        const prev = uniq.get(h.hora);
        if (rank(h) > rank(prev)) uniq.set(h.hora, h);
        else if (rank(h) === rank(prev) && h.isRaio && !prev.isRaio) uniq.set(h.hora, h);
      }

      const finalList = Array.from(uniq.values())
        .sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));

      // zona de calor = is_heat OU is_raio
      const hot = finalList.filter(x => x.isHeat || x.isRaio);

      setHorariosAll(finalList);
      setHorariosHot(hot);

      if (!finalList.length) setSlotsError('Nenhum horário disponível neste dia.');
    } catch (e) {
      console.error('fetchSlots:', e);
      setSlotsError('Erro ao buscar horários. Tente outro dia.');
    } finally {
      setSlotsLoading(false);
    }
  }, [profissional?.id, entrega?.duracao_minutos]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSelectDay = (iso) => {
    setSelectedDay(iso);
    fetchSlots(iso);
    setView('slots');
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setConfirmError(null);
    setView('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedDay || !clienteId || !negocioId) return;
    setConfirming(true);
    setConfirmError(null);

    try {
      const toTimeSP = (ts) => {
        const d = new Date(ts);
        const parts = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).formatToParts(d);
        const h = parts.find(p => p.type === 'hour')?.value   ?? '00';
        const m = parts.find(p => p.type === 'minute')?.value ?? '00';
        return `${h}:${m}`;
      };

      const horario_inicio = toTimeSP(selectedSlot.inicio);
      const horario_fim    = toTimeSP(selectedSlot.fim);
      const preco_final    = entrega.preco_promocional
        ? Number(entrega.preco_promocional)
        : Number(entrega.preco ?? 0);

      const { error } = await supabase.from('agendamentos').insert([{
        negocio_id:      negocioId,
        profissional_id: profissional.id,
        cliente_id:      clienteId,
        entrega_id:      entrega.id,
        data:            selectedDay,
        horario_inicio,
        horario_fim,
        status:          'agendado',
        preco_final,
      }]);

      if (error) throw error;

      onConfirm?.({
        inicio:  selectedSlot.inicio,
        fim:     selectedSlot.fim,
        label:   selectedSlot.hora,
        dataISO: selectedDay,
      });
    } catch (e) {
      console.error('handleConfirm:', e);
      const msg = String(e?.message || '').toLowerCase();
      const isOverlap =
        String(e?.code || '') === '23P01' ||
        msg.includes('overlap') ||
        msg.includes('sobrepos') ||
        msg.includes('exclusion');
      setConfirmError(
        isOverlap
          ? 'Alguém acabou de reservar esse horário. Escolha outro.'
          : 'Não foi possível confirmar. Tente novamente.'
      );
    } finally {
      setConfirming(false);
    }
  };

  // navegação de mês
  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  const canGoPrev    = !(viewYear === today?.year && viewMonth === today?.month);
  const diasTrabalho = profissional?.dias_trabalho ?? [1, 2, 3, 4, 5, 6];
  const valorExibido = entrega?.preco_promocional
    ? Number(entrega.preco_promocional).toFixed(2)
    : Number(entrega?.preco ?? 0).toFixed(2);

  // props comuns do Header
  const headerProps = { entrega, profissional, valorExibido, onClose };

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: CALENDAR
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'calendar') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div
          ref={containerRef}
          className="bg-dark-100 border border-gray-800 rounded-custom w-full max-w-md max-h-[92vh] overflow-y-auto"
        >
          <Header {...headerProps} title="Escolha a data" onBack={null} />

          <div className="px-6 py-5">
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

            <CalendarGrid
              viewYear={viewYear}
              viewMonth={viewMonth}
              todayISO={todayISO}
              selectedISO={selectedDay}
              diasTrabalho={diasTrabalho}
              onSelectDay={handleSelectDay}
            />

            {/* legenda */}
            <div className="flex items-center gap-4 mt-4 text-[11px] text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                disponível
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />
                indisponível
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: SLOTS
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'slots') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-dark-100 border border-gray-800 rounded-custom w-full max-w-md max-h-[92vh] overflow-y-auto">
          <Header
            {...headerProps}
            title={`Horários — ${formatDisplayBR(selectedDay)}`}
            onBack={() => setView('calendar')}
          />

          <div className="px-6 py-5">

            {/* loading */}
            {slotsLoading && (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Buscando horários...</span>
              </div>
            )}

            {/* erro / vazio */}
            {!slotsLoading && slotsError && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 mb-4">{slotsError}</p>
                <button
                  type="button"
                  onClick={() => setView('calendar')}
                  className="text-primary text-sm font-normal uppercase hover:text-yellow-400"
                >
                  ← Escolher outro dia
                </button>
              </div>
            )}

            {/* slots */}
            {!slotsLoading && !slotsError && horariosAll.length > 0 && (
              <>
                {/* ── ZONA DE CALOR ── */}
                {horariosHot.length > 0 ? (
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-4 mb-4">
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 font-normal uppercase mb-1">
                        HORÁRIOS INTELIGENTES
                      </div>
                      <div className="text-sm text-gray-400 font-normal">
                        Lista priorizada pelo sistema.
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {horariosHot.map((h, i) => (
                        <SlotButton
                          key={`hot-${i}`}
                          slot={h}
                          isSelected={
                            selectedSlot?.hora   === h.hora &&
                            selectedSlot?.inicio === h.inicio
                          }
                          onClick={handleSelectSlot}
                        />
                      ))}
                    </div>

                    {/* expandir todos */}
                    <button
                      type="button"
                      onClick={() => setShowAllSlots(v => !v)}
                      className="w-full mt-4 px-4 py-3 rounded-button border bg-dark-100 border-gray-800 text-gray-200 uppercase font-normal text-sm"
                    >
                      {showAllSlots ? 'OCULTAR HORÁRIOS' : 'VER MAIS HORÁRIOS'}
                    </button>

                    {showAllSlots && (
                      <div className="mt-4">
                        <div className="text-xs text-gray-500 font-normal uppercase mb-3">
                          TODOS OS HORÁRIOS
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {horariosAll.map((h, i) => (
                            <SlotButton
                              key={`all-${i}`}
                              slot={h}
                              isSelected={
                                selectedSlot?.hora   === h.hora &&
                                selectedSlot?.inicio === h.inicio
                              }
                              onClick={handleSelectSlot}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── SEM ZONA DE CALOR: todos direto ── */
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-4 mb-4">
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 font-normal uppercase mb-1">
                        HORÁRIOS DISPONÍVEIS
                      </div>
                      <div className="text-sm text-gray-400 font-normal">
                        Lista completa calculada pelo sistema.
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {horariosAll.map((h, i) => (
                        <SlotButton
                          key={`all-${i}`}
                          slot={h}
                          isSelected={
                            selectedSlot?.hora   === h.hora &&
                            selectedSlot?.inicio === h.inicio
                          }
                          onClick={handleSelectSlot}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* legenda dos ícones */}
                <div className="flex flex-wrap items-center gap-4 mt-1 text-[11px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm border border-primary/40 inline-block bg-dark-200" />
                    zona de calor
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    horário reaproveitado
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: CONFIRM
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-dark-100 border border-gray-800 rounded-custom w-full max-w-md max-h-[92vh] overflow-y-auto">
          <Header
            {...headerProps}
            title="Confirmar agendamento"
            onBack={() => { setView('slots'); setConfirmError(null); }}
          />

          <div className="px-6 py-5">
            {/* resumo */}
            <div className="bg-dark-200 border border-gray-800 rounded-custom p-4 space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-normal">PROFISSIONAL:</span>
                <span className="font-normal text-white">{profissional?.nome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-normal">DATA:</span>
                <span className="font-normal text-white">{formatDisplayBR(selectedDay)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-normal">HORÁRIO:</span>
                <span className="font-normal text-primary text-base">{selectedSlot?.hora}</span>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-normal">SERVIÇO:</span>
                  <span className="font-normal text-gray-200 text-right max-w-[60%] leading-snug">
                    {entrega?.nome}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-normal">DURAÇÃO:</span>
                <span className="font-normal text-white">{entrega?.duracao_minutos} MIN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-normal">VALOR:</span>
                <span className="font-normal text-primary text-lg">R$ {valorExibido}</span>
              </div>
            </div>

            {/* erro de confirmação */}
            {confirmError && (
              <div className="text-xs text-red-400 mb-4 bg-red-500/10 border border-red-500/20 rounded-custom p-3">
                {confirmError}
                {confirmError.includes('reservar') && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmError(null);
                      fetchSlots(selectedDay);
                      setView('slots');
                    }}
                    className="block mt-2 text-primary underline"
                  >
                    Ver horários atualizados
                  </button>
                )}
              </div>
            )}

            {/* confirmar */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {confirming
                ? <><Loader2 className="w-4 h-4 animate-spin" /> CONFIRMANDO...</>
                : <><Check className="w-4 h-4" /> CONFIRMAR AGENDAMENTO</>
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
