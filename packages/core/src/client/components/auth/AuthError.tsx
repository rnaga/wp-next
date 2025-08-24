import "./style.css";

//import { redirect } from "next/navigation";

export const AuthError = (props: {
  error: string;
  showLogoutLink?: boolean;
  showGoBackLink?: boolean;
  children?: React.ReactNode;
}) => {
  const { error, showLogoutLink, showGoBackLink, children } = props;

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Error</h2>
        <div className="error-message">Error: {error}</div>
        {showLogoutLink && (
          <a href="/api/auth/signout" className="link">
            Back to login page
          </a>
        )}
        {showGoBackLink && (
          <a
            href="#"
            className="link"
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            Go back to previous page
          </a>
        )}
      </div>
    </div>
  );
};
