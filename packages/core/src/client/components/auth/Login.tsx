"use client";

import "./style.css";

import { useEffect, useMemo, useState } from "react";

import { useAuthLogin } from "../../hooks";

import { ProviderButtons } from "./ProviderButtons";

import type * as types from "../../../types";

export const Login = (props: types.auth.AuthLoginProps) => {
  const { providers, error } = props;
  const [submitted, setSubmitted] = useState(false);

  const { login, getErrorMessage, externalProviders } = useAuthLogin(providers);

  const errorMessage = useMemo(() => getErrorMessage(error), [error]);

  useEffect(() => {
    error && submitted && setSubmitted(false);
  }, [error]);

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Login</h2>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitted(true);

            const formData = new FormData(e.currentTarget);
            const username = formData.get("username") as string;
            const password = formData.get("password") as string;

            await login({ username, password });
          }}
        >
          <div className="input-group">
            <label htmlFor="username">Username or Email Address</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="johndoe@email.com"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="password"
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={submitted}>
            {submitted ? <div className="loader"></div> : "Login"}
          </button>
        </form>
        <a href="lost" className="forgot-password">
          Forgot Password?
        </a>
        {externalProviders.length > 0 && (
          <>
            <div className="or-divider">
              <hr />
              <span>or</span>
              <hr />
            </div>
            <ProviderButtons providers={providers} type="login" />
          </>
        )}
        {props.canSignup && (
          <div className="signup">
            Don&apos;t have an account?{" "}
            <a href="signup" className="signup-link">
              Signup
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
