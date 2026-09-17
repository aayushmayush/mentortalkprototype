'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * WalletProvider — the balance the app bar badge and the session meter read.
 *
 * Deliberately thin for now: it holds a balance and the movement operations the
 * session loop and the wallet screens need. The transaction log and the
 * payment-log tabs land with T4, which is where `Transaction` gets its shape
 * from `wallet_models.dart`; inventing that type here would mean rewriting it
 * then.
 *
 * It lives in the root layout with the other providers so the balance survives
 * navigation — a session started from the Chat tab must keep decrementing the
 * badge on the Home tab.
 */

type WalletContextValue = {
  balance: number;
  /** Returns false when there is not enough — callers surface the shortfall. */
  debit: (amount: number) => boolean;
  credit: (amount: number) => void;
  setBalance: (amount: number) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

/** Enough to run several paid sessions without topping up. */
const STARTING_BALANCE = 500;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalanceState] = useState(STARTING_BALANCE);

  /**
   * The ref is the authoritative balance, not the state.
   *
   * `debit` has to return a verdict the caller acts on immediately — the
   * session loop ends the session when the money runs out. A `setState` updater
   * runs during the next render, not at call time, so reading the new balance
   * back out of one is always a step behind. Keeping a ref in lockstep makes
   * the check synchronous and correct, and the state is what re-renders.
   */
  const balanceRef = useRef(STARTING_BALANCE);

  const apply = useCallback((next: number) => {
    balanceRef.current = next;
    setBalanceState(next);
  }, []);

  const debit = useCallback(
    (amount: number) => {
      if (balanceRef.current < amount) return false;
      apply(balanceRef.current - amount);
      return true;
    },
    [apply],
  );

  const credit = useCallback(
    (amount: number) => apply(balanceRef.current + amount),
    [apply],
  );

  const value = useMemo<WalletContextValue>(
    () => ({ balance, debit, credit, setBalance: apply }),
    [balance, debit, credit, apply],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside a WalletProvider');
  return ctx;
}
