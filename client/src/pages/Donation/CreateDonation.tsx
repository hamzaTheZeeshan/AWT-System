import React, { useState } from "react";
import "./CreateDonation.css";
import Login from "../Login/Login";

interface DonationPayload {
    donation_type_id: number;
    amount: number | null;
    campaign_id: string;
    items: string[];
}

interface ApiResponse {
    message?: string;
    error?: string;
}

const AMOUNT_PRESETS = [100, 500, 1000];

const DonationForm: React.FC = () => {
    const [donationTypeId, setDonationTypeId] = useState<number | "">("");
    const [amount, setAmount] = useState<string>("");
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const showSubForm = donationTypeId === 4 || donationTypeId === 5;
    const showAmount = !showSubForm;

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

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!donationTypeId) {
            setError("Please select a donation type.");
            return;
        }

        if (showAmount && !amount) {
            setError("Please enter a donation amount.");
            return;
        }

        let parsedAmount: number | null = null;
        if (showAmount) {
            parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                setError("Please enter a valid donation amount.");
                return;
            }
        }

        const payload: DonationPayload = {
            donation_type_id: Number(donationTypeId),
            amount: parsedAmount,
            campaign_id: "",
            items: [],
        };

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                setError("You must be logged in to donate.");
                return;
            }

            const response = await fetch("http://localhost:5000/api/donations/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data: ApiResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong.");
            }

            setSuccess(data.message || "Donation submitted successfully!");
            setDonationTypeId("");
            setAmount("");
            setSelectedPreset(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Unexpected error.");
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = loading || !donationTypeId || (showAmount && !amount);

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

                    {showAmount && (
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

                    {showSubForm && (
                        <div className="sub-form-wrapper">
                            <div className="sub-form-divider">
                                <hr />
                                <span>Details</span>–
                                <hr />
                            </div>
                            <div className="sub-form-body">
                                <Login />
                            </div>
                        </div>
                    )}

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