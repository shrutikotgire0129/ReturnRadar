"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileImage,
  FileText,
  Filter,
  LayoutDashboard,
  Leaf,
  Menu,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Trash2,
  Pencil,
  ArrowDown,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type PurchaseStatus = "Active" | "Returned" | "Expired" | "Needs review";

type ActionNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

type Purchase = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  date: string | null;
  returnDate: string | null;
  warrantyDate: string | null;
  status: PurchaseStatus;
  icon: string;
  color: string;
  description: string;
  evidence: string;
  returnDeadlineVerified?: boolean;
};

type ReceiptExtraction = {
  merchant: string | null;
  itemName: string | null;
  category: string | null;
  totalPrice: number | null;
  currency: string | null;
  purchaseDate: string | null;
  returnByDate: string | null;
  returnWindowDays: number | null;
  warrantyUntil: string | null;
  returnPolicyFound: boolean;
  returnPolicyEvidence: string | null;
  receiptEvidence: string[];
  confidence: number;
  needsReview: boolean;
  warnings: string[];
};

type ExtractionResponse = {
  success: boolean;
  fileName?: string;
  extractionMethod?: string;
  receipt?: ReceiptExtraction;
  error?: string;
};

type PendingAction =
  | {
      type: "calendar-unverified";
      purchaseName: string;
    }
  | {
      type: "verify-deadline";
      purchaseId: string;
      purchaseName: string;
    }
  | {
      type: "mark-returned";
      purchaseId: string;
      purchaseName: string;
    }
  | {
      type: "restore-status";
      purchaseId: string;
      purchaseName: string;
    }
  | {
      type: "unverify-deadline";
      purchaseId: string;
      purchaseName: string;
    }
  | {
      type: "delete-purchase";
      purchaseId: string;
      purchaseName: string;
    };

const initialPurchases: Purchase[] = [
  {
    id: "RR-001",
    name: "Wireless Headphones",
    brand: "Sony",
    category: "Electronics",
    price: 7999,
    date: "2026-10-12",
    returnDate: "2026-10-26",
    warrantyDate: "2027-10-12",
    status: "Active",
    icon: "headphones",
    color: "lavender",
    description: "Wireless noise-cancelling headphones",
    evidence: "Demo record — receipt evidence has not been verified.",
  },
  {
    id: "RR-002",
    name: "Everyday Sneakers",
    brand: "Nike",
    category: "Fashion",
    price: 5499,
    date: "2026-10-08",
    returnDate: "2026-10-23",
    warrantyDate: null,
    status: "Active",
    icon: "shoe",
    color: "peach",
    description: "Everyday lifestyle sneakers",
    evidence: "Demo record — receipt evidence has not been verified.",
  },
  {
    id: "RR-003",
    name: "Mechanical Keyboard",
    brand: "Keychron",
    category: "Electronics",
    price: 6890,
    date: "2026-10-03",
    returnDate: "2026-10-17",
    warrantyDate: "2027-10-03",
    status: "Expired",
    icon: "keyboard",
    color: "mint",
    description: "Mechanical keyboard for everyday work",
    evidence: "Demo record — return period shown for interface preview only.",
  },
  {
    id: "RR-004",
    name: "Ceramic Coffee Set",
    brand: "Clay Studio",
    category: "Home",
    price: 1899,
    date: "2026-10-18",
    returnDate: null,
    warrantyDate: null,
    status: "Needs review",
    icon: "cup",
    color: "butter",
    description: "Handcrafted ceramic coffee set",
    evidence: "Demo record — return policy and warranty are unknown.",
  },
  {
    id: "RR-005",
    name: "Desk Lamp",
    brand: "IKEA",
    category: "Home",
    price: 2499,
    date: "2026-10-01",
    returnDate: "2026-10-31",
    warrantyDate: "2027-10-01",
    status: "Active",
    icon: "lamp",
    color: "blue",
    description: "Minimal desk lamp",
    evidence: "Demo record — receipt evidence has not been verified.",
  },
  {
    id: "RR-006",
    name: "Travel Backpack",
    brand: "Mokobara",
    category: "Fashion",
    price: 3999,
    date: "2026-09-28",
    returnDate: null,
    warrantyDate: "2027-09-28",
    status: "Needs review",
    icon: "bag",
    color: "rose",
    description: "Everyday travel backpack",
    evidence: "Demo record — return policy is unknown.",
  },
];

const STORAGE_KEY = "return-radar-purchases";
const STORAGE_CHANGE_EVENT = "return-radar-purchases-change";
const NO_RECEIPT_EVIDENCE = "No receipt evidence available yet.";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string | null) => {
  if (!date) return "Not specified";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const daysUntil = (date: string, today: string) => {
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const [targetYear, targetMonth, targetDay] = date.split("-").map(Number);

  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
  return Math.round((targetUtc - todayUtc) / 86400000);
};

function hasReceiptEvidence(purchase: Purchase) {
  const evidence = purchase.evidence.trim();

  if (
    !evidence ||
    evidence === NO_RECEIPT_EVIDENCE ||
    evidence.startsWith("Demo record")
  ) {
    return false;
  }

  if (evidence.includes("Receipt evidence: Not found.")) {
    return false;
  }

  return true;
}

function ProductArt({ purchase }: { purchase: Purchase }) {
  const symbols: Record<string, string> = {
    headphones: "◖",
    shoe: "⌁",
    keyboard: "▤",
    cup: "◡",
    lamp: "⌁",
    bag: "▱",
  };

  return (
    <div className={`product-art art-${purchase.color}`} aria-hidden="true">
      <span>{symbols[purchase.icon] ?? "◇"}</span>
      <span className="art-dot" />
    </div>
  );
}

function getEffectiveStatus(
  purchase: Purchase,
  today: string | null,
): PurchaseStatus {
  if (purchase.status === "Returned" || purchase.status === "Needs review") {
    return purchase.status;
  }

  if (!today || !purchase.returnDate) {
    return purchase.status;
  }

  return daysUntil(purchase.returnDate, today) < 0 ? "Expired" : "Active";
}

function StatusPill({ status }: { status: PurchaseStatus }) {
  const classNames: Record<PurchaseStatus, string> = {
    Active: "status-active",
    Returned: "status-returned",
    Expired: "status-expired",
    "Needs review": "status-review",
  };

  return <span className={`status-pill ${classNames[status]}`}>{status}</span>;
}

const subscribeToStorage = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_CHANGE_EVENT, callback);
  };
};

const getStorageSnapshot = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const getServerStorageSnapshot = () => null;

const ACTION_NOTIFICATIONS_KEY = "returnradar-action-notifications";
const DISMISSED_NOTIFICATIONS_KEY = "returnradar-dismissed-notifications";
const ACTION_NOTIFICATIONS_CHANGE_EVENT =
  "returnradar-action-notifications-change";

const subscribeToActionNotifications = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(ACTION_NOTIFICATIONS_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ACTION_NOTIFICATIONS_CHANGE_EVENT, callback);
  };
};

const getActionNotificationsSnapshot = () => {
  try {
    return localStorage.getItem(ACTION_NOTIFICATIONS_KEY);
  } catch {
    return null;
  }
};

const getServerActionNotificationsSnapshot = () => null;

const parseActionNotificationsSnapshot = (
  snapshot: string | null,
): ActionNotification[] => {
  if (!snapshot) return [];

  try {
    const parsed: unknown = JSON.parse(snapshot);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is ActionNotification =>
          item !== null &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.detail === "string" &&
          typeof item.time === "string",
      )
      .slice(0, 10);
  } catch {
    return [];
  }
};

const parsePurchasesSnapshot = (snapshot: string | null): Purchase[] => {
  if (snapshot === null) return initialPurchases;

  try {
    const parsed: unknown = JSON.parse(snapshot);

    if (Array.isArray(parsed)) {
      return parsed as Purchase[];
    }
  } catch {
    console.error("Could not parse saved purchases.");
  }

  return initialPurchases;
};

const updateStoredPurchases = (
  updater: (current: Purchase[]) => Purchase[],
) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const current = parsePurchasesSnapshot(saved);
    const updated = updater(current);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  } catch {
    console.error("Could not save purchases to browser storage.");
  }
};

function exportReturnReminder(
  purchase: Purchase,
  onInvalidDeadline: () => void,
) {
  if (
    !purchase.returnDate ||
    !hasReceiptEvidence(purchase) ||
    !purchase.returnDeadlineVerified
  ) {
    onInvalidDeadline();
    return;
  }

  const [year, month, day] = purchase.returnDate.split("-").map(Number);

  const startDate = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;

  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const endDate = [
    nextDay.getUTCFullYear(),
    String(nextDay.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDay.getUTCDate()).padStart(2, "0"),
  ].join("");

  const details = [
    `Product: ${purchase.name}`,
    `Brand: ${purchase.brand}`,
    `Price: ${purchase.price}`,
    purchase.description,
    "",
    "Reminder created with ReturnRadar. Verify the seller's return policy before returning the item.",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Return deadline: ${purchase.name}`,
    dates: `${startDate}/${endDate}`,
    details,
  });

  window.open(
    `https://calendar.google.com/calendar/render?${params.toString()}`,
    "_blank",
    "noopener,noreferrer",
  );
}

const subscribeToDismissedNotifications = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(
    "returnradar-dismissed-notifications-change",
    callback,
  );

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(
      "returnradar-dismissed-notifications-change",
      callback,
    );
  };
};

const getDismissedNotificationsSnapshot = () => {
  try {
    return localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
  } catch {
    return null;
  }
};

const getServerDismissedNotificationsSnapshot = () => null;

const parseDismissedNotificationsSnapshot = (
  snapshot: string | null,
): string[] => {
  if (!snapshot) return [];

  try {
    const parsed: unknown = JSON.parse(snapshot);

    if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
      return parsed;
    }

    return [];
  } catch {
    return [];
  }
};

export default function Home() {
  const [selectedId, setSelectedId] = useState("RR-001");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All purchases");
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const savedActionNotifications = useSyncExternalStore(
    subscribeToActionNotifications,
    getActionNotificationsSnapshot,
    getServerActionNotificationsSnapshot,
  );

  const actionNotifications = parseActionNotificationsSnapshot(
    savedActionNotifications,
  );
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);
  const [extractionFileName, setExtractionFileName] = useState("");
  const [today, setToday] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("Overview");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const savedDismissedNotifications = useSyncExternalStore(
    subscribeToDismissedNotifications,
    getDismissedNotificationsSnapshot,
    getServerDismissedNotificationsSnapshot,
  );

  const dismissedNotificationIds = parseDismissedNotificationsSnapshot(
    savedDismissedNotifications,
  );
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    category: "",
    price: "",
    date: "",
    returnDate: "",
    warrantyDate: "",
    description: "",
  });

  useEffect(() => {
    const updateToday = () => setToday(getLocalDateString());

    updateToday();

    const intervalId = window.setInterval(updateToday, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const savedPurchases = useSyncExternalStore(
    subscribeToStorage,
    getStorageSnapshot,
    getServerStorageSnapshot,
  );

  const purchases = parsePurchasesSnapshot(savedPurchases);

  const selectedPurchase =
    purchases.find((purchase) => purchase.id === selectedId) ?? purchases[0];

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      `${purchase.name} ${purchase.brand} ${purchase.category}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All purchases" ||
      (filter === "Upcoming returns" &&
        today !== null &&
        purchase.returnDate !== null &&
        getEffectiveStatus(purchase, today) === "Active") ||
      (filter === "Needs review" &&
        getEffectiveStatus(purchase, today) === "Needs review") ||
      (filter === "Expired" &&
        today !== null &&
        getEffectiveStatus(purchase, today) === "Expired") ||
      (filter === "Returned" && purchase.status === "Returned");

    return matchesSearch && matchesFilter;
  });

  const sortedFilteredPurchases =
    filter === "Upcoming returns"
      ? [...filteredPurchases].sort((a, b) =>
          (a.returnDate ?? "").localeCompare(b.returnDate ?? ""),
        )
      : filteredPurchases;

  const upcomingReturns = purchases
    .filter(
      (purchase) =>
        today !== null &&
        purchase.returnDate !== null &&
        getEffectiveStatus(purchase, today) === "Active",
    )
    .sort((a, b) => a.returnDate!.localeCompare(b.returnDate!));

  const needsReviewCount = purchases.filter(
    (purchase) => getEffectiveStatus(purchase, today) === "Needs review",
  ).length;

  const allNotificationItems = [
    ...upcomingReturns.slice(0, 5).map((purchase) => ({
      id: `deadline-${purchase.id}`,
      purchaseId: purchase.id,
      title: purchase.name,
      detail: `Tracked return date: ${
        purchase.returnDate
          ? new Date(`${purchase.returnDate}T00:00:00`).toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "short" },
            )
          : "Not set"
      }`,
      section: "Return deadlines" as const,
    })),
    ...purchases
      .filter(
        (purchase) => getEffectiveStatus(purchase, today) === "Needs review",
      )
      .slice(0, 5)
      .map((purchase) => ({
        id: `review-${purchase.id}`,
        purchaseId: purchase.id,
        title: purchase.name,
        detail: "Purchase details need your attention",
        section: "Needs review" as const,
      })),
  ];

  const notificationItems = allNotificationItems.filter(
    (notification) => !dismissedNotificationIds.includes(notification.id),
  );

  const returnedPurchases = purchases.filter(
    (purchase) => purchase.status === "Returned",
  ).length;

  const totalSpend = purchases.reduce(
    (total, purchase) => total + purchase.price,
    0,
  );

  const handleFiles = (files: FileList | File[]) => {
    const accepted = Array.from(files).filter((file) => {
      const validType = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ].includes(file.type);

      return validType && file.size <= 10 * 1024 * 1024;
    });

    setUploadedFiles((current) => [...current, ...accepted].slice(0, 5));

    if (accepted.length === 0) {
      setNotice("Choose a JPG, PNG, WebP, or PDF file up to 10 MB.");
    } else {
      setNotice(
        `${accepted.length} receipt file${accepted.length > 1 ? "s" : ""} selected. Ready for AI extraction.`,
      );
    }
  };

  const addActionNotification = (title: string, detail: string) => {
    const notification: ActionNotification = {
      id: crypto.randomUUID(),
      title,
      detail,
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    try {
      const current = parseActionNotificationsSnapshot(
        getActionNotificationsSnapshot(),
      );

      const updated = [notification, ...current].slice(0, 10);

      localStorage.setItem(ACTION_NOTIFICATIONS_KEY, JSON.stringify(updated));

      window.dispatchEvent(new Event(ACTION_NOTIFICATIONS_CHANGE_EVENT));
    } catch {
      setNotice("Notification could not be saved in this browser.");
    }
  };

  const clearActionNotifications = () => {
    try {
      localStorage.removeItem(ACTION_NOTIFICATIONS_KEY);

      const dismissedIds = notificationItems.map(
        (notification) => notification.id,
      );

      localStorage.setItem(
        DISMISSED_NOTIFICATIONS_KEY,
        JSON.stringify([
          ...new Set([...dismissedNotificationIds, ...dismissedIds]),
        ]),
      );

      window.dispatchEvent(new Event(ACTION_NOTIFICATIONS_CHANGE_EVENT));

      window.dispatchEvent(
        new Event("returnradar-dismissed-notifications-change"),
      );
    } catch {
      setNotice("Could not clear all notifications in this browser.");
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) handleFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const extractReceipt = async () => {
    const file = uploadedFiles[0];

    if (!file) {
      setNotice("Choose a receipt file first.");
      return;
    }

    setIsExtracting(true);
    setExtraction(null);
    setExtractionFileName("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-receipt", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ExtractionResponse;

      if (!response.ok || !data.success || !data.receipt) {
        throw new Error(data.error || "Receipt extraction failed.");
      }

      setExtraction(data.receipt);
      setExtractionFileName(data.fileName || file.name);
      setNotice("Extraction complete. Review every field before confirming.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Something went wrong while extracting the receipt.",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const updateExtraction = <K extends keyof ReceiptExtraction>(
    field: K,
    value: ReceiptExtraction[K],
  ) => {
    setExtraction((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const confirmPurchase = () => {
    if (!extraction) return;

    const name = extraction.itemName?.trim() || "";
    const brand = extraction.merchant?.trim() || "";
    const purchaseDate = extraction.purchaseDate || null;
    const returnDate = extraction.returnByDate || null;
    const warrantyDate = extraction.warrantyUntil || null;
    const price = extraction.totalPrice ?? 0;

    const isUpdatingBlankPurchase =
      selectedPurchase?.evidence === NO_RECEIPT_EVIDENCE;

    const purchaseId = isUpdatingBlankPurchase
      ? selectedPurchase.id
      : `RR-${crypto.randomUUID()}`;

    const todayString = getLocalDateString();

    const parsedReturnDate = returnDate
      ? daysUntil(returnDate, todayString)
      : null;

    const status: PurchaseStatus =
      !name ||
      !brand ||
      !purchaseDate ||
      extraction.needsReview ||
      !extraction.returnPolicyFound ||
      !returnDate
        ? "Needs review"
        : parsedReturnDate !== null && parsedReturnDate < 0
          ? "Expired"
          : "Active";

    const evidenceParts = [
      extraction.receiptEvidence.length > 0
        ? `Receipt evidence: ${extraction.receiptEvidence.join(" ")}`
        : "Receipt evidence: Not found.",
      extraction.returnPolicyEvidence
        ? `Return policy evidence: ${extraction.returnPolicyEvidence}`
        : "Return policy evidence: Not found.",
      ...extraction.warnings,
    ];

    const newPurchase: Purchase = {
      id: purchaseId,
      name: name || "Purchase needing review",
      brand: brand || "Unknown merchant",
      category: extraction.category || "Uncategorized",
      price,
      date: purchaseDate,
      returnDate,
      warrantyDate,
      status,
      icon: "bag",
      color: "mint",
      description: name
        ? `${name} extracted from ${brand || "a receipt"}`
        : "Receipt details need verification.",
      evidence: evidenceParts.join(" "),
      returnDeadlineVerified: false,
    };

    updateStoredPurchases((current) => {
      const alreadyExists = current.some(
        (purchase) => purchase.id === newPurchase.id,
      );

      if (alreadyExists) {
        return current.map((purchase) =>
          purchase.id === newPurchase.id ? newPurchase : purchase,
        );
      }

      return [newPurchase, ...current];
    });

    setSelectedId(newPurchase.id);
    setFilter("All purchases");
    setSearch("");
    setUploadedFiles((current) => current.slice(1));
    setExtraction(null);
    setExtractionFileName("");
    setNotice(
      isUpdatingBlankPurchase
        ? "Purchase updated with receipt details. Check its evidence and any outstanding details."
        : "Purchase added. Check its evidence and any outstanding details.",
    );

    if (uploadedFiles.length <= 1) {
      setShowUpload(false);
    }
  };

  const markPurchaseAsReturned = (purchaseId: string) => {
    updateStoredPurchases((current) =>
      current.map((purchase) =>
        purchase.id === purchaseId
          ? { ...purchase, status: "Returned" as PurchaseStatus }
          : purchase,
      ),
    );

    setNotice("Purchase marked as returned.");
  };

  const verifyReturnDeadline = (purchase: Purchase) => {
    if (
      !purchase.returnDate ||
      !hasReceiptEvidence(purchase) ||
      purchase.returnDeadlineVerified
    ) {
      setNotice(
        "A receipt with evidence is required before verifying a return deadline.",
      );
      return;
    }

    setPendingAction({
      type: "verify-deadline",
      purchaseId: purchase.id,
      purchaseName: purchase.name,
    });
  };

  const requestMarkReturned = (purchase: Purchase) => {
    setPendingAction({
      type: "mark-returned",
      purchaseId: purchase.id,
      purchaseName: purchase.name,
    });
  };

  const requestRestoreStatus = (purchase: Purchase) => {
    setPendingAction({
      type: "restore-status",
      purchaseId: purchase.id,
      purchaseName: purchase.name,
    });
  };

  const openEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      name: purchase.name,
      brand: purchase.brand,
      category: purchase.category,
      price: String(purchase.price),
      date: purchase.date ?? "",
      returnDate: purchase.returnDate ?? "",
      warrantyDate: purchase.warrantyDate ?? "",
      description: purchase.description,
    });
  };

  const requestDeletePurchase = (purchase: Purchase) => {
    setPendingAction({
      type: "delete-purchase",
      purchaseId: purchase.id,
      purchaseName: purchase.name,
    });
  };

  const saveEditedPurchase = () => {
    if (!editingPurchase) return;

    const name = editForm.name.trim();

    if (!name) {
      setNotice("Purchase name is required.");
      return;
    }

    const price = Number(editForm.price);

    if (editForm.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setNotice("Enter a valid price of zero or more.");
      return;
    }

    const returnDate = editForm.returnDate || null;
    const hasEvidence = hasReceiptEvidence(editingPurchase);

    updateStoredPurchases((current) =>
      current.map((purchase) =>
        purchase.id === editingPurchase.id
          ? {
              ...purchase,
              name,
              brand: editForm.brand.trim() || "Unknown merchant",
              category: editForm.category.trim() || "Uncategorized",
              price,
              date: editForm.date || null,
              returnDate,
              warrantyDate: editForm.warrantyDate || null,
              description: editForm.description.trim(),
              status:
                !hasEvidence || !returnDate
                  ? "Needs review"
                  : today === null
                    ? purchase.status
                    : daysUntil(returnDate, today) < 0
                      ? "Expired"
                      : "Active",
              returnDeadlineVerified: false,
            }
          : purchase,
      ),
    );

    setSelectedId(editingPurchase.id);
    addActionNotification(
      "Purchase updated",
      `${name} was updated successfully. Review the return deadline evidence.`,
    );
    setEditingPurchase(null);
    setNotice("Purchase details updated. Review the return deadline evidence.");
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;

    const action = pendingAction;

    if (action.type === "verify-deadline") {
      updateStoredPurchases((current) =>
        current.map((purchase) =>
          purchase.id === action.purchaseId
            ? { ...purchase, returnDeadlineVerified: true }
            : purchase,
        ),
      );

      setNotice("Return deadline marked as verified.");
    }

    if (action.type === "unverify-deadline") {
      updateStoredPurchases((current) =>
        current.map((purchase) =>
          purchase.id === action.purchaseId
            ? { ...purchase, returnDeadlineVerified: false }
            : purchase,
        ),
      );

      setNotice("Return deadline verification has been undone.");
    }

    if (action.type === "mark-returned") {
      markPurchaseAsReturned(action.purchaseId);
    }

    if (action.type === "restore-status") {
      updateStoredPurchases((current) =>
        current.map((purchase) => {
          if (purchase.id !== action.purchaseId) return purchase;

          const restoredStatus: PurchaseStatus =
            !purchase.returnDate || today === null
              ? "Needs review"
              : daysUntil(purchase.returnDate, today) < 0
                ? "Expired"
                : "Active";

          return {
            ...purchase,
            status: restoredStatus,
          };
        }),
      );

      setNotice("Purchase status restored.");
    }

    if (action.type === "delete-purchase") {
      updateStoredPurchases((current) =>
        current.filter((purchase) => purchase.id !== action.purchaseId),
      );

      const remainingPurchases = purchases.filter(
        (purchase) => purchase.id !== action.purchaseId,
      );

      setSelectedId(remainingPurchases[0]?.id ?? "");
      setNotice(`"${action.purchaseName}" was deleted.`);
    }

    if (action.type === "delete-purchase") {
      addActionNotification(
        "Purchase deleted",
        `${action.purchaseName} was deleted.`,
      );
    }

    setPendingAction(null);
  };

  const addDemoPurchase = () => {
    const purchaseDate = getLocalDateString();
    const sampleReturnDate = new Date();
    sampleReturnDate.setDate(sampleReturnDate.getDate() + 7);

    const newPurchase: Purchase = {
      id: `RR-${crypto.randomUUID()}`,
      name: "New purchase",
      brand: "Awaiting receipt",
      category: "Uncategorized",
      price: 0,
      date: purchaseDate,
      returnDate: [
        sampleReturnDate.getFullYear(),
        String(sampleReturnDate.getMonth() + 1).padStart(2, "0"),
        String(sampleReturnDate.getDate()).padStart(2, "0"),
      ].join("-"),
      warrantyDate: null,
      status: "Needs review",
      icon: "bag",
      color: "mint",
      description: "Confirm purchase details after receipt extraction.",
      evidence: NO_RECEIPT_EVIDENCE,
    };

    updateStoredPurchases((current) => [newPurchase, ...current]);

    setSelectedId(newPurchase.id);
    setFilter("All purchases");
    setSearch("");
    setNotice(
      "Blank purchase added. Upload a receipt to confirm its actual return deadline.",
    );
  };

  const dialogTitle = (() => {
    if (!pendingAction) return "";

    switch (pendingAction.type) {
      case "calendar-unverified":
        return "Return deadline not verified";
      case "verify-deadline":
        return "Verify return deadline";
      case "mark-returned":
        return "Mark purchase as returned?";
      case "restore-status":
        return "Restore purchase status?";
      case "unverify-deadline":
        return "Undo deadline verification?";
      case "delete-purchase":
        return "Delete this purchase?";
    }
  })();

  const dialogDescription = (() => {
    if (!pendingAction) return "";

    switch (pendingAction.type) {
      case "calendar-unverified":
        return "A calendar reminder requires receipt evidence and a return deadline you have checked against the retailer's policy. Demo dates and extracted dates are not verified automatically.";
      case "verify-deadline":
        return `Only confirm if you have checked the retailer's actual return policy and verified the deadline for "${pendingAction.purchaseName}". This action records your confirmation; it does not independently verify the retailer's policy.`;
      case "mark-returned":
        return `Confirm that "${pendingAction.purchaseName}" has been returned.`;
      case "restore-status":
        return `Mark "${pendingAction.purchaseName}" as not returned? Its status will be recalculated from the saved return deadline.`;
      case "unverify-deadline":
        return `Undo verification for "${pendingAction.purchaseName}"? The deadline will no longer be treated as verified, and you can verify it again later.`;
      case "delete-purchase":
        return `Permanently delete "${pendingAction.purchaseName}" and its saved details? This cannot be undone.`;
    }
  })();

  const dialogActionLabel = (() => {
    if (!pendingAction) return "Got it";

    switch (pendingAction.type) {
      case "calendar-unverified":
        return "Got it";
      case "verify-deadline":
        return "I verified the policy";
      case "mark-returned":
        return "Mark as returned";
      case "restore-status":
        return "Restore status";
      case "unverify-deadline":
        return "Undo verification";
      case "delete-purchase":
        return "Delete purchase";
    }
  })();

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" aria-label="ReturnRadar home">
          <span className="brand-mark">
            <ShieldCheck size={22} strokeWidth={2.1} />
          </span>
          <span>
            <strong>returnradar</strong>
            <small>BUY WITH CONFIDENCE</small>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${activeNav === "Overview" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => {
              setActiveNav("Overview");
              setFilter("All purchases");
              setMobileMenu(false);
            }}
          >
            <LayoutDashboard size={18} />
            Overview
            {activeNav === "Overview" && <span className="nav-indicator" />}
          </button>

          <button
            className={`nav-item ${activeNav === "My purchases" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => {
              setActiveNav("My purchases");
              setFilter("All purchases");
              setMobileMenu(false);
            }}
          >
            <Package size={18} />
            My purchases
            <span className="nav-count">{purchases.length}</span>
          </button>

          <button
            className={`nav-item ${activeNav === "Return deadlines" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => {
              setActiveNav("Return deadlines");
              setFilter("Upcoming returns");
              setMobileMenu(false);
            }}
          >
            <CalendarDays size={18} />
            Return deadlines
            <span className="nav-count">{upcomingReturns.length}</span>
          </button>

          <button
            className={`nav-item ${activeNav === "Needs review" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => {
              setActiveNav("Needs review");
              setFilter("Needs review");
              setMobileMenu(false);
            }}
          >
            <FileCheck2 size={18} />
            Needs review
            <span className="nav-count">{needsReviewCount}</span>
          </button>

          <button
            className={`nav-item ${activeNav === "Returned" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => {
              setActiveNav("Returned");
              setFilter("Returned");
              setMobileMenu(false);
            }}
          >
            <Check size={18} />
            Returned
            <span className="nav-count">{returnedPurchases}</span>
          </button>
        </nav>

        <div className="sidebar-tip">
          <span className="tip-icon">
            <Leaf size={18} />
          </span>
          <strong>Buy less. Keep track.</strong>
          <p>Every purchase deserves a little peace of mind.</p>
          <div className="tip-decoration">✳</div>
        </div>

        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <span>
              <strong>Your receipts, your control</strong>
              <small>Privacy-first by design</small>
            </span>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="mobile-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu-button"
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>

            <span className="breadcrumb-root">Workspace</span>
            <ChevronRight size={15} className="breadcrumb-separator" />
            <strong className="breadcrumb-current">{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <div className="today-label">
              <CalendarDays size={16} aria-hidden="true" />
              <span>
                {today
                  ? new Date(`${today}T00:00:00`).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                  : "Loading date..."}
              </span>
            </div>

            <div className="notification-wrapper">
              <button
                className="icon-button"
                type="button"
                aria-label={`Show notifications (${
                  notificationItems.length + actionNotifications.length
                })`}
                aria-expanded={showNotifications}
                aria-controls="notification-panel"
                title="Notifications"
                onClick={() => setShowNotifications((open) => !open)}
              >
                <Bell size={18} aria-hidden="true" />
                {notificationItems.length + actionNotifications.length > 0 && (
                  <span className="notification-count">
                    {notificationItems.length + actionNotifications.length > 9
                      ? "9+"
                      : notificationItems.length + actionNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <section
                  className="notification-panel"
                  id="notification-panel"
                  aria-label="Notifications"
                >
                  <div className="notification-panel-header">
                    <div>
                      <strong>Notifications</strong>
                      <p>
                        {notificationItems.length + actionNotifications.length
                          ? `${notificationItems.length + actionNotifications.length} notifications`
                          : "You're all caught up"}
                      </p>
                    </div>

                    <div className="notification-header-actions">
                      {actionNotifications.length + notificationItems.length >
                        0 && (
                        <button
                          className="notification-clear"
                          type="button"
                          onClick={clearActionNotifications}
                        >
                          Clear all
                        </button>
                      )}

                      <button
                        className="notification-close"
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setShowNotifications(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {notificationItems.length > 0 ||
                  actionNotifications.length > 0 ? (
                    <div className="notification-list">
                      {actionNotifications.map((item) => (
                        <div className="notification-item" key={item.id}>
                          <span className="notification-item-icon">
                            <Check size={17} />
                          </span>

                          <span className="notification-item-copy">
                            <strong>{item.title}</strong>
                            <small>{item.detail}</small>
                            <span className="notification-item-category">
                              {item.time}
                            </span>
                          </span>
                        </div>
                      ))}

                      {notificationItems.map((item) => (
                        <button
                          className="notification-item"
                          type="button"
                          key={item.id}
                          onClick={() => {
                            setSelectedId(item.purchaseId);
                            setActiveNav(item.section);
                            setFilter(
                              item.section === "Return deadlines"
                                ? "Upcoming returns"
                                : "Needs review",
                            );
                            setSearch("");
                            setShowNotifications(false);
                            setMobileMenu(false);
                          }}
                        >
                          <span className="notification-item-icon">
                            {item.section === "Return deadlines" ? (
                              <CalendarDays size={17} />
                            ) : (
                              <FileCheck2 size={17} />
                            )}
                          </span>

                          <span className="notification-item-copy">
                            <strong>{item.title}</strong>
                            <small>{item.detail}</small>
                            <span className="notification-item-category">
                              {item.section}
                            </span>
                          </span>

                          <ChevronRight size={16} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="notification-empty">
                      <Check size={22} />
                      <strong>No notifications yet</strong>
                      <p>
                        Purchase updates and items needing attention will appear
                        here.
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div
              className="avatar top-avatar"
              aria-label="Shruti's profile avatar"
              title="ReturnRadar workspace"
            >
              S
            </div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span /> YOUR PURCHASES, UNDER CONTROL
              </div>
              <h1>
                A little more peace
                <br className="mobile-break" /> of mind.
              </h1>
              <p className="welcome-subtitle">
                Keep every receipt, return window, and warranty in one
                thoughtful place.
              </p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setShowUpload(true);
                setNotice("");
              }}
            >
              <Plus size={18} />
              Add a receipt
            </button>
          </section>

          <section className="stats-grid" aria-label="Purchase summary">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-green">
                  <Package size={19} />
                </span>
                <span className="stat-caption">ALL TIME</span>
              </div>
              <div className="stat-value">{purchases.length}</div>
              <div className="stat-bottom">
                <span className="stat-title">Tracked purchases</span>
                <span className="stat-note">In your workspace</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-orange">
                  <Clock3 size={19} />
                </span>
                <span className="stat-caption">DON&apos;T MISS OUT</span>
              </div>
              <div className="stat-value">{upcomingReturns.length}</div>
              <div className="stat-bottom">
                <span className="stat-title">Upcoming returns</span>
                <span className="stat-note">Based on tracked dates</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-purple">
                  <ShieldCheck size={19} />
                </span>
                <span className="stat-caption">STAY PROTECTED</span>
              </div>
              <div className="stat-value">
                {purchases.filter((purchase) => purchase.warrantyDate).length}
              </div>
              <div className="stat-bottom">
                <span className="stat-title">Warranty records</span>
                <span className="stat-note">Dates need verification</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-blue">
                  <ArrowUpRight size={19} />
                </span>
                <span className="stat-caption">PURCHASE VALUE</span>
              </div>
              <div className="stat-value stat-money">
                {formatMoney(totalSpend)}
              </div>
              <div className="stat-bottom">
                <span className="stat-title">Total tracked spend</span>
                <span className="stat-note">Across saved records</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon stat-icon-green">
                  <Check size={19} />
                </span>
                <span className="stat-caption">COMPLETED</span>
              </div>
              <div className="stat-value">{returnedPurchases}</div>
              <div className="stat-bottom">
                <span className="stat-title">Returned purchases</span>
                <span className="stat-note">Marked as returned</span>
              </div>
            </article>
          </section>

          <section className="deadline-banner">
            <div className="deadline-art">
              <CalendarDays size={27} />
              <span className="deadline-sparkle">✳</span>
            </div>
            <div className="deadline-copy">
              <span className="banner-kicker">A FRIENDLY HEADS-UP</span>
              <h2>
                {upcomingReturns.length
                  ? `${upcomingReturns.length} return ${upcomingReturns.length === 1 ? "window" : "windows"} to keep an eye on`
                  : "You're all caught up"}
              </h2>
              <p>
                {upcomingReturns.length
                  ? "Check your upcoming dates before they slip by."
                  : "Add a verified return date to see reminders here."}
              </p>
            </div>
            <button
              className="banner-button"
              type="button"
              onClick={() => setFilter("Upcoming returns")}
            >
              View deadlines <ArrowDown size={16} />
            </button>
            <div className="banner-decoration" aria-hidden="true">
              ✳
            </div>
          </section>

          <section className="purchase-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR LITTLE INVENTORY</div>
                <h2>
                  Purchase library <span>{purchases.length}</span>
                </h2>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setFilter("All purchases");
                  setSearch("");
                }}
              >
                View all <ArrowDown size={16} />
              </button>
            </div>

            <div className="library-toolbar">
              <label className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search purchases..."
                  aria-label="Search purchases"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <label className="filter-box">
                <Filter size={16} />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  aria-label="Filter purchases"
                >
                  <option>All purchases</option>
                  <option>Upcoming returns</option>
                  <option>Needs review</option>
                  <option>Expired</option>
                  <option>Returned</option>
                </select>
                <ChevronDown size={15} />
              </label>
              <button
                className="toolbar-add"
                type="button"
                aria-label="Add demo purchase"
                onClick={addDemoPurchase}
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="library-layout">
              <div className="purchase-list">
                {filteredPurchases.length ? (
                  sortedFilteredPurchases.map((purchase) => (
                    <div className="purchase-card-row" key={purchase.id}>
                      <button
                        type="button"
                        className={`purchase-card ${selectedId === purchase.id ? "purchase-card-selected" : ""}`}
                        onClick={() => setSelectedId(purchase.id)}
                      >
                        <ProductArt purchase={purchase} />
                        <span className="purchase-info">
                          <span className="purchase-name">{purchase.name}</span>
                          <span className="purchase-brand">
                            {purchase.brand} <span>·</span> {purchase.category}
                          </span>
                          <span className="purchase-meta">
                            <CalendarDays size={13} /> Bought{" "}
                            {formatDate(purchase.date)}
                          </span>
                        </span>
                        <span className="purchase-end">
                          <strong>{formatMoney(purchase.price)}</strong>
                          <StatusPill
                            status={getEffectiveStatus(purchase, today)}
                          />
                          <ChevronRight
                            className="purchase-chevron"
                            size={17}
                          />
                        </span>
                      </button>

                      <button
                        type="button"
                        className="purchase-calendar-button"
                        aria-label={`Export calendar reminder for ${purchase.name}`}
                        title="Open return deadline in Google Calendar"
                        onClick={() =>
                          exportReturnReminder(purchase, () =>
                            setPendingAction({
                              type: "calendar-unverified",
                              purchaseName: purchase.name,
                            }),
                          )
                        }
                      >
                        <CalendarDays size={17} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Package size={25} />
                    <strong>No purchases found</strong>
                    <p>Try a different search or filter.</p>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setFilter("All purchases");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}

                <button
                  className="add-purchase-card"
                  type="button"
                  onClick={() => {
                    setShowUpload(true);
                    setNotice("");
                  }}
                >
                  <span className="add-circle">
                    <Plus size={18} />
                  </span>
                  <span>
                    <strong>Add another purchase</strong>
                    <small>
                      Drop in a receipt and let&apos;s get it organized.
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              </div>

              <aside className="detail-panel">
                {selectedPurchase && (
                  <>
                    <div className="detail-topline">
                      <span className="detail-label">PURCHASE DETAILS</span>
                      <div className="purchase-actions">
                        <button
                          className="purchase-action-button"
                          type="button"
                          onClick={() => openEditPurchase(selectedPurchase)}
                        >
                          <Pencil size={17} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="purchase-action-button purchase-action-delete"
                          type="button"
                          onClick={() =>
                            requestDeletePurchase(selectedPurchase)
                          }
                        >
                          <Trash2 size={17} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    <ProductArt purchase={selectedPurchase} />
                    <h3 className="detail-product-name">
                      {selectedPurchase.name}
                    </h3>
                    <p className="detail-brand">
                      {selectedPurchase.brand} · {selectedPurchase.category}
                    </p>

                    <div className="detail-price">
                      {!hasReceiptEvidence(selectedPurchase)
                        ? "Price not verified"
                        : formatMoney(selectedPurchase.price)}
                    </div>

                    {selectedPurchase.status === "Returned" ? (
                      <button
                        type="button"
                        className="google-calendar-button"
                        onClick={() => requestRestoreStatus(selectedPurchase)}
                      >
                        <span>Mark as not returned</span>
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="google-calendar-button"
                        onClick={() => requestMarkReturned(selectedPurchase)}
                      >
                        <span>Mark as returned</span>
                        <ChevronRight size={16} />
                      </button>
                    )}

                    <div className="detail-divider" />

                    <div className="detail-date-row">
                      <span className="detail-date-icon">
                        <CalendarDays size={16} />
                      </span>
                      <span>
                        <small>Purchase date</small>
                        <strong>
                          {!hasReceiptEvidence(selectedPurchase)
                            ? "Awaiting receipt verification"
                            : formatDate(selectedPurchase.date)}
                        </strong>
                      </span>
                    </div>

                    <div className="detail-date-row return-deadline-row">
                      <span className="detail-date-icon detail-date-orange">
                        <Clock3 size={16} />
                      </span>

                      <span className="return-deadline-info">
                        <small>Return by</small>
                        <strong>
                          {!hasReceiptEvidence(selectedPurchase)
                            ? "Sample date — verify deadline"
                            : selectedPurchase.returnDate
                              ? formatDate(selectedPurchase.returnDate)
                              : "Deadline not confirmed"}
                        </strong>
                      </span>

                      {selectedPurchase.returnDate &&
                        hasReceiptEvidence(selectedPurchase) &&
                        !selectedPurchase.returnDeadlineVerified && (
                          <button
                            type="button"
                            className="deadline-verify-button"
                            onClick={() =>
                              verifyReturnDeadline(selectedPurchase)
                            }
                          >
                            Verify
                          </button>
                        )}

                      {selectedPurchase.returnDeadlineVerified && (
                        <button
                          type="button"
                          className="deadline-verified-status"
                          title="Undo deadline verification"
                          aria-label={`Undo deadline verification for ${selectedPurchase.name}`}
                          onClick={() =>
                            setPendingAction({
                              type: "unverify-deadline",
                              purchaseId: selectedPurchase.id,
                              purchaseName: selectedPurchase.name,
                            })
                          }
                          style={{
                            border: 0,
                            cursor: "pointer",
                            font: "inherit",
                          }}
                        >
                          <ShieldCheck size={13} />
                          Verified | Undo
                        </button>
                      )}
                    </div>

                    <div className="detail-date-row">
                      <span className="detail-date-icon detail-date-purple">
                        <ShieldCheck size={16} />
                      </span>
                      <span>
                        <small>Warranty until</small>
                        <strong>
                          {formatDate(selectedPurchase.warrantyDate)}
                        </strong>
                      </span>
                    </div>

                    <div className="evidence-box">
                      <div className="evidence-heading">
                        <FileText size={15} />
                        Evidence &amp; verification
                      </div>
                      <p>{selectedPurchase.evidence}</p>
                      <span className="verification-label">
                        <CircleHelp size={13} />
                        {hasReceiptEvidence(selectedPurchase)
                          ? "Review evidence and verify the policy"
                          : "Receipt evidence needs verification"}
                      </span>
                    </div>

                    <button
                      className="detail-action"
                      type="button"
                      onClick={() => {
                        setShowUpload(true);
                        setNotice(
                          "Upload a receipt to extract and verify its information.",
                        );
                      }}
                    >
                      <FileImage size={17} />
                      Add receipt evidence
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </aside>
            </div>
          </section>

          <footer className="footer">
            <span>
              <Leaf size={14} /> A little less worry, one receipt at a time.
            </span>
            <span>
              ReturnRadar <span className="footer-dot">·</span> Built with care
            </span>
          </footer>
        </div>
      </section>

      {editingPurchase && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingPurchase(null);
            }
          }}
        >
          <section
            className="upload-modal edit-purchase-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-purchase-title"
          >
            <div className="modal-header">
              <div>
                <div className="section-kicker">UPDATE YOUR RECORD</div>
                <h2 id="edit-purchase-title">Edit purchase</h2>
                <p>Update the details saved in your purchase library.</p>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close edit dialog"
                onClick={() => setEditingPurchase(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="edit-purchase-fields">
              <label className="review-field">
                Purchase name
                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="review-field">
                Merchant / brand
                <input
                  value={editForm.brand}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      brand: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="review-field">
                Category
                <input
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="review-field">
                Price (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="review-field">
                Purchase date
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="review-field">
                Return deadline
                <input
                  type="date"
                  value={editForm.returnDate}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      returnDate: event.target.value,
                    }))
                  }
                />
                <small>
                  Changing this date removes its verified status. Check the
                  retailer&apos;s policy before relying on it.
                </small>
              </label>

              <label className="review-field">
                Warranty until
                <input
                  type="date"
                  value={editForm.warrantyDate}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      warrantyDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="review-field">
                Description
                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </label>
            </div>

            {notice && <p className="notice-message">{notice}</p>}

            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setEditingPurchase(null)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={saveEditedPurchase}
              >
                <Check size={17} />
                Save changes
              </button>
            </div>
          </section>
        </div>
      )}

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAction}>
              {dialogActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showUpload && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowUpload(false);
          }}
        >
          <section
            className="upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
          >
            <div className="modal-header">
              <div>
                <div className="section-kicker">LET&apos;S GET ORGANIZED</div>
                <h2 id="upload-title">Add a receipt</h2>
                <p>One small upload. A much easier time keeping track.</p>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close upload dialog"
                onClick={() => setShowUpload(false)}
              >
                <X size={19} />
              </button>
            </div>

            <div
              className={`upload-dropzone ${dragging ? "upload-dropzone-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="upload-icon">
                <Upload size={23} />
              </div>
              <strong>Drop your receipt right here</strong>
              <span>
                or <span className="upload-browse">browse files</span> on your
                device
              </span>
              <small>
                JPG, PNG, WebP or PDF · Max 10 MB per file · Up to 5 files
              </small>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              hidden
              onChange={onFileChange}
            />

            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                <div className="uploaded-files-heading">
                  Selected files <span>{uploadedFiles.length}/5</span>
                </div>
                {uploadedFiles.map((file, index) => (
                  <div className="uploaded-file" key={`${file.name}-${index}`}>
                    <span className="uploaded-file-icon">
                      <FileText size={17} />
                    </span>
                    <span className="uploaded-file-info">
                      <strong>{file.name}</strong>
                      <small>
                        {(file.size / 1024).toFixed(0)} KB · Ready for
                        extraction
                      </small>
                    </span>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => {
                        setUploadedFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        );
                        setExtraction(null);
                        setExtractionFileName("");
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {extraction && (
              <div className="receipt-review">
                <div className="uploaded-files-heading">
                  Review extracted details
                  <span>
                    {Math.round(extraction.confidence * 100)}% model confidence
                  </span>
                </div>

                <p className="review-file-name">
                  Extracted from: {extractionFileName}
                </p>

                <label className="review-field">
                  Merchant
                  <input
                    value={extraction.merchant ?? ""}
                    onChange={(event) =>
                      updateExtraction("merchant", event.target.value || null)
                    }
                    placeholder="Merchant name"
                  />
                </label>

                <label className="review-field">
                  Item name
                  <input
                    value={extraction.itemName ?? ""}
                    onChange={(event) =>
                      updateExtraction("itemName", event.target.value || null)
                    }
                    placeholder="Item name"
                  />
                </label>

                <label className="review-field">
                  Category
                  <input
                    value={extraction.category ?? ""}
                    onChange={(event) =>
                      updateExtraction("category", event.target.value || null)
                    }
                    placeholder="Category"
                  />
                </label>

                <label className="review-field">
                  Total price ({extraction.currency || "currency unknown"})
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={extraction.totalPrice ?? ""}
                    onChange={(event) =>
                      updateExtraction(
                        "totalPrice",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                    placeholder="Amount"
                  />
                </label>

                <label className="review-field">
                  Purchase date
                  <input
                    type="date"
                    value={extraction.purchaseDate ?? ""}
                    onChange={(event) =>
                      updateExtraction(
                        "purchaseDate",
                        event.target.value || null,
                      )
                    }
                  />
                </label>

                <label className="review-field">
                  Return deadline
                  <input
                    type="date"
                    value={extraction.returnByDate ?? ""}
                    onChange={(event) =>
                      updateExtraction(
                        "returnByDate",
                        event.target.value || null,
                      )
                    }
                  />
                </label>

                <label className="review-field">
                  Warranty until
                  <input
                    type="date"
                    value={extraction.warrantyUntil ?? ""}
                    onChange={(event) =>
                      updateExtraction(
                        "warrantyUntil",
                        event.target.value || null,
                      )
                    }
                  />
                </label>

                <div className="review-evidence">
                  <strong>Return policy evidence</strong>
                  <p>
                    {extraction.returnPolicyEvidence ||
                      "No explicit return-policy text was found."}
                  </p>
                  <small className="evidence-disclaimer">
                    Extracted evidence may need verification. Confirm the
                    seller&apos;s actual return policy before relying on a
                    deadline.
                  </small>
                  {extraction.returnWindowDays !== null && (
                    <p>
                      Stated return window: {extraction.returnWindowDays} days.
                      This is not a confirmed calendar deadline.
                    </p>
                  )}
                </div>

                {extraction.receiptEvidence.length > 0 && (
                  <div className="review-evidence">
                    <strong>Receipt evidence</strong>
                    <ul>
                      {extraction.receiptEvidence.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(extraction.warnings.length > 0 ||
                  !extraction.returnByDate) && (
                  <div className="review-warning">
                    <strong>Please check</strong>
                    <ul>
                      {extraction.warnings.map((warning, index) => (
                        <li key={`${warning}-${index}`}>{warning}</li>
                      ))}
                      {!extraction.returnByDate && (
                        <li>
                          No confirmed return deadline was extracted. Verify the
                          seller&apos;s return policy before relying on a
                          deadline.
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {extraction.needsReview && (
                  <p className="notice-message">
                    The model flagged this receipt for review. Verify the
                    extracted information before confirming.
                  </p>
                )}
              </div>
            )}

            <div className="privacy-callout">
              <ShieldCheck size={18} />
              <span>
                <strong>Your information matters.</strong>
                <small>
                  Receipts are sent to the configured AI extraction service when
                  you choose to extract them. Confirmed purchase details are
                  stored in this browser and are not synced to other devices.
                </small>
              </span>
            </div>

            {notice && <p className="notice-message">{notice}</p>}

            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setUploadedFiles([]);
                  setExtraction(null);
                  setExtractionFileName("");
                  setNotice("");
                  setShowUpload(false);
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={uploadedFiles.length === 0 || isExtracting}
                onClick={extraction ? confirmPurchase : extractReceipt}
              >
                <Sparkles size={17} />
                {isExtracting
                  ? "Extracting receipt..."
                  : extraction
                    ? extraction.needsReview ||
                      !extraction.returnPolicyFound ||
                      !extraction.returnByDate
                      ? "Review & save purchase"
                      : "Confirm purchase"
                    : "Extract receipt details"}
                {!isExtracting && <ArrowRight size={16} />}
              </button>
            </div>
          </section>
        </div>
      )}

      {notice && !showUpload && (
        <div className="toast-message" role="status">
          <Check size={17} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </main>
  );
}
