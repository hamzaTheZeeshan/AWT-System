import React, { useState, useEffect } from "react";
import "./CreateDonation.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClothItem {
    type: string;
    size: string;
    conditionOfCloth: string;
    description: string;
    quantity: number | "";
}

interface BookItem {
    title: string;
    author: string;
    conditionOfBook: string;
    description: string;
    quantity: number | "";
}

interface DonationPayload {
    donation_type_id: number;
    amount: number | null;
    campaign_id: string;
    items: ClothItem[] | BookItem[];
}

// What the backend returns on successful donation
interface ApiResponse {
    message?: string;
    error?: string;
    receipt_id?: string;
    donor?: {
        name: string;
        email: string;
        phone?: string;
        cnic?: string;
    };
    donation?: {
        id: number;
        donation_type_id: number;
        amount: number | null;
        items: ClothItem[] | BookItem[];
        created_at: string;
    };
}

// Data needed to generate the receipt PDF
interface ReceiptData {
    receiptId: string;
    donorName: string;
    donorEmail: string;
    donorPhone: string;
    donorCnic: string;
    donationTypeId: number;
    amount: number | null;
    items: ClothItem[] | BookItem[];
    date: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AMOUNT_PRESETS = [100, 500, 1000];

const EMPTY_CLOTH: ClothItem = {
    type: "",
    size: "",
    conditionOfCloth: "",
    description: "",
    quantity: "",
};

const EMPTY_BOOK: BookItem = {
    title: "",
    author: "",
    conditionOfBook: "",
    description: "",
    quantity: "",
};

const CLOTH_TYPES = ["Shirt", "Pants", "Jacket", "Dress", "Shoes", "Other"];
const CONDITION_OPTIONS = ["New", "Good", "Fair", "Worn"];

const DONATION_TYPE_LABELS: Record<number, string> = {
    1: "Zakat",
    2: "Normal Donation",
    3: "Sadqah",
    4: "Clothes",
    5: "Books",
};

// ─── PDF Generator ────────────────────────────────────────────────────────────

function generateReceiptPDF(data: ReceiptData): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = pageW - margin * 2;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const hex2rgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    };

    const setColor = (hex: string) => {
        const { r, g, b } = hex2rgb(hex);
        doc.setTextColor(r, g, b);
    };

    const setFill = (hex: string) => {
        const { r, g, b } = hex2rgb(hex);
        doc.setFillColor(r, g, b);
    };

    const setDraw = (hex: string) => {
        const { r, g, b } = hex2rgb(hex);
        doc.setDrawColor(r, g, b);
    };

    // ── Color Palette ─────────────────────────────────────────────────────────
    const TEAL     = "#0D6E6E";
    const TEAL_LT  = "#E6F4F4";
    const GOLD     = "#C9973A";
    const DARK     = "#1A1A2E";
    const MUTED    = "#6B7280";
    const WHITE    = "#FFFFFF";
    const DIVIDER  = "#D1D5DB";
    const SUCCESS  = "#065F46";
    const SUCCESS_BG = "#D1FAE5";

    let y = 0;

    // ── Header Banner ─────────────────────────────────────────────────────────
    setFill(TEAL);
    setDraw(TEAL);
    doc.rect(0, 0, pageW, 52, "F");

    // Decorative arc/circle top-right
    setFill("#0B5E5E");
    doc.circle(pageW - 10, -10, 30, "F");

    // Logo circle
    setFill(GOLD);
    doc.circle(margin + 12, 26, 12, "F");
    setColor(WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("A", margin + 12, 30, { align: "center" });

    // Organization name
    setColor(WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("AWT System", margin + 30, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor("#A8D8D8");
    doc.text("Army Welfare Trust  |  Donation Management Platform", margin + 30, 30);

    // "OFFICIAL RECEIPT" badge
    setFill(GOLD);
    doc.roundedRect(pageW - margin - 48, 14, 48, 16, 3, 3, "F");
    setColor(WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("OFFICIAL RECEIPT", pageW - margin - 24, 24, { align: "center" });

    y = 62;

    // ── Receipt Meta Row ──────────────────────────────────────────────────────
    setFill(TEAL_LT);
    setDraw(TEAL_LT);
    doc.rect(margin, y, contentW, 18, "F");

    setColor(TEAL);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("RECEIPT NO.", margin + 4, y + 7);
    setColor(DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(data.receiptId, margin + 4, y + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(TEAL);
    doc.text("DATE ISSUED", pageW / 2 - 20, y + 7);
    setColor(DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(data.date, pageW / 2 - 20, y + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(TEAL);
    doc.text("DONATION TYPE", pageW - margin - 55, y + 7);
    setColor(DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(DONATION_TYPE_LABELS[data.donationTypeId] || "Donation", pageW - margin - 55, y + 14);

    y += 26;

    // ── Section: Donor Information ────────────────────────────────────────────
    setColor(TEAL);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DONOR INFORMATION", margin, y);
    setDraw(TEAL);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 50, y + 2);

    y += 8;

    const donorFields: [string, string][] = [
        ["Full Name",     data.donorName  || "—"],
        ["Email Address", data.donorEmail || "—"],
        ["Phone",         data.donorPhone || "—"],
        ["CNIC",          data.donorCnic  || "—"],
    ];

    donorFields.forEach(([label, value], i) => {
        const col = i % 2 === 0 ? margin : pageW / 2 + 4;
        if (i % 2 === 0 && i > 0) y += 14;
        setColor(MUTED);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(label.toUpperCase(), col, y);
        setColor(DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(value, col, y + 6);
    });

    y += 18;

    // ── Divider ───────────────────────────────────────────────────────────────
    setDraw(DIVIDER);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // ── Section: Donation Details ─────────────────────────────────────────────
    setColor(TEAL);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DONATION DETAILS", margin, y);
    setDraw(TEAL);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 50, y + 2);
    y += 10;

    // ── Money Donation ────────────────────────────────────────────────────────
    if ([1, 2, 3].includes(data.donationTypeId) && data.amount !== null) {
        // Amount card
        setFill(TEAL_LT);
        setDraw(TEAL_LT);
        doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");

        setColor(MUTED);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("AMOUNT DONATED", margin + 8, y + 9);

        setColor(TEAL);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(`PKR ${data.amount.toLocaleString()}`, margin + 8, y + 22);

        // Type badge
        setFill(GOLD);
        doc.roundedRect(pageW - margin - 38, y + 6, 38, 14, 2, 2, "F");
        setColor(WHITE);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(DONATION_TYPE_LABELS[data.donationTypeId], pageW - margin - 19, y + 15, { align: "center" });

        y += 36;
    }

    // ── In-Kind Donation Table ────────────────────────────────────────────────
    if ([4, 5].includes(data.donationTypeId) && data.items.length > 0) {
        const isClothes = data.donationTypeId === 4;

        // Table header
        setFill(DARK);
        setDraw(DARK);
        doc.rect(margin, y, contentW, 9, "F");
        setColor(WHITE);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        if (isClothes) {
            doc.text("#",          margin + 3,  y + 6);
            doc.text("Type",       margin + 12, y + 6);
            doc.text("Size",       margin + 50, y + 6);
            doc.text("Condition",  margin + 85, y + 6);
            doc.text("Qty",        margin + 130, y + 6);
            doc.text("Description",margin + 150, y + 6);
        } else {
            doc.text("#",          margin + 3,  y + 6);
            doc.text("Title",      margin + 12, y + 6);
            doc.text("Author",     margin + 75, y + 6);
            doc.text("Condition",  margin + 120, y + 6);
            doc.text("Qty",        margin + 155, y + 6);
        }

        y += 9;

        data.items.forEach((item, idx) => {
            const rowH = 10;
            if (idx % 2 === 0) {
                setFill("#F9FAFB");
                setDraw("#F9FAFB");
                doc.rect(margin, y, contentW, rowH, "F");
            }

            setColor(DARK);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);

            if (isClothes) {
                const c = item as ClothItem;
                doc.text(String(idx + 1),            margin + 3,   y + 7);
                doc.text(c.type || "—",              margin + 12,  y + 7);
                doc.text(c.size || "—",              margin + 50,  y + 7);
                doc.text(c.conditionOfCloth || "—",  margin + 85,  y + 7);
                doc.text(String(c.quantity || 0),    margin + 130, y + 7);
                doc.text(
                    (c.description || "—").substring(0, 22),
                    margin + 150, y + 7
                );
            } else {
                const b = item as BookItem;
                doc.text(String(idx + 1),            margin + 3,   y + 7);
                doc.text((b.title || "—").substring(0, 30), margin + 12, y + 7);
                doc.text((b.author || "—").substring(0, 20), margin + 75, y + 7);
                doc.text(b.conditionOfBook || "—",   margin + 120, y + 7);
                doc.text(String(b.quantity || 0),    margin + 155, y + 7);
            }

            // Row bottom border
            setDraw(DIVIDER);
            doc.setLineWidth(0.2);
            doc.line(margin, y + rowH, pageW - margin, y + rowH);

            y += rowH;
        });

        // Total row
        setFill(TEAL_LT);
        setDraw(TEAL_LT);
        doc.rect(margin, y, contentW, 10, "F");
        setColor(TEAL);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        const totalQty = data.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        doc.text(`Total Items: ${data.items.length}   |   Total Quantity: ${totalQty}`, margin + 4, y + 7);
        y += 18;
    }

    // ── Acknowledgement Banner ─────────────────────────────────────────────────
    setFill(SUCCESS_BG);
    setDraw(SUCCESS_BG);
    doc.roundedRect(margin, y, contentW, 18, 3, 3, "F");
    setColor(SUCCESS);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("✓  Thank you for your generous donation. May Allah accept your contribution.", margin + 6, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("This receipt is your official acknowledgement of donation to AWT System.", margin + 6, y + 14);
    y += 26;

    // ── Footer ─────────────────────────────────────────────────────────────────
    setFill(TEAL);
    setDraw(TEAL);
    doc.rect(0, pageH - 22, pageW, 22, "F");

    setColor("#A8D8D8");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("AWT System  |  Army Welfare Trust Donation Platform", pageW / 2, pageH - 14, { align: "center" });
    doc.text(`Generated on ${new Date().toLocaleString()}  |  Receipt ID: ${data.receiptId}`, pageW / 2, pageH - 8, { align: "center" });

    // ── Save ───────────────────────────────────────────────────────────────────
    doc.save(`AWT-Receipt-${data.receiptId}.pdf`);
}

// ─── ClothesSubForm ───────────────────────────────────────────────────────────

interface ClothesSubFormProps {
    items: ClothItem[];
    onChange: (items: ClothItem[]) => void;
}

const ClothesSubForm: React.FC<ClothesSubFormProps> = ({ items, onChange }) => {
    const update = (index: number, field: keyof ClothItem, value: string | number) => {
        onChange(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };
    const addItem    = () => onChange([...items, { ...EMPTY_CLOTH }]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

    return (
        <div className="items-form">
            {items.map((item, index) => (
                <div className="item-card" key={index}>
                    <div className="item-card-header">
                        <span className="item-card-title">🧥 Clothing Item {index + 1}</span>
                        {items.length > 1 && (
                            <button type="button" className="remove-item-btn" onClick={() => removeItem(index)}>✕ Remove</button>
                        )}
                    </div>
                    <div className="item-fields">
                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Type <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">👕</span>
                                    <div className="select-wrapper">
                                        <select value={item.type} onChange={(e) => update(index, "type", e.target.value)}>
                                            <option value="">Select type</option>
                                            {CLOTH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="field-col">
                                <p className="field-label">Size</p>
                                <div className="input-group">
                                    <span className="input-icon">📏</span>
                                    <input type="text" placeholder="e.g. M, L, XL, 32" value={item.size}
                                        onChange={(e) => update(index, "size", e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Condition</p>
                                <div className="input-group">
                                    <span className="input-icon">⭐</span>
                                    <div className="select-wrapper">
                                        <select value={item.conditionOfCloth} onChange={(e) => update(index, "conditionOfCloth", e.target.value)}>
                                            <option value="">Select condition</option>
                                            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="field-col">
                                <p className="field-label">Quantity <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">🔢</span>
                                    <input type="number" placeholder="e.g. 2" value={item.quantity} min="1"
                                        onChange={(e) => update(index, "quantity", e.target.value === "" ? "" : Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <p className="field-label">Description</p>
                        <div className="input-group">
                            <span className="input-icon">📝</span>
                            <input type="text" placeholder="Optional details about the clothing" value={item.description}
                                onChange={(e) => update(index, "description", e.target.value)} />
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" className="add-item-btn" onClick={addItem}>+ Add Another Clothing Item</button>
        </div>
    );
};

// ─── BooksSubForm ─────────────────────────────────────────────────────────────

interface BooksSubFormProps {
    items: BookItem[];
    onChange: (items: BookItem[]) => void;
}

const BooksSubForm: React.FC<BooksSubFormProps> = ({ items, onChange }) => {
    const update = (index: number, field: keyof BookItem, value: string | number) => {
        onChange(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };
    const addItem    = () => onChange([...items, { ...EMPTY_BOOK }]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

    return (
        <div className="items-form">
            {items.map((item, index) => (
                <div className="item-card" key={index}>
                    <div className="item-card-header">
                        <span className="item-card-title">📚 Book Item {index + 1}</span>
                        {items.length > 1 && (
                            <button type="button" className="remove-item-btn" onClick={() => removeItem(index)}>✕ Remove</button>
                        )}
                    </div>
                    <div className="item-fields">
                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Title <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">📖</span>
                                    <input type="text" placeholder="Book title" value={item.title}
                                        onChange={(e) => update(index, "title", e.target.value)} />
                                </div>
                            </div>
                            <div className="field-col">
                                <p className="field-label">Author</p>
                                <div className="input-group">
                                    <span className="input-icon">✍️</span>
                                    <input type="text" placeholder="Author name" value={item.author}
                                        onChange={(e) => update(index, "author", e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Condition</p>
                                <div className="input-group">
                                    <span className="input-icon">⭐</span>
                                    <div className="select-wrapper">
                                        <select value={item.conditionOfBook} onChange={(e) => update(index, "conditionOfBook", e.target.value)}>
                                            <option value="">Select condition</option>
                                            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="field-col">
                                <p className="field-label">Quantity <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">🔢</span>
                                    <input type="number" placeholder="e.g. 3" value={item.quantity} min="1"
                                        onChange={(e) => update(index, "quantity", e.target.value === "" ? "" : Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <p className="field-label">Description</p>
                        <div className="input-group">
                            <span className="input-icon">📝</span>
                            <input type="text" placeholder="Optional details about the book" value={item.description}
                                onChange={(e) => update(index, "description", e.target.value)} />
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" className="add-item-btn" onClick={addItem}>+ Add Another Book</button>
        </div>
    );
};

// ─── DonationForm (main) ──────────────────────────────────────────────────────

const DonationForm: React.FC = () => {
    const [donationTypeId, setDonationTypeId] = useState<number | "">("");
    const [amount, setAmount] = useState<string>("");
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [clothItems, setClothItems] = useState<ClothItem[]>([{ ...EMPTY_CLOTH }]);
    const [bookItems, setBookItems] = useState<BookItem[]>([{ ...EMPTY_BOOK }]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    // Receipt state — populated only after a successful submission
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [pdfReady, setPdfReady] = useState<boolean>(false);

    // Load jsPDF from CDN once
    useEffect(() => {
        if ((window as any).jspdf) { setPdfReady(true); return; }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = () => setPdfReady(true);
        document.head.appendChild(script);
    }, []);

    const isMoneyType = [1, 2, 3].includes(Number(donationTypeId));
    const isClothes   = donationTypeId === 4;
    const isBooks     = donationTypeId === 5;

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDonationTypeId(Number(e.target.value));
        setAmount("");
        setSelectedPreset(null);
        setError("");
        setSuccess("");
        setReceiptData(null);
    };

    const handlePreset = (value: number) => {
        setSelectedPreset(value);
        setAmount(String(value));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPreset(null);
        setAmount(e.target.value);
    };

    // ── Validation ────────────────────────────────────────────────────────────

    const validateClothItems = (): string | null => {
        for (let i = 0; i < clothItems.length; i++) {
            if (!clothItems[i].type)                            return `Clothing item ${i + 1}: type is required.`;
            if (!clothItems[i].quantity || Number(clothItems[i].quantity) <= 0) return `Clothing item ${i + 1}: quantity must be > 0.`;
        }
        return null;
    };

    const validateBookItems = (): string | null => {
        for (let i = 0; i < bookItems.length; i++) {
            if (!bookItems[i].title)                           return `Book item ${i + 1}: title is required.`;
            if (!bookItems[i].quantity || Number(bookItems[i].quantity) <= 0) return `Book item ${i + 1}: quantity must be > 0.`;
        }
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setReceiptData(null);

        if (!donationTypeId) { setError("Please select a donation type."); return; }

        let parsedAmount: number | null = null;
        let items: ClothItem[] | BookItem[] = [];

        if (isMoneyType) {
            if (!amount) { setError("Please enter a donation amount."); return; }
            parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) { setError("Please enter a valid donation amount."); return; }
        }

        if (isClothes) {
            const err = validateClothItems();
            if (err) { setError(err); return; }
            items = clothItems;
        }

        if (isBooks) {
            const err = validateBookItems();
            if (err) { setError(err); return; }
            items = bookItems;
        }

        const payload: DonationPayload = {
            donation_type_id: Number(donationTypeId),
            amount: parsedAmount,
            campaign_id: "",
            items,
        };

        try {
            setLoading(true);
            const token = sessionStorage.getItem("token");
            if (!token) { setError("You must be logged in to donate."); return; }

            const response = await fetch("https://legal-impart-demise.ngrok-free.dev/api/donations/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data: ApiResponse = await response.json();
            if (!response.ok) throw new Error(data.error || "Something went wrong.");

            setSuccess(data.message || "Donation submitted successfully!");

            // ── Build receipt from server-verified data ────────────────────
            setReceiptData({
                receiptId:    data.receipt_id   || `RCP-${Date.now()}`,
                donorName:    data.donor?.name  || "—",
                donorEmail:   data.donor?.email || "—",
                donorPhone:   data.donor?.phone || "—",
                donorCnic:    data.donor?.cnic  || "—",
                donationTypeId: Number(donationTypeId),
                amount:       data.donation?.amount ?? parsedAmount,
                items:        data.donation?.items  ?? items,
                date:         data.donation?.created_at
                                ? new Date(data.donation.created_at).toLocaleDateString("en-PK", {
                                    day: "2-digit", month: "long", year: "numeric"
                                  })
                                : new Date().toLocaleDateString("en-PK", {
                                    day: "2-digit", month: "long", year: "numeric"
                                  }),
            });

            // Reset form
            setDonationTypeId("");
            setAmount("");
            setSelectedPreset(null);
            setClothItems([{ ...EMPTY_CLOTH }]);
            setBookItems([{ ...EMPTY_BOOK }]);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Unexpected error.");
        } finally {
            setLoading(false);
        }
    };

    // ── Generate Receipt ──────────────────────────────────────────────────────

    const handleGenerateReceipt = () => {
        if (!receiptData) return;
        generateReceiptPDF(receiptData);
    };

    const isDisabled =
        loading ||
        !donationTypeId ||
        (isMoneyType && !amount) ||
        (isClothes && clothItems.some((i) => !i.type || !i.quantity)) ||
        (isBooks   && bookItems.some((i) => !i.title || !i.quantity));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="page-wrapper">
            <div className="card">

                <div className="header">
                    <div className="logo">
                        <span className="logo-letter">A</span>
                    </div>
                    <p className="brand-name">AWT System</p>
                    <h1 className="heading">
                        Make a Donation
                        <span>Support a campaign you care about</span>
                    </h1>
                </div>

                <div className="form">

                    {/* ── Donation Type ── */}
                    <p className="field-label">Donation Type</p>
                    <div className="input-group">
                        <span className="input-icon">🏷</span>
                        <div className="select-wrapper">
                            <select value={donationTypeId} onChange={handleTypeChange}>
                                <option value="">Select donation type</option>
                                <option value="1">Zakat</option>
                                <option value="2">Normal</option>
                                <option value="3">Sadqah</option>
                                <option value="4">Clothes</option>
                                <option value="5">Books</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Money amount ── */}
                    {isMoneyType && (
                        <>
                            <p className="field-label">Amount</p>
                            <div className="amount-presets">
                                {AMOUNT_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        className={`preset-btn${selectedPreset === preset ? " active" : ""}`}
                                        onClick={() => handlePreset(preset)}
                                    >
                                        PKR {preset}
                                    </button>
                                ))}
                            </div>
                            <div className="input-group">
                                <span className="input-icon">💵</span>
                                <input
                                    type="number"
                                    placeholder="Or enter custom amount"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    min="1"
                                />
                            </div>
                        </>
                    )}

                    {/* ── Clothes sub-form ── */}
                    {isClothes && (
                        <div className="sub-form-wrapper">
                            <div className="sub-form-divider">
                                <hr /><span>Clothing Details</span><hr />
                            </div>
                            <ClothesSubForm items={clothItems} onChange={setClothItems} />
                        </div>
                    )}

                    {/* ── Books sub-form ── */}
                    {isBooks && (
                        <div className="sub-form-wrapper">
                            <div className="sub-form-divider">
                                <hr /><span>Book Details</span><hr />
                            </div>
                            <BooksSubForm items={bookItems} onChange={setBookItems} />
                        </div>
                    )}

                    {/* ── Feedback ── */}
                    {error   && <p className="feedback error-msg">{error}</p>}
                    {success && <p className="feedback success-msg">{success}</p>}

                    {/* ── Action Buttons ── */}
                    <div className="action-buttons">
                        <button
                            className="submit-btn"
                            onClick={handleSubmit}
                            disabled={isDisabled}
                            type="button"
                        >
                            {loading ? "Submitting…" : "Donate Now"}
                        </button>

                        {receiptData && (
                            <button
                                className="receipt-btn"
                                onClick={handleGenerateReceipt}
                                disabled={!pdfReady}
                                type="button"
                            >
                                {pdfReady ? "🧾 Download Receipt (PDF)" : "Loading PDF engine…"}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DonationForm;