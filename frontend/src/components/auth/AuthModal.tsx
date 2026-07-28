"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Chief Executive Officer");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      signUp(email.trim(), name.trim(), role, password.trim());
    } else {
      signIn(email.trim(), password.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl relative text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950 text-white font-display font-bold flex items-center justify-center text-sm shadow-xs">
              O<span className="text-purple-300">1</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                {isSignUp ? "Create Enterprise Account" : "Sign In to Operator One"}
              </h3>
              <p className="text-xs text-slate-500">Access business operations console</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition-colors">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Yusra Saleem"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-purple-900 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Enterprise Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-purple-900 font-sans cursor-pointer"
                >
                  <option value="Chief Executive Officer">Chief Executive Officer</option>
                  <option value="Store Operations Manager">Store Operations Manager</option>
                  <option value="Sales Director">Sales Director</option>
                  <option value="Inventory Lead">Inventory Lead</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Enterprise Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yusra.saleem@operatorone.ai"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-purple-900 font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Account Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-purple-900 font-sans"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            {isSignUp ? "Create Account & Sign In" : "Sign In to Workspace"}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          {isSignUp ? "Already have an account?" : "Need an enterprise workspace?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
            className="font-semibold text-purple-900 hover:underline cursor-pointer"
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
};
