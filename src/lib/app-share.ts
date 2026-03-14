"use client";

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

type ShareAppInput = {
  referralCode?: string;
};

const SHARE_CARD_WIDTH = 1200;
const SHARE_CARD_HEIGHT = 630;
const LOGO_PATH = "/logo.jpg";
const APP_TITLE = "MSPK Trade Solutions";
const APP_URL = "https://user.mspktradesolutions.com/trial";

function getShareText(referralCode?: string) {
  const normalizedReferralCode = referralCode?.trim();
  const trialUrl = normalizedReferralCode
    ? `${APP_URL}?ref=${encodeURIComponent(normalizedReferralCode)}`
    : APP_URL;

  const lines = [
    "MSPK Trade Solutions is a premium and trusted signals app.",
    "Get real-time market updates and pro-level trade insights.",
    normalizedReferralCode ? `Use my referral code: ${normalizedReferralCode}.` : "Start your free trial today.",
    `Join here: ${trialUrl}`,
  ];

  return {
    title: APP_TITLE,
    text: lines.join(" "),
    trialUrl,
  };
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const tentative = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(tentative).width <= maxWidth) {
      currentLine = tentative;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function loadLogo() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load app logo"));
    image.src = LOGO_PATH;
  });
}

async function createShareCardBlob({ referralCode }: ShareAppInput) {
  if (typeof window === "undefined") {
    return null;
  }

  const { trialUrl } = getShareText(referralCode);
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.fillStyle = "#07111f";
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const gradient = context.createLinearGradient(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(0.55, "#0b3a5d");
  gradient.addColorStop(1, "#0f766e");
  context.fillStyle = gradient;
  context.fillRect(24, 24, SHARE_CARD_WIDTH - 48, SHARE_CARD_HEIGHT - 48);

  context.fillStyle = "rgba(255,255,255,0.08)";
  context.beginPath();
  context.arc(980, 130, 120, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(1060, 520, 150, 0, Math.PI * 2);
  context.fill();

  try {
    const logo = await loadLogo();
    context.save();
    context.beginPath();
    context.arc(148, 130, 62, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    context.drawImage(logo, 86, 68, 124, 124);
    context.restore();
  } catch {
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.arc(148, 130, 62, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#0f172a";
    context.font = "bold 46px Arial";
    context.fillText("M", 130, 146);
  }

  context.fillStyle = "#f8fafc";
  context.font = "700 52px Arial";
  context.fillText(APP_TITLE, 240, 118);

  context.fillStyle = "rgba(248,250,252,0.92)";
  context.font = "400 28px Arial";
  context.fillText("Premium signals, market updates, and disciplined execution.", 240, 162);

  context.fillStyle = "#ffffff";
  context.font = "700 42px Arial";
  const headline = referralCode?.trim()
    ? `Use referral code ${referralCode.trim()} to start with MSPK.`
    : "Start your MSPK trial in one tap.";
  const headlineLines = wrapText(context, headline, 760);
  headlineLines.forEach((line, index) => {
    context.fillText(line, 88, 292 + index * 56);
  });

  context.fillStyle = "rgba(255,255,255,0.94)";
  context.font = "400 28px Arial";
  const bodyLines = wrapText(context, trialUrl, 920);
  bodyLines.forEach((line, index) => {
    context.fillText(line, 88, 432 + index * 38);
  });

  context.fillStyle = "#f59e0b";
  context.fillRect(88, 510, 332, 64);
  context.fillStyle = "#111827";
  context.font = "700 30px Arial";
  context.fillText("Join MSPK Today", 132, 552);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

async function createNativeShareFile(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  const path = `share/mspk-share-card-${Date.now()}.png`;
  const result = await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  return result.uri;
}

export async function shareApp({ referralCode }: ShareAppInput) {
  const payload = getShareText(referralCode);
  const shareCardBlob = await createShareCardBlob({ referralCode }).catch(() => null);

  if (Capacitor.isNativePlatform()) {
    if (shareCardBlob) {
      try {
        const fileUri = await createNativeShareFile(shareCardBlob);
        await Share.share({
          title: payload.title,
          text: payload.text,
          files: [fileUri],
          dialogTitle: "Share MSPK Trade Solutions",
        });
        return { status: "shared" as const };
      } catch {
      }
    }

    try {
      await Share.share({
        title: payload.title,
        text: payload.text,
        dialogTitle: "Share MSPK Trade Solutions",
      });
      return { status: "shared" as const };
    } catch {
      return { status: "failed" as const, text: payload.text };
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      if (shareCardBlob) {
        const shareFile = new File([shareCardBlob], "mspk-share-card.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [shareFile] })) {
          await navigator.share({
            title: payload.title,
            text: payload.text,
            files: [shareFile],
          });
          return { status: "shared" as const };
        }
      }

      await navigator.share({
        title: payload.title,
        text: payload.text,
      });
      return { status: "shared" as const };
    } catch {
      return { status: "failed" as const, text: payload.text };
    }
  }

  return { status: "unsupported" as const, text: payload.text };
}
