const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const GOOGLE_IDENTITY_SCRIPT_URL =
  "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let activeCredentialHandler: ((credential: string) => void) | null = null;

export type GoogleButtonText = "signin_with" | "signup_with";

interface RenderGoogleButtonOptions {
  container: HTMLElement;
  clientId: string;
  text: GoogleButtonText;
  onCredential: (credential: string) => void;
}

export async function renderGoogleSignInButton({
  container,
  clientId,
  text,
  onCredential,
}: RenderGoogleButtonOptions): Promise<() => void> {
  await loadGoogleIdentityLibrary();

  const googleIdentity = window.google?.accounts.id;
  if (!googleIdentity) {
    throw new Error("Google Identity Services did not initialize");
  }

  if (initializedClientId && initializedClientId !== clientId) {
    throw new Error("Google Identity Services was initialized with another client ID");
  }

  activeCredentialHandler = onCredential;

  if (!initializedClientId) {
    googleIdentity.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          activeCredentialHandler?.(response.credential);
        }
      },
      auto_select: false,
      ux_mode: "popup",
    });
    initializedClientId = clientId;
  }

  container.replaceChildren();
  const measuredWidth = Math.floor(container.getBoundingClientRect().width);
  googleIdentity.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text,
    shape: "rectangular",
    logo_alignment: "left",
    width: Math.max(200, Math.min(measuredWidth || 320, 400)),
  });

  return () => {
    if (activeCredentialHandler === onCredential) {
      activeCredentialHandler = null;
    }
  };
}

function loadGoogleIdentityLibrary(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_IDENTITY_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script = existingScript || document.createElement("script");

    const handleLoad = () => {
      if (window.google?.accounts.id) {
        resolve();
        return;
      }

      scriptPromise = null;
      reject(new Error("Google Identity Services did not initialize"));
    };
    const handleError = () => {
      scriptPromise = null;
      reject(new Error("Google Identity Services could not be loaded"));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = GOOGLE_IDENTITY_SCRIPT_ID;
      script.src = GOOGLE_IDENTITY_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
}
