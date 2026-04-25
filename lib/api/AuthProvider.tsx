import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  deleteAccount as deleteAccountEndpoint,
  fetchMe,
  loginUser,
  logoutUser,
  registerUser,
  resendVerificationEmail as resendVerificationEmailEndpoint,
} from "./endpoints";
import {
  clearSession,
  loadSession,
  saveSession,
  type PersistedSession,
} from "./session";
import type { ApiUser } from "./types";

interface AuthContextValue {
  /** true while we're still reading SecureStore on first boot */
  bootstrapping: boolean;
  /** current user, or null if signed out */
  user: ApiUser | null;
  /** bearer token, or null if signed out */
  token: string | null;
  /** true if user+token are present */
  isSignedIn: boolean;

  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    handle: string;
    displayName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Permanently delete the signed-in user's account on the server and
   * drop the local session. Required by App Store Guideline 5.1.1(v).
   */
  deleteAccount: () => Promise<void>;
  /** Re-fetch `/auth/me` and refresh the cached `user` (e.g. after email verify). */
  refreshUser: () => Promise<void>;
  /** Ask the server to send another verification email (throttled server-side). */
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PersistedSession | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const didBootstrap = useRef(false);

  // On first mount: hydrate from SecureStore, then revalidate the user.
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    (async () => {
      const persisted = await loadSession();
      if (!persisted) {
        setBootstrapping(false);
        return;
      }
      setSession(persisted);

      try {
        // Silent revalidation — if the token is stale we drop it quietly.
        const { user } = await fetchMe(persisted.token);
        const refreshed = { ...persisted, user };
        setSession(refreshed);
        await saveSession(
          { token: persisted.token, expiresAt: persisted.expiresAt },
          user,
        );
      } catch {
        await clearSession();
        setSession(null);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const adopt = useCallback(
    async (persisted: PersistedSession) => {
      await saveSession(
        { token: persisted.token, expiresAt: persisted.expiresAt },
        persisted.user,
      );
      setSession(persisted);
    },
    [],
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(async (input) => {
    const res = await loginUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    await adopt({
      token: res.session.token,
      expiresAt: res.session.expiresAt,
      user: res.user,
    });
  }, [adopt]);

  const signUp = useCallback<AuthContextValue["signUp"]>(async (input) => {
    const res = await registerUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      handle: input.handle.trim().toLowerCase(),
      displayName: input.displayName.trim(),
    });
    await adopt({
      token: res.session.token,
      expiresAt: res.session.expiresAt,
      user: res.user,
    });
  }, [adopt]);

  const signOut = useCallback<AuthContextValue["signOut"]>(async () => {
    const token = session?.token;
    setSession(null);
    await clearSession();
    if (token) {
      // Best-effort server-side revoke; ignore network errors.
      logoutUser(token).catch(() => undefined);
    }
  }, [session?.token]);

  const deleteAccount = useCallback<
    AuthContextValue["deleteAccount"]
  >(async () => {
    const token = session?.token;
    if (!token) return;
    // Wait for the server to confirm the delete before wiping the local
    // session — if the call fails (network, 401, etc.) we want the user
    // to stay signed in and retry rather than be silently stranded.
    await deleteAccountEndpoint(token);
    setSession(null);
    await clearSession();
  }, [session?.token]);

  const refreshUser = useCallback<AuthContextValue["refreshUser"]>(
    async () => {
      const token = session?.token;
      const expiresAt = session?.expiresAt;
      if (!token || !expiresAt) return;
      const { user } = await fetchMe(token);
      const next: PersistedSession = { token, expiresAt, user };
      setSession(next);
      await saveSession({ token, expiresAt }, user);
    },
    [session?.expiresAt, session?.token],
  );

  const resendVerificationEmail =
    useCallback<AuthContextValue["resendVerificationEmail"]>(async () => {
      const token = session?.token;
      if (!token) throw new Error("Not signed in");
      await resendVerificationEmailEndpoint(token);
    }, [session?.token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      bootstrapping,
      user: session?.user ?? null,
      token: session?.token ?? null,
      isSignedIn: Boolean(session?.token && session?.user),
      signIn,
      signUp,
      signOut,
      deleteAccount,
      refreshUser,
      resendVerificationEmail,
    }),
    [
      bootstrapping,
      session,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      refreshUser,
      resendVerificationEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }
  return ctx;
}
