import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CheckoutProductId } from "@/lib/catalog";

export type OrderProduct = "story" | "monster" | "emergency";
export type OrderStatus = "draft" | "pending_payment" | "paid" | "processing" | "delivered" | "failed";

export type StoredOrder = {
  id: string;
  productId: CheckoutProductId;
  product: OrderProduct;
  status: OrderStatus;
  configuration: Record<string, unknown>;
  output?: Record<string, unknown>;
  coverObjectName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
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

function firestoreFields(order: StoredOrder) {
  const values: Record<string, { stringValue?: string }> = {
    id: { stringValue: order.id },
    productId: { stringValue: order.productId },
    product: { stringValue: order.product },
    status: { stringValue: order.status },
    configuration: { stringValue: JSON.stringify(order.configuration) },
    createdAt: { stringValue: order.createdAt },
    updatedAt: { stringValue: order.updatedAt },
  };

  if (order.output) values.output = { stringValue: JSON.stringify(order.output) };
  if (order.coverObjectName) values.coverObjectName = { stringValue: order.coverObjectName };
  if (order.customerEmail) values.customerEmail = { stringValue: order.customerEmail };
  if (order.deliveryExpiresAt) values.deliveryExpiresAt = { stringValue: order.deliveryExpiresAt };
  if (order.errorCode) values.errorCode = { stringValue: order.errorCode };
  return values;
}

function readString(fields: Record<string, { stringValue?: string }> | undefined, name: string) {
  return fields?.[name]?.stringValue || "";
}

function readJson(fields: Record<string, { stringValue?: string }> | undefined, name: string) {
  const value = readString(fields, name);
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function fromFirestore(document: { name?: string; updateTime?: string; fields?: Record<string, { stringValue?: string }> }): StoredOrder | null {
  const fields = document.fields;
  const id = readString(fields, "id");
  const productId = readString(fields, "productId") as CheckoutProductId;
  const product = readString(fields, "product") as OrderProduct;
  const status = readString(fields, "status") as OrderStatus;
  const configuration = readJson(fields, "configuration");
  if (!orderIdPattern.test(id) || !configuration || !["story", "monster", "emergency"].includes(product) || !["draft", "pending_payment", "paid", "processing", "delivered", "failed"].includes(status)) return null;

  return {
    id,
    productId,
    product,
    status,
    configuration,
    ...(readJson(fields, "output") ? { output: readJson(fields, "output") } : {}),
    ...(readString(fields, "coverObjectName") ? { coverObjectName: readString(fields, "coverObjectName") } : {}),
    ...(readString(fields, "customerEmail") ? { customerEmail: readString(fields, "customerEmail") } : {}),
    createdAt: readString(fields, "createdAt"),
    updatedAt: readString(fields, "updatedAt"),
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
  if (productId === "night-shield") return "monster";
  if (productId === "patience-kit") return "emergency";
  return "story";
}

export async function createOrder(productId: CheckoutProductId, configuration: Record<string, unknown>) {
  const now = new Date().toISOString();
  const order: StoredOrder = { id: createOrderId(), productId, product: getProductFromId(productId), status: "draft", configuration, createdAt: now, updatedAt: now };
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

export async function setOrderStatus(order: StoredOrder, status: OrderStatus, fields: Partial<Pick<StoredOrder, "customerEmail" | "output" | "coverObjectName" | "deliveryExpiresAt" | "errorCode">> = {}) {
  return saveOrder({ ...order, ...fields, status, updatedAt: new Date().toISOString() }, order.updateTime);
}

function storageBucket() {
  const bucket = process.env.ORDER_STORAGE_BUCKET?.trim();
  if (!bucket) throw new Error("ORDER_STORAGE_BUCKET nu este configurat.");
  return bucket;
}

export async function saveOrderCover(orderId: string, imageDataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(imageDataUrl);
  if (!match) throw new Error("Coperta generata nu are un format valid.");
  const mimeType = match[1];
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  const objectName = `orders/${orderId}/cover.${extension}`;
  const token = await accessToken(TASKS_SCOPES);
  const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(storageBucket())}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
    body: Buffer.from(match[2], "base64"),
  });
  if (!response.ok) throw new Error(`Cloud Storage upload failed (${response.status}).`);
  return objectName;
}

export async function readOrderCover(objectName: string) {
  const token = await accessToken(TASKS_SCOPES);
  const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(storageBucket())}/o/${encodeURIComponent(objectName)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Cloud Storage download failed (${response.status}).`);
  const contentType = response.headers.get("content-type") || "image/png";
  const image = Buffer.from(await response.arrayBuffer()).toString("base64");
  return `data:${contentType};base64,${image}`;
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
  const project = projectId();
  const location = process.env.ORDER_TASKS_LOCATION?.trim() || "europe-west3";
  const queue = process.env.ORDER_TASKS_QUEUE?.trim() || "pmm-order-processing";
  const serviceAccountEmail = process.env.ORDER_TASKS_SERVICE_ACCOUNT?.trim();
  if (!project || !serviceAccountEmail) throw new Error("Cloud Tasks nu este configurat pentru comenzi.");

  const taskName = `projects/${project}/locations/${location}/queues/${queue}/tasks/order-${orderId}`;
  const url = `https://cloudtasks.googleapis.com/v2/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/queues/${encodeURIComponent(queue)}/tasks`;
  const token = await accessToken(TASKS_SCOPES);
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ task: { name: taskName, httpRequest: { httpMethod: "POST", url: `${siteUrl}/api/orders/process`, headers: { "Content-Type": "application/json" }, body: Buffer.from(JSON.stringify({ orderId })).toString("base64"), oidcToken: { serviceAccountEmail, audience: siteUrl } } } }),
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
