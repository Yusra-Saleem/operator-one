"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password?: string) => boolean;
  signUp: (email: string, name: string, role?: string, password?: string) => boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("op1_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const signIn = (email: string) => {
    const namePart = email.split("@")[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const loggedUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email,
      role: "Operations Executive",
      name: formattedName,
    };
    setUser(loggedUser);
    try {
      localStorage.setItem("op1_user", JSON.stringify(loggedUser));
    } catch {}
    return true;
  };

  const signUp = (email: string, name: string, role: string = "Enterprise Lead") => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email,
      role: role,
      name: name || "Enterprise Member",
    };
    setUser(newUser);
    try {
      localStorage.setItem("op1_user", JSON.stringify(newUser));
    } catch {}
    return true;
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem("op1_user");
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
