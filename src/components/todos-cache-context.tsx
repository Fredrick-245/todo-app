"use client";

import { createContext, useContext } from "react";

const TodosCacheContext = createContext<((memberId: string) => void) | null>(
  null,
);

export function TodosCacheProvider({
  refreshMember,
  children,
}: {
  refreshMember: (memberId: string) => void;
  children: React.ReactNode;
}) {
  return (
    <TodosCacheContext.Provider value={refreshMember}>
      {children}
    </TodosCacheContext.Provider>
  );
}

export function useRefreshTodos() {
  return useContext(TodosCacheContext);
}
