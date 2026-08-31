import React, { useEffect, useRef, useState } from "react";
import {
  GoogleButtonText,
  renderGoogleSignInButton,
} from "./googleIdentity";

interface GoogleSignInButtonProps {
  clientId: string;
  text: GoogleButtonText;
  onCredential: (credential: string) => Promise<boolean>;
  onFailure: () => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  clientId,
  text,
  onCredential,
  onFailure,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let isMounted = true;

    void renderGoogleSignInButton({
      container,
      clientId,
      text,
      onCredential: (credential) => {
        void onCredential(credential).then((succeeded) => {
          if (!succeeded) {
            onFailure();
          }
        });
      },
    })
      .then((dispose) => {
        if (isMounted) {
          cleanup = dispose;
          setIsUnavailable(false);
        } else {
          dispose();
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsUnavailable(true);
        }
      });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [clientId, onCredential, onFailure, text]);

  if (isUnavailable) {
    return (
      <p className="text-center text-xs text-rose-600 dark:text-rose-400">
        Google sign-in is temporarily unavailable.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-11 w-full items-center justify-center overflow-hidden"
      aria-label="Google account sign-in"
    />
  );
};
