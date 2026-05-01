import React, { useState } from "react";
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

interface ApiResponse {
    message?: string;
    error?: string;
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

// ─── ClothesSubForm ───────────────────────────────────────────────────────────

interface ClothesSubFormProps {
    items: ClothItem[];
    onChange: (items: ClothItem[]) => void;
}

const ClothesSubForm: React.FC<ClothesSubFormProps> = ({ items, onChange }) => {
    const update = (index: number, field: keyof ClothItem, value: string | number) => {
        const updated = items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        onChange(updated);
    };

    const addItem = () => onChange([...items, { ...EMPTY_CLOTH }]);

    const removeItem = (index: number) =>
        onChange(items.filter((_, i) => i !== index));

    return (
        <div className="items-form">
            {items.map((item, index) => (
                <div className="item-card" key={index}>
                    <div className="item-card-header">
                        <span className="item-card-title">🧥 Clothing Item {index + 1}</span>
                        {items.length > 1 && (
                            <button
                                type="button"
                                className="remove-item-btn"
                                onClick={() => removeItem(index)}
                            >
                                ✕ Remove
                            </button>
                        )}
                    </div>

                    <div className="item-fields">
                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Type <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">👕</span>
                                    <div className="select-wrapper">
                                        <select
                                            value={item.type}
                                            onChange={(e) => update(index, "type", e.target.value)}
                                        >
                                            <option value="">Select type</option>
                                            {CLOTH_TYPES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="field-col">
                                <p className="field-label">Size</p>
                                <div className="input-group">
                                    <span className="input-icon">📏</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. M, L, XL, 32"
                                        value={item.size}
                                        onChange={(e) => update(index, "size", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Condition</p>
                                <div className="input-group">
                                    <span className="input-icon">⭐</span>
                                    <div className="select-wrapper">
                                        <select
                                            value={item.conditionOfCloth}
                                            onChange={(e) => update(index, "conditionOfCloth", e.target.value)}
                                        >
                                            <option value="">Select condition</option>
                                            {CONDITION_OPTIONS.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="field-col">
                                <p className="field-label">Quantity <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">🔢</span>
                                    <input
                                        type="number"
                                        placeholder="e.g. 2"
                                        value={item.quantity}
                                        min="1"
                                        onChange={(e) =>
                                            update(index, "quantity", e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="field-label">Description</p>
                        <div className="input-group">
                            <span className="input-icon">📝</span>
                            <input
                                type="text"
                                placeholder="Optional details about the clothing"
                                value={item.description}
                                onChange={(e) => update(index, "description", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" className="add-item-btn" onClick={addItem}>
                + Add Another Clothing Item
            </button>
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
        const updated = items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        onChange(updated);
    };

    const addItem = () => onChange([...items, { ...EMPTY_BOOK }]);

    const removeItem = (index: number) =>
        onChange(items.filter((_, i) => i !== index));

    return (
        <div className="items-form">
            {items.map((item, index) => (
                <div className="item-card" key={index}>
                    <div className="item-card-header">
                        <span className="item-card-title">📚 Book Item {index + 1}</span>
                        {items.length > 1 && (
                            <button
                                type="button"
                                className="remove-item-btn"
                                onClick={() => removeItem(index)}
                            >
                                ✕ Remove
                            </button>
                        )}
                    </div>

                    <div className="item-fields">
                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Title <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">📖</span>
                                    <input
                                        type="text"
                                        placeholder="Book title"
                                        value={item.title}
                                        onChange={(e) => update(index, "title", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="field-col">
                                <p className="field-label">Author</p>
                                <div className="input-group">
                                    <span className="input-icon">✍️</span>
                                    <input
                                        type="text"
                                        placeholder="Author name"
                                        value={item.author}
                                        onChange={(e) => update(index, "author", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="field-row">
                            <div className="field-col">
                                <p className="field-label">Condition</p>
                                <div className="input-group">
                                    <span className="input-icon">⭐</span>
                                    <div className="select-wrapper">
                                        <select
                                            value={item.conditionOfBook}
                                            onChange={(e) => update(index, "conditionOfBook", e.target.value)}
                                        >
                                            <option value="">Select condition</option>
                                            {CONDITION_OPTIONS.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="field-col">
                                <p className="field-label">Quantity <span className="required">*</span></p>
                                <div className="input-group">
                                    <span className="input-icon">🔢</span>
                                    <input
                                        type="number"
                                        placeholder="e.g. 3"
                                        value={item.quantity}
                                        min="1"
                                        onChange={(e) =>
                                            update(index, "quantity", e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="field-label">Description</p>
                        <div className="input-group">
                            <span className="input-icon">📝</span>
                            <input
                                type="text"
                                placeholder="Optional details about the book"
                                value={item.description}
                                onChange={(e) => update(index, "description", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" className="add-item-btn" onClick={addItem}>
                + Add Another Book
            </button>
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

    const isMoneyType = [1, 2, 3].includes(Number(donationTypeId));
    const isClothes = donationTypeId === 4;
    const isBooks = donationTypeId === 5;

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDonationTypeId(Number(e.target.value));
        setAmount("");
        setSelectedPreset(null);
        setError("");
        setSuccess("");
    };

    const handlePreset = (value: number) => {
        setSelectedPreset(value);
        setAmount(String(value));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPreset(null);
        setAmount(e.target.value);
    };

    // ── Validation helpers ────────────────────────────────────────────────────

    const validateClothItems = (): string | null => {
        for (let i = 0; i < clothItems.length; i++) {
            const item = clothItems[i];
            if (!item.type) return `Clothing item ${i + 1}: type is required.`;
            if (!item.quantity || Number(item.quantity) <= 0)
                return `Clothing item ${i + 1}: quantity must be greater than 0.`;
        }
        return null;
    };

    const validateBookItems = (): string | null => {
        for (let i = 0; i < bookItems.length; i++) {
            const item = bookItems[i];
            if (!item.title) return `Book item ${i + 1}: title is required.`;
            if (!item.quantity || Number(item.quantity) <= 0)
                return `Book item ${i + 1}: quantity must be greater than 0.`;
        }
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!donationTypeId) {
            setError("Please select a donation type.");
            return;
        }

        let parsedAmount: number | null = null;
        let items: ClothItem[] | BookItem[] = [];

        if (isMoneyType) {
            if (!amount) { setError("Please enter a donation amount."); return; }
            parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                setError("Please enter a valid donation amount.");
                return;
            }
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

            const response = await fetch("http://localhost:5000/api/donations/create", {
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

    const isDisabled =
        loading ||
        !donationTypeId ||
        (isMoneyType && !amount) ||
        (isClothes && clothItems.some((i) => !i.type || !i.quantity)) ||
        (isBooks && bookItems.some((i) => !i.title || !i.quantity));

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
                    {error && <p className="feedback error-msg">{error}</p>}
                    {success && <p className="feedback success-msg">{success}</p>}

                    <button
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={isDisabled}
                        type="button"
                    >
                        {loading ? "Submitting…" : "Donate Now"}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default DonationForm;