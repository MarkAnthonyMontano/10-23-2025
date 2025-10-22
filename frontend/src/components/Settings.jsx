import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Button,
    TextField,
    Input,
    InputLabel,
    Typography,
    Paper,
    Box,
    Divider,
    Avatar,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

function Settings({ onUpdate }) {
    const [companyName, setCompanyName] = useState("");
    const [address, setAddress] = useState("");
    const [logo, setLogo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [headerColor, setHeaderColor] = useState("#ffffff");
    const [footerText, setFooterText] = useState("");
    const [footerColor, setFooterColor] = useState("#ffffff");

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/settings")
            .then((response) => {
                const {
                    company_name,
                    address,
                    logo_url,
                    header_color,
                    footer_text,
                    footer_color,
                } = response.data;
                setCompanyName(company_name || "");
                setAddress(address || "");
                setPreview(logo_url || null);
                setHeaderColor(header_color || "#ffffff");
                setFooterText(footer_text || "");
                setFooterColor(footer_color || "#ffffff");
            })
            .catch((error) => console.error("Error fetching settings:", error));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append("company_name", companyName || "");
        formData.append("address", address || "");
        formData.append("logo", logo);
        formData.append("header_color", headerColor || "#ffffff");
        formData.append("footer_text", footerText || "");
        formData.append("footer_color", footerColor || "#ffffff");

        try {
            await axios.post("http://localhost:5000/api/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (typeof onUpdate === "function") {
                await onUpdate();
            }

            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Error updating settings:", error);
        }
    };

    return (
        <Box
            sx={{
                height: "calc(100vh - 120px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent",
                overflowY: "auto",
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: 2,
                    width: 550,
                    borderRadius: 4,
                    backgroundColor: "#fff",
                    border: "2px solid maroon",
                    boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                }}
            >
                <Box textAlign="center" mb={1}>
                    <SettingsIcon
                        sx={{
                            fontSize: 80,
                            color: "#800000",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "50%",
                            p: 1,
                        }}
                    />
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ mt: 1, color: "#800000" }}
                    >
                        Customize Your Settings
                    </Typography>
                </Box>

                <Divider sx={{ mb: 1 }} />

                <form onSubmit={handleSubmit}>
                    {/* ✅ Company Name */}
                    <Box mb={1}>
                        <InputLabel>Company Name</InputLabel>
                        <TextField
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            fullWidth
                            size="small"
                            variant="outlined"
                        />
                    </Box>

                    {/* ✅ Address */}
                    <Box mb={1}>
                        <InputLabel>Address</InputLabel>
                        <TextField
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            fullWidth
                            size="small"
                            variant="outlined"
                        />
                    </Box>

                    {/* ✅ Logo Upload */}
                    <Box mb={2}>
                        <InputLabel>Logo</InputLabel>
                        <Input
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                setLogo(file);
                                setPreview(URL.createObjectURL(file));
                            }}
                            fullWidth
                        />
                        {preview && (
                            <Avatar
                                src={preview}
                                alt="Logo Preview"
                                sx={{
                                    width: 80,
                                    height: 80,
                                    mt: 1,
                                    mx: "auto",
                                    border: "2px solid #1976d2",
                                }}
                            />
                        )}
                    </Box>

                    {/* ✅ Header Color */}
                    <Box mb={1}>
                        <InputLabel>Header Color</InputLabel>
                        <Input
                            type="color"
                            value={headerColor}
                            onChange={(e) => setHeaderColor(e.target.value)}
                            fullWidth
                            sx={{ height: "40px", cursor: "pointer" }}
                        />
                    </Box>

                    {/* ✅ Footer Text */}
                    <Box mb={1}>
                        <InputLabel>Footer Text</InputLabel>
                        <TextField
                            value={footerText}
                            onChange={(e) => setFooterText(e.target.value)}
                            fullWidth
                            size="small"
                            variant="outlined"
                        />
                    </Box>

                    {/* ✅ Footer Color */}
                    <Box mb={1}>
                        <InputLabel>Footer Color</InputLabel>
                        <Input
                            type="color"
                            value={footerColor}
                            onChange={(e) => setFooterColor(e.target.value)}
                            fullWidth
                            sx={{ height: "40px", cursor: "pointer" }}
                        />
                    </Box>

                    {/* ✅ Save Button */}
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{
                            py: 1.2,
                            borderRadius: 2,
                            backgroundColor: "#1976d2",
                            textTransform: "none",
                            fontWeight: "bold",
                            "&:hover": { backgroundColor: "#1565c0" },
                        }}
                    >
                        Save Settings
                    </Button>
                </form>
            </Paper>
        </Box>
    );

}

export default Settings;
