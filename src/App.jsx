import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import { isPasswordRecoveryUrl } from './utils/auth';

import FeedbackProvider from './feedback/FeedbackProvider';

import Home from './pages/Home';
import Login from './pages/Login';
import SignupChoice from './pages/SignupChoice';
import SignupClient from './pages/SignupClient';
import SignupProfessional from './pages/SignupProfessional';
import Dashboard from './pages/Dashboard';
import Vitrine from './pages/Vitrine';
import ClientArea from './pages/ClientArea';
import CriarNegocio from './pages/CriarNegocio';
import SelecionarNegocio from './pages/SelecionarNegocio';

const PROFILE_TABLE = 'users';
const isValidType = (t) => t === 'client' || t === 'professional';
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
        <button
          onClick={onRetry}
          className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button"
        >
          TENTAR NOVAMENTE
        </button>
      </div>
    </div>
  );
}

async function fetchTypeFromDb(userId) {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('type')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  const t = data?.type;
  return isValidType(t) ? t : null;
}

async function getUserTypeRobust(authUser) {
  if (!authUser?.id) return null;

  const delays = [100, 250, 500];
  let lastErr = null;

  for (let i = 0; i < delays.length; i++) {
    try {
      const t = await fetchTypeFromDb(authUser.id);
      if (t) return t;
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function RecoveryWatcher({ onChange }) {
  const loc = useLocation();

  useEffect(() => {
    if (isPasswordRecoveryUrl()) onChange(true);
  }, [loc.pathname, loc.search, loc.hash, onChange]);

  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [booting, setBooting] = useState(true);
  const [typeLoading, setTypeLoading] = useState(false);
  const [fatalError, setFatalError] = useState(null);
  const [inRecovery, setInRecovery] = useState(false);

  const aliveRef = useRef(true);
  const loadedUserRef = useRef(null);

  const isLoggedIn = !!user;

  const safeSet = useCallback((fn) => {
    if (aliveRef.current) fn();
  }, []);

  const loadType = useCallback(async (sessionUser) => {
    if (!sessionUser?.id) return null;

    safeSet(() => {
      setTypeLoading(true);
      setUserType(null);
    });

    try {
      const type = await getUserTypeRobust(sessionUser);

      if (!type) {
        await supabase.auth.signOut();
        safeSet(() => {
          setUser(null);
          setUserType(null);
          loadedUserRef.current = null;
          setFatalError('Perfil não encontrado. Por favor, conclua seu cadastro.');
        });
        return null;
      }

      loadedUserRef.current = sessionUser.id;
      safeSet(() => {
        setUserType(type);
        setFatalError(null);
      });
      return type;
    } catch (e) {
      safeSet(() => {
        setUserType(null);
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

        if (event === 'PASSWORD_RECOVERY') {
          safeSet(() => {
            setInRecovery(true);
            setBooting(false);
          });
          return;
        }

        if (event === 'INITIAL_SESSION') {
          const sessionUser = session?.user || null;

          if (!sessionUser) {
            safeSet(() => {
              setUser(null);
              setUserType(null);
              setBooting(false);
            });
            return;
          }

          setUser(sessionUser);

          if (loadedUserRef.current !== sessionUser.id) {
            await loadType(sessionUser);
          }

          safeSet(() => setBooting(false));
          return;
        }

        const sessionUser = session?.user || null;

        if (!sessionUser) {
          loadedUserRef.current = null;
          setUser(null);
          setUserType(null);
          setFatalError(null);
          return;
        }

        setUser(sessionUser);

        if (loadedUserRef.current !== sessionUser.id) {
          await loadType(sessionUser);
        }
      });

    return () => {
      aliveRef.current = false;
      subscription?.unsubscribe();
    };
  }, [loadType]);

  const handleLogin = useCallback((userData, type) => {
    loadedUserRef.current = userData?.id || null;
    setUser(userData || null);
    setUserType(isValidType(type) ? type : null);
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
      setFatalError(null);
      setTypeLoading(false);
    }
  }, []);

  const handleRetry = useCallback(async () => {
    safeSet(() => {
      setFatalError(null);
      setBooting(true);
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        safeSet(() => {
          setUser(null);
          setUserType(null);
          setBooting(false);
        });
        return;
      }

      safeSet(() => setUser(session.user));
      await loadType(session.user);
      safeSet(() => setBooting(false));
    } catch {
      safeSet(() => {
        setUser(null);
        setUserType(null);
        setBooting(false);
      });
    }
  }, [safeSet, loadType]);

  if (booting) return <FullScreenLoading />;

  if (fatalError && !inRecovery)
    return <FullScreenError message={fatalError} onRetry={handleRetry} />;

  if (isLoggedIn && !userType && typeLoading && !inRecovery)
    return <FullScreenLoading text="CARREGANDO PERFIL..." />;

  return (
    <Router>
      <FeedbackProvider>
        <RecoveryWatcher onChange={setInRecovery} />
        <ScrollToTopOnRouteChange />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                user={isLoggedIn ? user : null}
                userType={isLoggedIn ? userType : null}
                onLogout={handleLogout}
              />
            }
          />

          <Route
            path="/login"
            element={
              inRecovery ? (
                <Login onLogin={handleLogin} inRecovery={true} />
              ) : isLoggedIn && userType ? (
                <Navigate to={userType === 'professional' ? '/dashboard' : '/minha-area'} />
              ) : (
                <Login onLogin={handleLogin} inRecovery={false} />
              )
            }
          />

          <Route
            path="/cadastro"
            element={
              isLoggedIn && userType
                ? <Navigate to={userType === 'professional' ? '/dashboard' : '/minha-area'} />
                : <SignupChoice />
            }
          />

          <Route
            path="/cadastro/cliente"
            element={
              isLoggedIn && userType === 'client'
                ? <Navigate to="/minha-area" />
                : <SignupClient onLogin={handleLogin} />
            }
          />

          <Route
            path="/cadastro/profissional"
            element={
              isLoggedIn && userType === 'professional'
                ? <Navigate to="/dashboard" />
                : <SignupProfessional onLogin={handleLogin} />
            }
          />

          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                typeLoading ? (
                  <FullScreenLoading text="CARREGANDO..." />
                ) : userType === 'professional' ? (
                  <Dashboard user={user} onLogout={handleLogout} />
                ) : userType ? (
                  <Navigate to="/minha-area" />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/minha-area"
            element={
              isLoggedIn ? (
                typeLoading ? (
                  <FullScreenLoading text="CARREGANDO..." />
                ) : userType === 'client' ? (
                  <ClientArea user={user} onLogout={handleLogout} />
                ) : userType ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/v/:slug"
            element={
              <Vitrine
                user={isLoggedIn ? user : null}
                userType={isLoggedIn ? userType : null}
              />
            }
          />

          <Route
            path="/criar-negocio"
            element={
              isLoggedIn ? (
                typeLoading ? (
                  <FullScreenLoading text="CARREGANDO..." />
                ) : userType === 'professional' ? (
                  <CriarNegocio user={user} />
                ) : userType ? (
                  <Navigate to="/minha-area" />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/selecionar-negocio"
            element={
              isLoggedIn ? (
                typeLoading ? (
                  <FullScreenLoading text="CARREGANDO..." />
                ) : userType === 'professional' ? (
                  <SelecionarNegocio user={user} onLogout={handleLogout} />
                ) : userType ? (
                  <Navigate to="/minha-area" />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </FeedbackProvider>
    </Router>
  );
}
