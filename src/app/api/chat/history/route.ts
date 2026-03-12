import { NextRequest, NextResponse } from "next/server";
import { gatewayCall } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

type GatewayMessagePart = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

type GatewayMessage = {
  id?: string;
  role?: string;
  content?: GatewayMessagePart[];
  timestamp?: number | string | null;
};

type ChatHistoryResult = {
  sessionKey?: string;
  messages?: GatewayMessage[];
};

type UiHistoryMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: "text"; text: string }>;
  createdAt: string;
};

function toEpochMs(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return Date.now();
  return num < 1_000_000_000_000 ? Math.trunc(num * 1000) : Math.trunc(num);
}

function extractText(message: GatewayMessage): string {
  const chunks = Array.isArray(message.content) ? message.content : [];
  return chunks
    .filter((chunk) => chunk?.type === "text" && typeof chunk.text === "string")
    .map((chunk) => chunk.text as string)
    .join("\n")
    .trim();
}

function toUiRole(role: unknown): "user" | "assistant" | "system" | null {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "user") return "user";
  if (normalized === "assistant") return "assistant";
  if (normalized === "system") return "system";
  return null;
}

function toUiMessage(message: GatewayMessage, index: number): UiHistoryMessage | null {
  const role = toUiRole(message.role);
  if (!role) return null;
  const text = extractText(message);
  if (!text) return null;
  return {
    id:
      (typeof message.id === "string" && message.id.trim()) ||
      `history-${index}-${toEpochMs(message.timestamp)}`,
    role,
    parts: [{ type: "text", text }],
    createdAt: new Date(toEpochMs(message.timestamp)).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionKey = String(searchParams.get("sessionKey") || "").trim();
    const limitRaw = Number(searchParams.get("limit") || "200");
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.trunc(limitRaw)))
      : 200;

    if (!sessionKey) {
      return NextResponse.json({ error: "sessionKey is required" }, { status: 400 });
    }

    const history = await gatewayCall<ChatHistoryResult>(
      "chat.history",
      { sessionKey, limit },
      20000,
    );

    const rawMessages = Array.isArray(history.messages) ? history.messages : [];
    const messages = rawMessages
      .map((message, index) => toUiMessage(message, index))
      .filter((message): message is UiHistoryMessage => Boolean(message));

    return NextResponse.json(
      { sessionKey, messages },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
