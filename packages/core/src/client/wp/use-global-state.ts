"use client";
import { useRef, useSyncExternalStore } from "react";
import type * as types from "../../types";

export type GlobalStateSubscriber = (
  value: Partial<types.client.GlobalState>
) => void;

export const useGlobalState = (defaults: Partial<types.client.GlobalState>) => {
  const store = useRef(defaults);

  const subscribers = useRef(new Set<GlobalStateSubscriber>());

  const subscribe = (subscriber: GlobalStateSubscriber) => {
    subscribers.current.add(subscriber);
    return () => subscribers.current.delete(subscriber);
  };

  const setState = (arg1: any, arg2?: any) => {
    if ("string" === typeof arg1) {
      store.current = { ...store.current, [arg1]: arg2 };
    } else {
      store.current = { ...store.current, ...arg1 };
    }

    subscribers.current.forEach((subscriber) => {
      subscriber(store.current);
    });
  };

  const getState = <T extends keyof types.client.GlobalState>(key: T) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const value = useSyncExternalStore(
      subscribe,
      () => store.current[key],
      () => store.current[key]
    );

    return value as types.client.GlobalState[T];
  };

  const globalState = {
    set: setState,
    get: getState,
  };

  return globalState;
};
