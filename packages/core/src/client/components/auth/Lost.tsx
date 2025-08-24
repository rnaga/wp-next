"use client";

import "./style.css";
import * as React from "react";

import { useAuthResetPassword } from "../../hooks";

import type * as types from "../../../types";

export const Lost = (props: types.auth.AuthLostProps) => {
  const { emailEnabled } = props;
  const { requestResetKey } = useAuthResetPassword();

  const [submitted, setSubmitted] = React.useState(false);
  const [response, setResponse] = React.useState<{
    message: undefined | string;
  }>({ message: undefined });

  if (response.message) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <h2>Check your email</h2>
          <div className="success-message">{response.message}</div>
        </div>
      </div>
    );
  }

  // If email is not enabled, show a message to contact the administrator.
  if (!emailEnabled) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <h2>Reset your password</h2>
          <div className="error-message">
            Password reset is not enabled. Please contact your administrator.
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
        <h2>Reset your password</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitted(true);
            const userLogin = String(
              new FormData(e.currentTarget).get("user_login")
            );

            const result = await requestResetKey({ userLogin });
            setResponse({
              message: `If an account with this information exists,
                    a password reset email has been sent to your registered address.
                    For further assistance, contact your administrator.`,
            });
          }}
        >
          <div className="input-group">
            <label htmlFor="email">Username or Email Address</label>
            <input
              type="input"
              name="user_login"
              placeholder="johndoe@email.com"
              required
            />
          </div>
          <button type="submit" className="login-btn">
            {submitted ? <div className="loader"></div> : "Get New Password"}
          </button>
        </form>
        <a href="login" className="link">
          Back to login page
        </a>
      </div>
    </div>
  );
};
