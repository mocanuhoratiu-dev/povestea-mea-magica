import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!stripeSecretKey) {
  console.error("Lipsește STRIPE_SECRET_KEY. Rulează scriptul cu cheia Stripe test sau live.");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const now = Math.floor(Date.now() / 1000);
const day = 24 * 60 * 60;

const promotionDefinitions = [
  {
    code: "MAGIE10",
    couponId: "pmm-magie10-launch-2026",
    name: "Povestea Mea Magică - MAGIE10",
    percentOff: 10,
    maxRedemptions: 100,
    expiresAt: now + 7 * day,
    campaign: "launch-2026",
  },
  {
    code: "POVESTECADOU100",
    couponId: "pmm-povestecadou100-2026",
    name: "Povestea Mea Magică - POVESTECADOU100",
    percentOff: 100,
    maxRedemptions: 5,
    expiresAt: now + 30 * day,
    campaign: "gift-2026",
  },
];

async function retrieveCoupon(couponId) {
  try {
    const coupon = await stripe.coupons.retrieve(couponId);
    return coupon.deleted ? null : coupon;
  } catch (error) {
    if (error?.code === "resource_missing") return null;
    throw error;
  }
}

async function ensureCoupon(definition) {
  const existing = await retrieveCoupon(definition.couponId);
  if (existing) {
    if (
      existing.percent_off !== definition.percentOff
      || existing.max_redemptions !== definition.maxRedemptions
    ) {
      throw new Error(`Couponul ${definition.couponId} există cu alte reguli.`);
    }
    return existing;
  }

  return stripe.coupons.create({
    id: definition.couponId,
    name: definition.name,
    percent_off: definition.percentOff,
    duration: "once",
    max_redemptions: definition.maxRedemptions,
    redeem_by: definition.expiresAt,
    metadata: {
      campaign: definition.campaign,
      managed_by: "povestea-mea-magica",
    },
  });
}

function promotionCouponId(promotionCode) {
  const coupon = promotionCode.promotion?.coupon;
  return typeof coupon === "string" ? coupon : coupon?.id;
}

async function ensurePromotionCode(definition, coupon) {
  const existingCodes = await stripe.promotionCodes.list({
    code: definition.code,
    active: true,
    limit: 1,
  });
  const existing = existingCodes.data[0];

  if (existing) {
    if (
      promotionCouponId(existing) !== coupon.id
      || existing.max_redemptions !== definition.maxRedemptions
    ) {
      throw new Error(`Codul ${definition.code} există deja cu alte reguli.`);
    }
    return { promotionCode: existing, created: false };
  }

  const promotionCode = await stripe.promotionCodes.create({
    promotion: {
      type: "coupon",
      coupon: coupon.id,
    },
    code: definition.code,
    active: true,
    expires_at: definition.expiresAt,
    max_redemptions: definition.maxRedemptions,
    metadata: {
      campaign: definition.campaign,
      managed_by: "povestea-mea-magica",
    },
  });

  return { promotionCode, created: true };
}

const mode = stripeSecretKey.startsWith("sk_live_") ? "LIVE" : "TEST";
console.log(`Configurare coduri promoționale în modul ${mode}.`);

for (const definition of promotionDefinitions) {
  const coupon = await ensureCoupon(definition);
  const { promotionCode, created } = await ensurePromotionCode(definition, coupon);
  const expiration = new Date((promotionCode.expires_at ?? definition.expiresAt) * 1000)
    .toISOString()
    .slice(0, 10);
  console.log(
    `${definition.code}: ${created ? "creat" : "deja configurat"}, `
    + `${definition.percentOff}%, maximum ${definition.maxRedemptions} utilizări, expiră ${expiration}.`,
  );
}
