"use client";
import { FormEvent, useState } from "react";

import { useUserSelfRegistration } from "../../hooks";

import { ProviderButtons } from "./ProviderButtons";

import type * as types from "../../../types";

export const Signup = (props: types.auth.AuthSignupProps) => {
  const { blogId, providers, googleRecaptchaSitekey, canSignup } = props;

  const [submitted, setSubmitted] = useState(false);
  const { register } = useUserSelfRegistration();
  const [response, setResponse] =
    useState<Awaited<ReturnType<typeof register>>>();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;

    const response = await register({
      email,
      username,
      googleRecaptchaSitekey,
    });

    setResponse(response);
    setSubmitted(false);
  };

  if (!canSignup) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <h2>Sign Up</h2>
          <div className="error-message">
            User self-registration is not enabled.
          </div>
          <a href="login" className="link">
            Back to Login page
          </a>
        </div>
      </div>
    );
  }

  if (!(response instanceof Error) && response?.success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <h2>Check your email</h2>
          <div className="success-message">
            Registration almost complete! Please check your email to verify your
            account.
          </div>
          <a href="login" className="link">
            Back to login page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <form onSubmit={handleSubmit}>
          <h2>Sign Up</h2>

          {(response instanceof Error || response?.success === false) && (
            <div className="error-message">
              {response instanceof Error ? String(response) : response.error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="username">Username </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={submitted}>
            {submitted ? <div className="loader"></div> : "Sign Up"}
          </button>
        </form>
        <div className="or-divider">
          <hr />
          <span>or</span>
          <hr />
        </div>
        <ProviderButtons providers={providers} type="signup" />
        <a href="login" className="link">
          Back to Login page
        </a>
      </div>
    </div>
  );
};
