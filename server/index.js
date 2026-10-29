import express from "express"
import pool from "./db.js"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import cors from "cors"
import bcrypt from "bcrypt"
import crypto from "crypto"
import nodemailer from "nodemailer";
import multer from "multer"
import { v2 as cloudinary } from "cloudinary";
import pkg from 'multer-storage-cloudinary';
const { CloudinaryStorage } = pkg;
import dotenv from "dotenv"
import pg from "pg"
import { google } from "googleapis"

pg.types.setTypeParser(1082, (value) => value);

const port = 3000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${port}`;
const isProduction = process.env.NODE_ENV === "production";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}))

const startServer = async () => {
    await pool.query("SELECT NOW()")
        .then(() => {
            console.log("Database Connection Successful");
            app.listen(port, () => {
                console.log(`Server started on port ${port}`);
            })
        })
        .catch((err) => {
            console.log("Database connection failed: ", err.message)
        })
}
startServer();


const sendOtpEmail = async (email, otp, purpose = 'Email Verification') => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
            sender: {
                name: process.env.MAIL_FROM_NAME || "Drive Luxury",
                email: process.env.MAIL_FROM_EMAIL,
            },
            to: [{ email }],
            subject: purpose,
            htmlContent: `This is your one time otp <b>${otp}</b> and it expires in <b>15</b> minutes`,
        }),
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Brevo send failed (${response.status}): ${errBody}`);
    }
};

const upsertOtp = async (email, otp) => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const existing = await pool.query("SELECT otp FROM otps WHERE email = $1", [email]);

    if (existing.rows.length === 0) {
        await pool.query(
            "INSERT INTO otps(email, otp, expiresat) VALUES($1,$2,$3)",
            [email, otp, expiresAt]
        );
    } else {
        await pool.query(
            "UPDATE otps SET otp = $1, expiresat = $2 WHERE email = $3",
            [otp, expiresAt, email]
        );
    }
};

const encryptRefundAccountNumber = (
    accountNumber,
    secret
) => {
    const iv = crypto.randomBytes(12)

    const key = crypto
        .createHash("sha256")
        .update(secret)
        .digest()

    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        key,
        iv
    )

    const encrypted = Buffer.concat([
        cipher.update(accountNumber, "utf8"),
        cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64"),
    ].join(".")
}

const decryptRefundAccountNumber = (
    encryptedValue,
    secret
) => {
    const [ivBase64, authTagBase64, encryptedBase64] =
        encryptedValue.split(".")

    const iv = Buffer.from(ivBase64, "base64")
    const authTag = Buffer.from(authTagBase64, "base64")
    const encrypted = Buffer.from(
        encryptedBase64,
        "base64"
    )

    const key = crypto
        .createHash("sha256")
        .update(secret)
        .digest()

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        iv
    )

    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ])

    return decrypted.toString("utf8")
}

app.post("/register", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const checkEmail = await pool.query(
            "SELECT 1 FROM users WHERE email = $1",
            [email]
        );
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const otp = crypto.randomInt(100000, 999999);
        await sendOtpEmail(email, otp, 'Email Verification');
        await upsertOtp(email, otp);

        return res.status(200).json({ message: 'You can proceed to OTP Verification' });
    } catch (err) {
        console.log("Internal server Error /register:", err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ---------- NEW: resend the signup OTP (SignUp's OTP screen had no way to do this) ----------
app.post("/resendOtp", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const checkUser = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const otp = crypto.randomInt(100000, 999999);
        await sendOtpEmail(email, otp, 'Email Verification');
        await upsertOtp(email, otp);

        return res.status(200).json({ message: 'OTP resent successfully.' });
    } catch (err) {
        console.log("Internal server Error /resendOtp:", err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/verifyOTP", async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, email, password, phone, otp } = req.body;

        const checkUser = await client.query(
            "SELECT 1 FROM users WHERE email = $1",
            [email]
        );
        if (checkUser.rows.length !== 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const checkOtp = await client.query(
            "SELECT otp, expiresAt FROM otps WHERE email = $1",
            [email]
        );
        if (checkOtp.rows.length === 0) {
            return res.status(400).json({ message: 'OTP not found for this email' });
        }

        const userOtp = checkOtp.rows[0];

        if (Date.now() > Number(userOtp.expiresat)) {
            return res.status(400).json({
                message: 'This OTP has expired and is no longer valid'
            });
        }

        if (String(otp) !== String(userOtp.otp)) {
            return res.status(400).json({ message: 'Incorrect OTP' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query("BEGIN");
        await client.query(
            "INSERT INTO users(name, email, password, phone, createdAt) VALUES ($1, $2, $3, $4, $5)",
            [name, email, hashedPassword, phone, new Date()]
        );
        await client.query(
            "DELETE FROM otps WHERE email = $1",
            [email]
        );
        await client.query("COMMIT");

        return res.status(200).json({ message: 'User registered successfully.' });
    } catch (err) {
        await client.query("ROLLBACK");
        console.log("Internal server Error /verifyOTP:", err.message);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
};

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const userResult = await pool.query(
            "SELECT id, password, role, name, auth_provider FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "You are not registered" });
        }

        const user = userResult.rows[0];

        // Account was created through Google: its stored password is a random
        // placeholder, so tell the person to sign in with Google instead.
        if (user.auth_provider === "google") {
            return res.status(400).json({
                message:
                    "You signed up with Google. Please use 'Continue with Google' to sign in.",
                authProvider: "google",
            });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ message: "Incorrect Password" });
        }

        const token = await jwt.sign(
            {
                id: user.id,
                email,
                role: user.role,
                name: user.name,
            },
            process.env.JWTSECRET,
            {
                expiresIn: "30m",
            }
        );

        res.cookie("token", token, cookieOptions);

        return res
            .status(200)
            .json({ message: "User logged in successfully!", role: user.role });
    } catch (err) {
        console.log("Internal server Error /login:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});
const verifyJWT = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: 'You are not logged in.' });
    }

    jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};


// google auth

const GOOGLE_REDIRECT_URL =
    process.env.GOOGLE_REDIRECT_URL ||
    (process.env.SERVER_URL
        ? `${process.env.SERVER_URL}/auth/google/callback`
        : undefined);

if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REDIRECT_URL
) {
    console.error(
        "Google OAuth is not configured: check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URL"
    );
}

// A fresh client per request, so two people signing in at the same time never share credentials
const createOAuthClient = () =>
    new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URL
    );

app.get("/auth/google", (req, res) => {
    const oauth2Client = createOAuthClient();

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["profile", "email"],
        prompt: "consent",
    });

    return res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
    const { code, error: googleError } = req.query;

    if (googleError || !code) {
        return res.redirect(`${FRONTEND_URL}/login?error=google_auth_cancelled`);
    }

    const client = await pool.connect();

    try {
        const oauth2Client = createOAuthClient();

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const { data: profile } = await oauth2.userinfo.get();

        if (!profile.email) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_no_email`);
        }

        await client.query("BEGIN");

        const existing = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [profile.email]
        );

        let user;

        if (existing.rows.length === 0) {
            // First time here: create a customer account
            const randomPassword = crypto.randomBytes(32).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const inserted = await client.query(
                `INSERT INTO users (name, email, password, role, google_id, auth_provider, image_url)
                 VALUES ($1, $2, $3, 'customer', $4, 'google', $5)
                 RETURNING *`,
                [
                    profile.name || profile.email.split("@")[0],
                    profile.email,
                    hashedPassword,
                    profile.id,
                    profile.picture || null,
                ]
            );

            user = inserted.rows[0];
        } else {
            user = existing.rows[0];

            // Existing email/password account: link the Google ID
            if (!user.google_id) {
                const updated = await client.query(
                    `UPDATE users
                     SET google_id = $1,
                         image_url = COALESCE(image_url, $2)
                     WHERE id = $3
                     RETURNING *`,
                    [profile.id, profile.picture || null, user.id]
                );

                user = updated.rows[0];
            }
        }

        await client.query("COMMIT");

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWTSECRET,
            { expiresIn: "30m" }
        );

        res.cookie("token", token, {
            sameSite: isProduction ? "none" : "lax",
            httpOnly: true,
            secure: isProduction,
        });

        const redirectPath =
            (user.role || "").toLowerCase() === "admin" ? "/admin" : "/dashboard";

        return res.redirect(`${FRONTEND_URL}${redirectPath}`);
    } catch (err) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackErr) {
            console.error("ROLLBACK ERROR:", rollbackErr);
        }

        console.error("GOOGLE AUTH ERROR:", err);
        return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    } finally {
        client.release();
    }
});

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Please log in to continue'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'You are not authorized to perform this action'
        });
    }

    next();
};

app.get("/vehicles", async (req, res) => {
    try {
        const { category } = req.query;
        let vehicles;

        if (category) {
            vehicles = await pool.query(
                "SELECT * FROM vehicles WHERE category = $1",
                [category]
            );
        } else {
            vehicles = await pool.query("SELECT * FROM vehicles");
        }

        return res.status(200).json(vehicles.rows);
    } catch (err) {
        console.log("Internal server Error /vehicles:", err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ---------- NEW: shared overlap check, used by both /addBooking and this availability route ----------
const findOverlappingBookings = async (vehicleId, startDate, endDate, excludeBookingId = null) => {
    const params = [vehicleId, startDate, endDate];
    let query = `
        SELECT id, startdate, enddate FROM bookings
        WHERE vehicleid = $1
        AND status NOT IN ('cancelled')
        AND startdate <= $3
        AND enddate >= $2
    `;
    if (excludeBookingId) {
        params.push(excludeBookingId);
        query += ` AND id != $4`;
    }
    return pool.query(query, params);
};

// ---------- NEW: real date-conflict checking for the car details / checkout flow ----------
app.get("/vehicles/:id/availability", async (req, res) => {
    try {
        const { id } = req.params;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ message: 'start and end query params are required.' });
        }

        const conflicts = await findOverlappingBookings(id, start, end);

        return res.status(200).json({
            available: conflicts.rows.length === 0,
            conflictingBookings: conflicts.rows,
        });
    } catch (err) {
        console.log("Internal server Error /vehicles/:id/availability:", err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/session", verifyJWT, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT id, name, email, role, image_url
            FROM users
            WHERE id = $1
            `,
            [req.user.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            })
        }

        return res.status(200).json(result.rows[0])
    } catch (err) {
        console.error("GET /session error:", err)

        return res.status(500).json({
            message: "Internal server error.",
        })
    }
})

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileImageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "profiles",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
            {
                width: 500,
                height: 500,
                crop: "fill",
                gravity: "face",
                quality: "auto",
                fetch_format: "auto",
            },
        ],
    },
})

const profileImageUpload = multer({
    storage: profileImageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
}).single("profileImage")

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "products",
        allowed_formats: ["jpg", "jpeg", "png"],
    },
});

// "img1" stays the required cover image (used everywhere that only shows
// one photo — fleet grid, search results, wishlist, booking summaries).
// "images" is new: up to 4 additional gallery photos for the car details
// page, stored in the separate vehicle_images table (see migrations2.sql).
const upload = multer({ storage }).fields([
    { name: "img1", maxCount: 1 },
    { name: "images", maxCount: 4 },
]);

const saveVehicleGalleryImages = async (vehicleId, files, replaceExisting = false) => {
    if (replaceExisting) {
        await pool.query("DELETE FROM vehicle_images WHERE vehicleid = $1", [vehicleId]);
    }
    for (let i = 0; i < files.length; i++) {
        await pool.query(
            "INSERT INTO vehicle_images(vehicleid, img_url, position) VALUES ($1,$2,$3)",
            [vehicleId, files[i].path, i]
        );
    }
};

const createNotificatins = async (userId, message) => {
    await pool.query("INSERT into notifications (userId, message) values ($1,$2)", [userId, message])
}

// ---------- NEW: broadcast a notification to every admin account — used so
// the admin top bar's bell has something real to show (new bookings, new
// customer messages), not just an empty shell. ----------
const notifyAllAdmins = async (message) => {
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins.rows) {
        await createNotificatins(admin.id, message);
    }
};

app.post("/addVehicle", verifyJWT, upload, async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res
                .status(401)
                .json({ message: "You are not authorized to carry out this operation." });

        const img_url = req.files?.img1?.[0]?.path || "";

        const {
            name,
            category,
            description,
            brand,
            model,
            year,
            colour,
            dailyprice,
            isavailable,
        } = req.body;

        if (!name || !category || !dailyprice) {
            return res.status(400).json({ message: "Name, category and daily price are required." });
        }

        const parsedYear = year === undefined || year === "" ? null : parseInt(year, 10);
        const parsedPrice = parseFloat(dailyprice);

        if (year !== undefined && year !== "" && Number.isNaN(parsedYear)) {
            return res.status(400).json({ message: "Year must be a valid number." });
        }
        if (Number.isNaN(parsedPrice)) {
            return res.status(400).json({ message: "Daily price must be a valid number." });
        }

        const inserted = await pool.query(
            "INSERT INTO vehicles(name, category, description, brand, model, year, colour, dailyprice, isavailable, img_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
            [
                name,
                category,
                description,
                brand,
                model,
                parsedYear,
                colour,
                parsedPrice,
                isavailable,
                img_url,
            ]
        );

        const vehicleId = inserted.rows[0].id;

        // Cover image always sits at position 0 in the gallery too, so
        // GET /vehicle/:id's `images` array is a complete, ordered set.
        const galleryFiles = [
            ...(req.files?.img1 ?? []),
            ...(req.files?.images ?? []),
        ];
        if (galleryFiles.length > 0) {
            await saveVehicleGalleryImages(vehicleId, galleryFiles);
        }

        return res
            .status(200)
            .json({ message: "Vehicle added successfully!", id: vehicleId });
    } catch (err) {
        console.error("addVehicle error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ---------- NEW: edit an existing vehicle (Admin Vehicles page had no way to do this) ----------
app.patch("/admin/vehicle/:id", verifyJWT, requireAdmin, upload, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query("SELECT * FROM vehicles WHERE id = $1", [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: "Vehicle not found." });
        }
        const current = existing.rows[0];

        const {
            name,
            category,
            description,
            brand,
            model,
            year,
            colour,
            dailyprice,
            isavailable,
        } = req.body;

        // Keep the existing image unless a new one was uploaded.
        const img_url = req.files?.img1?.[0]?.path || current.img_url;

        const parsedYear = year === undefined || year === "" ? current.year : parseInt(year, 10);
        const parsedPrice = dailyprice === undefined || dailyprice === "" ? current.dailyprice : parseFloat(dailyprice);

        if (Number.isNaN(parsedYear) || Number.isNaN(parsedPrice)) {
            return res.status(400).json({ message: "Year and daily price must be valid numbers." });
        }

        await pool.query(
            `UPDATE vehicles
             SET name = $1, category = $2, description = $3, brand = $4, model = $5,
                 year = $6, colour = $7, dailyprice = $8, isavailable = $9, img_url = $10
             WHERE id = $11`,
            [
                name ?? current.name,
                category ?? current.category,
                description ?? current.description,
                brand ?? current.brand,
                model ?? current.model,
                parsedYear,
                colour ?? current.colour,
                parsedPrice,
                isavailable ?? current.isavailable,
                img_url,
                id,
            ]
        );

        // Only touch the gallery if new photos came in — an edit that just
        // changes the price shouldn't wipe out the existing photo set.
        const newGalleryFiles = [
            ...(req.files?.img1 ?? []),
            ...(req.files?.images ?? []),
        ];
        if (newGalleryFiles.length > 0) {
            await saveVehicleGalleryImages(id, newGalleryFiles, true);
        }

        return res.status(200).json({ message: "Vehicle updated successfully." });
    } catch (err) {
        console.error("PATCH /admin/vehicle/:id error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ---------- NEW: remove a vehicle ----------
app.delete("/admin/vehicle/:id", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query("DELETE FROM vehicles WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Vehicle not found." });
        }

        return res.status(200).json({ message: "Vehicle removed." });
    } catch (err) {
        // Bookings/reviews/wishlist rows reference this vehicle — surface a
        // clear message instead of a raw FK-violation error.
        if (err.code === '23503') {
            return res.status(409).json({
                message: "This vehicle has bookings, reviews, or wishlist entries and can't be deleted. Mark it unavailable instead."
            });
        }
        console.error("DELETE /admin/vehicle/:id error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/addBooking", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { vehicleId, startdate, enddate, totalprice, status } = req.body;

        if (!vehicleId || !startdate || !enddate) {
            return res.status(400).json({ message: 'vehicleId, startdate, and enddate are required.' });
        }

        // ---------- FIX: this vehicle could previously be double-booked ----------
        const conflicts = await findOverlappingBookings(vehicleId, startdate, enddate);
        if (conflicts.rows.length > 0) {
            return res.status(409).json({ message: 'This vehicle is already booked for part of the selected dates.' });
        }

        const result = await pool.query("INSERT INTO bookings(userid, vehicleid, startdate, enddate, totalprice, status) VALUES($1,$2,$3,$4,$5,$6) returning id", [userId, vehicleId, startdate, enddate, totalprice, status]);

        await createNotificatins(
            userId,
            `Your booking #${result.rows[0].id} has been confirmed`
        )

        const vehicleResult = await pool.query("SELECT name FROM vehicles WHERE id = $1", [vehicleId]);
        await notifyAllAdmins(
            `New booking #${result.rows[0].id} placed for ${vehicleResult.rows[0]?.name ?? 'a vehicle'}.`
        );

        return res.status(200).json({ message: 'Booking added successfully!', id: result.rows[0].id });
    } catch (err) {
        console.error("addBooking error:", err);
        return res.status(500).json({ message: 'Internal server error' })
    }
})

app.post("/paystack/initialize", verifyJWT, async (req, res) => {
    try {
        const { bookingId, saveCard } = req.body;
        if (!bookingId) {
            return res.status(400).json({ message: "bookingId is required." });
        }

        const bookingResult = await pool.query(
            "SELECT id, userid, totalprice, status FROM bookings WHERE id = $1",
            [bookingId]
        );
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = bookingResult.rows[0];
        if (booking.userid !== req.user.id) {
            return res.status(403).json({ message: "This booking does not belong to you." });
        }
        if (booking.status === "confirmed") {
            return res.status(400).json({ message: "This booking is already confirmed." });
        }

        const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: req.user.email,
                amount: Math.round(Number(booking.totalprice) * 100),
                currency: "NGN",
                callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/callback`,
                // `saveCard` round-trips through Paystack's metadata so
                // /paystack/verify — running after the redirect back from
                // Paystack, with no access to any client-side state — still
                // knows whether the customer opted in to saving this card.
                metadata: { bookingId: booking.id, userId: req.user.id, saveCard: !!saveCard },
            }),
        });
        const initData = await initRes.json();

        if (!initData.status) {
            return res.status(400).json({ message: initData.message || "Could not start payment." });
        }

        return res.status(200).json({
            authorization_url: initData.data.authorization_url,
            reference: initData.data.reference,
        });
    } catch (err) {
        console.error("paystack/initialize error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/paystack/verify/:reference", verifyJWT, async (req, res) => {
    try {
        const { reference } = req.params;

        const verifyRes = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
        );
        const verifyData = await verifyRes.json();

        if (!verifyData.status || verifyData.data?.status !== "success") {
            return res.status(400).json({ message: "Payment verification failed." });
        }

        const bookingId = verifyData.data.metadata?.bookingId;
        if (!bookingId) {
            return res.status(400).json({ message: "No booking is attached to this payment." });
        }

        const amountPaid = verifyData.data.amount / 100;

        const bookingResult = await pool.query(
            "SELECT id, userid, totalprice, status FROM bookings WHERE id = $1",
            [bookingId]
        );
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = bookingResult.rows[0];

        if (booking.userid !== req.user.id) {
            return res.status(403).json({ message: "This booking does not belong to you." });
        }
        if (booking.status === "confirmed") {
            return res.status(200).json({ message: "Booking already confirmed.", bookingId: booking.id });
        }
        if (Number(booking.totalprice) !== Number(amountPaid)) {
            return res.status(400).json({ message: "Amount paid does not match the booking total." });
        }

        await pool.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [bookingId]);
        await pool.query(
            `
    INSERT INTO transactions
        (
            userid,
            bookingid,
            amount,
            payment_method,
            status,
            transactiondate,
            provider_reference
        )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
            [
                req.user.id,
                bookingId,
                amountPaid,
                "paystack",
                "paid",
                new Date(),
                verifyData.data.reference,
            ]
        )
        await createNotificatins(req.user.id, `Your payment for booking #${bookingId} was successful.`);

        const auth = verifyData.data.authorization;
        if (verifyData.data.metadata?.saveCard && auth?.reusable && auth?.authorization_code) {
            await pool.query(
                `INSERT INTO saved_cards(userid, authorization_code, card_type, last4, exp_month, exp_year, bank)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)
                 ON CONFLICT (userid, authorization_code) DO NOTHING`,
                [req.user.id, auth.authorization_code, auth.card_type, auth.last4, auth.exp_month, auth.exp_year, auth.bank]
            );
        }

        return res
            .status(200)
            .json({ message: "Payment verified and booking confirmed.", bookingId: booking.id });
    } catch (err) {
        console.error("paystack/verify error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/addTransactions", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId, amount, paymentMethod, status } = req.body;
        await pool.query("INSERT INTO transactions(userid, bookingid, amount, payment_method, status, transactiondate) VALUES ($1,$2,$3,$4,$5,$6)", [userId, bookingId, amount, paymentMethod, status, new Date(Date.now())])
        return res.status(200).json({ message: 'Transaction added successfully!' });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' })
    }
})

// ---------- FIX: this used to be `SELECT * FROM bookings` with no vehicle info at
// all, so the customer dashboard had no name/image/category to render. Mirrors
// the join already used in /admin/bookings. ----------
app.get("/myBookings", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await pool.query(`
            SELECT b.*, v.name AS vehiclename, v.category AS vehiclecategory, v.img_url
            FROM bookings b
            JOIN vehicles v ON v.id = b.vehicleid
            WHERE b.userid = $1
            ORDER BY b.id DESC
        `, [userId])
        return res.status(200).json(bookings.rows)
    } catch (err) {
        console.error("myBookings error:", err);
        return res.status(500).json({ message: 'Internal server error' })
    }
})

// ---------- NEW: powers the stat cards on the customer dashboard ----------
app.get("/dashboard/stats", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        const tripsResult = await pool.query(
            "SELECT COUNT(*) FROM bookings WHERE userid = $1 AND status != 'cancelled'",
            [userId]
        );
        const activeResult = await pool.query(
            "SELECT COUNT(*) FROM bookings WHERE userid = $1 AND status IN ('confirmed', 'pending', 'rented')",
            [userId]
        );
        const spentResult = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE userid = $1 AND status = 'paid'",
            [userId]
        );

        const totalSpent = Number(spentResult.rows[0].total);

        // NOTE: loyalty points formula is a placeholder (10 points per $1
        // spent) until real business rules for the loyalty program exist.
        const loyaltyPoints = Math.round(totalSpent * 0.2);

        return res.status(200).json({
            totalTrips: Number(tripsResult.rows[0].count),
            activeBookings: Number(activeResult.rows[0].count),
            totalSpent,
            loyaltyPoints,
        });
    } catch (err) {
        console.error("dashboard/stats error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/reviews", verifyJWT, async (req, res) => {
    try {
        const userid = req.user.id;
        const { vehicleId, rating, comment } = req.body;

        const booking = await pool.query('SELECT 1 FROM bookings WHERE userId = $1 AND vehicleId = $2', [userid, vehicleId]);
        if (booking.rows.length === 0) return res.status(400).json({ message: 'You can only leave a review on a car you booked' });

        const existing = await pool.query('SELECT 1 FROM reviews WHERE userId = $1 AND vehicleId = $2', [userid, vehicleId]);

        if (existing.rows.length > 0) return res.status(400).json({ message: 'You have already left a review' });

        await pool.query('INSERT INTO reviews(userId, vehicleId, rating, comment) VALUES($1, $2, $3,$4)', [userid, vehicleId, rating, comment])

        return res.status(200).json({ message: "Review submitted successfully." })
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' })
    }
})

app.get("/vehicle/:id/reviews", async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await pool.query(`
            SELECT r.rating, r.comment, u.name
            FROM reviews r
            JOIN users u ON u.id = r.userId
            WHERE r.vehicleId = $1
        `, [id]);

        const avg = await pool.query("SELECT ROUND(AVG(rating), 1) as average FROM reviews WHERE vehicleId = $1", [id])

        return res.status(200).json({
            reviews: reviews.rows,
            averageReview: avg.rows[0].average
        })

    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

app.get("/vehicle/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleDetails = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);

        if (vehicleDetails.rows.length === 0) return res.status(400).json({ message: 'Vehicle not found' })

        const images = await pool.query(
            'SELECT img_url FROM vehicle_images WHERE vehicleid = $1 ORDER BY position ASC',
            [id]
        );

        return res.status(200).json({
            ...vehicleDetails.rows[0],
            // Falls back to the single cover image for vehicles added before
            // the gallery feature existed.
            images: images.rows.length > 0 ? images.rows.map((i) => i.img_url) : [vehicleDetails.rows[0].img_url],
        })
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

// ---------- FIX: this used to take a vehicleId as :id and update `bookings
// WHERE id = :id` — meaning it was cancelling whatever booking happened to
// share that same numeric id as the vehicle, not the customer's actual
// booking. Now :id is genuinely the booking's own primary key, and it's
// scoped to the logged-in user so you can't cancel someone else's booking. ----------
app.post("/booking/:id/cancel", verifyJWT, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const bookingId = Number(req.params.id);

        if (!Number.isInteger(bookingId)) {
            return res.status(400).json({
                message: "Invalid booking ID.",
            });
        }

        await client.query("BEGIN");

        const bookingResult = await client.query(
            `
            SELECT
                b.id,
                b.userid,
                b.status,
                b.startdate,
                b.totalprice
            FROM bookings b
            WHERE b.id = $1
              AND b.userid = $2
            FOR UPDATE
            `,
            [bookingId, userId]
        );

        if (bookingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        const booking = bookingResult.rows[0];

        if (booking.status === "cancelled") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Booking is already cancelled.",
            });
        }

        if (booking.status === "completed") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "You cannot cancel a completed booking.",
            });
        }

        if (booking.status === "rented") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "A rented booking cannot be cancelled online.",
            });
        }

        const startDate = new Date(booking.startdate);
        const hoursUntilStart =
            (startDate.getTime() - Date.now()) /
            (1000 * 60 * 60);

        const windowSetting = await client.query(
            `
            SELECT value
            FROM platform_settings
            WHERE key = 'cancellation_window_hours'
            `
        );

        const cancellationWindowHours =
            windowSetting.rows.length > 0
                ? Number(windowSetting.rows[0].value)
                : 24;

        if (
            !Number.isFinite(cancellationWindowHours) ||
            cancellationWindowHours < 0
        ) {
            await client.query("ROLLBACK");

            return res.status(500).json({
                message: "Invalid cancellation window configuration.",
            });
        }

        if (hoursUntilStart < cancellationWindowHours) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: `Cancellations must be made at least ${cancellationWindowHours} hours before the start date.`,
            });
        }

        const paymentResult = await client.query(
            `
            SELECT
                t.id,
                t.amount,
                t.payment_method,
                t.provider_reference
            FROM transactions t
            WHERE t.bookingid = $1
              AND t.userid = $2
              AND t.status = 'paid'
            ORDER BY t.transactiondate DESC
            LIMIT 1
            `,
            [bookingId, userId]
        );

        const payment = paymentResult.rows[0] ?? null;

        await client.query(
            `
            UPDATE bookings
            SET status = 'cancelled'
            WHERE id = $1
            `,
            [bookingId]
        );

        let refundRequest = null;

        if (payment) {
            const refundResult = await client.query(
                `
                INSERT INTO refund_requests
                    (
                        bookingid,
                        userid,
                        transactionid,
                        amount,
                        reason,
                        status,
                        refund_method
                    )
                VALUES ($1, $2, $3, $4, $5, 'pending', $6)
                ON CONFLICT (bookingid)
                DO UPDATE SET updated_at = NOW()
                RETURNING id, amount, status
                `,
                [
                    bookingId,
                    userId,
                    payment.id,
                    payment.amount,
                    "Customer cancelled within the permitted cancellation window.",
                    payment.payment_method,
                ]
            );

            refundRequest = refundResult.rows[0];
        }

        await client.query(
            `
            INSERT INTO notifications(userid, message)
            VALUES ($1, $2)
            `,
            [
                userId,
                payment
                    ? `Booking #${bookingId} was cancelled. Your refund request is pending review.`
                    : `Booking #${bookingId} was cancelled successfully.`,
            ]
        );

        await client.query("COMMIT");

        if (payment) {
            await notifyAllAdmins(
                `Refund request #${refundRequest.id} created for booking #${bookingId}.`
            );
        } else {
            await notifyAllAdmins(
                `Booking #${bookingId} was cancelled without a recorded payment.`
            );
        }

        return res.status(200).json({
            message: payment
                ? "Booking cancelled. Your refund request has been submitted for review."
                : "Booking cancelled successfully. No paid transaction was found.",
            refundRequested: Boolean(payment),
            refundRequestId: refundRequest?.id ?? null,
            refundStatus: refundRequest?.status ?? null,
            refundAmount: refundRequest
                ? Number(refundRequest.amount)
                : 0,
        });
    } catch (err) {
        await client.query("ROLLBACK");

        console.error("POST /booking/:id/cancel error:", err);

        return res.status(500).json({
            message: "Internal server error.",
        });
    } finally {
        client.release();
    }
});

app.get("/booking/:id/refund", verifyJWT, async (req, res) => {
    try {
        const bookingId = Number(req.params.id);

        const result = await pool.query(
            `
            SELECT
                rr.id,
                rr.bookingid,
                rr.amount,
                rr.reason,
                rr.status,
                rr.refund_method,
                rr.provider_reference,
                rr.admin_note,
                rr.requested_at,
                rr.reviewed_at,
                rr.completed_at
            FROM refund_requests rr
            WHERE rr.bookingid = $1
              AND rr.userid = $2
            `,
            [bookingId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(200).json(null);
        }

        const refund = result.rows[0];

        return res.status(200).json({
            ...refund,
            amount: Number(refund.amount),
        });
    } catch (err) {
        console.error("GET /booking/:id/refund error:", err);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
});

app.get("/notifications", verifyJWT, async (req, res) => {
    try {
        const userid = req.user.id;
        const notifications = await pool.query('SELECT * FROM notifications WHERE userId = $1 ORDER BY createdAt DESC', [userid])

        return res.status(200).json(notifications.rows)
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

// ---------- NEW: mark a notification as read. Requires an `isread` column —
// see migrations.sql. ----------
app.patch("/notifications/:id/read", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(
            "UPDATE notifications SET isread = true WHERE id = $1 AND userId = $2",
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        return res.status(200).json({ message: 'Notification marked as read.' });
    } catch (err) {
        console.error("notifications/:id/read error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// ---------- FIX: was `SELECT *`, which sends password hashes to the admin frontend ----------
app.get("/admin/users", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const users = await pool.query(
            "SELECT id, name, email, phone, role, createdAt FROM users ORDER BY createdAt DESC"
        );
        return res.status(200).json(users.rows)
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

// ---------- NEW: per-customer drill-down for the admin Customers page ----------
app.get("/admin/customers/:id", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const userResult = await pool.query(
            "SELECT id, name, email, phone, role, createdAt FROM users WHERE id = $1",
            [id]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        const bookingsResult = await pool.query(`
            SELECT b.*, v.name AS vehiclename, v.img_url
            FROM bookings b
            JOIN vehicles v ON v.id = b.vehicleid
            WHERE b.userid = $1
            ORDER BY b.id DESC
        `, [id]);

        const spentResult = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE userid = $1 AND status = 'paid'",
            [id]
        );

        return res.status(200).json({
            ...userResult.rows[0],
            bookings: bookingsResult.rows,
            totalSpent: Number(spentResult.rows[0].total),
        });
    } catch (err) {
        console.error("admin/customers/:id error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get("/admin/bookings", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const bookings = await pool.query(`
            SELECT b.*, u.name as username, v.name as vehiclename, v.img_url FROM bookings b
            JOIN users u ON u.id = b.userId
            JOIN vehicles v ON v.id = b.vehicleId
            ORDER BY b.id DESC
            `)

        return res.status(200).json(bookings.rows)
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

app.patch("/admin/booking/:id/status", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await pool.query("UPDATE bookings SET status = $1 WHERE id = $2", [status, id])

        return res.status(200).json({ message: 'Booking status updated successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

// ---------- NEW: powers the admin Payments page ----------
app.get("/admin/transactions", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const transactions = await pool.query(`
            SELECT t.*, u.name AS username, v.name AS vehiclename
            FROM transactions t
            JOIN users u ON u.id = t.userid
            JOIN bookings b ON b.id = t.bookingid
            JOIN vehicles v ON v.id = b.vehicleid
            ORDER BY t.transactiondate DESC
        `);
        return res.status(200).json(transactions.rows);
    } catch (err) {
        console.error("admin/transactions error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// ---------- NEW: powers the admin Reviews moderation page ----------
app.get("/admin/reviews", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const reviews = await pool.query(`
            SELECT r.id, r.rating, r.comment, u.name AS username, v.name AS vehiclename
            FROM reviews r
            JOIN users u ON u.id = r.userid
            JOIN vehicles v ON v.id = r.vehicleid
            ORDER BY r.id DESC
        `);
        return res.status(200).json(reviews.rows);
    } catch (err) {
        console.error("admin/reviews error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete("/admin/reviews/:id", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM reviews WHERE id = $1", [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Review not found.' });
        }
        return res.status(200).json({ message: 'Review removed.' });
    } catch (err) {
        console.error("admin/reviews delete error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get("/admin/analytics", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const revenueByMonthResult = await pool.query(`
            SELECT
                TO_CHAR(transactiondate, 'Mon YYYY') AS month,
                DATE_TRUNC('month', transactiondate) AS month_start,
                COALESCE(SUM(amount), 0) AS revenue
            FROM transactions
            WHERE status = 'paid'
            GROUP BY
                TO_CHAR(transactiondate, 'Mon YYYY'),
                DATE_TRUNC('month', transactiondate)
            ORDER BY month_start ASC
        `)

        const bookingsByMonthResult = await pool.query(`
            SELECT
                TO_CHAR(startdate, 'Mon YYYY') AS month,
                DATE_TRUNC('month', startdate) AS month_start,
                COUNT(*) AS bookings
            FROM bookings
            WHERE status != 'cancelled'
            GROUP BY
                TO_CHAR(startdate, 'Mon YYYY'),
                DATE_TRUNC('month', startdate)
            ORDER BY month_start ASC
        `)

        const bookingsByCategoryResult = await pool.query(`
            SELECT
                COALESCE(v.category, 'Uncategorized') AS category,
                COUNT(*) AS bookings
            FROM bookings b
            INNER JOIN vehicles v ON v.id = b.vehicleid
            WHERE b.status != 'cancelled'
            GROUP BY v.category
            ORDER BY bookings DESC
        `)

        const topVehiclesResult = await pool.query(`
            SELECT
                v.id,
                v.name,
                COUNT(DISTINCT b.id) AS bookings,
                COALESCE(SUM(
                    CASE
                        WHEN t.status = 'paid' THEN t.amount
                        ELSE 0
                    END
                ), 0) AS revenue
            FROM vehicles v
            INNER JOIN bookings b ON b.vehicleid = v.id
            LEFT JOIN transactions t ON t.bookingid = b.id
            WHERE b.status != 'cancelled'
            GROUP BY v.id, v.name
            ORDER BY revenue DESC
            LIMIT 5
        `)

        return res.status(200).json({
            revenueByMonth: revenueByMonthResult.rows.map((row) => ({
                month: row.month,
                month_start: row.month_start,
                revenue: Number(row.revenue),
            })),

            bookingsByMonth: bookingsByMonthResult.rows.map((row) => ({
                month: row.month,
                month_start: row.month_start,
                bookings: Number(row.bookings),
            })),

            bookingsByCategory: bookingsByCategoryResult.rows.map((row) => ({
                category: row.category,
                bookings: Number(row.bookings),
            })),

            topVehicles: topVehiclesResult.rows.map((row) => ({
                id: row.id,
                name: row.name,
                bookings: Number(row.bookings),
                revenue: Number(row.revenue),
            })),
        })
    } catch (err) {
        console.error("GET /admin/analytics error:", err)

        return res.status(500).json({
            message: "Internal Server Error",
        })
    }
})

app.post("/logout", verifyJWT, (req, res) => {
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({ message: 'You have been logged out successfully' })
})

app.post("/addWishlist/:id", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const checkList = await pool.query("SELECT 1 FROM wishlist WHERE userid = $1 AND vehicleid = $2", [userId, id]);

        if (checkList.rowCount < 1) await pool.query("INSERT INTO wishlist(userid, vehicleid) VALUES($1, $2)", [userId, id]);
        return res.status(200).json({ message: 'Vehicle added to wishlist' });
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

// ---------- FIX: the old query — `FROM Vehicles, v INNER JOIN Wishlist, w ...` —
// was invalid SQL (stray commas before the aliases) and would never have run;
// it also returned the raw pg result object instead of `.rows`. ----------
app.get("/wishlist", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id

        const wishlist = await pool.query(
            `
            SELECT v.*
            FROM vehicles v
            INNER JOIN wishlist w ON w.vehicleid = v.id
            WHERE w.userid = $1
            `,
            [userId]
        )

        return res.status(200).json(wishlist.rows)
    } catch (err) {
        console.error("wishlist error:", err)

        return res.status(500).json({
            message: "Internal Server Error",
        })
    }
})

app.delete("/wishlist/:id", verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params

        await pool.query(
            "DELETE FROM wishlist WHERE userid = $1 AND vehicleid = $2",
            [userId, id]
        )

        return res.status(200).json({
            message: "Vehicle removed from wishlist",
        })
    } catch (err) {
        console.error("wishlist delete error:", err)

        return res.status(500).json({
            message: "Internal Server Error",
        })
    }
})


app.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const checkUser = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
        if (checkUser.rows.length === 0) {
            return res.status(400).json({ message: 'No account found with this email.' });
        }

        const otp = crypto.randomInt(100000, 999999);
        await sendOtpEmail(email, otp, 'Password Reset Verification');
        await upsertOtp(email, otp);

        return res.status(200).json({ message: 'You can proceed to OTP verification.' });
    } catch (err) {
        console.error("forgot-password error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/verify-reset-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const checkOtp = await pool.query("SELECT otp, expiresat FROM otps WHERE email = $1", [email]);
        if (checkOtp.rows.length === 0) {
            return res.status(400).json({ message: 'OTP not found for this email.' });
        }

        const userOtp = checkOtp.rows[0];
        if (Date.now() > Number(userOtp.expiresat)) {
            return res.status(400).json({ message: 'This OTP has expired. Please request a new one.' });
        }
        if (String(otp) !== String(userOtp.otp)) {
            return res.status(400).json({ message: 'Incorrect OTP' });
        }

        await pool.query("DELETE FROM otps WHERE email = $1", [email]);

        // Short-lived token proving this email was just OTP-verified —
        // /reset-password requires it so the actual password change can't be
        // called on its own without having passed OTP first.
        const resetToken = jwt.sign({ email, purpose: 'password_reset' }, process.env.JWTSECRET, { expiresIn: '15m' });

        return res.status(200).json({ message: 'You can proceed to reset your password.', resetToken });
    } catch (err) {
        console.error("verify-reset-otp error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/reset-password", async (req, res) => {
    try {
        const { resetToken, password } = req.body;
        if (!resetToken || !password) {
            return res.status(400).json({ message: 'resetToken and password are required.' });
        }

        let payload;
        try {
            payload = jwt.verify(resetToken, process.env.JWTSECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired reset token. Please start over.' });
        }
        if (payload.purpose !== 'password_reset') {
            return res.status(401).json({ message: 'Invalid reset token.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, payload.email]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        return res.status(200).json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.error("reset-password error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.patch(
    "/profile",
    verifyJWT,
    profileImageUpload,
    async (req, res) => {
        try {
            const {
                name,
                phone,
                licenseNumber,
                address,
            } = req.body

            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Name is required.",
                })
            }

            const currentUserResult = await pool.query(
                "SELECT image_url FROM users WHERE id = $1",
                [req.user.id]
            )

            if (currentUserResult.rows.length === 0) {
                return res.status(404).json({
                    message: "User not found.",
                })
            }

            const currentImageUrl =
                currentUserResult.rows[0].image_url

            const imageUrl =
                req.file?.path || currentImageUrl || null

            await pool.query(
                `
                UPDATE users
                SET
                    name = $1,
                    phone = $2,
                    license_number = $3,
                    address = $4,
                    image_url = $5
                WHERE id = $6
                `,
                [
                    name.trim(),
                    phone?.trim() || null,
                    licenseNumber?.trim() || null,
                    address?.trim() || null,
                    imageUrl,
                    req.user.id,
                ]
            )

            return res.status(200).json({
                message: "Profile updated successfully.",
                image_url: imageUrl,
            })
        } catch (err) {
            console.error("PATCH /profile error:", err)

            return res.status(500).json({
                message: "Internal server error.",
            })
        }
    }
)

app.get("/profile", verifyJWT, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                license_number,
                address,
                image_url,
                role,
                email_notifications,
                sms_notifications,
                promo_notifications
            FROM users
            WHERE id = $1
            `,
            [req.user.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            })
        }

        return res.status(200).json(result.rows[0])
    } catch (err) {
        console.error("GET /profile error:", err)

        return res.status(500).json({
            message: "Internal server error.",
        })
    }
})

// ---------- NEW: Settings page's notification toggles now actually save ----------
app.patch("/notification-preferences", verifyJWT, async (req, res) => {
    try {
        const { emailNotifications, smsNotifications, promoNotifications } = req.body;

        await pool.query(
            `UPDATE users
             SET email_notifications = $1, sms_notifications = $2, promo_notifications = $3
             WHERE id = $4`,
            [!!emailNotifications, !!smsNotifications, !!promoNotifications, req.user.id]
        );

        return res.status(200).json({ message: 'Notification preferences updated.' });
    } catch (err) {
        console.error("PATCH /notification-preferences error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.patch("/account/password", verifyJWT, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required.' });
        }

        const userResult = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
        if (!valid) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error("PATCH /account/password error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


app.post("/contact", async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required.' });
        }

        await pool.query(
            "INSERT INTO contact_requests(name, email, phone, subject, message, createdat) VALUES ($1,$2,$3,$4,$5,$6)",
            [name, email, phone || null, subject || null, message, new Date()]
        );

        return res.status(200).json({ message: 'Message sent successfully.' });
    } catch (err) {
        console.error("contact error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/admin/contact-requests", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone, subject, message, createdat
             FROM contact_requests
             ORDER BY createdat DESC`
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET /admin/contact-requests error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

const SETTINGS_KEYS = ["business_name", "support_email", "cancellation_window_hours"];

app.get("/admin/settings", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query("SELECT key, value FROM platform_settings");
        const settings = Object.fromEntries(result.rows.map((r) => [r.key, r.value]));

        return res.status(200).json({
            business_name: settings.business_name ?? "DRIVEluxury Operations Inc.",
            support_email: settings.support_email ?? "concierge@driveluxury.com",
            cancellation_window_hours: settings.cancellation_window_hours ?? "24",
        });
    } catch (err) {
        console.error("GET /admin/settings error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.patch("/admin/settings", verifyJWT, requireAdmin, async (req, res) => {
    try {
        for (const key of SETTINGS_KEYS) {
            if (req.body[key] === undefined) continue;

            await pool.query(
                `INSERT INTO platform_settings(key, value, updated_by, updated_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
                [key, String(req.body[key]), req.user.id]
            );
        }
        return res.status(200).json({ message: 'Settings updated.' });
    } catch (err) {
        console.error("PATCH /admin/settings error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ==================================================================== //
// NEW: loyalty tiers (admin-configurable). NOTE: the actual tier a
// customer sits in isn't computed/assigned anywhere yet — /dashboard/stats
// only returns raw loyaltyPoints. Wiring loyaltyPoints against these
// thresholds to show a real tier badge is a small follow-up once you want it.
// ==================================================================== //

app.get("/admin/loyalty-tiers", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, threshold, perk FROM loyalty_tiers ORDER BY threshold ASC");
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET /admin/loyalty-tiers error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.patch("/admin/loyalty-tiers", verifyJWT, requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { tiers } = req.body;
        if (!Array.isArray(tiers)) {
            return res.status(400).json({ message: 'tiers must be an array.' });
        }

        await client.query("BEGIN");
        for (const tier of tiers) {
            await client.query(
                "UPDATE loyalty_tiers SET name = $1, threshold = $2, perk = $3 WHERE id = $4",
                [tier.name, tier.threshold, tier.perk, tier.id]
            );
        }
        await client.query("COMMIT");

        return res.status(200).json({ message: 'Loyalty tiers updated.' });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PATCH /admin/loyalty-tiers error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// ==================================================================== //
// NEW: admin account management.
// ==================================================================== //

app.post("/admin/admins", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }

        const existing = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const inserted = await pool.query(
            "INSERT INTO users(name, email, password, role, createdAt) VALUES ($1,$2,$3,'admin',$4) RETURNING id",
            [name, email, hashedPassword, new Date()]
        );

        return res.status(201).json({ message: 'Admin account created.', id: inserted.rows[0].id });
    } catch (err) {
        console.error("POST /admin/admins error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete("/admin/users/:id", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const targetId = Number(req.params.id);
        if (targetId === req.user.id) {
            return res.status(400).json({ message: "You can't remove your own account." });
        }

        const result = await pool.query("DELETE FROM users WHERE id = $1", [targetId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ message: 'Account removed.' });
    } catch (err) {
        // A user with bookings/reviews/etc. attached will hit this rather
        // than silently orphaning their history.
        if (err.code === '23503') {
            return res.status(409).json({
                message: 'This account has bookings or other records attached and cannot be deleted.'
            });
        }
        console.error("DELETE /admin/users/:id error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ==================================================================== //
// NEW: real numbers for the AdminDashboard widgets that were still mock
// (New Customers, Fleet Utilization, Customer Insights, top-earning
// vehicles with per-vehicle utilization).
//
// "Utilization" here = booked vehicle-days / possible vehicle-days over a
// rolling 30-day window. This is a reasonable, commonly-used definition,
// but it's a choice — adjust the window or formula if your business
// defines it differently.
// ==================================================================== //

app.get("/admin/dashboard/stats", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const WINDOW_DAYS = 30;
        const windowStart = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

        const newCustomersResult = await pool.query(
            "SELECT COUNT(*) FROM users WHERE role = 'customer' AND createdAt >= $1",
            [windowStart]
        );

        const fleetSizeResult = await pool.query("SELECT COUNT(*) FROM vehicles");
        const fleetSize = Number(fleetSizeResult.rows[0].count);

        // Sum of (days overlapping the window) across all non-cancelled bookings.
        const bookedDaysResult = await pool.query(
            `SELECT COALESCE(SUM(
                LEAST(enddate, CURRENT_DATE) - GREATEST(startdate, $1::date) + 1
             ), 0) AS booked_days
             FROM bookings
             WHERE status != 'cancelled'
             AND enddate >= $1::date
             AND startdate <= CURRENT_DATE`,
            [windowStart]
        );
        const bookedDays = Number(bookedDaysResult.rows[0].booked_days);
        const possibleDays = fleetSize * WINDOW_DAYS;
        const fleetUtilization = possibleDays > 0 ? Math.round((bookedDays / possibleDays) * 100) : 0;

        const topCustomersResult = await pool.query(
            `SELECT u.id, u.name, COUNT(DISTINCT b.id) AS bookings, COALESCE(SUM(t.amount), 0) AS spent
             FROM users u
             LEFT JOIN bookings b ON b.userid = u.id AND b.status != 'cancelled'
             LEFT JOIN transactions t ON t.userid = u.id AND t.status = 'paid'
             WHERE u.role = 'customer'
             GROUP BY u.id, u.name
             ORDER BY spent DESC
             LIMIT 3`
        );

        const topVehiclesResult = await pool.query(
            `SELECT v.id, v.name, v.img_url, v.dailyprice,
                    COALESCE(SUM(
                        CASE WHEN b.status != 'cancelled' AND b.enddate >= $1::date AND b.startdate <= CURRENT_DATE
                        THEN LEAST(b.enddate, CURRENT_DATE) - GREATEST(b.startdate, $1::date) + 1
                        ELSE 0 END
                    ), 0) AS booked_days
             FROM vehicles v
             LEFT JOIN bookings b ON b.vehicleid = v.id
             GROUP BY v.id, v.name, v.img_url, v.dailyprice
             ORDER BY booked_days DESC
             LIMIT 3`,
            [windowStart]
        );

        return res.status(200).json({
            newCustomers: Number(newCustomersResult.rows[0].count),
            fleetUtilization,
            topCustomers: topCustomersResult.rows.map((c) => ({
                id: c.id,
                name: c.name,
                bookings: Number(c.bookings),
                spent: Number(c.spent),
            })),
            topVehicles: topVehiclesResult.rows.map((v) => ({
                id: v.id,
                name: v.name,
                image: v.img_url,
                dailyRate: Number(v.dailyprice),
                utilization: Math.round((Number(v.booked_days) / WINDOW_DAYS) * 100),
            })),
        });
    } catch (err) {
        console.error("GET /admin/dashboard/stats error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ==================================================================== //
// NEW: concierge messaging. One thread per conversation; messages are
// tagged by sender_role so the same table serves both sides.
// ==================================================================== //

// ---------- Customer: list my threads, most recently active first ----------
app.get("/messages", verifyJWT, async (req, res) => {
    try {
        const threads = await pool.query(`
            SELECT mt.id, mt.subject, mt.updatedat,
                   (SELECT body FROM messages WHERE threadid = mt.id ORDER BY createdat DESC LIMIT 1) AS last_message,
                   (SELECT COUNT(*) FROM messages WHERE threadid = mt.id AND sender_role = 'admin' AND isread = false) AS unread_count
            FROM message_threads mt
            WHERE mt.userid = $1
            ORDER BY mt.updatedat DESC
        `, [req.user.id]);

        return res.status(200).json(threads.rows);
    } catch (err) {
        console.error("GET /messages error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ---------- Customer: start a new thread ----------
app.post("/messages", verifyJWT, async (req, res) => {
    const client = await pool.connect();
    try {
        const { subject, body } = req.body;
        if (!subject || !body) {
            return res.status(400).json({ message: 'subject and body are required.' });
        }

        await client.query("BEGIN");
        const thread = await client.query(
            "INSERT INTO message_threads(userid, subject) VALUES ($1,$2) RETURNING id",
            [req.user.id, subject]
        );
        await client.query(
            "INSERT INTO messages(threadid, sender_id, sender_role, body) VALUES ($1,$2,'customer',$3)",
            [thread.rows[0].id, req.user.id, body]
        );
        await client.query("COMMIT");

        await notifyAllAdmins(`New message from ${req.user.name}: "${subject}"`);

        return res.status(201).json({ message: 'Message sent.', threadId: thread.rows[0].id });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("POST /messages error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// ---------- Customer: view a thread + mark admin replies as read ----------
app.get("/messages/:threadId", verifyJWT, async (req, res) => {
    try {
        const thread = await pool.query(
            "SELECT id, subject FROM message_threads WHERE id = $1 AND userid = $2",
            [req.params.threadId, req.user.id]
        );
        if (thread.rows.length === 0) {
            return res.status(404).json({ message: 'Thread not found.' });
        }

        const messages = await pool.query(
            "SELECT id, sender_role, body, createdat FROM messages WHERE threadid = $1 ORDER BY createdat ASC",
            [req.params.threadId]
        );

        await pool.query(
            "UPDATE messages SET isread = true WHERE threadid = $1 AND sender_role = 'admin' AND isread = false",
            [req.params.threadId]
        );

        return res.status(200).json({ ...thread.rows[0], messages: messages.rows });
    } catch (err) {
        console.error("GET /messages/:threadId error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ---------- Customer: reply in an existing thread ----------
app.post("/messages/:threadId", verifyJWT, async (req, res) => {
    const client = await pool.connect();
    try {
        const { body } = req.body;
        if (!body) return res.status(400).json({ message: 'body is required.' });

        const thread = await client.query(
            "SELECT id FROM message_threads WHERE id = $1 AND userid = $2",
            [req.params.threadId, req.user.id]
        );
        if (thread.rows.length === 0) {
            return res.status(404).json({ message: 'Thread not found.' });
        }

        await client.query("BEGIN");
        await client.query(
            "INSERT INTO messages(threadid, sender_id, sender_role, body) VALUES ($1,$2,'customer',$3)",
            [req.params.threadId, req.user.id, body]
        );
        await client.query("UPDATE message_threads SET updatedat = NOW() WHERE id = $1", [req.params.threadId]);
        await client.query("COMMIT");

        await notifyAllAdmins(`New reply from ${req.user.name} in thread #${req.params.threadId}.`);

        return res.status(201).json({ message: 'Reply sent.' });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("POST /messages/:threadId error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// ---------- Admin: list every thread, across all customers ----------
app.get("/admin/messages", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const threads = await pool.query(`
            SELECT mt.id, mt.subject, mt.updatedat, u.name AS customer_name,
                   (SELECT body FROM messages WHERE threadid = mt.id ORDER BY createdat DESC LIMIT 1) AS last_message,
                   (SELECT COUNT(*) FROM messages WHERE threadid = mt.id AND sender_role = 'customer' AND isread = false) AS unread_count
            FROM message_threads mt
            JOIN users u ON u.id = mt.userid
            ORDER BY mt.updatedat DESC
        `);
        return res.status(200).json(threads.rows);
    } catch (err) {
        console.error("GET /admin/messages error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ---------- Admin: view a thread + mark customer messages as read ----------
app.get("/admin/messages/:threadId", verifyJWT, requireAdmin, async (req, res) => {
    try {
        const thread = await pool.query(
            "SELECT mt.id, mt.subject, u.name AS customer_name FROM message_threads mt JOIN users u ON u.id = mt.userid WHERE mt.id = $1",
            [req.params.threadId]
        );
        if (thread.rows.length === 0) {
            return res.status(404).json({ message: 'Thread not found.' });
        }

        const messages = await pool.query(
            "SELECT id, sender_role, body, createdat FROM messages WHERE threadid = $1 ORDER BY createdat ASC",
            [req.params.threadId]
        );

        await pool.query(
            "UPDATE messages SET isread = true WHERE threadid = $1 AND sender_role = 'customer' AND isread = false",
            [req.params.threadId]
        );

        return res.status(200).json({ ...thread.rows[0], messages: messages.rows });
    } catch (err) {
        console.error("GET /admin/messages/:threadId error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// ---------- Admin: reply in a thread ----------
app.post("/admin/messages/:threadId", verifyJWT, requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { body } = req.body;
        if (!body) return res.status(400).json({ message: 'body is required.' });

        const thread = await client.query("SELECT id, userid, subject FROM message_threads WHERE id = $1", [req.params.threadId]);
        if (thread.rows.length === 0) {
            return res.status(404).json({ message: 'Thread not found.' });
        }

        await client.query("BEGIN");
        await client.query(
            "INSERT INTO messages(threadid, sender_id, sender_role, body) VALUES ($1,$2,'admin',$3)",
            [req.params.threadId, req.user.id, body]
        );
        await client.query("UPDATE message_threads SET updatedat = NOW() WHERE id = $1", [req.params.threadId]);
        await client.query("COMMIT");

        await createNotificatins(thread.rows[0].userid, `Your concierge has replied to "${thread.rows[0].subject}".`);

        return res.status(201).json({ message: 'Reply sent.' });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("POST /admin/messages/:threadId error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// ==================================================================== //
// NEW: saved payment methods, backed by Paystack reusable authorizations
// (see saved_cards table and the /paystack/verify change above).
// ==================================================================== //

app.get("/payment-methods", verifyJWT, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, card_type, last4, exp_month, exp_year, bank, is_default FROM saved_cards WHERE userid = $1 ORDER BY is_default DESC, createdat DESC",
            [req.user.id]
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET /payment-methods error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete("/payment-methods/:id", verifyJWT, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM saved_cards WHERE id = $1 AND userid = $2",
            [req.params.id, req.user.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        return res.status(200).json({ message: 'Card removed.' });
    } catch (err) {
        console.error("DELETE /payment-methods/:id error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.patch("/payment-methods/:id/default", verifyJWT, async (req, res) => {
    const client = await pool.connect();
    try {
        const owned = await client.query(
            "SELECT id FROM saved_cards WHERE id = $1 AND userid = $2",
            [req.params.id, req.user.id]
        );
        if (owned.rows.length === 0) {
            return res.status(404).json({ message: 'Card not found.' });
        }

        await client.query("BEGIN");
        await client.query("UPDATE saved_cards SET is_default = false WHERE userid = $1", [req.user.id]);
        await client.query("UPDATE saved_cards SET is_default = true WHERE id = $1", [req.params.id]);
        await client.query("COMMIT");

        return res.status(200).json({ message: 'Default card updated.' });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PATCH /payment-methods/:id/default error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// ---------- NEW: pay for a booking with an already-saved card — no
// redirect to Paystack needed, since we already hold a reusable
// authorization_code for it. ----------
app.post("/paystack/charge-saved", verifyJWT, async (req, res) => {
    try {
        const { bookingId, savedCardId } = req.body;
        if (!bookingId || !savedCardId) {
            return res.status(400).json({ message: 'bookingId and savedCardId are required.' });
        }

        const bookingResult = await pool.query(
            "SELECT id, userid, totalprice, status FROM bookings WHERE id = $1",
            [bookingId]
        );
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        const booking = bookingResult.rows[0];
        if (booking.userid !== req.user.id) {
            return res.status(403).json({ message: 'This booking does not belong to you.' });
        }
        if (booking.status === 'confirmed') {
            return res.status(400).json({ message: 'This booking is already confirmed.' });
        }

        const cardResult = await pool.query(
            "SELECT authorization_code FROM saved_cards WHERE id = $1 AND userid = $2",
            [savedCardId, req.user.id]
        );
        if (cardResult.rows.length === 0) {
            return res.status(404).json({ message: 'Saved card not found.' });
        }

        const chargeRes = await fetch("https://api.paystack.co/transaction/charge_authorization", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: req.user.email,
                amount: Math.round(Number(booking.totalprice) * 100),
                authorization_code: cardResult.rows[0].authorization_code,
            }),
        });
        const chargeData = await chargeRes.json();

        if (!chargeData.status || chargeData.data?.status !== "success") {
            return res.status(400).json({ message: chargeData.message || "Charge failed. Try a different card." });
        }

        await pool.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [bookingId]);
        await pool.query(
            `
    INSERT INTO transactions
        (
            userid,
            bookingid,
            amount,
            payment_method,
            status,
            transactiondate,
            provider_reference
        )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
            [
                req.user.id,
                bookingId,
                booking.totalprice,
                "paystack (saved card)",
                "paid",
                new Date(),
                chargeData.data.reference,
            ]
        )
        await createNotificatins(req.user.id, `Your payment for booking #${bookingId} was successful.`);

        return res.status(200).json({
            message: "Payment successful and booking confirmed.",
            bookingId: booking.id,
            reference: chargeData.data.reference,
        });
    } catch (err) {
        console.error("paystack/charge-saved error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ---------- NEW: public endpoint for the landing page's testimonials
// section — top-rated reviews across the whole fleet, not tied to one
// vehicle (unlike /vehicle/:id/reviews). ----------
app.get("/reviews/featured", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.rating, r.comment, u.name AS username, v.name AS vehiclename
            FROM reviews r
            JOIN users u ON u.id = r.userid
            JOIN vehicles v ON v.id = r.vehicleid
            WHERE r.rating >= 4 AND r.comment IS NOT NULL
            ORDER BY r.rating DESC, r.id DESC
            LIMIT 3
        `);
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET /reviews/featured error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/booking/:id", verifyJWT, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                b.id,
                b.vehicleid,
                b.startdate,
                b.enddate,
                b.totalprice,
                b.status,

                v.name AS vehiclename,
                v.category AS vehiclecategory,
                v.img_url,
                v.brand,
                v.model,
                v.year,
                v.colour,
                v.dailyprice,

                rr.id AS refund_id,
                rr.amount AS refund_amount,
                rr.reason AS refund_reason,
                rr.status AS refund_status,
                rr.refund_method,
                rr.provider_reference,
                rr.admin_note,
                rr.requested_at,
                rr.reviewed_at,
                rr.completed_at,
                rr.account_name,
                rr.bank_name,
                rr.account_number_last4,
                rr.details_submitted_at

            FROM bookings b
            JOIN vehicles v
                ON v.id = b.vehicleid
            LEFT JOIN refund_requests rr
                ON rr.bookingid = b.id
            WHERE b.id = $1
              AND b.userid = $2
            `,
            [req.params.id, req.user.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Booking not found.",
            })
        }

        const row = result.rows[0]

        return res.status(200).json({
            id: row.id,
            vehicleid: row.vehicleid,
            startdate: row.startdate,
            enddate: row.enddate,
            totalprice: Number(row.totalprice),
            status: row.status,

            vehiclename: row.vehiclename,
            vehiclecategory: row.vehiclecategory,
            img_url: row.img_url,
            brand: row.brand,
            model: row.model,
            year: row.year,
            colour: row.colour,
            dailyprice: Number(row.dailyprice),

            refund: row.refund_id
                ? {
                    id: row.refund_id,
                    amount: Number(
                        row.refund_amount
                    ),
                    reason: row.refund_reason,
                    status: row.refund_status,
                    refund_method:
                        row.refund_method,
                    provider_reference:
                        row.provider_reference,
                    admin_note: row.admin_note,
                    requested_at:
                        row.requested_at,
                    reviewed_at:
                        row.reviewed_at,
                    completed_at:
                        row.completed_at,
                    account_name:
                        row.account_name,
                    bank_name: row.bank_name,
                    account_number_last4:
                        row.account_number_last4,
                    details_submitted_at:
                        row.details_submitted_at,
                }
                : null,
        })
    } catch (err) {
        console.error("GET /booking/:id error:", err)

        return res.status(500).json({
            message: "Internal server error.",
        })
    }
})

app.get("/settings/cancellation-window", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT value FROM platform_settings WHERE key = 'cancellation_window_hours'"
        );
        const hours = result.rows[0] ? Number(result.rows[0].value) : 24;
        return res.status(200).json({ hours });
    } catch (err) {
        console.error("GET /settings/cancellation-window error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get(
    "/admin/refunds",
    verifyJWT,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await pool.query(
                `
                SELECT
                    rr.id,
                    rr.bookingid,
                    rr.userid,
                    rr.transactionid,
                    rr.amount,
                    rr.reason,
                    rr.status,
                    rr.refund_method,
                    rr.provider_reference AS refund_provider_reference,
                    rr.admin_note,
                    rr.failure_reason,
                    rr.requested_at,
                    rr.reviewed_at,
                    rr.completed_at,

                    rr.account_name,
                    rr.bank_name,
                    rr.account_number_encrypted,
                    rr.account_number_last4,
                    rr.details_submitted_at,

                    t.provider_reference AS payment_provider_reference,

                    u.name AS customer_name,
                    u.email AS customer_email,
                    u.phone AS customer_phone,

                    v.name AS vehicle_name,

                    b.status AS booking_status,
                    b.startdate,
                    b.enddate

                FROM refund_requests rr
                JOIN users u
                    ON u.id = rr.userid
                JOIN bookings b
                    ON b.id = rr.bookingid
                JOIN vehicles v
                    ON v.id = b.vehicleid
                LEFT JOIN transactions t
                    ON t.id = rr.transactionid
                ORDER BY
                    CASE
                        WHEN rr.status = 'pending'
                            THEN 0
                        WHEN rr.status = 'approved'
                            THEN 1
                        ELSE 2
                    END,
                    rr.requested_at DESC
                `
            )

            const encryptionKey =
                process.env.REFUND_ACCOUNT_ENCRYPTION_KEY

            if (!encryptionKey) {
                return res.status(500).json({
                    message:
                        "Refund account encryption is not configured.",
                })
            }

            const refunds = result.rows.map((row) => ({
                ...row,
                amount: Number(row.amount),
                account_number: row.account_number_encrypted
                    ? decryptRefundAccountNumber(
                        row.account_number_encrypted,
                        encryptionKey
                    )
                    : null,
                account_number_encrypted: undefined,
            }))

            return res.status(200).json(refunds)
        } catch (err) {
            console.error(
                "GET /admin/refunds error:",
                err
            )

            return res.status(500).json({
                message: "Internal server error.",
            })
        }
    }
)

app.get(
    "/admin/refunds/:id",
    verifyJWT,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await pool.query(
                `
                SELECT
                    rr.*,
                    u.name AS customer_name,
                    u.email AS customer_email,
                    u.phone AS customer_phone,
                    b.startdate,
                    b.enddate,
                    b.totalprice,
                    b.status AS booking_status,
                    v.name AS vehicle_name,
                    t.payment_method,
                    t.provider_reference
                FROM refund_requests rr
                JOIN users u
                    ON u.id = rr.userid
                JOIN bookings b
                    ON b.id = rr.bookingid
                JOIN vehicles v
                    ON v.id = b.vehicleid
                LEFT JOIN transactions t
                    ON t.id = rr.transactionid
                WHERE rr.id = $1
                `,
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Refund request not found.",
                });
            }

            return res.status(200).json({
                ...result.rows[0],
                amount: Number(result.rows[0].amount),
            });
        } catch (err) {
            console.error("GET /admin/refunds/:id error:", err);

            return res.status(500).json({
                message: "Internal server error.",
            });
        }
    }
);

app.patch(
    "/admin/refunds/:id/reject",
    verifyJWT,
    requireAdmin,
    async (req, res) => {
        const client = await pool.connect()

        try {
            const refundId = Number(req.params.id)
            const { adminNote } = req.body

            if (!Number.isInteger(refundId)) {
                return res.status(400).json({
                    message: "Invalid refund ID.",
                })
            }

            if (
                typeof adminNote !== "string" ||
                !adminNote.trim()
            ) {
                return res.status(400).json({
                    message:
                        "A rejection reason is required.",
                })
            }

            await client.query("BEGIN")

            const result = await client.query(
                `
                UPDATE refund_requests
                SET
                    status = 'rejected',
                    refund_method = 'manual',
                    admin_note = $1,
                    reviewed_at = NOW(),
                    updated_at = NOW()
                WHERE id = $2
                  AND status = 'pending'
                RETURNING id, userid, bookingid
                `,
                [adminNote.trim(), refundId]
            )

            if (result.rows.length === 0) {
                await client.query("ROLLBACK")

                return res.status(400).json({
                    message:
                        "This refund is no longer pending.",
                })
            }

            const refund = result.rows[0]

            await client.query(
                `
                INSERT INTO notifications(userid, message)
                VALUES ($1, $2)
                `,
                [
                    refund.userid,
                    `Your refund request for booking #${refund.bookingid} was rejected.`,
                ]
            )

            await client.query("COMMIT")

            return res.status(200).json({
                message: "Refund request rejected.",
            })
        } catch (err) {
            await client.query("ROLLBACK")

            console.error(
                "PATCH /admin/refunds/:id/reject error:",
                err
            )

            return res.status(500).json({
                message: "Internal server error.",
            })
        } finally {
            client.release()
        }
    }
)

app.patch(
    "/admin/refunds/:id/approve",
    verifyJWT,
    requireAdmin,
    async (req, res) => {
        const client = await pool.connect()

        try {
            const refundId = Number(req.params.id)

            if (!Number.isInteger(refundId)) {
                return res.status(400).json({
                    message: "Invalid refund ID.",
                })
            }

            await client.query("BEGIN")

            const result = await client.query(
                `
                UPDATE refund_requests
                SET
                    status = 'approved',
                    refund_method = 'manual',
                    reviewed_at = NOW(),
                    updated_at = NOW()
                WHERE id = $1
                  AND status = 'pending'
                RETURNING id, userid, bookingid, amount
                `,
                [refundId]
            )

            if (result.rows.length === 0) {
                await client.query("ROLLBACK")

                return res.status(400).json({
                    message:
                        "This refund is no longer pending.",
                })
            }

            const refund = result.rows[0]

            await client.query(
                `
                INSERT INTO notifications(userid, message)
                VALUES ($1, $2)
                `,
                [
                    refund.userid,
                    `Your refund request for booking #${refund.bookingid} has been approved and is awaiting manual processing.`,
                ]
            )

            await client.query("COMMIT")

            return res.status(200).json({
                message:
                    "Refund approved. Send the money manually, then record the transfer reference.",
                refundId: refund.id,
                amount: Number(refund.amount),
            })
        } catch (err) {
            await client.query("ROLLBACK")

            console.error(
                "PATCH /admin/refunds/:id/approve error:",
                err
            )

            return res.status(500).json({
                message: "Internal server error.",
            })
        } finally {
            client.release()
        }
    }
)

app.patch(
    "/admin/refunds/:id/complete",
    verifyJWT,
    requireAdmin,
    async (req, res) => {
        const client = await pool.connect()

        try {
            const refundId = Number(req.params.id)
            const {
                providerReference,
                adminNote,
            } = req.body

            if (!Number.isInteger(refundId)) {
                return res.status(400).json({
                    message: "Invalid refund ID.",
                })
            }

            if (
                typeof providerReference !== "string" ||
                !providerReference.trim()
            ) {
                return res.status(400).json({
                    message:
                        "Manual transfer reference is required.",
                })
            }

            await client.query("BEGIN")

            const refundResult = await client.query(
                `
                SELECT
                    rr.id,
                    rr.userid,
                    rr.bookingid,
                    rr.transactionid,
                    rr.amount,
                    rr.status
                FROM refund_requests rr
                WHERE rr.id = $1
                FOR UPDATE
                `,
                [refundId]
            )

            if (refundResult.rows.length === 0) {
                await client.query("ROLLBACK")

                return res.status(404).json({
                    message:
                        "Refund request not found.",
                })
            }

            const refund = refundResult.rows[0]

            if (refund.status !== "approved") {
                await client.query("ROLLBACK")

                return res.status(400).json({
                    message:
                        "Only an approved refund can be completed.",
                })
            }

            const duplicateReference =
                await client.query(
                    `
                    SELECT id
                    FROM refund_requests
                    WHERE provider_reference = $1
                      AND id <> $2
                    `,
                    [
                        providerReference.trim(),
                        refundId,
                    ]
                )

            if (duplicateReference.rows.length > 0) {
                await client.query("ROLLBACK")

                return res.status(409).json({
                    message:
                        "This transfer reference has already been used.",
                })
            }

            await client.query(
                `
                UPDATE refund_requests
                SET
                    status = 'completed',
                    refund_method = 'manual',
                    provider_reference = $1,
                    admin_note = $2,
                    processed_at = NOW(),
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE id = $3
                `,
                [
                    providerReference.trim(),
                    typeof adminNote === "string" &&
                        adminNote.trim()
                        ? adminNote.trim()
                        : null,
                    refundId,
                ]
            )

            if (refund.transactionid) {
                await client.query(
                    `
                    UPDATE transactions
                    SET status = 'refunded'
                    WHERE id = $1
                      AND status = 'paid'
                    `,
                    [refund.transactionid]
                )
            }

            await client.query(
                `
                INSERT INTO notifications(userid, message)
                VALUES ($1, $2)
                `,
                [
                    refund.userid,
                    `Your refund of ${Number(refund.amount).toFixed(2)} for booking #${refund.bookingid} has been completed.`,
                ]
            )

            await client.query("COMMIT")

            return res.status(200).json({
                message:
                    "Manual refund completed and records updated.",
                refundId: refund.id,
                transactionStatus: "refunded",
            })
        } catch (err) {
            await client.query("ROLLBACK")

            console.error(
                "PATCH /admin/refunds/:id/complete error:",
                err
            )

            return res.status(500).json({
                message: "Internal server error.",
            })
        } finally {
            client.release()
        }
    }
)

app.patch(
    "/admin/refunds/:id/fail",
    verifyJWT,
    requireAdmin,
    async (req, res) => {
        try {
            const { adminNote } = req.body;

            const result = await pool.query(
                `
                UPDATE refund_requests
                SET
                    status = 'failed',
                    admin_note = $1,
                    updated_at = NOW()
                WHERE id = $2
                  AND status IN ('approved', 'processing')
                RETURNING id, userid, bookingid
                `,
                [
                    adminNote || null,
                    req.params.id,
                ]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({
                    message: "Refund is not in a processable state.",
                });
            }

            await createNotificatins(
                result.rows[0].userid,
                `Your refund for booking #${result.rows[0].bookingid} could not be completed. Please contact support.`
            );

            return res.status(200).json({
                message: "Refund marked as failed.",
            });
        } catch (err) {
            console.error("PATCH /admin/refunds/:id/fail error:", err);

            return res.status(500).json({
                message: "Internal server error.",
            });
        }
    }
);

app.patch(
    "/booking/:id/refund-details",
    verifyJWT,
    async (req, res) => {
        const client = await pool.connect()

        try {
            const bookingId = Number(req.params.id)
            const {
                accountName,
                bankName,
                accountNumber,
            } = req.body

            if (!Number.isInteger(bookingId)) {
                return res.status(400).json({
                    message: "Invalid booking ID.",
                })
            }

            if (
                typeof accountName !== "string" ||
                !accountName.trim()
            ) {
                return res.status(400).json({
                    message:
                        "Account holder name is required.",
                })
            }

            if (
                typeof bankName !== "string" ||
                !bankName.trim()
            ) {
                return res.status(400).json({
                    message: "Bank name is required.",
                })
            }

            const cleanAccountNumber =
                typeof accountNumber === "string"
                    ? accountNumber.trim()
                    : ""

            if (!/^\d{10}$/.test(cleanAccountNumber)) {
                return res.status(400).json({
                    message:
                        "A valid 10-digit account number is required.",
                })
            }

            const encryptionKey =
                process.env.REFUND_ACCOUNT_ENCRYPTION_KEY

            if (!encryptionKey) {
                console.error(
                    "REFUND_ACCOUNT_ENCRYPTION_KEY is missing."
                )

                return res.status(500).json({
                    message:
                        "Refund account encryption is not configured.",
                })
            }

            await client.query("BEGIN")

            const refundResult = await client.query(
                `
                SELECT id, userid, status
                FROM refund_requests
                WHERE bookingid = $1
                  AND userid = $2
                FOR UPDATE
                `,
                [bookingId, req.user.id]
            )

            if (refundResult.rows.length === 0) {
                await client.query("ROLLBACK")

                return res.status(404).json({
                    message:
                        "No refund request exists for this booking.",
                })
            }

            const refund = refundResult.rows[0]

            if (
                !["pending", "approved"].includes(
                    refund.status
                )
            ) {
                await client.query("ROLLBACK")

                return res.status(400).json({
                    message:
                        "Refund details can no longer be changed.",
                })
            }

            const encryptedAccountNumber =
                encryptRefundAccountNumber(
                    cleanAccountNumber,
                    encryptionKey
                )

            await client.query(
                `
                UPDATE refund_requests
                SET
                    account_name = $1,
                    bank_name = $2,
                    account_number_encrypted = $3,
                    account_number_last4 = $4,
                    details_submitted_at = NOW(),
                    updated_at = NOW()
                WHERE id = $5
                `,
                [
                    accountName.trim(),
                    bankName.trim(),
                    encryptedAccountNumber,
                    cleanAccountNumber.slice(-4),
                    refund.id,
                ]
            )

            await client.query("COMMIT")

            await notifyAllAdmins(
                `Refund account details were submitted for booking #${bookingId}.`
            )

            return res.status(200).json({
                message:
                    "Refund account details submitted successfully.",
            })
        } catch (err) {
            await client.query("ROLLBACK")

            console.error(
                "PATCH /booking/:id/refund-details error:",
                err
            )

            return res.status(500).json({
                message: "Internal server error.",
            })
        } finally {
            client.release()
        }
    }
)

app.get(
    "/booking/:id/refund",
    verifyJWT,
    async (req, res) => {
        try {
            const result = await pool.query(
                `
                SELECT
                    id,
                    bookingid,
                    amount,
                    status,
                    account_name,
                    bank_name,
                    account_number_last4,
                    admin_note,
                    requested_at,
                    details_submitted_at,
                    completed_at
                FROM refund_requests
                WHERE bookingid = $1
                  AND userid = $2
                `,
                [req.params.id, req.user.id]
            )

            if (result.rows.length === 0) {
                return res.status(200).json(null)
            }

            return res.status(200).json({
                ...result.rows[0],
                amount: Number(result.rows[0].amount),
            })
        } catch (err) {
            console.error("GET /booking/:id/refund error:", err)

            return res.status(500).json({
                message: "Internal server error.",
            })
        }
    }
)

app.post('/addCategory', verifyJWT, requireAdmin, async (req, res) => {
    try {
        const { category } = req.body;
        const check = await pool.query('SELECT 1 FROM categories WHERE LOWER(name) = LOWER($1)', [category])
        if (check.rowCount > 0) return res.status(400).json({ message: 'Category already exists' })
        await pool.query('INSERT INTO categories (name) VALUES ($1)', [category])
        return res.status(200).json({ message: 'Category added successfully' })
    } catch (err) {
        console.log("Internal server Error: ", err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
})

app.get("/categories", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name FROM categories ORDER BY name");
        return res.status(200).json(result.rows);
    } catch (err) {
        console.log("Internal server Error: ", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});