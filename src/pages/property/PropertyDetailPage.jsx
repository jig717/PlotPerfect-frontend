import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { propertyService, inquiryService, reviewService, paymentService } from "../../services";
import { useAuth } from "../../context/AuthContext";
import { formatPrice, timeAgo, getInitials, resolveApiAssetUrl } from "../../utils/index";
import api from "../../services/api";
import visitService from "../../services/visitService";

// Cloudinary configuration
const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME;
const LOGO_URL = "https://checkout.razorpay.com/v1/logo.png"; // Fallback placeholder
const BLOCKED_LOOPBACK_IMAGE = /^http:\/\/(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(:\d+)?\//i;
const MAX_ADVANCE_PAYMENT_AMOUNT = 100000;
const RAZORPAY_PAYMENT_METHODS = {
  upi: { label: "UPI", limit: 100000 },
  card: { label: "Card", limit: Infinity },
  netbanking: { label: "Net Banking", limit: 500000 },
};

// MOCK only for development when backend is down
const MOCK = {
  _id: "507f1f77bcf86cd799439011",
  title: "2 BHK Premium Apartment",
  city: "Ahmedabad",
  locality: "Satellite",
  price: 4500000,
  listingType: "sale",
  images: ["/house.jpg", "/banner.jpg"],
  description: "Spacious 2 BHK apartment...",
  bhk: 2,
  baths: 2,
  area: 1200,
  floor: 4,
  totalFloors: 12,
  age: 3,
  facing: "East",
  furnishing: "semi_furnished",
  propertyType: "Apartment",
  isVerified: true,
  amenities: ["Lift", "Parking", "Gym", "Security", "CCTV", "Power Backup"],
  owner: { name: "Raj Patel", role: "owner" },
  createdAt: new Date(Date.now() - 2 * 86400000),
};

const getImageUrl = (publicId, width, height) => {
  if (!publicId) return null;
  if (publicId.startsWith("http")) {
    if (window.location.protocol === "https:" && BLOCKED_LOOPBACK_IMAGE.test(publicId)) {
      return `https://picsum.photos/id/104/${width}/${height}`;
    }
    return publicId;
  }
  if (publicId.startsWith("/")) return resolveApiAssetUrl(publicId);
  if (!CLOUD_NAME) return `https://picsum.photos/id/104/${width}/${height}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
};

const formatPlanPrice = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Price on request";
  if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 2)} Cr`;
  if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 2)} L`;
  return formatPrice(amount);
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const normalizeRazorpayContact = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const digitsOnly = raw.replace(/[^\d+]/g, "");
  if (digitsOnly.startsWith("+") && digitsOnly.length >= 11 && digitsOnly.length <= 16) {
    return digitsOnly;
  }

  const numeric = raw.replace(/\D/g, "");
  if (numeric.length === 10) return `+91${numeric}`;
  if (numeric.length === 12 && numeric.startsWith("91")) return `+${numeric}`;
  if (numeric.length >= 11 && numeric.length <= 15) return `+${numeric}`;
  return "";
};

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    // 1. If already loaded, resolve immediately
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    // 2. Check for existing script (prevent duplicates)
    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existingScript) {
      // If script is already there, wait for it to finish loading
      existingScript.addEventListener("load", () => resolve(window.Razorpay));
      existingScript.addEventListener("error", () => reject(new Error("Razorpay SDK failed to load (existing script tag).")));
      return;
    }

    // 3. Otherwise, create and inject the script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";

    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error("Razorpay SDK was loaded but window.Razorpay is missing."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK. Check your network."));

    document.body.appendChild(script);
  });

const getFullPaymentLabel = (property) => {
  const listingType = String(property?.listingType || property?.purpose || "").toLowerCase();
  return ["rent", "pg"].includes(listingType) ? "Pay Full Amount" : "Pay Full Price";
};

const getRazorpayPaymentMethod = (paymentMethod) =>
  RAZORPAY_PAYMENT_METHODS[String(paymentMethod || "").toLowerCase()] ||
  RAZORPAY_PAYMENT_METHODS.upi;

const getRazorpayLimitMessage = (label = "payment", paymentMethod = "upi") => {
  const method = getRazorpayPaymentMethod(paymentMethod);
  if (!Number.isFinite(method.limit)) {
    return `Razorpay rejected this ${label}. Please try another method or contact the owner or agent for bank transfer options.`;
  }
  return `${method.label} supports a maximum ${label} of ${formatPrice(method.limit)} per transaction. Please choose another method or contact the owner or agent for bank transfer or split payment options.`;
};

const isRazorpayAmountLimitError = (error) => {
  const reason = String(error?.reason || "").toLowerCase();
  const description = String(error?.description || "").toLowerCase();
  return (
    reason === "invalid_amount" ||
    description.includes("amount exceeds") ||
    description.includes("maximum amount")
  );
};

const getRazorpayMethodOptions = (paymentMethod) => {
  const normalizedMethod = String(paymentMethod || "").toLowerCase();
  return {
    card: normalizedMethod === "card",
    upi: normalizedMethod === "upi",
    netbanking: normalizedMethod === "netbanking",
    wallet: false,
    paylater: false,
  };
};

const triggerInvoiceDownload = async (paymentId) => {
  if (!paymentId) return;

  const invoiceBlob = await paymentService.downloadInvoice(paymentId);
  const downloadUrl = window.URL.createObjectURL(invoiceBlob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = `plotperfect-invoice-${paymentId}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

const getPaymentErrorMessage = (error, fallbackMessage) => {
  const payload = error?.response?.data;
  const message = payload?.message || error?.message || fallbackMessage;
  const details = payload?.details;

  if (details && typeof details === "object") {
    const detailParts = [
      details.purpose ? `purpose: ${details.purpose}` : "",
      details.type ? `type: ${details.type}` : "",
      details.status ? `status: ${details.status}` : "",
      typeof details.price === "number" ? `price: ${details.price}` : "",
    ].filter(Boolean);

    if (detailParts.length) {
      return `${message} (${detailParts.join(", ")})`;
    }
  }

  return message;
};

const unwrapApiData = (payload) => payload?.data || payload || {};

const getCompletedPaymentId = (payload) => {
  const body = unwrapApiData(payload);
  return (
    body?._id ||
    body?.paymentId ||
    body?.payment?._id ||
    body?.payment?.id ||
    null
  );
};

const normalizeFloorPlans = (property) => {
  const plans = Array.isArray(property?.floorPlans) ? property.floorPlans : [];
  if (plans.length > 0) {
    return plans.map((plan, index) => ({
      id: plan._id || `${plan.title || plan.label || "plan"}-${index}`,
      title: plan.title || plan.label || `${plan.beds || property?.bhk || ""} BHK`.trim() || `Plan ${index + 1}`,
      area: plan.area || property?.area || "",
      carpetArea: plan.carpetArea || `${plan.beds || property?.bhk || ""} BHK`.trim(),
      price: plan.price ?? property?.price,
      possession: plan.possession || "",
      launchStatus: plan.launchStatus || "",
      image: plan.image || property?.primaryImage || property?.images?.[0] || "",
      imageAlt: plan.imageAlt || `${plan.title || plan.label || "Floor plan"} image`,
      beds: plan.beds ?? property?.bhk ?? null,
      baths: plan.baths ?? property?.baths ?? null,
    }));
  }

  if (!property) return [];

  const fallbackTitle = `${property.bhk || ""} BHK`.trim() || "Floor Plan";
  return [
    {
      id: "default-plan",
      title: fallbackTitle,
      area: property.area || "",
      carpetArea: fallbackTitle,
      price: property.price,
      possession: "",
      launchStatus: property.status === "PENDING" ? "New Launch" : "",
      image: property.primaryImage || property.images?.[0] || "",
      imageAlt: `${fallbackTitle} image`,
      beds: property.bhk ?? null,
      baths: property.baths ?? null,
    },
  ].filter((plan) => plan.title || plan.area || plan.price || plan.image);
};

function Gallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className="h-80 rounded-2xl bg-linear-to-br from-[#f0eeff] to-[#e8e4ff] flex items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-40">
          <path d="M10 70V35L40 10l30 25v35H52V50H28v20H10z" fill="#a78bfa" />
          <rect x="33" y="50" width="14" height="20" rx="2" fill="#c4b5fd" />
          <rect x="20" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
          <rect x="46" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
        </svg>
      </div>
    );
  }
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden h-80">
        <img
          src={getImageUrl(images[active], 800, 450)}
          alt={title}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
            >
              ‹
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {active + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {images.map((img, i) => (
            <img
              key={i}
              src={getImageUrl(img, 100, 70)}
              onClick={() => setActive(i)}
              className={`w-20 h-14 rounded-lg object-cover cursor-pointer border-2 ${active === i ? "border-[#7c3aed]" : "border-transparent"
                } opacity-${active === i ? 1 : 60}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <div className="flex items-center gap-2 bg-[#f9f9ff] border border-[rgba(124,58,237,0.15)] rounded-xl px-4 py-2 text-sm font-medium text-[#1a0a2e]">
      {icon && <span>{icon}</span>}
      {label}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <h3 className="font-serif text-lg font-bold text-[#1a0a2e] border-b border-[rgba(124,58,237,0.1)] pb-2 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function AmenityStatsStrip({ property }) {
  const stats = [
    {
      label: "Bedrooms",
      value: property?.bedrooms ?? property?.bhk,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <path d="M3 11V6.8A1.8 1.8 0 0 1 4.8 5h3.4A1.8 1.8 0 0 1 10 6.8V11" />
          <path d="M14 11V8.8A1.8 1.8 0 0 1 15.8 7h3.4A1.8 1.8 0 0 1 21 8.8V11" />
          <path d="M3 11h18v5H3z" />
          <path d="M5 16v3M19 16v3" />
        </svg>
      ),
    },
    {
      label: "Bathrooms",
      value: property?.bathrooms ?? property?.baths,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <path d="M7 4h3a2 2 0 0 1 2 2v8" />
          <path d="M5 13h11a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-3z" />
          <path d="M7 8h5" />
        </svg>
      ),
    },
  ].filter((item) => item.value !== undefined && item.value !== null && item.value !== "");

  if (!stats.length) return null;

  return (
    <div className={`grid ${stats.length === 2 ? "grid-cols-2" : "grid-cols-1"} rounded-lg border border-[rgba(124,58,237,0.16)] bg-[#f8f7ff]`}>
      {stats.map((item, index) => (
        <div
          key={item.label}
          className={`flex flex-col items-center justify-center gap-2 px-4 py-4 text-center text-[#7c3aed] ${index < stats.length - 1 ? "border-r border-[rgba(124,58,237,0.14)]" : ""}`}
        >
          {item.icon}
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(26,10,46,0.45)]">
            {item.label}
          </span>
          <span className="text-base font-semibold text-[#1a0a2e]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function FloorPlansSection({ property }) {
  const floorPlans = normalizeFloorPlans(property);
  const [activePlanId, setActivePlanId] = useState(floorPlans[0]?.id || null);
  if (!floorPlans.length) return null;

  const activePlan = floorPlans.find((plan) => plan.id === activePlanId) || floorPlans[0];

  return (
    <Section title="Floor Plans & Pricing">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {floorPlans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setActivePlanId(plan.id)}
              className={`px-4 py-2 rounded-full text-sm border transition ${activePlan?.id === plan.id
                ? "bg-[#eef4ff] border-[#93c5fd] text-[#0f3d91] font-semibold"
                : "bg-white border-[rgba(124,58,237,0.14)] text-[rgba(26,10,46,0.7)] hover:border-[#93c5fd]"
                }`}
            >
              {plan.title}
            </button>
          ))}
        </div>
        <a
          href="#contact-owner"
          className="text-sm font-semibold text-[#0f62fe] hover:text-[#0b4ecc] transition"
        >
          View Homes in 3D
        </a>
      </div>

      <div className="rounded-[28px] border border-[#e6eefc] bg-linear-to-br from-[#f7fbff] via-[#f7faff] to-[#eef5ff] p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(15,61,145,0.5)] mb-4">
          {floorPlans.length} Floor Plan{floorPlans.length > 1 ? "s" : ""} Available
        </div>

        <div className="max-w-sm rounded-3xl border border-[#dbe8ff] bg-white shadow-[0_18px_45px_rgba(62,104,179,0.08)] p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-lg font-bold text-[#12315f]">
                {activePlan.area ? `${activePlan.area} sqft.` : activePlan.title}
              </div>
              <div className="text-sm text-[rgba(18,49,95,0.6)] mt-1">
                {activePlan.carpetArea || activePlan.title}
              </div>
            </div>
            <div className="min-w-10 h-10 rounded-2xl bg-[#f2f7ff] flex items-center justify-center text-[#2d6cdf] text-lg">
              ⌂
            </div>
          </div>

          <div className="rounded-[20px] bg-[#fbfdff] border border-[#edf3ff] p-3 mb-4 min-h-52.5 flex items-center justify-center overflow-hidden">
            {activePlan.image ? (
              <img
                src={getImageUrl(activePlan.image, 520, 340)}
                alt={activePlan.imageAlt}
                className="w-full h-full max-h-55 object-contain"
              />
            ) : (
              <div className="text-sm text-[rgba(18,49,95,0.45)]">No floor plan image available</div>
            )}
          </div>

          <div className="text-3xl font-bold text-[#0d2d63] mb-2">{formatPlanPrice(activePlan.price)}</div>

          {(activePlan.launchStatus || activePlan.possession) && (
            <div className="rounded-2xl bg-[#f7f9fc] border border-[#edf2fa] px-4 py-3 text-sm text-[rgba(18,49,95,0.72)] space-y-1">
              {activePlan.launchStatus && <div>{activePlan.launchStatus}</div>}
              {activePlan.possession && <div>{activePlan.possession}</div>}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const target = document.getElementById("contact-owner");
              target?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mt-4 text-sm font-semibold text-[#0f62fe] hover:text-[#0b4ecc] transition"
          >
            Request callback
          </button>
        </div>
      </div>
    </Section>
  );
}

function ReviewSection({ reviews, loading, user, onSubmitReview, submittingReview, reviewForm, setReviewForm }) {
  return (
    <Section title="Reviews">
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-[rgba(26,10,46,0.55)]">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-[rgba(26,10,46,0.55)]">No reviews yet. Be the first to review this property.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const reviewerName = review?.user?.name || review?.reviewerName || "Verified User";
              const ratingValue = Number(review?.rating) || 0;
              const stars = "★".repeat(Math.max(1, Math.min(5, Math.round(ratingValue))));

              return (
                <div key={review?._id} className="bg-[#f9f9ff] rounded-xl p-3 border border-[rgba(124,58,237,0.08)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-[#1a0a2e]">{reviewerName}</div>
                    <div className="text-sm text-[#7c3aed]">{stars}</div>
                  </div>
                  <div className="text-xs text-[rgba(26,10,46,0.45)] mt-1">{timeAgo(review?.createdAt)}</div>
                  <p className="text-sm text-[rgba(26,10,46,0.72)] mt-2">{review?.comment || "Great property."}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-[rgba(124,58,237,0.08)]">
          {!user ? (
            <p className="text-sm text-[rgba(26,10,46,0.55)]">Login to write a review.</p>
          ) : (
            <form onSubmit={onSubmitReview} className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-[rgba(26,10,46,0.65)] font-medium">Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((p) => ({ ...p, rating: e.target.value }))}
                  className="h-9 px-2 rounded-lg border border-[rgba(124,58,237,0.2)] bg-white text-sm"
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                placeholder="Share your experience about this property..."
                className="w-full p-3 rounded-xl border border-[rgba(124,58,237,0.2)] bg-[#f9f9ff] text-[#1a0a2e] text-sm outline-none focus:border-[#7c3aed]"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 rounded-lg bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white text-sm font-semibold disabled:opacity-70"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

function InquiryForm({ propertyId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    "Hi, I am interested in this property. Please share more details."
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please login to send an inquiry");
      navigate("/login");
      return;
    }
    if (user.role !== "buyer") {
      toast.error("Only buyer accounts can send inquiries.");
      navigate("/login");
      return;
    }
    if (!propertyId || propertyId.length !== 24) {
      toast.error("Invalid property ID. Please refresh the page.");
      return;
    }
    setLoading(true);
    try {
      await inquiryService.send({
        user: user._id,
        property: propertyId,
        message,
      });
      toast.success("Inquiry sent! The owner will contact you shortly.");
      setMessage("");
    } catch (error) {
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.message || "";
      if (status === 403) {
        toast.error("Only buyer accounts can send inquiries.");
        navigate("/login");
      } else {
        console.error(error);
        toast.error(errorMessage || "Failed to send inquiry. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        rows={3}
        placeholder="Your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-3 bg-[#f9f9ff] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#1a0a2e] text-sm outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-70"
      >
        {loading ? "Sending…" : "Send Inquiry"}
      </button>
    </form>
  );
}

// ========== Schedule Visit Modal ==========
function ScheduleVisitModal({ property, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const propertyId = property?._id;
  const propertyTitle = property?.title || "this property";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (user.role !== "buyer") {
      toast.error("Only buyer accounts can schedule a visit.");
      navigate("/login");
      return;
    }
    if (!propertyId || String(propertyId).length !== 24) {
      toast.error("Invalid property. Please refresh and try again.");
      return;
    }

    const parsedDate = new Date(scheduledDate);
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error("Please choose a valid visit date and time.");
      return;
    }

    const ownerId =
      property?.owner?._id ||
      property?.owner?.id ||
      (typeof property?.owner === 'string' ? property.owner : null) ||
      property?.ownerId ||
      property?.owner_id ||
      null;
    const normalizedDate = parsedDate.toISOString();

    setLoading(true);
    try {
      const payload = {
        propertyId,
        scheduledDate: normalizedDate,
        notes: notes.trim(),
      };

      if (ownerId) {
        payload.agentId = ownerId;
      }

      await visitService.create(payload);
      toast.success("Visit requested! The agent will confirm soon.");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "";
      if (err?.response?.status === 403) {
        toast.error("Only buyer accounts can schedule a visit.");
        onClose();
        navigate("/login");
      } else if (
        err?.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already have a pending or confirmed visit")
      ) {
        toast.info("You already have a visit request for this property. Opening your scheduled visits.");
        onClose();
        navigate("/dashboard/buyer");
      } else if (err?.code === "ECONNABORTED") {
        toast.error("Visit request is taking longer than expected. Please try again in a moment.");
      } else {
        console.error("Visit request failed:", err?.response?.data || err);
        toast.error(errorMessage || "Failed to schedule");
      }
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Schedule a Visit</h2>
        <p className="text-sm text-gray-500 mb-4">
          for <span className="font-semibold">{propertyTitle}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">Date & Time *</label>
          <input
            type="datetime-local"
            required
            min={minDateTime}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-purple-500 focus:border-purple-500"
          />
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or questions for the agent?"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-purple-500 focus:border-purple-500"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Request Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAdvancePaymentModal, setShowAdvancePaymentModal] = useState(false);
  const [showFullPaymentModal, setShowFullPaymentModal] = useState(false);
  const [hasExistingVisit, setHasExistingVisit] = useState(false);
  const [checkingVisitStatus, setCheckingVisitStatus] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });

  const getFavoritesList = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.message)) return res.message;
    if (Array.isArray(res)) return res;
    return [];
  };

  const loadPropertyDetails = async (propertyId, options = {}) => {
    const { silent = false } = options;

    // Safety check: Prevent fetching if ID is missing or literally "undefined"
    if (!propertyId || propertyId === "undefined") {
      if (!silent) {
        setLoading(false);
        setError("Invalid property selection. Please go back and try again.");
      }
      return null;
    }

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await propertyService.getById(propertyId, { timeout: 30000 });
      const nextProperty = data?.data || data || null;
      if (!nextProperty) throw new Error("No property data received");
      setProperty(nextProperty);
      if (!silent) setError(null);
      return nextProperty;
    } catch (err) {
      console.error("Property fetch error:", err);
      if (!silent) {
        const status = err.response?.status;
        const message = err.response?.data?.message || err.message;
        if (err?.code === "ECONNABORTED") {
          setError("Property details are taking longer than expected to load. Please try again in a moment.");
        } else if (status === 500) {
          setError("Server error. Please try again later.");
        } else if (status === 404) {
          setError("Property not found.");
        } else {
          setError(message || "Failed to load property details.");
        }
        if (
          import.meta.env.DEV &&
          status !== 400 &&
          err?.code !== "ECONNABORTED" &&
          err?.response &&
          propertyId !== "undefined"
        ) {
          console.warn("Using mock property data (development only)");
          setProperty(MOCK);
          setError(null);
          return MOCK;
        }
      }
      throw err;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // FETCH PROPERTY with error handling
  useEffect(() => {
    let cancelled = false;
    const fetchProperty = async () => {
      try {
        await loadPropertyDetails(id);
      } catch {
        if (cancelled) return;
      }
    };
    fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || id === "undefined") return;

    let cancelled = false;
    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await reviewService.getByProperty(id);
        const list = Array.isArray(response?.data) ? response.data : [];
        if (!cancelled) setReviews(list);
      } catch {
        // Gracefully fallback to empty list when no reviews exist yet.
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!property || window.location.hash !== "#contact-owner") return;
    const timeoutId = window.setTimeout(() => {
      document.getElementById("contact-owner")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [property]);

  // CHECK FAVORITE STATUS
  useEffect(() => {
    if (!user || !property?._id) return;
    const checkFavoriteStatus = async () => {
      try {
        const res = await api.get(`/favorite/${user._id}`);
        const favorites = getFavoritesList(res);
        const found = favorites.find(
          (fav) =>
            fav.property?._id?.toString() === property._id ||
            fav.property?.toString() === property._id
        );
        if (found) {
          setSaved(true);
          setFavoriteId(found._id);
        } else {
          setSaved(false);
          setFavoriteId(null);
        }
      } catch (err) {
        console.warn("Failed to fetch favorites", err);
      }
    };
    checkFavoriteStatus();
  }, [user, property?._id]);

  useEffect(() => {
    if (!user?._id || user.role !== "buyer" || !property?._id) {
      setHasExistingVisit(false);
      return;
    }

    let cancelled = false;

    const loadVisitStatus = async () => {
      try {
        setCheckingVisitStatus(true);
        const response = await visitService.getBuyerVisits({ limit: 100 });
        const visits = Array.isArray(response)
          ? response
          : Array.isArray(response?.visits)
            ? response.visits
            : Array.isArray(response?.data)
              ? response.data
              : [];

        const alreadyScheduled = visits.some((visit) => {
          const visitPropertyId =
            visit?.property?._id ||
            visit?.propertyId ||
            visit?.property_id ||
            visit?.property;
          const visitStatus = String(visit?.status || visit?.visit_status || "").toUpperCase();

          return (
            String(visitPropertyId) === String(property._id) &&
            (visitStatus === "PENDING" || visitStatus === "CONFIRMED" || visitStatus === "REQUESTED")
          );
        });

        if (!cancelled) {
          setHasExistingVisit(alreadyScheduled);
        }
      } catch {
        if (!cancelled) {
          setHasExistingVisit(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingVisitStatus(false);
        }
      }
    };

    loadVisitStatus();
    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.role, property?._id]);

  // HANDLE SAVE / UNSAVE
  const handleSave = async () => {
    if (!user) {
      toast.info("Please login to save properties");
      navigate("/login");
      return;
    }

    if (!property?._id || property._id.length !== 24) {
      toast.error("Invalid property ID. Please refresh.");
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      if (saved) {
        if (!favoriteId) {
          const res = await api.get(`/favorite/${user._id}`);
          const favorites = getFavoritesList(res);
          const found = favorites.find(
            (f) =>
              f.property?._id === property._id ||
              f.property?.toString() === property._id
          );
          if (!found) {
            toast.error("Favorite not found");
            return;
          }
          await api.delete(`/favorite/${found._id}`);
        } else {
          await api.delete(`/favorite/${favoriteId}`);
        }
        toast.success("Removed from saved");
        setSaved(false);
        setFavoriteId(null);
      } else {
        await api.post("/favorite", {
          userId: user._id,
          propertyId: property._id,
        });
        const res = await api.get(`/favorite/${user._id}`);
        const favorites = getFavoritesList(res);
        const found = favorites.find(
          (f) =>
            f.property?._id === property._id ||
            f.property?.toString() === property._id
        );
        const nextFavoriteId = found?._id;
        if (!nextFavoriteId) {
          toast.error("Save failed (not persisted)");
          return;
        }
        setFavoriteId(nextFavoriteId);
        setSaved(true);
        toast.success("Property saved! ❤️");
      }
    } catch (error) {
      console.error("Save error:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.message === "Already in favorites"
      ) {
        try {
          const res = await api.get(`/favorite/${user._id}`);
          const favorites = getFavoritesList(res);
          const found = favorites.find(
            (f) =>
              f.property?._id === property._id ||
              f.property?.toString() === property._id
          );
          if (found) {
            setFavoriteId(found._id);
            setSaved(true);
          }
        } catch (syncError) {
          console.warn("Favorite sync failed:", syncError);
        }
        toast.info("Property is already saved.");
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = property?.title || "Check out this property";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        toast.success("Shared successfully!");
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied! You can now share it.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.info("Please login to add a review");
      navigate("/login");
      return;
    }

    if (!property?._id) {
      toast.error("Property not loaded yet");
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewService.create({
        property: property._id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });

      toast.success("Review submitted successfully");
      setReviewForm({ rating: "5", comment: "" });

      const refreshed = await reviewService.getByProperty(property._id);
      setReviews(Array.isArray(refreshed?.data) ? refreshed.data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-[#f0eeff] rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-80 bg-[#f0eeff] rounded-2xl"></div>
              <div className="h-8 bg-[#f0eeff] rounded w-3/4"></div>
              <div className="h-4 bg-[#f0eeff] rounded w-1/2"></div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-[#f0eeff] rounded-full"></div>
                <div className="h-10 w-24 bg-[#f0eeff] rounded-full"></div>
              </div>
            </div>
            <div className="h-96 bg-[#f0eeff] rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Unable to load property
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const normalizedListingType = String(property.listingType || property.purpose || "sale").toLowerCase();
  const normalizedPropertyStatus = String(property.status || "").toUpperCase();
  const isPropertyBooked = normalizedPropertyStatus === "BOOKED";
  const isPropertyUnavailable = ["BOOKED", "SOLD", "RENTED"].includes(normalizedPropertyStatus);
  const canUseFullPayment = Boolean(property?.canUseFullPayment);
  const badgeLabel =
    property.listingLabel ||
    { sale: "For Sale", rent: "For Rent", pg: "PG", lease: "Lease" }[
    normalizedListingType
    ] || "For Sale";
  const badgeColor =
    isPropertyBooked
      ? "#0f766e"
      : { sale: "#7c3aed", rent: "#0891b2", pg: "#059669", lease: "#d97706" }[
      normalizedListingType
      ] || "#7c3aed";

  const detailRows = [
    ["Property Type", property.propertyType],
    ["Listing Type", badgeLabel],
    ["City", property.city],
    ["Locality", property.locality],
    ["BHK", property.bhk ? `${property.bhk} BHK` : null],
    ["Bathrooms", property.baths],
    ["Area", property.area ? `${property.area} sqft` : null],
    ["Floor", property.floor],
    ["Total Floors", property.totalFloors],
    ["Furnishing", property.furnishing?.replace("_", " ")],
    ["Age", property.age ? `${property.age} years` : null],
    ["Facing", property.facing],
  ].filter(([, v]) => v);

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-[rgba(124,58,237,0.1)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-[rgba(26,10,46,0.5)]">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-[#7c3aed] transition"
          >
            ← Back
          </button>
          <span>/</span>
          <button
            onClick={() => navigate("/")}
            className="hover:text-[#7c3aed]"
          >
            Home
          </button>
          <span>/</span>
          <button
            onClick={() => navigate("/properties")}
            className="hover:text-[#7c3aed]"
          >
            Properties
          </button>
          <span>/</span>
          <span className="text-[#7c3aed] font-medium">{property.city}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Gallery images={property.images || []} title={property.title} />

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                  style={{ background: badgeColor, color: "#fff" }}
                >
                  {badgeLabel}
                </span>
                {isPropertyBooked && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
                    Booked
                  </span>
                )}
                {property.isVerified && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                    ✓ Verified
                  </span>
                )}
                <span className="text-xs text-[rgba(26,10,46,0.5)] ml-auto">
                  Listed {property.listedSince || timeAgo(property.createdAt)}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#1a0a2e] mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-1 text-[rgba(26,10,46,0.5)] mb-5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                {property.locality && `${property.locality}, `}
                {property.city}
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {property.bhk && <Chip icon="🛏" label={`${property.bhk} BHK`} />}
                {property.baths && <Chip icon="🚿" label={`${property.baths} Bath`} />}
                {property.area && <Chip icon="📐" label={`${property.area} sqft`} />}
                {property.furnishing && (
                  <Chip icon="🪑" label={property.furnishing.replace("_", " ")} />
                )}
                {property.propertyType && (
                  <Chip icon="🏠" label={property.propertyType} />
                )}
              </div>

              <Section title="Description">
                <p className="text-[rgba(26,10,46,0.7)] leading-relaxed">
                  {property.description || "No description provided."}
                </p>
              </Section>

              <ReviewSection
                reviews={reviews}
                loading={reviewsLoading}
                user={user}
                onSubmitReview={handleSubmitReview}
                submittingReview={submittingReview}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
              />

              {(property.amenities?.length > 0 || property.bhk || property.baths || property.bedrooms || property.bathrooms) && (
                <Section title="Amenities">
                  <AmenityStatsStrip property={property} />
                  {property.amenities?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span
                        key={a}
                        className="bg-[#f0eeff] text-[#7c3aed] text-sm px-3 py-1.5 rounded-lg"
                      >
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                  )}
                </Section>
              )}

              <Section title="Property Details">
                <div className="grid grid-cols-2 gap-3">
                  {detailRows.map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-[#f9f9ff] rounded-xl p-3 border border-[rgba(124,58,237,0.08)]"
                    >
                      <div className="text-xs uppercase tracking-wide text-[rgba(26,10,46,0.4)] mb-1">
                        {key}
                      </div>
                      <div className="text-sm font-semibold text-[#1a0a2e]">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <FloorPlansSection key={property?._id} property={property} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[rgba(124,58,237,0.15)] shadow-sm p-6 sticky top-24">
              <div className="font-serif text-3xl font-bold text-[#1a0a2e]">
                {formatPrice(property.price)}
                {normalizedListingType === "rent" && (
                  <span className="text-base font-normal text-[rgba(26,10,46,0.5)]">
                    /month
                  </span>
                )}
              </div>
              {property.area > 0 && (
                <div className="text-sm text-[rgba(26,10,46,0.5)] mt-1">
                  ₹{Math.round(property.price / property.area).toLocaleString()} / sqft
                </div>
              )}

              {property.owner && (
                <div className="flex items-center gap-3 py-4 my-4 border-y border-[rgba(124,58,237,0.08)]">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center text-white font-bold shadow-md">
                    {getInitials(property.owner.name)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a0a2e]">
                      {property.owner.name}
                    </div>
                    <div className="text-xs text-[rgba(26,10,46,0.5)]">
                      {property.owner.role === "agent"
                        ? "✓ Verified Agent"
                        : "Property Owner"}
                    </div>
                  </div>
                </div>
              )}

              <div id="contact-owner">
                <InquiryForm propertyId={property._id} />
              </div>

              {isPropertyBooked && (
                <div className="mt-4 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-semibold text-[#166534]">
                  This property is booked. The payment invoice and confirmation email have been sent after the successful payment.
                </div>
              )}

              {/* Schedule a Visit Button */}
              <button
                onClick={() => {
                  if (!user) {
                    toast.info("Please login to schedule a visit.");
                    navigate("/login");
                    return;
                  }
                  if (user.role !== "buyer") {
                    toast.error("Only buyer accounts can schedule a visit.");
                    navigate("/login");
                    return;
                  }
                  if (hasExistingVisit) {
                    toast.info("You already have a visit request for this property.");
                    navigate("/dashboard/buyer");
                    return;
                  }
                  setShowScheduleModal(true);
                }}
                disabled={checkingVisitStatus}
                className="w-full py-3 mt-3 bg-white border border-purple-300 text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checkingVisitStatus
                  ? "Checking visit status..."
                  : hasExistingVisit
                    ? "View Scheduled Visit"
                    : "Schedule a Visit"}
              </button>

              {Boolean(property?.canUseAdvancePayment) && (
                <button
                  onClick={() => {
                    if (isPropertyUnavailable) {
                      toast.info(`This property is already ${normalizedPropertyStatus.toLowerCase()}.`);
                      return;
                    }
                    if (!user) {
                      toast.info("Please login to continue with the advance payment/token.");
                      navigate("/login");
                      return;
                    }
                    if (user.role !== "buyer") {
                      toast.error("Only buyer accounts can make an advance payment/token.");
                      navigate("/login");
                      return;
                    }
                    setShowAdvancePaymentModal(true);
                  }}
                  disabled={isPropertyUnavailable}
                  className="w-full py-3 mt-3 bg-linear-to-r from-[#0f766e] to-[#0d9488] text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPropertyUnavailable ? `Property ${normalizedPropertyStatus}` : "Advance Payment / Token"}
                </button>
              )}

              {canUseFullPayment && (
                <button
                  onClick={() => {
                    if (isPropertyUnavailable) {
                      toast.info(`This property is already ${normalizedPropertyStatus.toLowerCase()}.`);
                      return;
                    }
                    if (!user) {
                      toast.info("Please login to continue with the full payment.");
                      navigate("/login");
                      return;
                    }
                    if (user.role !== "buyer") {
                      toast.error("Only buyer accounts can make a full payment.");
                      navigate("/login");
                      return;
                    }
                    setShowFullPaymentModal(true);
                  }}
                  disabled={isPropertyUnavailable}
                  className="w-full py-3 mt-3 bg-linear-to-r from-[#1d4ed8] to-[#2563eb] text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPropertyUnavailable ? `Property ${normalizedPropertyStatus}` : getFullPaymentLabel(property)}
                </button>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={isToggling}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition ${saved
                    ? "border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed]"
                    : "border-[rgba(124,58,237,0.3)] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white"
                    }`}
                >
                  {isToggling
                    ? saved
                      ? "Removing..."
                      : "Saving..."
                    : saved
                      ? "❤️ Saved"
                      : "🤍 Save"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 rounded-xl border border-[rgba(124,58,237,0.3)] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white transition font-semibold"
                >
                  Share 📤
                </button>
              </div>
            </div>

            <div className="bg-[#f9f9ff] rounded-2xl p-5 border border-[rgba(124,58,237,0.1)]">
              <div className="text-xs font-bold uppercase tracking-wide text-[rgba(26,10,46,0.4)] mb-3">
                Why PlotPerfect?
              </div>
              <div className="space-y-2 text-sm text-[rgba(26,10,46,0.7)]">
                <div>✓ Verified listings only</div>
                <div>✓ Direct owner contact</div>
                <div>✓ Zero brokerage</div>
                <div>✓ Secure inquiries</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {showScheduleModal && (
        <ScheduleVisitModal
          property={property}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            // Optional: refresh or show additional feedback
          }}
        />
      )}
      {showAdvancePaymentModal && (
        <AdvancePaymentModal
          property={property}
          onClose={() => setShowAdvancePaymentModal(false)}
          onSuccess={() => {
            loadPropertyDetails(property?._id || id, { silent: true }).catch(() => { });
          }}
        />
      )}
      {showFullPaymentModal && (
        <FullPaymentModal
          property={property}
          onClose={() => setShowFullPaymentModal(false)}
          onSuccess={() => {
            loadPropertyDetails(property?._id || id, { silent: true }).catch(() => { });
          }}
        />
      )}
    </div>
  );
}

function AdvancePaymentModal({ property, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedAmount = (() => {
    const basePrice = Number(property?.price || 0);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return 50000;
    return Math.min(MAX_ADVANCE_PAYMENT_AMOUNT, Math.max(25000, Math.round(basePrice * 0.01)));
  })();

  useEffect(() => {
    setAmount(String(suggestedAmount));
  }, [suggestedAmount]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      toast.info("Please login to continue with the advance payment/token.");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyer accounts can make an advance payment/token.");
      navigate("/login");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const method = getRazorpayPaymentMethod(paymentMethod);
    if (numericAmount > MAX_ADVANCE_PAYMENT_AMOUNT) {
      toast.error(`Advance amount cannot exceed ${formatPrice(MAX_ADVANCE_PAYMENT_AMOUNT)}.`);
      return;
    }

    if (Number.isFinite(method.limit) && numericAmount > method.limit) {
      toast.error(getRazorpayLimitMessage("advance payment", paymentMethod));
      return;
    }

    setLoading(true);
    try {
      await loadRazorpayCheckout();

      const orderResponse = await paymentService.createAdvanceTokenOrder({
        propertyId: property?._id,
        amount: numericAmount,
        paymentMethod,
        notes: notes.trim(),
      });

      const orderPayload = unwrapApiData(orderResponse);
      const order = orderPayload?.order;
      const razorpayKeyId = orderPayload?.razorpayKeyId;

      if (!order?.id || !razorpayKeyId) {
        throw new Error("Unable to initialize Razorpay checkout.");
      }

      const orderAmount = Number(order?.amount || 0) / 100;
      if (Number.isFinite(method.limit) && orderAmount > method.limit) {
        throw new Error(getRazorpayLimitMessage("advance payment", paymentMethod));
      }

      const buyerName = String(orderPayload?.buyer?.name || user?.name || "").trim();
      const buyerEmail = String(orderPayload?.buyer?.email || user?.email || "").trim();
      const buyerContact = normalizeRazorpayContact(orderPayload?.buyer?.phone || user?.phone || "");
      const prefill = {};

      if (buyerName) prefill.name = buyerName;
      if (isValidEmail(buyerEmail)) prefill.email = buyerEmail;
      if (buyerContact) prefill.contact = buyerContact;

      await new Promise((resolve, reject) => {
        const options = {
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "PlotPerfect",
          description: `Advance payment for ${property?.title || "property"}`,
          image: LOGO_URL,
          order_id: order.id,
          method: getRazorpayMethodOptions(paymentMethod),
          prefill,
          theme: {
            color: "#0f766e",
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled.")),
          },
          handler: async (response) => {
            try {
              const verificationResponse = await paymentService.verifyAdvanceToken({
                propertyId: property?._id,
                amount: numericAmount,
                notes: notes.trim(),
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              const completedPaymentId = getCompletedPaymentId(verificationResponse);
              if (completedPaymentId) {
                await triggerInvoiceDownload(completedPaymentId);
              }

              toast.success("Payment completed successfully. Confirmation email sent.");
              onSuccess?.();
              onClose?.();
              resolve();
            } catch (verificationError) {
              reject(
                new Error(
                  verificationError?.response?.data?.message ||
                  "Payment verification failed."
                )
              );
            }
          },
        };

        try {
          const razorpay = new window.Razorpay(options);

          razorpay.on("payment.failed", (response) => {
            // Log the failure to console for debugging
            console.warn("Razorpay payment attempt failed:", response?.error);
            if (isRazorpayAmountLimitError(response?.error)) {
              const limitMessage = getRazorpayLimitMessage("advance payment", paymentMethod);
              razorpay.close();
              reject(new Error(limitMessage));
              return;
            }

            // We DON'T reject here because the user can usually try again 
            // with a different card/method without closing the modal.
            // Razorpay's modal shows its own error message to the user.
          });

          razorpay.open();
        } catch (initError) {
          console.error("Failed to initialize Razorpay object:", initError);
          reject(new Error("Could not initialize payment gateway."));
        }
      });
    } catch (error) {
      if (error?.message !== "Payment was cancelled.") {
        console.error("Advance payment flow failed:", error?.response?.data || error);
        toast.error(getPaymentErrorMessage(error, "Failed to complete advance payment/token."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Advance Payment / Token</h2>
            <p className="text-sm text-gray-500 mt-1">
              Secure this property with a real payment record linked to the owner.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f4f1ff] text-[#7c3aed] font-bold"
          >
            X
          </button>
        </div>

        <div className="rounded-2xl border border-[rgba(124,58,237,0.12)] bg-[#faf8ff] p-4 mb-5">
          <div className="text-sm font-semibold text-[#1a0a2e]">{property?.title || "Property"}</div>
          <div className="text-xs text-[rgba(26,10,46,0.55)] mt-1">
            Suggested token: {formatPrice(suggestedAmount)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[rgba(26,10,46,0.75)] mb-1">
              Amount
            </label>
            <input
              type="number"
              min="1"
              max={MAX_ADVANCE_PAYMENT_AMOUNT}
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded-xl border border-[rgba(124,58,237,0.2)] bg-[#f9f9ff] text-[#1a0a2e] outline-none focus:border-[#7c3aed]"
            />
          </div>
          <p className="text-xs text-[rgba(26,10,46,0.55)]">
            Maximum advance payment: {formatPrice(MAX_ADVANCE_PAYMENT_AMOUNT)}
          </p>

          <div>
            <label className="block text-sm font-semibold text-[rgba(26,10,46,0.75)] mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 rounded-xl border border-[rgba(124,58,237,0.2)] bg-[#f9f9ff] text-[#1a0a2e] outline-none focus:border-[#7c3aed]"
            >
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[rgba(26,10,46,0.75)] mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note for the owner about your token/booking intent..."
              className="w-full p-3 rounded-xl border border-[rgba(124,58,237,0.2)] bg-[#f9f9ff] text-[#1a0a2e] outline-none focus:border-[#7c3aed] resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-linear-to-r from-[#0f766e] to-[#0d9488] text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-70"
          >
            {loading ? "Opening Razorpay..." : "Pay With Razorpay"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FullPaymentModal({ property, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const payableAmount = Number(property?.price || 0);
  const listingType = String(property?.listingType || property?.purpose || "").toLowerCase();
  const amountLabel = ["rent", "pg"].includes(listingType) ? "Full Amount" : "Full Price";
  const selectedMethod = getRazorpayPaymentMethod(paymentMethod);
  const exceedsCheckoutLimit =
    Number.isFinite(payableAmount) &&
    Number.isFinite(selectedMethod.limit) &&
    payableAmount > selectedMethod.limit;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      toast.info("Please login to continue with the full payment.");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyer accounts can make a full payment.");
      navigate("/login");
      return;
    }

    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      toast.error("This property does not have a valid payable amount.");
      return;
    }

    if (exceedsCheckoutLimit) {
      toast.error(getRazorpayLimitMessage(amountLabel.toLowerCase(), paymentMethod));
      return;
    }

    setLoading(true);
    try {
      await loadRazorpayCheckout();

      const orderResponse = await paymentService.createFullPaymentOrder({
        propertyId: property?._id,
        paymentMethod,
        notes: notes.trim(),
      });

      const orderPayload = unwrapApiData(orderResponse);
      const order = orderPayload?.order;
      const razorpayKeyId = orderPayload?.razorpayKeyId;

      if (!order?.id || !razorpayKeyId) {
        throw new Error("Unable to initialize Razorpay checkout.");
      }

      const orderAmount = Number(order?.amount || 0) / 100;
      if (Number.isFinite(selectedMethod.limit) && orderAmount > selectedMethod.limit) {
        throw new Error(getRazorpayLimitMessage(amountLabel.toLowerCase(), paymentMethod));
      }

      const buyerName = String(orderPayload?.buyer?.name || user?.name || "").trim();
      const buyerEmail = String(orderPayload?.buyer?.email || user?.email || "").trim();
      const buyerContact = normalizeRazorpayContact(orderPayload?.buyer?.phone || user?.phone || "");
      const prefill = {};

      if (buyerName) prefill.name = buyerName;
      if (isValidEmail(buyerEmail)) prefill.email = buyerEmail;
      if (buyerContact) prefill.contact = buyerContact;

      console.info("[FullPaymentModal] Initializing Razorpay Checkout:", {
        key: razorpayKeyId ? `${razorpayKeyId.substring(0, 8)}...` : "MISSING",
        orderId: order?.id,
        amount: order?.amount,
        prefill
      });

      await new Promise((resolve, reject) => {
        const options = {
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "PlotPerfect",
          description: `Full payment for ${property?.title || "property"}`,
          image: LOGO_URL,
          order_id: order.id,
          method: getRazorpayMethodOptions(paymentMethod),
          prefill,
          theme: {
            color: "#2563eb",
          },
          modal: {
            ondismiss: () => {
              console.warn("Razorpay modal dismissed by user or closed automatically.");
              reject(new Error("Payment was cancelled."));
            },
          },
          handler: async (response) => {
            try {
              const verificationResponse = await paymentService.verifyFullPayment({
                propertyId: property?._id,
                notes: notes.trim(),
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              const completedPaymentId = getCompletedPaymentId(verificationResponse);
              if (completedPaymentId) {
                await triggerInvoiceDownload(completedPaymentId);
              }

              toast.success("Full payment completed successfully. Invoice downloaded.");
              onSuccess?.();
              onClose?.();
              resolve();
            } catch (verificationError) {
              reject(
                new Error(
                  verificationError?.response?.data?.message ||
                  "Payment verification failed."
                )
              );
            }
          },
        };

        try {
          const razorpay = new window.Razorpay(options);

          razorpay.on("payment.failed", (response) => {
            // Log the failure to console for debugging
            console.warn("Razorpay payment attempt failed:", response?.error);
            if (isRazorpayAmountLimitError(response?.error)) {
              const limitMessage = getRazorpayLimitMessage(amountLabel.toLowerCase(), paymentMethod);
              razorpay.close();
              reject(new Error(limitMessage));
              return;
            }

            // We DON'T reject here because the user can usually try again 
            // with a different card/method without closing the modal.
            // Razorpay's modal shows its own error message to the user.
          });

          razorpay.open();
        } catch (initError) {
          console.error("Failed to initialize Razorpay object:", initError);
          reject(new Error("Could not initialize payment gateway."));
        }
      });
    } catch (error) {
      if (error?.message !== "Payment was cancelled.") {
        console.error("Full payment flow failed:", error?.response?.data || error);
        toast.error(getPaymentErrorMessage(error, "Failed to complete full payment."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{amountLabel}</h2>
            <p className="text-sm text-gray-500 mt-1">
              This checkout uses the live property price from the backend and downloads the invoice right after success.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#eef4ff] text-[#2563eb] font-bold"
          >
            X
          </button>
        </div>

        <div className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 mb-5">
          <div className="text-sm font-semibold text-[#1a0a2e]">{property?.title || "Property"}</div>
          <div className="text-xs text-[rgba(26,10,46,0.55)] mt-1">
            Payable amount: {formatPrice(payableAmount)}
          </div>
          {exceedsCheckoutLimit && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {getRazorpayLimitMessage(amountLabel.toLowerCase(), paymentMethod)}
              </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[rgba(26,10,46,0.75)] mb-1">
              {amountLabel}
            </label>
            <input
              type="text"
              value={formatPrice(payableAmount)}
              readOnly
              className="w-full p-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] text-[#1a0a2e] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[rgba(26,10,46,0.75)] mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#bfdbfe] bg-[#f8fbff] text-[#1a0a2e] outline-none focus:border-[#2563eb]"
            >
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[rgba(26,10,46,0.75)] mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note for the owner about this payment..."
              className="w-full p-3 rounded-xl border border-[#bfdbfe] bg-[#f8fbff] text-[#1a0a2e] outline-none focus:border-[#2563eb] resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={loading || exceedsCheckoutLimit}
            className="w-full py-3 bg-linear-to-r from-[#1d4ed8] to-[#2563eb] text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-70"
          >
            {loading ? "Opening Razorpay..." : `${amountLabel} With Razorpay`}
          </button>
        </form>
      </div>
    </div>
  );
}
