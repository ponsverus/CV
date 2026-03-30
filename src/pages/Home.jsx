import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Zap, TrendingUp, Shield, Users, Clock, CheckCircle, Star } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';

const SUPORTE_PHONE_E164 = '5533999037979';
const SUPORTE_MSG = 'Ola, preciso de ajuda. Pode me orientar?';
const SUPORTE_HREF =
  `https://wa.me/${SUPORTE_PHONE_E164}?text=${encodeURIComponent(SUPORTE_MSG)}`;

function SearchBox({
  searchOpen,
  setSearchOpen,
  searchTerm,
  setSearchTerm,
  resultadosBusca,
  setResultadosBusca,
  buscando,
}) {
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const handlePointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setSearchOpen(false);
        setSearchTerm('');
        setResultadosBusca([]);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [searchOpen, setResultadosBusca, setSearchOpen, setSearchTerm]);

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={[
          'relative flex items-center overflow-hidden rounded-full bg-black/40 backdrop-blur-md transition-all duration-300 ease-out',
          searchOpen ? 'w-[min(24rem,calc(100vw-2rem))] border border-white/10 shadow-[0_0_0_1px_rgba(255,209,26,0.18)]' : 'w-11 border border-transparent bg-transparent backdrop-blur-0',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => {
            if (searchOpen && !searchTerm) {
              setSearchOpen(false);
              return;
            }
            setSearchOpen(true);
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-gray-300 transition-colors hover:text-primary"
          aria-label="Pesquisar"
        >
          <Search strokeWidth={1.6} className="h-[18px] w-[18px]" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="BUSQUE: NEGOCIO OU PROFISSIONAL :)"
          className={[
            'bg-transparent pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all duration-300',
            searchOpen ? 'w-full opacity-100' : 'w-0 opacity-0',
          ].join(' ')}
        />

        {buscando && (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full border border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {searchOpen && resultadosBusca.length > 0 && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[3px] border border-white/10 bg-dark-100/95 shadow-2xl backdrop-blur-xl">
          {resultadosBusca.map((r, i) => (
            <Link
              key={`${r.tipo}-${r.slug || r.negocios?.slug}-${i}`}
              to={`/v/${r.tipo === 'negocio' ? r.slug : r.negocios?.slug}`}
              onClick={() => {
                setSearchOpen(false);
                setSearchTerm('');
                setResultadosBusca([]);
              }}
              className="block border-b border-white/5 px-5 py-4 transition-colors hover:bg-dark-200/90 last:border-b-0"
            >
              <div className="font-bold text-white">{r.nome}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-gray-500">
                {r.tipo === 'negocio' ? 'Negocio' : 'Profissional'}
              </div>
              {r.tipo === 'profissional' && r.negocios?.nome && (
                <div className="mt-1 text-sm text-gray-400">{r.negocios.nome}</div>
              )}
            </Link>
          ))}
        </div>
      )}

      {searchOpen && !buscando && searchTerm.trim().length >= 3 && resultadosBusca.length === 0 && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-[3px] border border-white/10 bg-dark-100/95 px-5 py-4 text-sm text-gray-400 shadow-2xl backdrop-blur-xl">
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  );
}

export default function Home({ user, userType, onLogout }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const { showMessage } = useFeedback();

  const isLogged = !!user && !!userType;

  useEffect(() => {
    let cancelled = false;

    const buscar = async () => {
      const term = String(searchTerm || '').trim();

      if (term.length < 3) {
        if (!cancelled) {
          setResultadosBusca([]);
          setBuscando(false);
        }
        return;
      }

      if (!cancelled) setBuscando(true);

      try {
        const [{ data: negocios, error: nErr }, { data: profissionais, error: pErr }] =
          await Promise.all([
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
      } catch (error) {
        if (cancelled) return;
        console.error('Erro na busca:', error);
        showMessage('home.search_failed_support');
        setResultadosBusca([]);
      } finally {
        if (!cancelled) setBuscando(false);
      }
    };

    const timer = setTimeout(buscar, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, showMessage]);

  const handleLogoutClick = () => onLogout?.();

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="relative z-50 w-full bg-yellow-400 border-b border-yellow-300/50 overflow-hidden h-10 flex items-center">
        <div className="announcement-bar-wrapper flex">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="announcement-bar-track flex items-center shrink-0 whitespace-nowrap"
              aria-hidden={i === 2}
            >
              {[...Array(14)].map((_, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-black font-bold text-sm uppercase mx-4">
                    CLIQUE PARA IR
                  </span>

                  <span className="text-black mx-4">•</span>

                  <a
                    href={SUPORTE_HREF}
                    target="_blank"
                    rel="noreferrer"
                    className="text-black font-normal text-sm uppercase hover:underline underline-offset-4 transition-all mx-4"
                  >
                    SUPORTE
                  </a>

                  <span className="text-black mx-4">•</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <style>{`
          @keyframes announcement-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .announcement-bar-wrapper {
            display: flex;
            width: max-content;
            animation: announcement-scroll 50s linear infinite;
          }

          .announcement-bar-wrapper:hover {
            animation-play-state: paused;
          }

          .announcement-bar-track a {
            position: relative;
            z-index: 10;
            cursor: pointer;
            display: inline-block;
          }

          @media (prefers-reduced-motion: reduce) {
            .announcement-bar-wrapper { animation: none; }
          }
        `}</style>
      </div>

      <header className="absolute top-16 left-0 w-full z-40 bg-transparent border-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-center h-16 sm:h-20">
            <Link to="/" className="flex items-center justify-center">
              <h1 className="text-2xl sm:text-3xl font-black">COMVAGA</h1>
            </Link>

            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <SearchBox
                searchOpen={searchOpen}
                setSearchOpen={setSearchOpen}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                resultadosBusca={resultadosBusca}
                setResultadosBusca={setResultadosBusca}
                buscando={buscando}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-yellow-600/10"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/15 border border-primary/20 rounded-button mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold text-sm">AGENDA INTELIGENTE, VITRINE E OPERACAO</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight drop-shadow-lg">
            SUA VITRINE,<br />
            <span className="bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
              SUA AGENDA PROTEGIDA
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-4xl mx-auto drop-shadow-md">
            O Comvaga une <span className="text-primary font-bold">vitrine profissional, agenda inteligente e gestao operacional</span> em um so sistema.
            Seus servicos sao publicados em um link proprio, o cliente agenda sem baixar nada e a logica da agenda libera apenas horarios realmente
            possiveis, bloqueia conflitos automaticamente e reaproveita cancelamentos como novas oportunidades de encaixe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/cadastro"
              className="px-10 py-5 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-black text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              CRIAR MINHA VITRINE <Zap className="w-5 h-5" />
            </Link>

            <button
              type="button"
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 bg-white/10 border border-white/20 text-white rounded-button font-bold text-lg hover:bg-white/20 backdrop-blur-sm"
            >
              VER O QUE ELE ENTREGA
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              ['LINK PROPRIO', 'vitrine publica com profissionais, servicos, fotos e redes'],
              ['AGENDA PROTEGIDA', 'bloqueio automatico de conflitos e encaixes inviaveis'],
              ['REAPROVEITAMENTO', 'cancelamentos voltam como novas vagas de encaixe'],
              ['VISAO DE NEGOCIO', 'faturamento, ticket medio, conversao e cancelamento'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-custom p-5 text-left hover:border-primary/30 transition-all">
                <div className="text-sm font-bold text-primary mb-2 uppercase tracking-[0.14em]">{title}</div>
                <div className="text-sm text-gray-400 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 -mt-2 sm:-mt-6 relative z-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-4">
          {[
            {
              title: 'PARA O PROFISSIONAL',
              text: 'Cadastre servicos, organize equipe, personalize a vitrine, publique ofertas e acompanhe o desempenho da operacao em tempo real.',
            },
            {
              title: 'PARA O CLIENTE',
              text: 'Escolha profissional, veja disponibilidade real, favorite vitrines, deixe depoimentos, acompanhe agendamentos e adicione o compromisso a agenda.',
            },
            {
              title: 'PARA O NEGOCIO',
              text: 'Aproveite melhor o tempo da equipe, reduza buracos na agenda, aprove pedidos pendentes e administre mais de um negocio na mesma conta.',
            },
          ].map(({ title, text }) => (
            <div key={title} className="bg-black/80 border border-white/10 rounded-custom p-6 backdrop-blur-xl">
              <div className="text-xs text-primary font-bold tracking-[0.18em] uppercase mb-3">{title}</div>
              <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="py-24 px-4 bg-dark-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              A CIENCIA <span className="text-primary">POR TRAS</span>
            </h2>
            <p className="text-xl text-gray-400">Como o sistema protege a operacao e melhora a experiencia de quem agenda</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-14">
            {[
              { num: 1, title: 'SERVICOS COM DURACAO REAL', text: 'Cada servico entra com tempo e valor proprios. A agenda deixa de operar em blocos fixos e passa a trabalhar com o tempo real de cada atendimento.' },
              { num: 2, title: 'VITRINE QUE CONVERTE', text: 'Seu cliente entra em um link proprio, ve profissionais, fotos, ofertas, avaliacoes e horarios livres reais. Sem baixar app, sem conversa manual para descobrir disponibilidade.' },
              { num: 3, title: 'AGENDA QUE SE REORGANIZA', text: 'Cada novo agendamento, cancelamento ou troca recalcula a disponibilidade. O sistema protege o que ja existe e reaproveita o que ficou livre.' }
            ].map(({ num, title, text }) => (
              <div key={num} className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 md:-top-10 md:-left-4 w-16 h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-primary/50 z-10">
                  {num}
                </div>
                <div className="bg-dark-200 border border-white/10 rounded-custom p-8 pt-14 md:pt-10">
                  <h3 className="text-2xl font-normal mb-3 text-white">{title}</h3>
                  <p className="text-gray-400 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-primary/15 to-yellow-600/10 border border-primary/20 rounded-custom p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/20 border border-primary/20 rounded-custom flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-normal mb-2 text-white">REAPROVEITAMENTO INTELIGENTE DE CANCELAMENTOS</h3>
                <p className="text-gray-300 leading-relaxed">
                  <span className="text-primary">Quando uma vaga cai, a agenda nao desperdiça o tempo.</span> O sistema recalcula o espaco livre e
                  devolve esse intervalo como novas oportunidades de encaixe, respeitando duracoes, margens e limites reais do profissional.
                  Isso transforma cancelamento em chance de venda, nao em buraco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-dark-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              VANTAGEM <span className="text-primary">MUTUA</span>
            </h2>
            <p className="text-xl text-gray-400">O que o produto ja entrega hoje para vender melhor, operar melhor e atender melhor</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: 'DASHBOARD DE OPERACAO', text: 'Acompanhe faturamento, ticket medio, conversao, cancelamentos e desempenho por profissional em diferentes recortes.' },
              { icon: Users, title: 'EQUIPE E PARCEIROS', text: 'Aprove acessos, ative ou inative profissionais, acompanhe status de trabalho e organize a operacao sem depender de controle externo.' },
              { icon: Shield, title: 'BLOQUEIO DE CONFLITOS', text: 'O cliente nao reserva um horario que invade outro atendimento, o almoco ou a janela real do profissional.' },
              { icon: Clock, title: 'ENCAIXE E LEMBRETE', text: 'Cancelamentos voltam como oportunidades de encaixe e o cliente ainda recebe lembrete proximo do horario agendado.' },
              { icon: Star, title: 'PROVA SOCIAL NA VITRINE', text: 'Depoimentos, favoritos, fotos, logo, redes sociais e ofertas ajudam a transformar a vitrine em uma pagina que converte.' },
              { icon: CheckCircle, title: 'EXPERIENCIA COMPLETA', text: 'O cliente pode agendar mais de um servico em sequencia, confirmar o horario e adicionar o compromisso a propria agenda.' }
            ].map(({ icon: Icon, title, text }, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-primary/8 to-yellow-600/8 border border-white/10 rounded-custom p-8 hover:border-primary/30 transition-all"
              >
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-custom flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-normal mb-3 text-white">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-r from-primary via-yellow-500 to-yellow-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black text-black mb-6">ELEVE SEU NIVEL PROFISSIONAL</h2>
          <p className="text-2xl text-black/80 mb-8">Sua agenda protegida. Sua vitrine vendendo. Sua operacao mais redonda.</p>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-3 px-12 py-6 bg-black text-primary rounded-button font-black text-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            COMECAR AGORA GRATIS <Zap className="w-6 h-6" />
          </Link>
          <p className="text-black/60 text-sm mt-6">Feito para servicos, consultas e aulas que dependem de organizacao real de agenda.</p>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-normal mb-4">PRODUTO</h4>
              <ul className="space-y-2">
                {['COMO FUNCIONA'].map(link => (
                  <li key={link}>
                    <a href="#como-funciona" className="text-gray-500 hover:text-primary transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-normal mb-4">PARA VOCE</h4>
              <ul className="space-y-2">
                {isLogged ? (
                  <>
                    <li>
                      <Link
                        to={userType === 'professional' ? '/dashboard' : '/minha-area'}
                        className="text-gray-500 hover:text-primary transition-colors text-sm"
                      >
                        {userType === 'professional' ? 'DASHBOARD' : 'MINHA AREA'}
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="text-gray-500 hover:text-primary transition-colors text-sm"
                      >
                        SAIR
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/login" className="text-gray-500 hover:text-primary transition-colors text-sm">
                        ENTRAR
                      </Link>
                    </li>
                    <li>
                      <Link to="/cadastro" className="text-gray-500 hover:text-primary transition-colors text-sm">
                        CADASTRAR GRATIS
                      </Link>
                    </li>
                    <li>
                      <Link to="/parceiro/login" className="text-gray-500 hover:text-primary transition-colors text-sm">
                        LOGIN PARCEIRO
                      </Link>
                    </li>
                    <li>
                      <Link to="/parceiro/cadastro" className="text-gray-500 hover:text-primary transition-colors text-sm">
                        CADASTRO PARCEIRO
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-normal mb-4">EMPRESA</h4>
              <ul className="space-y-2">
                {['SOBRE', 'BLOG'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-normal mb-4">LEGAL</h4>
              <ul className="space-y-2">
                {['PRIVACIDADE', 'TERMOS'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 hover:text-primary transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-white font-black text-sm">COMVAGA</div>
              <div className="text-gray-600 text-sm">© 2026 COMVAGA. Todos os direitos reservados.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
