import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CheckoutProductId } from "@/lib/catalog";

export type OrderProduct = "story" | "monster" | "emergency" | "bundle" | "album";
export type OrderStatus = "draft" | "pending_payment" | "paid" | "processing" | "delivered" | "failed";
export type InvoiceStatus = "pending" | "issuing" | "issued" | "failed" | "needs_review" | "not_required";

export type StoredOrder = {
  id: string;
  productId: CheckoutProductId;
  product: OrderProduct;
  status: OrderStatus;
  configuration: Record<string, unknown>;
  output?: Record<string, unknown>;
  coverObjectName?: string;
  customerEmail?: string;
  stripeSessionId?: string;
  stripeLivemode?: boolean;
  invoiceStatus?: InvoiceStatus;
  invoiceSeries?: string;
  invoiceNumber?: string;
  invoiceDocumentUrl?: string;
  invoiceErrorCode?: string;
  invoiceUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  deliveryExpiresAt?: string;
  errorCode?: string;
  updateTime?: string;
};

const FIRESTORE_SCOPES = ["https://www.googleapis.com/auth/datastore"];
const TASKS_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];
const orderIdPattern = /^[a-zA-Z0-9_-]{16,80}$/;

function projectId() {
  return process.env.ORDER_STORE_PROJECT_ID?.trim() || process.env.VERTEX_AI_PROJECT_ID?.trim();
}

function orderSecret() {
  return process.env.ORDER_ACCESS_SECRET?.trim();
}

function firestoreDocumentUrl(id: string) {
  const project = projectId();
  if (!project) throw new Error("ORDER_STORE_PROJECT_ID nu este configurat.");
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/orders/${encodeURIComponent(id)}`;
}

type FirestoreField = { stringValue?: string; timestampValue?: string };

function firestoreFields(order: StoredOrder) {
  const values: Record<string, FirestoreField> = {
    id: { stringValue: order.id },
    productId: { stringValue: order.productId },
    product: { stringValue: order.product },
    status: { stringValue: order.status },
    configuration: { stringValue: JSON.stringify(order.configuration) },
    createdAt: { stringValue: order.createdAt },
    updatedAt: { stringValue: order.updatedAt },
    expiresAt: { timestampValue: order.expiresAt },
  };

  if (order.output) values.output = { stringValue: JSON.stringify(order.output) };
  if (order.coverObjectName) values.coverObjectName = { stringValue: order.coverObjectName };
  if (order.customerEmail) values.customerEmail = { stringValue: order.customerEmail };
  if (order.stripeSessionId) values.stripeSessionId = { stringValue: order.stripeSessionId };
  if (typeof order.stripeLivemode === "boolean") values.stripeLivemode = { stringValue: String(order.stripeLivemode) };
  if (order.invoiceStatus) values.invoiceStatus = { stringValue: order.invoiceStatus };
  if (order.invoiceSeries) values.invoiceSeries = { stringValue: order.invoiceSeries };
  if (order.invoiceNumber) values.invoiceNumber = { stringValue: order.invoiceNumber };
  if (order.invoiceDocumentUrl) values.invoiceDocumentUrl = { stringValue: order.invoiceDocumentUrl };
  if (order.invoiceErrorCode) values.invoiceErrorCode = { stringValue: order.invoiceErrorCode };
  if (order.invoiceUpdatedAt) values.invoiceUpdatedAt = { stringValue: order.invoiceUpdatedAt };
  if (order.deliveryExpiresAt) values.deliveryExpiresAt = { stringValue: order.deliveryExpiresAt };
  if (order.errorCode) values.errorCode = { stringValue: order.errorCode };
  return values;
}

function readString(fields: Record<string, FirestoreField> | undefined, name: string) {
  return fields?.[name]?.stringValue || "";
}

function readTimestamp(fields: Record<string, FirestoreField> | undefined, name: string) {
  return fields?.[name]?.timestampValue || "";
}

function readJson(fields: Record<string, FirestoreField> | undefined, name: string) {
  const value = readString(fields, name);
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function fromFirestore(document: { name?: string; updateTime?: string; fields?: Record<string, FirestoreField> }): StoredOrder | null {
  const fields = document.fields;
  const id = readString(fields, "id");
  const productId = readString(fields, "productId") as CheckoutProductId;
  const product = readString(fields, "product") as OrderProduct;
  const status = readString(fields, "status") as OrderStatus;
  const configuration = readJson(fields, "configuration");
  const invoiceStatus = readString(fields, "invoiceStatus") as InvoiceStatus;
  if (!orderIdPattern.test(id) || !configuration || !["story", "monster", "emergency", "bundle", "album"].includes(product) || !["draft", "pending_payment", "paid", "processing", "delivered", "failed"].includes(status)) return null;

  return {
    id,
    productId,
    product,
    status,
    configuration,
    ...(readJson(fields, "output") ? { output: readJson(fields, "output") } : {}),
    ...(readString(fields, "coverObjectName") ? { coverObjectName: readString(fields, "coverObjectName") } : {}),
    ...(readString(fields, "customerEmail") ? { customerEmail: readString(fields, "customerEmail") } : {}),
    ...(readString(fields, "stripeSessionId") ? { stripeSessionId: readString(fields, "stripeSessionId") } : {}),
    ...(readString(fields, "stripeLivemode") ? { stripeLivemode: readString(fields, "stripeLivemode") === "true" } : {}),
    ...(["pending", "issuing", "issued", "failed", "needs_review", "not_required"].includes(invoiceStatus) ? { invoiceStatus } : {}),
    ...(readString(fields, "invoiceSeries") ? { invoiceSeries: readString(fields, "invoiceSeries") } : {}),
    ...(readString(fields, "invoiceNumber") ? { invoiceNumber: readString(fields, "invoiceNumber") } : {}),
    ...(readString(fields, "invoiceDocumentUrl") ? { invoiceDocumentUrl: readString(fields, "invoiceDocumentUrl") } : {}),
    ...(readString(fields, "invoiceErrorCode") ? { invoiceErrorCode: readString(fields, "invoiceErrorCode") } : {}),
    ...(readString(fields, "invoiceUpdatedAt") ? { invoiceUpdatedAt: readString(fields, "invoiceUpdatedAt") } : {}),
    createdAt: readString(fields, "createdAt"),
    updatedAt: readString(fields, "updatedAt"),
    expiresAt: readTimestamp(fields, "expiresAt") || readString(fields, "expiresAt"),
    ...(readString(fields, "deliveryExpiresAt") ? { deliveryExpiresAt: readString(fields, "deliveryExpiresAt") } : {}),
    ...(readString(fields, "errorCode") ? { errorCode: readString(fields, "errorCode") } : {}),
    updateTime: document.updateTime,
  };
}

async function accessToken(scopes = FIRESTORE_SCOPES) {
  const auth = new GoogleAuth({ scopes });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Nu am putut obține acces la Google Cloud pentru comenzi.");
  return token.token;
}

async function firestoreFetch(url: string, init: RequestInit = {}) {
  const token = await accessToken();
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  if (!response.ok) throw new Error(`Firestore request failed (${response.status}).`);
  return response;
}

export function isOrderStoreConfigured() {
  return Boolean(projectId() && orderSecret() && process.env.ORDER_STORAGE_BUCKET?.trim());
}

export function isTrustedOrderWorker(request: Request) {
  const configured = process.env.ORDER_WORKER_SECRET?.trim();
  const supplied = request.headers.get("x-pmm-order-worker") || "";
  if (!configured || !supplied) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createOrderId() {
  return randomBytes(18).toString("base64url");
}

export function getProductFromId(productId: CheckoutProductId): OrderProduct {
  if (productId === "illustrated-album-digital") return "album";
  if (productId === "family-bundle" || productId === "complete-bundle") return "bundle";
  if (productId === "night-shield") return "monster";
  if (productId === "patience-kit") return "emergency";
  return "story";
}

export async function createOrder(productId: CheckoutProductId, configuration: Record<string, unknown>) {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const order: StoredOrder = { id: createOrderId(), productId, product: getProductFromId(productId), status: "draft", configuration, createdAt: now, updatedAt: now, expiresAt };
  await firestoreFetch(`${firestoreDocumentUrl(order.id)}?currentDocument.exists=false`, { method: "PATCH", body: JSON.stringify({ fields: firestoreFields(order) }) });
  return order;
}

export async function getOrder(id: string) {
  if (!orderIdPattern.test(id)) return null;
  try {
    const response = await firestoreFetch(firestoreDocumentUrl(id));
    return fromFirestore(await response.json());
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) return null;
    throw error;
  }
}

export async function saveOrder(order: StoredOrder, expectedUpdateTime?: string) {
  const currentDocument = expectedUpdateTime ? `&currentDocument.updateTime=${encodeURIComponent(expectedUpdateTime)}` : "";
  const response = await firestoreFetch(`${firestoreDocumentUrl(order.id)}?${currentDocument.slice(1)}`, { method: "PATCH", body: JSON.stringify({ fields: firestoreFields(order) }) });
  return fromFirestore(await response.json());
}

const orderStatusRank: Record<OrderStatus, number> = {
  draft: 0,
  pending_payment: 1,
  paid: 2,
  processing: 3,
  delivered: 4,
  failed: 5,
};

export async function setOrderStatus(order: StoredOrder, status: OrderStatus, fields: Partial<Pick<StoredOrder, "customerEmail" | "output" | "coverObjectName" | "deliveryExpiresAt" | "expiresAt" | "errorCode" | "stripeSessionId" | "stripeLivemode" | "invoiceStatus" | "invoiceSeries" | "invoiceNumber" | "invoiceDocumentUrl" | "invoiceErrorCode" | "invoiceUpdatedAt">> = {}) {
  let current = order;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const nextStatus = orderStatusRank[current.status] > orderStatusRank[status] ? current.status : status;
    try {
      return await saveOrder({
        ...current,
        ...fields,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      }, current.updateTime);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("(412)") || attempt === 3) throw error;
      const refreshed = await getOrder(order.id);
      if (!refreshed) throw new Error("Comanda nu a fost gasita dupa un conflict de actualizare.");
      current = refreshed;
    }
  }
  throw new Error("Comanda nu a putut fi actualizata.");
}

type InvoiceFields = Partial<Pick<StoredOrder, "stripeSessionId" | "stripeLivemode" | "invoiceStatus" | "invoiceSeries" | "invoiceNumber" | "invoiceDocumentUrl" | "invoiceErrorCode" | "invoiceUpdatedAt">>;

export async function updateOrderInvoice(
  orderId: string,
  fields: InvoiceFields,
  allowedStatuses?: Array<InvoiceStatus | undefined>,
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await getOrder(orderId);
    if (!current) throw new Error("Comanda nu a fost gasita pentru actualizarea facturii.");
    if (allowedStatuses && !allowedStatuses.includes(current.invoiceStatus)) {
      return { order: current, updated: false };
    }
    try {
      const saved = await saveOrder({
        ...current,
        ...fields,
        updatedAt: new Date().toISOString(),
      }, current.updateTime);
      if (!saved) throw new Error("Actualizarea facturii nu a fost salvata.");
      return { order: saved, updated: true };
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("(412)") || attempt === 3) throw error;
    }
  }
  throw new Error("Actualizarea facturii nu a putut fi finalizata.");
}

function storageBucket() {
  const bucket = process.env.ORDER_STORAGE_BUCKET?.trim();
  if (!bucket) throw new Error("ORDER_STORAGE_BUCKET nu este configurat.");
  return bucket;
}

async function uploadOrderFile(orderId: string, data: Buffer, basename: string, mimeType: string, extension: string) {
  const safeBasename = basename.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "file";
  const objectName = `orders/${orderId}/${safeBasename}.${extension}`;
  const token = await accessToken(TASKS_SCOPES);
  const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(storageBucket())}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
    body: new Uint8Array(data),
  });
  if (!response.ok) throw new Error(`Cloud Storage upload failed (${response.status}).`);
  return objectName;
}

export async function saveOrderFile(orderId: string, data: Buffer, basename: string, mimeType: string) {
  const extension = mimeType === "application/pdf" ? "pdf" : mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1] || "bin";
  return uploadOrderFile(orderId, data, basename, mimeType, extension);
}

export async function saveOrderCover(orderId: string, imageDataUrl: string, basename = "cover") {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(imageDataUrl);
  if (!match) throw new Error("Coperta generata nu are un format valid.");
  const mimeType = match[1];
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  return uploadOrderFile(orderId, Buffer.from(match[2], "base64"), basename, mimeType, extension);
}

export async function readOrderFile(objectName: string) {
  const token = await accessToken(TASKS_SCOPES);
  const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(storageBucket())}/o/${encodeURIComponent(objectName)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Cloud Storage download failed (${response.status}).`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}

export async function readOrderCover(objectName: string) {
  const file = await readOrderFile(objectName);
  return `data:${file.contentType};base64,${file.buffer.toString("base64")}`;
}

function deliverySignature(orderId: string, expiresAt: string) {
  const secret = orderSecret();
  if (!secret) throw new Error("ORDER_ACCESS_SECRET nu este configurat.");
  return createHmac("sha256", secret).update(`${orderId}.${expiresAt}`).digest("base64url");
}

export function createDeliveryToken(orderId: string, days = 30) {
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  return createDeliveryTokenForExpiry(orderId, expiresAt);
}

export function createDeliveryTokenForExpiry(orderId: string, expiresAt: string) {
  return `${expiresAt}.${deliverySignature(orderId, expiresAt)}`;
}

export function createOrderDeliveryUrl(order: StoredOrder, token: string, baseUrl: string) {
  const query = `order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}`;
  if (order.product === "bundle") return `${baseUrl}/pachet/livrare?${query}`;
  if (order.product === "album") return `${baseUrl}/album-ilustrat/livrare?${query}`;
  const anchor = order.product === "story" ? "creator" : order.product === "monster" ? "monster-away" : "emergency-kit";
  return `${baseUrl}/?${query}#${anchor}`;
}

export function isValidDeliveryToken(orderId: string, token: string) {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;
  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) < Date.now()) return false;
  const expected = deliverySignature(orderId, expiresAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function enqueueOrderProcessing(orderId: string, siteUrl: string) {
  return enqueueOrderTask(orderId, siteUrl, "process");
}

export async function enqueueOrderInvoicing(orderId: string, siteUrl: string) {
  return enqueueOrderTask(orderId, siteUrl, "invoice");
}

async function enqueueOrderTask(orderId: string, siteUrl: string, taskType: "process" | "invoice") {
  const project = projectId();
  const location = process.env.ORDER_TASKS_LOCATION?.trim() || "europe-west3";
  const queue = process.env.ORDER_TASKS_QUEUE?.trim() || "pmm-order-processing";
  const serviceAccountEmail = process.env.ORDER_TASKS_SERVICE_ACCOUNT?.trim();
  if (!project || !serviceAccountEmail) throw new Error("Cloud Tasks nu este configurat pentru comenzi.");

  const taskName = `projects/${project}/locations/${location}/queues/${queue}/tasks/${taskType}-${orderId}`;
  const url = `https://cloudtasks.googleapis.com/v2/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/queues/${encodeURIComponent(queue)}/tasks`;
  const token = await accessToken(TASKS_SCOPES);
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ task: { name: taskName, dispatchDeadline: taskType === "process" ? "1800s" : "300s", httpRequest: { httpMethod: "POST", url: `${siteUrl}/api/orders/${taskType}`, headers: { "Content-Type": "application/json" }, body: Buffer.from(JSON.stringify({ orderId })).toString("base64"), oidcToken: { serviceAccountEmail, audience: siteUrl } } } }),
  });
  if (response.status === 409) return;
  if (!response.ok) throw new Error(`Cloud Tasks request failed (${response.status}).`);
}

export async function verifyTaskIdentity(request: Request, audience: string) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  try {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({ idToken: token, audience });
    const email = ticket.getPayload()?.email;
    return email === process.env.ORDER_TASKS_SERVICE_ACCOUNT?.trim();
  } catch {
    return false;
  }
}
