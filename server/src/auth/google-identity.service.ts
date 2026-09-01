import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { VerifiedGoogleIdentity } from "./auth.types";

@Injectable()
export class GoogleIdentityService {
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  async verifyCredential(credential: string): Promise<VerifiedGoogleIdentity> {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID")?.trim();

    if (!clientId) {
      throw new ServiceUnavailableException(
        "Google sign-in is not configured",
      );
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (
        !payload?.sub ||
        !payload.email ||
        payload.email_verified !== true
      ) {
        throw new UnauthorizedException(
          "Google sign-in could not be verified",
        );
      }

      return {
        subject: payload.sub,
        email: payload.email.trim().toLowerCase(),
        name: payload.name?.trim() || null,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        "Google sign-in could not be verified",
      );
    }
  }
}
