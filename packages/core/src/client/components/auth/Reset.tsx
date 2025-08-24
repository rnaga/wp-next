"use client";
import "./style.css";

import * as React from "react";

import { useAuthResetPassword } from "../../hooks";

import type * as types from "../../../types";

export const Reset = (props: types.auth.AuthResetProps) => {
  const { reset } = useAuthResetPassword();
  const [response, setResponse] = React.useState<{
    error: string | undefined;
    success: boolean;
    submitted: boolean;
  }>({ error: undefined, success: false, submitted: false });

  let { error, resetKey, userLogin } = props;

  if (response.error || error) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <h2>Oops</h2>
          <div className="error-message">Error: {response.error ?? error}</div>
        </div>
      </div>
    );
  }

  if (response.success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <h2>Success</h2>
          <div className="success-message">Password changed.</div>
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
            const formData = new FormData(e.currentTarget);
            const password = formData.get("password");
            const passwordConfirm = formData.get("password_confirm");
            const result = await reset({
              password: password as string,
              passwordConfirm: passwordConfirm as string,
              resetKey,
              userLogin,
            });

            if (result instanceof Error) {
              setResponse({
                ...response,
                error: String(result),
              });
              return;
            }
            // setResponse({ ...response, submitted: true });
            // const result = await reset({
            //   newPassword: formData.get("password") as string,
            //   resetKey,
            //   userLogin,
            // });
            setResponse({ ...response, ...result, submitted: true });
          }}
        >
          <div className="input-group">
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              name="password"
              placeholder="password"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              name="password_confirm"
              required
              placeholder="confirm password"
            />
          </div>
          <button type="submit" className="login-btn">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};
