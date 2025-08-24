import { requestResetKey as actionsRequestResetPasswordKey } from "../../server/actions/password/request-reset-key";
import { reset as actionsResetPassword } from "../../server/actions/password/reset";

export const useAuthResetPassword = () => {
  const requestResetKey = async (args: { userLogin?: string }) => {
    const { userLogin } = args;

    if (!userLogin) {
      return new Error("No user login or form data provided");
    }

    return await actionsRequestResetPasswordKey(userLogin);
  };

  const handleRequestResetKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userLogin = formData.get("user_login") as string;
    await requestResetKey({ userLogin });
  };

  const reset = async (args: {
    resetKey: string;
    userLogin: string;
    password: string;
    passwordConfirm: string;
  }) => {
    let { resetKey, userLogin, password, passwordConfirm } = args;

    if (password !== passwordConfirm) {
      return new Error("Passwords do not match");
    }

    return await actionsResetPassword({
      newPassword: password,
      resetKey,
      userLogin,
    });
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("password_confirm") as string;
    const resetKey = formData.get("key") as string;
    const userLogin = formData.get("user_login") as string;
    await reset({ password, passwordConfirm, resetKey, userLogin });
  };

  return { requestResetKey, handleRequestResetKey, reset, handleReset };
};
