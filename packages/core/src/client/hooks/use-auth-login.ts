import { getProviders, signIn } from "next-auth/react";
import { loginErrors } from "../utils";

export const useAuthLogin = (
  providers: Awaited<ReturnType<typeof getProviders>>
) => {
  const externalProviders = Object.values(providers || {}).filter(
    (provider) => provider.type !== "credentials"
  );

  const login = async (args: { username: string; password: string }) => {
    const { username, password } = args;

    return await signIn("credentials", {
      username,
      password,
    });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    await login({ username, password });
  };

  const getErrorMessage = (error?: keyof typeof loginErrors) => {
    return !error ? undefined : loginErrors[error] ?? loginErrors.default;
  };

  return { externalProviders, login, getErrorMessage, handleLogin };
};
