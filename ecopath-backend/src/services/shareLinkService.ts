// Share link and QR code generation service

import { createHash } from "crypto";
import QRCode from "qrcode";

const BASE_URL = process.env.PUBLIC_URL || "https://ecopath.me";
const DEFAULT_LANDING_PAGE = "/";

export interface ShareLinkResponse {
  url: string;
  qrCodeDataUrl?: string;
  referralCode?: string;
  expiresAt?: string;
}

export interface ShareLinkOptions {
  userId?: string;
  campaign?: string;
  includeQRCode?: boolean;
  landingPage?: string;
}

// In-memory store for referral analytics (in production, use database)
const referralLogs = new Map<string, { userId?: string; createdAt: string; clicks: number }>();

export class ShareLinkService {
  /**
   * Generate a shareable link with optional QR code
   */
  static async generateShareLink(options: ShareLinkOptions = {}): Promise<ShareLinkResponse> {
    const { userId, campaign, includeQRCode = false, landingPage = DEFAULT_LANDING_PAGE } = options;

    // Generate anonymous referral code if userId provided
    let referralCode: string | undefined;
    if (userId) {
      referralCode = this.generateAnonymousReferralCode(userId);

      // Log for analytics
      this.logReferralLink(referralCode, userId);
    }

    // Build shareable URL
    const url = this.buildShareableUrl(landingPage, referralCode, campaign);

    // Generate QR code if requested
    let qrCodeDataUrl: string | undefined;
    if (includeQRCode) {
      qrCodeDataUrl = await this.generateQRCode(url);
    }

    return {
      url,
      qrCodeDataUrl,
      referralCode,
    };
  }

  /**
   * Generate anonymous referral code from userId
   * Uses hashing to prevent PII exposure
   */
  private static generateAnonymousReferralCode(userId: string): string {
    const timestamp = Date.now().toString(36);
    const hash = createHash("sha256")
      .update(`${userId}-${timestamp}`)
      .digest("hex")
      .substring(0, 8);

    return `${hash}${timestamp}`;
  }

  /**
   * Build shareable URL with referral tracking
   */
  private static buildShareableUrl(
    landingPage: string,
    referralCode?: string,
    campaign?: string,
  ): string {
    const url = new URL(landingPage, BASE_URL);

    if (referralCode) {
      url.searchParams.set("ref", referralCode);
    }

    if (campaign) {
      url.searchParams.set("campaign", campaign);
    }

    // Add source parameter to identify QR scans
    url.searchParams.set("source", "qr_share");

    return url.toString();
  }

  /**
   * Generate QR code as data URL
   */
  private static async generateQRCode(url: string): Promise<string> {
    try {
      const qrOptions = {
        errorCorrectionLevel: "M" as const,
        type: "image/png" as const,
        quality: 0.92,
        margin: 1,
        width: 512,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      };

      const dataUrl = await QRCode.toDataURL(url, qrOptions);
      return dataUrl;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Log referral link creation for analytics
   */
  private static logReferralLink(referralCode: string, userId?: string): void {
    referralLogs.set(referralCode, {
      userId,
      createdAt: new Date().toISOString(),
      clicks: 0,
    });
  }

  /**
   * Track referral link click (called when user visits with ref parameter)
   */
  static trackReferralClick(referralCode: string): void {
    const log = referralLogs.get(referralCode);
    if (log) {
      log.clicks += 1;
    }
  }

  /**
   * Get referral analytics (admin/user use)
   */
  static getReferralAnalytics(referralCode: string): {
    clicks: number;
    createdAt: string;
  } | null {
    const log = referralLogs.get(referralCode);
    if (!log) return null;

    return {
      clicks: log.clicks,
      createdAt: log.createdAt,
    };
  }

  /**
   * Generate a simple public QR code (no tracking)
   */
  static async generatePublicQRCode(landingPage: string = DEFAULT_LANDING_PAGE): Promise<string> {
    const url = new URL(landingPage, BASE_URL);
    url.searchParams.set("source", "qr_public");

    return await this.generateQRCode(url.toString());
  }
}
