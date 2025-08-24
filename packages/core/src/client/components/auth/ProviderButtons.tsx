import { getProviders, signIn } from "next-auth/react";
import { useAuthLogin } from "../../hooks";

const styleColorMap: Record<string, Record<string, string>> = {
  button: {
    GitHub: "#333",
    Google: "#dd4b39",
    default: "#e6e6e6",
  },
  span: {
    GitHub: "#fff",
    Google: "#fff",
    default: "#000",
  },
};

export const ProviderButtons = (props: {
  providers: Awaited<ReturnType<typeof getProviders>>;
  type: "login" | "signup";
}) => {
  const { providers, type } = props;
  const { externalProviders } = useAuthLogin(providers);

  const getStyleColor = (type: "button" | "span", providerName: string) => {
    return Object.keys(styleColorMap[type]).includes(providerName)
      ? styleColorMap[type][providerName]
      : styleColorMap[type].default;
  };

  return (
    <div className="social-login">
      {externalProviders.map((provider) => (
        <button
          className="provider-btn"
          key={provider.id}
          onClick={() => signIn(provider.id)}
          style={{
            background: getStyleColor("button", provider.name),
          }}
        >
          <span
            style={{
              color: getStyleColor("span", provider.name),
            }}
          >
            {type == "login" ? "Login" : "Sign Up"} with {provider.name}
          </span>
        </button>
      ))}
    </div>
  );
};
