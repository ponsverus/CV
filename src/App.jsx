import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import { isPasswordRecoveryUrl } from './utils/auth';
import { fetchUserAccessProfile, isValidType, normalizeOnboardingStatus } from './utils/profileAccess';

import FeedbackProvider from './feedback/FeedbackProvider';

import Home                   from './pages/Home';
import Login                  from './pages/Login';
import SignupChoice           from './pages/SignupChoice';
import SignupClient           from './pages/SignupClient';
import SignupProfessional     from './pages/SignupProfessional';
import ParceiroCadastro       from './pages/ParceiroCadastro';
import ParceiroLogin          from './pages/ParceiroLogin';
import PartnerPendingApproval from './pages/PartnerPendingApproval';

const Dashboard                 = lazy(() => import('./pages/Dashboard'));
const Vitrine                   = lazy(() => import('./pages/Vitrine'));
const ClientArea                = lazy(() => import('./pages/ClientArea'));
const CriarNegocio              = lazy(() => import('./pages/CriarNegocio'));
const SelecionarNegocio         = lazy(() => import('./pages/SelecionarNegocio'));
const SignupProfessionalResume  = lazy(() => import('./pages/SignupProfessionalResume'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function FullScreenLoading({ text = 'CARREGANDO...' }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-primary text-xl">{text}</div>
      </div>
    </div>
  );
}

function FullScreenError({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-100 border border-red-500/40 rounded-custom p-8 text-center">
        <h1 className="text-2xl font-normal text-white mb-2">Algo deu errado</h1>
        <p className="text-gray-400 mb-6 whitespace-pre-wrap">{message}</p>
        <button onClick={onRetry} className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button">
          TENTAR NOVAMENTE
        </button>
      </div>
    </div>
  );
}

async function getUserProfileRobust(authUser) {
  if (!authUser?.id) return null;

  const delays = [100, 250, 500];
  let lastErr = null;

  for (let i = 0; i < delays.length; i++) {
    try {
      const profile = await fetchUserAccessProfile(authUser.id);
      if (profile) return profile;
      if (i < delays.length - 1) await sleep(delays[i]);
    } catch (e) {
      lastErr = e;
      if (i < delays.length - 1) await sleep(delays[i]);
    }
  }

  if (lastErr) throw lastErr;
  return null;
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RecoveryWatcher({ onChange }) {
  const loc = useLocation();
  useEffect(() => {
    onChange(isPasswordRecoveryUrl());
  }, [loc.pathname, loc.search, loc.hash, onChange]);
  return null;
}

export default function App() {
  const [user,             setUser]             = useState(null);
  const [userType,         setUserType]         = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [accessState,      setAccessState]      = useState('active');
  const [booting,          setBooting]          = useState(true);
  const [typeLoading,      setTypeLoading]      = useState(false);
  const [fatalError,       setFatalError]       = useState(null);
  const [inRecovery,       setInRecovery]       = useState(false);

  const aliveRef        = useRef(true);
  const loadedUserRef   = useRef(null);
  const suppressAuthRef = useRef(false);

  const isLoggedIn = !!user;

  const safeSet = useCallback((fn) => {
    if (aliveRef.current) fn();
  }, []);

  const getPostLoginPath = useCallback((type, currentAccessState, status) => {
    if (type !== 'professional') return '/minha-area';
    if (currentAccessState === 'partner_pending') return '/parceiro/aguardando';
    if (currentAccessState === 'owner_resume' || normalizeOnboardingStatus(type, status) === 'pending') {
      return '/cadastro/profissional/retomada';
    }
    return '/dashboard';
  }, []);

  const loadProfile = useCallback(async (sessionUser) => {
    if (!sessionUser?.id) return null;

    safeSet(() => {
      setTypeLoading(true);
      setUserType(null);
      setOnboardingStatus(null);
      setAccessState('active');
    });

    try {
      const profile = await getUserProfileRobust(sessionUser);

      if (!profile) {
        await supabase.auth.signOut();
        safeSet(() => {
          setUser(null);
          setUserType(null);
          setOnboardingStatus(null);
          setAccessState('active');
          loadedUserRef.current = null;
          setFatalError('Perfil não encontrado. Por favor, conclua seu cadastro.');
        });
        return null;
      }

      loadedUserRef.current = sessionUser.id;
      safeSet(() => {
        setUserType(profile.type);
        setOnboardingStatus(profile.onboardingStatus);
        setAccessState(profile.accessState || 'active');
        setFatalError(null);
      });
      return profile;
    } catch (e) {
      safeSet(() => {
        setUserType(null);
        setOnboardingStatus(null);
        setAccessState('active');
        setFatalError(e?.message || 'Falha ao carregar perfil.');
      });
      return null;
    } finally {
      safeSet(() => setTypeLoading(false));
    }
  }, [safeSet]);

  useEffect(() => {
    aliveRef.current = true;

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (!aliveRef.current) return;
        if (suppressAuthRef.current) return;

        if (event === 'PASSWORD_RECOVERY') {
          safeSet(() => { setInRecovery(true); setBooting(false); });
          return;
        }

        if (event === 'INITIAL_SESSION') {
          const sessionUser = session?.user || null;
          if (!sessionUser) {
            safeSet(() => {
              setUser(null);
              setUserType(null);
              setOnboardingStatus(null);
              setAccessState('active');
              setBooting(false);
            });
            return;
          }

          setUser(sessionUser);
          if (loadedUserRef.current !== sessionUser.id) await loadProfile(sessionUser);
          safeSet(() => setBooting(false));
          return;
        }

        const sessionUser = session?.user || null;
        if (!sessionUser) {
          loadedUserRef.current = null;
          setUser(null);
          setUserType(null);
          setOnboardingStatus(null);
          setAccessState('active');
          setFatalError(null);
          return;
        }

        setUser(sessionUser);
        if (loadedUserRef.current !== sessionUser.id) await loadProfile(sessionUser);
      });

    return () => { aliveRef.current = false; subscription?.unsubscribe(); };
  }, [loadProfile, safeSet]);

  const handleLogin = useCallback((userData, type, nextOnboardingStatus = 'completed', nextAccessState = 'active') => {
    loadedUserRef.current = userData?.id || null;
    setUser(userData || null);
    setUserType(isValidType(type) ? type : null);
    setOnboardingStatus(
      isValidType(type)
        ? normalizeOnboardingStatus(type, nextOnboardingStatus)
        : null
    );
    setAccessState(nextAccessState);
    setFatalError(null);
  }, []);

  const handleLogout = useCallback(async () => {
    loadedUserRef.current = null;
    try {
      await supabase.auth.signOut();
    } finally {
      setInRecovery(false);
      setUser(null);
      setUserType(null);
      setOnboardingStatus(null);
      setAccessState('active');
      setFatalError(null);
      setTypeLoading(false);
    }
  }, []);

  const handleRetry = useCallback(async () => {
    safeSet(() => { setFatalError(null); setBooting(true); });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        safeSet(() => {
          setUser(null);
          setUserType(null);
          setOnboardingStatus(null);
          setAccessState('active');
          setBooting(false);
        });
        return;
      }

      safeSet(() => setUser(session.user));
      await loadProfile(session.user);
      safeSet(() => setBooting(false));
    } catch {
      safeSet(() => {
        setUser(null);
        setUserType(null);
        setOnboardingStatus(null);
        setAccessState('active');
        setBooting(false);
      });
    }
  }, [safeSet, loadProfile]);

  if (booting) return <FullScreenLoading />;
  if (fatalError && !inRecovery) return <FullScreenError message={fatalError} onRetry={handleRetry} />;
  if (isLoggedIn && !userType && !inRecovery) return <FullScreenLoading text="CARREGANDO PERFIL..." />;

  return (
    <Router>
      <FeedbackProvider>
        <RecoveryWatcher onChange={setInRecovery} />
        <ScrollToTopOnRouteChange />

        <Suspense fallback={<FullScreenLoading />}>
          <Routes>
            <Route path="/" element={<Home user={isLoggedIn ? user : null} userType={isLoggedIn ? userType : null} onLogout={handleLogout} />} />

            <Route path="/login" element={
              inRecovery ? <Login onLogin={handleLogin} inRecovery={true} />
              : isLoggedIn && userType ? <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
              : <Login onLogin={handleLogin} inRecovery={false} />
            } />

            <Route path="/parceiro/cadastro" element={
              isLoggedIn && userType
                ? <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
                : <ParceiroCadastro suppressAuthRef={suppressAuthRef} />
            } />

            <Route path="/parceiro/login" element={
              inRecovery
                ? <ParceiroLogin onLogin={handleLogin} suppressAuthRef={suppressAuthRef} inRecovery={true} />
                : isLoggedIn && userType
                  ? <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
                  : <ParceiroLogin onLogin={handleLogin} suppressAuthRef={suppressAuthRef} />
            } />

            <Route path="/parceiro/aguardando" element={
              isLoggedIn ? (
                typeLoading ? <FullScreenLoading text="CARREGANDO..." />
                : userType === 'professional' && accessState === 'partner_pending'
                  ? <PartnerPendingApproval onLogout={handleLogout} />
                  : <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
              ) : <Navigate to="/login" />
            } />

            <Route path="/cadastro" element={
              isLoggedIn && userType
                ? <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
                : <SignupChoice />
            } />

            <Route path="/cadastro/cliente" element={
              isLoggedIn && userType ? <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
              : <SignupClient onLogin={handleLogin} />
            } />

            <Route path="/cadastro/profissional" element={
              isLoggedIn && userType ? <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
              : <SignupProfessional onLogin={handleLogin} />
            } />

            <Route path="/cadastro/profissional/retomada" element={
              isLoggedIn ? (
                typeLoading ? <FullScreenLoading text="CARREGANDO..." />
                : userType === 'professional'
                  ? accessState === 'owner_resume'
                    ? <SignupProfessionalResume user={user} onLogin={handleLogin} />
                    : <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
                  : userType ? <Navigate to="/minha-area" />
                  : <Navigate to="/login" />
              ) : <Navigate to="/login" />
            } />

            <Route path="/dashboard" element={
              isLoggedIn ? (
                typeLoading ? <FullScreenLoading text="CARREGANDO..." />
                : userType === 'professional'
                  ? accessState === 'owner_resume'
                    ? <Navigate to="/cadastro/profissional/retomada" />
                    : accessState === 'partner_pending'
                      ? <Navigate to="/parceiro/aguardando" />
                      : <Dashboard user={user} onLogout={handleLogout} />
                : userType ? <Navigate to="/minha-area" />
                : <Navigate to="/login" />
              ) : <Navigate to="/login" />
            } />

            <Route path="/minha-area" element={
              isLoggedIn ? (
                typeLoading ? <FullScreenLoading text="CARREGANDO..." />
                : userType === 'client' ? <ClientArea user={user} onLogout={handleLogout} />
                : userType ? <Navigate to={getPostLoginPath(userType, accessState, onboardingStatus)} />
                : <Navigate to="/login" />
              ) : <Navigate to="/login" />
            } />

            <Route path="/v/:slug" element={<Vitrine user={isLoggedIn ? user : null} userType={isLoggedIn ? userType : null} />} />

            <Route path="/criar-negocio" element={
              isLoggedIn ? (
                typeLoading ? <FullScreenLoading text="CARREGANDO..." />
                : userType === 'professional'
                  ? accessState === 'owner_resume'
                    ? <Navigate to="/cadastro/profissional/retomada" />
                    : accessState === 'partner_pending'
                      ? <Navigate to="/parceiro/aguardando" />
                      : <CriarNegocio user={user} />
                : userType ? <Navigate to="/minha-area" />
                : <Navigate to="/login" />
              ) : <Navigate to="/login" />
            } />

            <Route path="/selecionar-negocio" element={
              isLoggedIn ? (
                typeLoading ? <FullScreenLoading text="CARREGANDO..." />
                : userType === 'professional'
                  ? accessState === 'owner_resume'
                    ? <Navigate to="/cadastro/profissional/retomada" />
                    : accessState === 'partner_pending'
                      ? <Navigate to="/parceiro/aguardando" />
                      : <SelecionarNegocio user={user} onLogout={handleLogout} />
                : userType ? <Navigate to="/minha-area" />
                : <Navigate to="/login" />
              ) : <Navigate to="/login" />
            } />
          </Routes>
        </Suspense>
      </FeedbackProvider>
    </Router>
  );
}
