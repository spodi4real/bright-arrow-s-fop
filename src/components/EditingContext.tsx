'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type EditingContextValue = {
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
};

const EditingContext = createContext<EditingContextValue>({
  isEditing: false,
  setEditing: () => {},
});

export function EditingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const setEditing = useCallback((editing: boolean) => {
    setCount((c) => Math.max(0, c + (editing ? 1 : -1)));
  }, []);
  return (
    <EditingContext.Provider value={{ isEditing: count > 0, setEditing }}>
      {children}
    </EditingContext.Provider>
  );
}

export function useEditing() {
  return useContext(EditingContext);
}
