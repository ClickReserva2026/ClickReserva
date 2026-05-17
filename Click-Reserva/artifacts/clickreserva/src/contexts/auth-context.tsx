import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const { data: meData, isLoading, isError } = useGetMe({
    query: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
      throwOnError: false,
    }
  });

  useEffect(() => {
    if (meData && !isError) {
      setUser(meData);
    } else if (isError) {
      setUser(null);
    }
  }, [meData, isError]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
