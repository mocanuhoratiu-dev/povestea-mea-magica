import { GoogleAuth } from "google-auth-library";
import type { OrderProduct } from "@/lib/orders";

export type ReviewRecord = {
  id: string;
  orderId: string;
  product: OrderProduct;
  rating: number;
  displayName: string;
  quote: string;
  consentToPublish: boolean;
  verifiedOrder: true;
  moderationStatus: "pending" | "approved" | "rejected";
  photoObjectName?: string;
  videoObjectName?: string;
  createdAt: string;
};

export type ReviewDraft = {
  rating: number;
  displayName: string;
  quote: string;
  consentToPublish: boolean;
  hasPhoto: boolean;
  hasVideo: boolean;
};

type FirestoreField = {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
};

const scopes = ["https://www.googleapis.com/auth/datastore"];
const reviewIdPattern = /^[a-zA-Z0-9_-]{16,80}$/;

export function reviewDraftError(draft: ReviewDraft) {
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) return "Alege un rating de la 1 la 5.";
  if (draft.consentToPublish && (!draft.displayName || draft.quote.length < 10)) return "Completează numele și câteva cuvinte înainte de publicare.";
  if ((draft.hasPhoto || draft.hasVideo) && !draft.consentToPublish) return "Confirmă acordul de publicare pentru fișierele încărcate.";
  return null;
}

export function isReviewMediaAllowed(kind: "photo" | "video", mimeType: string, size: number) {
  if (!Number.isFinite(size) || size <= 0) return false;
  if (kind === "photo") return ["image/jpeg", "image/png", "image/webp"].includes(mimeType) && size <= 6_000_000;
  return ["video/mp4", "video/webm"].includes(mimeType) && size <= 20_000_000;
}

function projectId() {
  return process.env.ORDER_STORE_PROJECT_ID?.trim() || process.env.VERTEX_AI_PROJECT_ID?.trim();
}

function documentUrl(id: string) {
  const project = projectId();
  if (!project) throw new Error("Review store is not configured.");
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/reviews/${encodeURIComponent(id)}`;
}

async function accessToken() {
  const auth = new GoogleAuth({ scopes });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Review store authentication failed.");
  return token.token;
}

async function firestoreFetch(url: string, init: RequestInit = {}) {
  const token = await accessToken();
  return fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

function toFields(review: ReviewRecord): Record<string, FirestoreField> {
  return {
    id: { stringValue: review.id },
    orderId: { stringValue: review.orderId },
    product: { stringValue: review.product },
    rating: { integerValue: String(review.rating) },
    displayName: { stringValue: review.displayName },
    quote: { stringValue: review.quote },
    consentToPublish: { booleanValue: review.consentToPublish },
    verifiedOrder: { booleanValue: true },
    moderationStatus: { stringValue: review.moderationStatus },
    ...(review.photoObjectName ? { photoObjectName: { stringValue: review.photoObjectName } } : {}),
    ...(review.videoObjectName ? { videoObjectName: { stringValue: review.videoObjectName } } : {}),
    createdAt: { timestampValue: review.createdAt },
  };
}

function fromDocument(document: { fields?: Record<string, FirestoreField> }): ReviewRecord | null {
  const fields = document.fields || {};
  const id = fields.id?.stringValue || "";
  const product = fields.product?.stringValue as OrderProduct;
  const rating = Number(fields.rating?.integerValue || 0);
  const moderationStatus = fields.moderationStatus?.stringValue as ReviewRecord["moderationStatus"];
  if (!reviewIdPattern.test(id) || !["story", "monster", "emergency", "bundle", "album"].includes(product) || !Number.isInteger(rating) || rating < 1 || rating > 5 || !["pending", "approved", "rejected"].includes(moderationStatus)) return null;
  return {
    id,
    orderId: fields.orderId?.stringValue || id,
    product,
    rating,
    displayName: fields.displayName?.stringValue || "Părinte",
    quote: fields.quote?.stringValue || "",
    consentToPublish: fields.consentToPublish?.booleanValue === true,
    verifiedOrder: true,
    moderationStatus,
    ...(fields.photoObjectName?.stringValue ? { photoObjectName: fields.photoObjectName.stringValue } : {}),
    ...(fields.videoObjectName?.stringValue ? { videoObjectName: fields.videoObjectName.stringValue } : {}),
    createdAt: fields.createdAt?.timestampValue || new Date(0).toISOString(),
  };
}

export async function createVerifiedReview(review: ReviewRecord) {
  const response = await firestoreFetch(`${documentUrl(review.id)}?currentDocument.exists=false`, {
    method: "PATCH",
    body: JSON.stringify({ fields: toFields(review) }),
  });
  if (!response.ok) {
    if (response.status === 409 || response.status === 412) throw new Error("review_exists");
    throw new Error(`Review store failed (${response.status}).`);
  }
}

export async function getReview(id: string) {
  if (!reviewIdPattern.test(id)) return null;
  const response = await firestoreFetch(documentUrl(id));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Review lookup failed (${response.status}).`);
  return fromDocument(await response.json());
}

export async function listApprovedReviews(limit = 6) {
  const project = projectId();
  if (!project) return [];
  const response = await firestoreFetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "reviews" }],
        where: { fieldFilter: { field: { fieldPath: "moderationStatus" }, op: "EQUAL", value: { stringValue: "approved" } } },
        limit: Math.min(20, Math.max(1, limit * 3)),
      },
    }),
  });
  if (!response.ok) throw new Error(`Review listing failed (${response.status}).`);
  const rows = await response.json() as Array<{ document?: { fields?: Record<string, FirestoreField> } }>;
  return rows.flatMap((row) => {
    const review = row.document ? fromDocument(row.document) : null;
    return review?.consentToPublish && review.quote ? [review] : [];
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
