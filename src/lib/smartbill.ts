import type Stripe from "stripe";
import type { CheckoutProduct } from "@/lib/catalog";

const SMARTBILL_INVOICE_URL = "https://ws.smartbill.ro/SBORO/api/invoice/v2";
const DEFAULT_TIMEOUT_MS = 15_000;

export type SmartBillMode = "test" | "live";

export type SmartBillInvoiceResult = {
  series: string;
  number: string;
  documentViewUrl?: string;
};

export class SmartBillError extends Error {
  constructor(
    message: string,
    public readonly certainty: "definite" | "uncertain",
    public readonly code: string,
  ) {
    super(message);
    this.name = "SmartBillError";
  }
}

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function enabled(value: string) {
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function smartBillMode(): SmartBillMode {
  return env("SMARTBILL_MODE").toLowerCase() === "live" ? "live" : "test";
}

export function isSmartBillEnabled() {
  return enabled(env("SMARTBILL_ENABLED"));
}

export function isSmartBillConfigured() {
  return Boolean(
    isSmartBillEnabled()
    && env("SMARTBILL_TOKEN")
    && env("SMARTBILL_USERNAME")
    && env("SMARTBILL_COMPANY_VAT_CODE")
    && env("SMARTBILL_INVOICE_SERIES"),
  );
}

export function validateSmartBillEnvironment(stripeLivemode: boolean) {
  if (!isSmartBillConfigured()) {
    return { ok: false as const, reason: "smartbill_not_configured" };
  }

  const mode = smartBillMode();
  const series = env("SMARTBILL_INVOICE_SERIES").toUpperCase();
  const stripeKey = env("STRIPE_SECRET_KEY");
  const stripeKeyIsLive = stripeKey.startsWith("sk_live_");
  const stripeKeyIsTest = stripeKey.startsWith("sk_test_");

  if (mode === "test") {
    if (stripeLivemode || !stripeKeyIsTest || !series.includes("TEST")) {
      return { ok: false as const, reason: "test_live_mismatch" };
    }
  } else if (!stripeLivemode || !stripeKeyIsLive || series.includes("TEST")) {
    return { ok: false as const, reason: "live_test_mismatch" };
  }

  return { ok: true as const, mode };
}

function clean(value: string | null | undefined, maxLength: number) {
  return (value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function issueDateInRomania() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function clientFromStripe(details: Stripe.Checkout.Session.CustomerDetails | null) {
  const address = details?.address;
  const taxId = details?.tax_ids?.find((item) => item.value)?.value || "";
  const name = clean(details?.business_name || details?.name || details?.individual_name, 200) || "Client persoana fizica";
  const country = address?.country?.toUpperCase() === "RO" ? "Romania" : clean(address?.country, 100) || "Romania";

  return {
    name,
    ...(taxId ? { vatCode: clean(taxId, 40), isTaxPayer: true } : { isTaxPayer: false }),
    address: clean([address?.line1, address?.line2].filter(Boolean).join(", "), 200),
    city: clean(address?.city, 100),
    county: clean(address?.state, 100),
    country,
    email: clean(details?.email, 200),
    phone: clean(details?.phone, 40),
    saveToDb: false,
  };
}

function readError(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.errorText === "string" && record.errorText.trim()) {
    return clean(record.errorText.split("<")[0], 300);
  }
  if (Array.isArray(record.errors)) {
    return clean(record.errors.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return "";
      const error = item as Record<string, unknown>;
      return `${typeof error.param === "string" ? `${error.param}: ` : ""}${typeof error.message === "string" ? error.message : ""}`;
    }).filter(Boolean).join("; "), 300);
  }
  return "";
}

export async function issueSmartBillInvoice({
  orderId,
  stripeSession,
  product,
}: {
  orderId: string;
  stripeSession: Stripe.Checkout.Session;
  product: CheckoutProduct;
}): Promise<SmartBillInvoiceResult> {
  const validation = validateSmartBillEnvironment(stripeSession.livemode);
  if (!validation.ok) {
    throw new SmartBillError("Configuratia SmartBill nu corespunde mediului Stripe.", "definite", validation.reason);
  }

  const amountTotal = stripeSession.amount_total;
  if (typeof amountTotal !== "number" || amountTotal <= 0 || stripeSession.currency?.toLowerCase() !== "ron") {
    throw new SmartBillError("Totalul Stripe nu este eligibil pentru facturare.", "definite", "invalid_total");
  }

  const taxPercentage = Number(env("SMARTBILL_TAX_PERCENTAGE") || "0");
  if (!Number.isFinite(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
    throw new SmartBillError("Cota fiscala SmartBill este invalida.", "definite", "invalid_tax_configuration");
  }

  const amountRon = amountTotal / 100;
  const payload = {
    companyVatCode: env("SMARTBILL_COMPANY_VAT_CODE"),
    seriesName: env("SMARTBILL_INVOICE_SERIES"),
    issueDate: issueDateInRomania(),
    currency: "RON",
    isDraft: false,
    useStock: false,
    sendEmail: false,
    client: clientFromStripe(stripeSession.customer_details),
    products: [{
      name: clean(product.name, 200),
      code: product.id.toUpperCase().replace(/[^A-Z0-9_-]/g, "_").slice(0, 40),
      isService: true,
      quantity: 1,
      measuringUnitName: "buc",
      price: amountRon,
      currency: "RON",
      isTaxIncluded: true,
      taxPercentage,
      saveToDb: false,
    }],
    payment: { value: amountRon, type: "Card online", isCash: false },
    observations: clean(`Comanda online Povestea Mea Magica: ${orderId}. Plata Stripe: ${stripeSession.id}.`, 500),
    mentions: "Material digital personalizat. Achitat online cu cardul.",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(env("SMARTBILL_TIMEOUT_MS")) || DEFAULT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(SMARTBILL_INVOICE_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env("SMARTBILL_USERNAME")}:${env("SMARTBILL_TOKEN")}`).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "SmartBill a depasit timpul de raspuns." : "SmartBill nu a putut fi contactat.";
    throw new SmartBillError(message, "uncertain", error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error");
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = null;
  }

  const errorText = readError(parsed);
  if (!response.ok || errorText) {
    const certainty = response.status >= 500 ? "uncertain" : "definite";
    throw new SmartBillError(errorText || `SmartBill a raspuns cu status ${response.status}.`, certainty, `http_${response.status}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SmartBillError("SmartBill a returnat un raspuns neasteptat.", "uncertain", "invalid_response");
  }
  const result = parsed as Record<string, unknown>;
  const series = clean(typeof result.series === "string" ? result.series : "", 40);
  const number = clean(typeof result.number === "string" ? result.number : String(result.number || ""), 40);
  if (!series || !number) {
    throw new SmartBillError("SmartBill nu a confirmat seria si numarul facturii.", "uncertain", "missing_invoice_id");
  }

  return {
    series,
    number,
    ...(typeof result.documentViewUrl === "string" && result.documentViewUrl.startsWith("https://")
      ? { documentViewUrl: result.documentViewUrl }
      : {}),
  };
}
