import nodemailer from "nodemailer";

export const sendContactMessage = async (req, res) => {
    const { fullName, email, phone, message } = req.body;
    console.log(process.env.EMAIL_USER);
    console.log(process.env.EMAIL_PASS ? "PASS OK" : "NO PASS");
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `New Contact Form Message from ${fullName}`,
            text: `
Name: ${fullName}
Email: ${email}
Phone: ${phone}

Message:
${message}
      `,
        });

        res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to send message" });
    }
};