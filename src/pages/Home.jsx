import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';

const SUPORTE_PHONE_E164 = '5533999037979';
const SUPORTE_MSG = 'Olá, preciso de ajuda. Pode me orientar?';
const SUPORTE_HREF = `https://wa.me/${SUPORTE_PHONE_E164}?text=${encodeURIComponent(SUPORTE_MSG)}`;

function SearchBox({ searchOpen, setSearchOpen, searchTerm, setSearchTerm, resultadosBusca, setResultadosBusca, buscando }) {
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const fn = (e) => {
      if (!wrapRef.current?.contains(e.target)) {
        setSearchOpen(false); setSearchTerm(''); setResultadosBusca([]);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [searchOpen, setResultadosBusca, setSearchOpen, setSearchTerm]);

  return (
    <div ref={wrapRef} className="relative">
      <div className={[
        'relative flex items-center overflow-hidden rounded-full transition-all duration-300 ease-out border',
        searchOpen
          ? 'w-[min(22rem,calc(100vw-2rem))] border-white/15 bg-white/5 backdrop-blur-md'
          : 'w-10 border-transparent bg-transparent',
      ].join(' ')}>
        <button
          type="button"
          onClick={() => { if (searchOpen && !searchTerm) { setSearchOpen(false); return; } setSearchOpen(true); }}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-500 hover:text-white transition-colors"
          aria-label="Pesquisar"
        >
          <Search strokeWidth={1.3} className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="busque negócio ou profissional"
          className={[
            'bg-transparent pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-all duration-300',
            searchOpen ? 'w-full opacity-100' : 'w-0 opacity-0',
          ].join(' ')}
        />
        {buscando && (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 rounded-full border border-[#D4A017] border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {searchOpen && resultadosBusca.length > 0 && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl">
          {resultadosBusca.map((r, i) => (
            <Link
              key={`${r.tipo}-${r.slug || r.negocios?.slug}-${i}`}
              to={`/v/${r.tipo === 'negocio' ? r.slug : r.negocios?.slug}`}
              onClick={() => { setSearchOpen(false); setSearchTerm(''); setResultadosBusca([]); }}
              className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 transition-colors hover:bg-white/5 last:border-b-0"
            >
              <div>
                <div className="text-sm text-white">{r.nome}</div>
                {r.tipo === 'profissional' && r.negocios?.nome && (
                  <div className="mt-0.5 text-xs text-gray-500">{r.negocios.nome}</div>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-widest text-gray-600">
                {r.tipo === 'negocio' ? 'Negócio' : 'Profissional'}
              </span>
            </Link>
          ))}
        </div>
      )}

      {searchOpen && !buscando && searchTerm.trim().length >= 3 && resultadosBusca.length === 0 && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#0a0a0a]/95 px-5 py-4 text-sm text-gray-500 shadow-2xl backdrop-blur-xl">
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  );
}

export default function Home({ user, userType, onLogout }) {
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando]           = useState(false);
  const { showMessage } = useFeedback();
  const isLogged = !!user && !!userType;

  useEffect(() => {
    let cancelled = false;
    const buscar = async () => {
      const term = String(searchTerm || '').trim();
      if (term.length < 3) { if (!cancelled) { setResultadosBusca([]); setBuscando(false); } return; }
      if (!cancelled) setBuscando(true);
      try {
        const [{ data: negocios, error: nErr }, { data: profissionais, error: pErr }] = await Promise.all([
          supabase.from('negocios').select('nome, slug').ilike('nome', `%${term}%`).limit(5),
          supabase.from('profissionais').select('nome, negocios(nome, slug)').eq('status', 'ativo').ilike('nome', `%${term}%`).limit(5),
        ]);
        if (nErr || pErr) throw nErr || pErr;
        if (cancelled) return;
        const profOk = (profissionais || []).filter(p => p?.negocios?.slug);
        setResultadosBusca([
          ...(negocios || []).map(n => ({ ...n, tipo: 'negocio' })),
          ...profOk.map(p => ({ ...p, tipo: 'profissional' })),
        ]);
      } catch {
        if (cancelled) return;
        showMessage('home.search_failed_support');
        setResultadosBusca([]);
      } finally { if (!cancelled) setBuscando(false); }
    };
    const t = setTimeout(buscar, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchTerm, showMessage]);

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        :root { --gold: #C9A84C; --gold-dim: rgba(201,168,76,0.12); --gold-line: rgba(201,168,76,0.22); }

        .gold { color: var(--gold); }
        .border-gold { border-color: var(--gold-line); }

        .pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 999px;
          border: 1px solid var(--gold-line);
          font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
          color: var(--gold);
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 32px; border-radius: 4px;
          background: var(--gold); color: #080808;
          font-size: 13px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
          transition: opacity .2s;
        }
        .btn-primary:hover { opacity: .88; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 13px 32px; border-radius: 4px;
          border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.7);
          font-size: 13px; font-weight: 400; letter-spacing: .06em; text-transform: uppercase;
          transition: border-color .2s, color .2s;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,.3); color: #fff; }

        .feature-card {
          padding: 36px 32px; border: 1px solid rgba(255,255,255,.07); border-radius: 6px;
          transition: border-color .25s;
        }
        .feature-card:hover { border-color: var(--gold-line); }

        .serif { font-family: 'DM Serif Display', Georgia, serif; }

        .divider { border: none; border-top: 1px solid rgba(255,255,255,.07); }

        .stat-block { border-left: 1px solid var(--gold-line); padding-left: 24px; }

        .ticker-wrap { overflow: hidden; white-space: nowrap; }
        .ticker-inner { display: inline-flex; animation: ticker 40s linear infinite; }
        .ticker-inner:hover { animation-play-state: paused; }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @media(prefers-reduced-motion:reduce){ .ticker-inner{animation:none} }

        .index-num {
          font-size: 11px; letter-spacing: .1em; color: rgba(255,255,255,.25);
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      <div className="ticker-wrap h-9 flex items-center border-b border-white/5 bg-[#050505]">
        <div className="ticker-inner">
          {[1,2].map(i => (
            <span key={i} aria-hidden={i===2} className="inline-flex items-center">
              {['Agenda inteligente','Vitrine pública','Múltiplos serviços','Métricas reais','Equipes e parceiros','Lembretes automáticos','Sem app para baixar'].map((t,j) => (
                <span key={j} className="inline-flex items-center gap-6 mx-8">
                  <span className="text-[11px] tracking-widest uppercase text-gray-500">{t}</span>
                  <span className="text-gray-700">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080808]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/" className="text-sm font-medium tracking-[.18em] uppercase">COMVAGA</Link>
          <div className="flex items-center gap-4">
            <SearchBox
              searchOpen={searchOpen} setSearchOpen={setSearchOpen}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              resultadosBusca={resultadosBusca} setResultadosBusca={setResultadosBusca}
              buscando={buscando}
            />
            {isLogged ? (
              <Link
                to={userType === 'professional' ? '/dashboard' : '/minha-area'}
                className="text-xs tracking-widest uppercase text-gray-400 hover:text-white transition-colors"
              >
                {userType === 'professional' ? 'Dashboard' : 'Minha área'}
              </Link>
            ) : (
              <Link to="/login" className="text-xs tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
                Entrar
              </Link>
            )}
            <Link to="/cadastro" className="btn-primary !py-2 !px-5 !text-[11px]">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-28 lg:pt-32 lg:pb-36">
        <div className="max-w-3xl">
          <span className="pill mb-8 inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
            Gestão de agenda e vitrine para profissionais
          </span>

          <h1 className="serif text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.08] font-normal mb-8 text-white">
            Mais ocupação.<br />
            Menos erro.<br />
            <span className="gold italic">Melhor apresentação.</span>
          </h1>

          <p className="text-[15px] leading-relaxed text-gray-400 max-w-xl mb-12">
            O Comvaga organiza sua operação de ponta a ponta — da vitrine pública que converte ao painel que mostra quanto você faturou. Bloqueio automático de conflitos, encaixe inteligente após cancelamentos e métricas reais de desempenho. Tudo em um link, sem baixar nada.
          </p>

          <div className="flex flex-wrap gap-3 mb-16">
            <Link to="/cadastro" className="btn-primary">
              Criar minha vitrine grátis <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-ghost"
            >
              Como funciona
            </button>
          </div>

          <div className="flex flex-wrap gap-10">
            <div className="stat-block">
              <div className="text-2xl font-light text-white mb-1">Zero conflitos</div>
              <div className="text-xs tracking-widest uppercase text-gray-500">Bloqueio automático de sobreposição</div>
            </div>
            <div className="stat-block">
              <div className="text-2xl font-light text-white mb-1">Tempo real</div>
              <div className="text-xs tracking-widest uppercase text-gray-500">Status operacional por profissional</div>
            </div>
            <div className="stat-block">
              <div className="text-2xl font-light text-white mb-1">Sem app</div>
              <div className="text-xs tracking-widest uppercase text-gray-500">Link público, acesso imediato</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider max-w-7xl mx-auto" />

      {/* ── Para o cliente / Para o negócio ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-0 lg:gap-0">
        <div className="pr-0 lg:pr-16 pb-16 lg:pb-0 lg:border-r border-white/7">
          <span className="index-num block mb-6">01</span>
          <h2 className="serif text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal leading-tight mb-6 text-white">
            Para quem agenda
          </h2>
          <p className="text-[15px] text-gray-400 leading-relaxed mb-8">
            O cliente entra na vitrine, vê os profissionais disponíveis, os serviços com preço e duração, fotos do espaço, avaliações reais e agenda sem complicação. Pode favoritar negócios, acompanhar seus agendamentos, cancelar quando precisar e adicionar o compromisso direto na agenda do Google.
          </p>
          <ul className="space-y-3">
            {[
              'Horários reais — só os que cabem, sem sobreposição',
              'Múltiplos serviços em sequência no mesmo fluxo',
              'Confirmação com lembrete automático antes do horário',
              'Depoimentos, fotos e avaliações dos profissionais',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--gold)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="pl-0 lg:pl-16 pt-16 lg:pt-0">
          <span className="index-num block mb-6">02</span>
          <h2 className="serif text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal leading-tight mb-6 text-white">
            Para o negócio
          </h2>
          <p className="text-[15px] text-gray-400 leading-relaxed mb-8">
            O profissional cadastra serviços com duração real, define horários de trabalho, almoço e dias ativos, monta sua equipe e publica uma vitrine com link exclusivo. A partir daí, o sistema cuida da agenda sozinho — e entrega visão comercial completa do que está acontecendo.
          </p>
          <ul className="space-y-3">
            {[
              'Faturamento, ticket médio e taxa de cancelamento',
              'Taxa de conversão e desempenho por profissional',
              'Gestão de equipe, aprovação de parceiros e inativação',
              'Mais de um negócio na mesma conta',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--gold)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr className="divider max-w-7xl mx-auto" />

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="mb-16">
          <span className="index-num block mb-4">03</span>
          <h2 className="serif text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal text-white">
            Como funciona
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/7 rounded-lg overflow-hidden">
          {[
            {
              n: '01',
              title: 'Cadastre seus serviços',
              text: 'Defina nome, duração real e preço. O sistema usa esses dados para calcular horários precisos — sem blocos fixos, sem margem de erro.',
            },
            {
              n: '02',
              title: 'Publique sua vitrine',
              text: 'Um link exclusivo com seus profissionais, serviços, fotos, redes sociais e avaliações. O cliente agenda diretamente, sem baixar nada.',
            },
            {
              n: '03',
              title: 'A agenda se ajusta sozinha',
              text: 'Novo agendamento, cancelamento ou troca — o sistema recalcula tudo automaticamente. Cancelamentos viram novas oportunidades de encaixe.',
            },
          ].map(({ n, title, text }) => (
            <div key={n} className="bg-[#0d0d0d] p-10">
              <div className="index-num mb-6">{n}</div>
              <h3 className="text-base font-medium text-white mb-3">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Cancelamento callout */}
        <div className="mt-4 border border-[var(--gold-line)] rounded-lg p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full border border-[var(--gold-line)] flex items-center justify-center">
              <span className="gold text-lg font-light">↺</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2 uppercase tracking-widest">Encaixe inteligente após cancelamentos</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
              Quando um cliente cancela, o tempo não vira buraco. O sistema fragmenta o espaço livre em novas vagas dimensionadas conforme seus serviços e as exibe na vitrine com destaque. Mais ocupação, sem nenhum controle manual.
            </p>
          </div>
        </div>
      </section>

      <hr className="divider max-w-7xl mx-auto" />

      {/* ── Funcionalidades ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="mb-16">
          <span className="index-num block mb-4">04</span>
          <h2 className="serif text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal text-white">
            O que está incluído
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Vitrine pública personalizada', text: 'Logo, galeria de fotos, tema claro ou escuro, redes sociais, depoimentos e link exclusivo para compartilhar.' },
            { title: 'Status operacional em tempo real', text: 'Aberto, fechado, almoço, inativo — o cliente vê o status atual de cada profissional antes de agendar.' },
            { title: 'Múltiplos serviços em sequência', text: 'O cliente seleciona mais de um serviço no mesmo fluxo e o sistema calcula o bloco completo automaticamente.' },
            { title: 'Métricas reais de operação', text: 'Faturamento diário, ticket médio, taxa de cancelamento, taxa de conversão e desempenho por profissional.' },
            { title: 'Gestão de equipe e parceiros', text: 'Convide profissionais, aprove ou reprove candidaturas, ative e inative membros da equipe com controle total.' },
            { title: 'Lembretes automáticos', text: 'O cliente recebe lembrete antes do horário marcado. Menos falta, menos retrabalho, mais pontualidade.' },
            { title: 'Agenda do Google integrada', text: 'Após agendar, o cliente pode adicionar o compromisso diretamente à própria agenda com um clique.' },
            { title: 'Mais de um negócio por conta', text: 'Gerencie múltiplos negócios na mesma conta, cada um com sua vitrine, equipe e métricas independentes.' },
            { title: 'Funciona para qualquer operação', text: 'Beleza, saúde, consultas, aulas, treinos — a estrutura se adapta ao tipo de serviço que você oferece.' },
          ].map(({ title, text }, i) => (
            <div key={i} className="feature-card">
              <h3 className="text-sm font-medium text-white mb-3">{title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider max-w-7xl mx-auto" />

      {/* ── CTA final ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-2xl">
          <span className="index-num block mb-6">05</span>
          <h2 className="serif text-[clamp(2rem,4vw,3.2rem)] font-normal leading-tight text-white mb-6">
            Sua vitrine está a um cadastro de distância.
          </h2>
          <p className="text-[15px] text-gray-400 leading-relaxed mb-10">
            Comece grátis. Configure sua vitrine, adicione seus serviços e compartilhe o link com seus clientes. O sistema faz o resto.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/cadastro" className="btn-primary">
              Criar minha conta grátis <ArrowUpRight strokeWidth={1.5} className="w-4 h-4" />
            </Link>
            <a href={SUPORTE_HREF} target="_blank" rel="noreferrer" className="btn-ghost">
              Falar com suporte
            </a>
          </div>
          <p className="mt-6 text-xs text-gray-600">Funciona para barbearias, salões, clínicas, estúdios, personal trainers e mais.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="text-xs tracking-[.16em] uppercase text-white mb-5">Produto</div>
              <ul className="space-y-2">
                <li><button type="button" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Como funciona</button></li>
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[.16em] uppercase text-white mb-5">Acesso</div>
              <ul className="space-y-2">
                {isLogged ? (
                  <>
                    <li><Link to={userType === 'professional' ? '/dashboard' : '/minha-area'} className="text-xs text-gray-600 hover:text-gray-300 transition-colors">{userType === 'professional' ? 'Dashboard' : 'Minha área'}</Link></li>
                    <li><button type="button" onClick={() => onLogout?.()} className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Sair</button></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Entrar</Link></li>
                    <li><Link to="/cadastro" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Cadastrar grátis</Link></li>
                    <li><Link to="/parceiro/login" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Login parceiro</Link></li>
                    <li><Link to="/parceiro/cadastro" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Cadastro parceiro</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[.16em] uppercase text-white mb-5">Empresa</div>
              <ul className="space-y-2">
                {['Sobre', 'Blog'].map(l => <li key={l}><a href="#" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[.16em] uppercase text-white mb-5">Legal</div>
              <ul className="space-y-2">
                {['Privacidade', 'Termos'].map(l => <li key={l}><a href="#" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">{l}</a></li>)}
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <span className="text-xs tracking-widest uppercase text-gray-700">Comvaga</span>
            <span className="text-xs text-gray-700">© 2026. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
