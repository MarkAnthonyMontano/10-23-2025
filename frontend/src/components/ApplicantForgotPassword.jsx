import React, { useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import {
  Snackbar,
  Alert,
  Box,
  Container,
  TextField,
  InputAdornment,
  Button,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Email } from "@mui/icons-material";
import ReCAPTCHA from "react-google-recaptcha";
import { SettingsContext } from "../App";
import Logo from "../assets/Logo.png";

// Connect to backend
const socket = io("http://localhost:5000");

const ApplicantForgotPassword = () => {
  const settings = useContext(SettingsContext);
  const [capVal, setCapVal] = useState(null);
  const [email, setEmail] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [currentYear, setCurrentYear] = useState(""); // ✅ Manila time year

  useEffect(() => {
    // ✅ Get year based on Manila timezone
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
    const year = new Date(now).getFullYear();
    setCurrentYear(year);
  }, []);

  const handleReset = () => {
    if (!email) {
      setSnack({ open: true, message: "Please enter your email.", severity: "warning" });
      return;
    }
    if (!capVal) {
      setSnack({
        open: true,
        message: "Please verify you're not a robot.",
        severity: "warning",
      });
      return;
    }
    socket.emit("forgot-password-applicant", email);
  };

  useEffect(() => {
    const listener = (data) => {
      setSnack({
        open: true,
        message: data.message,
        severity: data.success ? "success" : "error",
      });
    };
    socket.on("password-reset-result-applicant", listener);
    return () => socket.off("password-reset-result-applicant", listener);
  }, []);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // ✅ Dynamic background + logo
  const backgroundImage = settings?.bg_image
    ? `url(http://localhost:5000${settings.bg_image})`
    : "url(/default-bg.jpg)";
  const logoSrc = settings?.logo_url
    ? `http://localhost:5000${settings.logo_url}`
    : Logo;

  // 🔒 Disable right-click & DevTools
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => {
    const block =
      e.key === "F12" ||
      e.key === "F11" ||
      (e.ctrlKey && e.shiftKey && ["i", "j"].includes(e.key.toLowerCase())) ||
      (e.ctrlKey && ["u", "p"].includes(e.key.toLowerCase()));
    if (block) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  const isButtonDisabled = !email || !capVal;

  return (
    <Box
      sx={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: "10px",
            boxShadow: "1px 1px 10px rgba(0,0,0,0.1)",
            overflow: "hidden",
            marginTop: "-100px",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              backgroundColor: "#6D2323",
              borderRadius: "10px 10px 0 0",
              py: 3,
              textAlign: "center",
              border: "5px solid white",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <Box
                sx={{
                  width: 105,
                  height: 105,
                  borderRadius: "50%",
                  border: "5px solid white",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                }}
              >
                <img src={logoSrc} alt="Logo" style={{ width: "100%", height: "100%" }} />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
              {settings?.company_name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Student Information System
            </Typography>
          </Box>

          {/* Body */}
          <Box sx={{ px: 4, py: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 500, mb: 1, color: "rgba(0,0,0,0.6)" }}
            >
              Email Address
            </Typography>
            <TextField
              fullWidth
              type="email"
              placeholder="Enter your Email Address (e.g., username@gmail.com)"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  height: "50px",
                  "& input": { height: "50px", boxSizing: "border-box" },
                },
              }}
            />

            {/* CAPTCHA */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <ReCAPTCHA
                sitekey="6Lfem44rAAAAAEeAexdQxvN0Lpm1V4KPu1bBxaGy"
                onChange={(val) => setCapVal(val)}
              />
            </Box>

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              disabled={isButtonDisabled}
              onClick={handleReset}
              sx={{
                mt: 4,
                py: 1.4,
                backgroundColor: "#6D2323",
                fontWeight: 500,
                fontSize: "15px",
                "&:hover": { backgroundColor: "#6D2323" },
              }}
            >
              Reset Password
            </Button>

            {/* Back to login */}
            <Box sx={{ textAlign: "center", mt: 2, color: "#6D2323" }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                To go to login page,
              </Typography>
              <Link
                to="/login_applicant"
                style={{
                  color: "#6D2323",
                  textDecoration: "underline",
                  fontWeight: 500,
                }}
              >
                Click here
              </Link>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              textAlign: "center",
              bgcolor: "rgba(243, 219, 173, 0.531)",
              color: "rgba(0,0,0,0.7)",
              fontSize: "14px",
              py: 1.5,
              borderRadius: "0 0 10px 10px",
            }}
          >
            © {currentYear} {settings?.company_name} Student Information System. All rights reserved.
          </Box>
        </Box>
      </Container>

      {/* Snackbar Notification */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleClose} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApplicantForgotPassword;
