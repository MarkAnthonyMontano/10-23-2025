import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Box,
    TextField,
    Button,
    Typography,
    Avatar,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    Paper,
    TableHead,
    TableRow,
    Alert,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";

const RegisterRegistrar = () => {
    const [department, setDepartment] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [registrars, setRegistrars] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editData, setEditData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [form, setForm] = useState({
        employee_id: "",
        last_name: "",
        middle_name: "",
        first_name: "",
        role: "registrar",
        email: "",
        password: "",
        status: "",
        dprtmnt_id: "",
        profile_picture: null, // ✅ holds the uploaded file
        preview: "", // ✅ for preview URL

    });
    const [itemsPerPage, setItemsPerPage] = useState(50);


    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const filteredRegistrar = registrars
        .filter((r) =>
            selectedDepartmentFilter
                ? r.dprtmnt_name === selectedDepartmentFilter
                : true
        )
        .sort((a, b) => {
            if (sortOrder === "asc") return a.last_name.localeCompare(b.last_name);
            if (sortOrder === "desc") return b.last_name.localeCompare(a.last_name);
            return 0;
        });

    const totalPages = Math.ceil(filteredRegistrar.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRegistrar = filteredRegistrar.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [filteredRegistrar.length, totalPages]);

    const maxButtonsToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage < maxButtonsToShow - 1) {
        startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    const visiblePages = [];
    for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
    }



    useEffect(() => {
        fetchDepartments();
        fetchRegistrars();
    }, []);

    // 📥 Fetch Departments
    const fetchDepartments = async () => {
        try {
            const res = await axios.get("http://localhost:5000/get_department");
            setDepartment(res.data);
        } catch (err) {
            console.error("❌ Department fetch error:", err);
            setErrorMessage("Failed to load department list");
        }
    };

    const fetchRegistrars = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/registrars");
            setRegistrars(res.data);
        } catch (err) {
            console.error("❌ Registrar fetch error:", err);
            setErrorMessage("Failed to load registrar accounts");
        }
    };

    // Handle form field changes
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const fd = new FormData();
            // append all text fields
            Object.entries(form).forEach(([key, value]) => {
                if (value !== null && key !== "preview") {
                    fd.append(key, value);
                }
            });

            if (editData) {
                // 🟢 Update existing registrar
                await axios.post(`http://localhost:5000/update_registrar/${editData.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                // 🟢 Add new registrar
                await axios.post("http://localhost:5000/register_registrar", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }


            setOpenSnackbar(true);
            setOpenDialog(false);
            setEditData(null);
            setForm({
                employee_id: "",
                last_name: "",
                middle_name: "",
                first_name: "",
                role: "registrar",
                email: "",
                password: "",
                status: "",
                dprtmnt_id: "",
                profile_picture: null,
                preview: "",
            });
            fetchRegistrars();
        } catch (err) {
            console.error("❌ Submit error:", err);
            setErrorMessage(err.response?.data?.message || "Something went wrong");
        }
    };

    const handleEdit = (r) => {
        setEditData(r);
        setForm({
            employee_id: r.employee_id || "",
            first_name: r.first_name || "",
            middle_name: r.middle_name || "",
            last_name: r.last_name || "",
            email: r.email || "",
            password: "",
            role: r.role || "registrar",
            status: Number(r.status), // ✅ ensure numeric
            dprtmnt_id: r.dprtmnt_id || "",
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditData(null);
    };

    // Export CSV
    const handleExportCSV = () => {
        if (registrars.length === 0) return alert("No data to export!");

        const headers = ["Employee ID", "Full Name", "Email", "Department", "Status"];
        const rows = registrars.map((r) => [
            r.employee_id,
            `${r.first_name} ${r.middle_name || ""} ${r.last_name}`,
            r.email,
            r.dprtmnt_name || "N/A",
            r.status === 1 ? "Active" : "Inactive",
        ]);
        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "registrars.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            await axios.put(`http://localhost:5000/update_registrar/${id}`, { status: newStatus });
            fetchRegistrars(); // 🔄 refresh list
        } catch (error) {
            console.error("❌ Error toggling status:", error);
            setErrorMessage("Failed to update status");
        }
    };


    return (
        <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", pr: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={2}>
                {/* Left: Header */}
                <Typography variant="h4" fontWeight="bold" color="maroon">
                    REGISTRAR ACCOUNTS
                </Typography>

                {/* Right: Search */}

            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />


            <br />

            <TableContainer component={Paper} sx={{ width: '100%' }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                        <TableRow>
                            <TableCell
                                colSpan={10}
                                sx={{
                                    border: "2px solid maroon",
                                    py: 0.5,
                                    backgroundColor: '#6D2323',
                                    color: "white"
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    {/* Left: Registrar List Count */}
                                    <Typography fontSize="14px" fontWeight="bold" color="white">
                                        Registrar's List:
                                    </Typography>

                                    {/* Right: Pagination Controls */}
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            First
                                        </Button>

                                        <Button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            Prev
                                        </Button>

                                        {/* Page Dropdown */}
                                        <FormControl size="small" sx={{ minWidth: 80 }}>
                                            <Select
                                                value={currentPage}
                                                onChange={(e) => setCurrentPage(Number(e.target.value))}
                                                displayEmpty
                                                sx={{
                                                    fontSize: '12px',
                                                    height: 36,
                                                    color: 'white',
                                                    border: '1px solid white',
                                                    backgroundColor: 'transparent',
                                                    '.MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'white',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'white',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'white',
                                                    },
                                                    '& svg': {
                                                        color: 'white',
                                                    }
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            maxHeight: 200,
                                                            backgroundColor: '#fff',
                                                        }
                                                    }
                                                }}
                                            >
                                                {Array.from({ length: totalPages }, (_, i) => (
                                                    <MenuItem key={i + 1} value={i + 1}>
                                                        Page {i + 1}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Typography fontSize="11px" color="white">
                                            of {totalPages} page{totalPages > 1 ? 's' : ''}
                                        </Typography>

                                        <Button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            Next
                                        </Button>

                                        <Button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 80,
                                                color: "white",
                                                borderColor: "white",
                                                backgroundColor: "transparent",
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                },
                                                '&.Mui-disabled': {
                                                    color: "white",
                                                    borderColor: "white",
                                                    backgroundColor: "transparent",
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            Last
                                        </Button>
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>
            {/* 🔧 Control Bar Section */}
            <TableContainer
                component={Paper}
                sx={{
                    width: "100%",

                    border: "2px solid #800000",

                }}
            >
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: 2,
                                    }}
                                >
                                    {/* ➕ Left: Add Registrar Button */}
                                    <Button
                                        startIcon={<AddIcon />}
                                        variant="contained"
                                        onClick={() => {
                                            setForm({
                                                employee_id: "",
                                                last_name: "",
                                                middle_name: "",
                                                first_name: "",
                                                role: "registrar",
                                                email: "",
                                                password: "",
                                                status: "",
                                                dprtmnt_id: "",
                                            });
                                            setOpenDialog(true);
                                        }}
                                        sx={{
                                            backgroundColor: "default",
                                            color: "white",
                                            textTransform: "none",
                                            fontWeight: "bold",
                                            width: "350px",
                                            "&:hover": { backgroundColor: "#6D2323" },
                                        }}
                                    >
                                        Add Registrar
                                    </Button>

                                    {/* ⚙️ Right: Filter, Sort, Export */}
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        {/* Department Filter */}
                                        <FormControl sx={{ width: "350px" }} size="small">
                                            <InputLabel id="filter-department-label">
                                                Filter by Department
                                            </InputLabel>
                                            <Select
                                                labelId="filter-department-label"
                                                value={selectedDepartmentFilter}
                                                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                                                label="Filter by Department"
                                            >
                                                <MenuItem value="">All Departments</MenuItem>
                                                {department.map((dep) => (
                                                    <MenuItem
                                                        key={dep.dprtmnt_id}
                                                        value={dep.dprtmnt_name}
                                                    >
                                                        {dep.dprtmnt_name} ({dep.dprtmnt_code})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Sort Order */}
                                        <FormControl size="small" sx={{ width: "200px" }}>
                                            <Select
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="">Select Order</MenuItem>
                                                <MenuItem value="asc">Ascending</MenuItem>
                                                <MenuItem value="desc">Descending</MenuItem>
                                            </Select>
                                        </FormControl>

                                        {/* Export CSV */}
                                        <Button
                                            variant="outlined"
                                            startIcon={<FileDownloadIcon />}
                                            onClick={handleExportCSV}
                                            sx={{
                                                borderColor: "#800000",
                                                color: "#800000",
                                                textTransform: "none",
                                                fontWeight: "bold",
                                                "&:hover": { borderColor: "#a52a2a", color: "#a52a2a" },
                                            }}
                                        >
                                            Export CSV
                                        </Button>
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: "100%", border: "2px solid maroon", mb: 4 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: "#6D2323" }}>
                        <TableRow>
                            {[
                                "EMPLOYEE ID",
                                "Image",
                                "Full Name",
                                "Email",
                                "Department",
                                "Position",
                                "Actions",
                                "Status",


                            ].map((header, idx) => (
                                <TableCell
                                    key={idx}
                                    sx={{
                                        color: "white",
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        border: "1px solid maroon"
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {registrars.length > 0 ? (
                            registrars.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{r.employee_id}</TableCell>

                                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>
                                        {r.profile_picture ? (
                                            <Avatar
                                                src={`http://localhost:5000/uploads/${r.profile_picture}`}
                                                alt={r.first_name}
                                                sx={{ width: 60, height: 60, margin: "auto", border: "1px solid maroon" }}
                                            />
                                        ) : (
                                            <Avatar sx={{ bgcolor: "#6D2323", margin: "auto" }}>
                                                {r.first_name?.[0] || "?"}
                                            </Avatar>
                                        )}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>
                                        {`${r.first_name || ""} ${r.middle_name || ""} ${r.last_name || ""}`}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{r.email}</TableCell>

                                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>
                                        {r.dprtmnt_name || "N/A"}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>
                                        {r.role || "Registrar"}
                                    </TableCell>



                                    {/* ✅ EDIT BUTTON */}
                                    <TableCell sx={{ border: "1px solid maroon", borderRight: "2px solid maroon" }}>
                                        <Button
                                            onClick={() => handleEdit(r)}
                                            sx={{
                                                backgroundColor: "#eccb22ff",
                                                color: "white",
                                                textTransform: "none",
                                                fontWeight: "bold",

                                            }}
                                            variant="contained"
                                        >
                                            EDIT
                                        </Button>
                                    </TableCell>

                                    {/* ✅ STATUS TOGGLE BUTTON */}
                                    <TableCell sx={{ border: "1px solid maroon" }}>
                                        <Button
                                            onClick={() => handleToggleStatus(r.id, r.status)}
                                            sx={{
                                                backgroundColor: r.status === 1 ? "green" : "maroon",
                                                color: "white",
                                                textTransform: "none",
                                                fontWeight: "bold",
                                                "&:hover": {
                                                    backgroundColor: r.status === 1 ? "#4CAF50" : "#a52a2a",
                                                },
                                            }}
                                            variant="contained"
                                        >
                                            {r.status === 1 ? "Active" : "Inactive"}
                                        </Button>
                                    </TableCell>




                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No registrar accounts found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>


            {/* ➕ / ✏️ Registrar Modal */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle sx={{ color: "maroon", fontWeight: "bold" }}>
                    {editData ? "Edit Registrar" : "Add New Registrar"}
                </DialogTitle>
                <hr style={{ border: "1px solid #ccc", width: "100%" }} />

                <DialogContent sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                        {/* 🔹 Profile Picture Upload */}
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-start">
                            <Avatar
                                src={
                                    form.preview ||
                                    (editData?.profile_picture
                                        ? `http://localhost:5000/uploads/${editData.profile_picture}`
                                        : "")
                                }
                                alt={form.first_name || "Profile"}
                                sx={{
                                    width: 80,
                                    height: 80,
                                    border: "2px solid maroon",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                            />
                            <Button
                                variant="outlined"
                                component="label"
                                sx={{
                                    borderColor: "#6D2323",
                                    color: "#6D2323",
                                    textTransform: "none",
                                    fontWeight: "bold",
                                    "&:hover": { borderColor: "#800000", color: "#800000" },
                                }}
                            >
                                Upload Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setForm({
                                                ...form,
                                                profile_picture: file,
                                                preview: URL.createObjectURL(file),
                                            });
                                        }
                                    }}
                                />
                            </Button>
                        </Stack>

                        {/* 🔹 Registrar Information */}
                        <TextField
                            label="Employee ID"
                            name="employee_id"
                            value={form.employee_id}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Last Name"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Middle Name"
                            name="middle_name"
                            value={form.middle_name}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="First Name"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            type="email"
                            fullWidth
                        />
                        <TextField
                            label={editData ? "New Password (optional)" : "Password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type="password"
                            fullWidth
                        />

                        {/* 🔹 Department Dropdown */}
                        <FormControl fullWidth>
                            <InputLabel id="department-label">Department</InputLabel>
                            <Select
                                labelId="department-label"
                                name="dprtmnt_id"
                                value={form.dprtmnt_id}
                                label="Department"
                                onChange={handleChange}
                            >
                                <MenuItem value="">Select Department</MenuItem>
                                {department.map((dep) => (
                                    <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_id}>
                                        {dep.dprtmnt_name} ({dep.dprtmnt_code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 🔹 Status Dropdown (Active/Inactive) */}
                        {editData && (
                            <FormControl fullWidth>
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    name="status"
                                    value={form.status}
                                    label="Status"
                                    onChange={handleChange}
                                >
                                    <MenuItem value={1}>Active</MenuItem>
                                    <MenuItem value={0}>Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{
                            backgroundColor: "#800000",
                            "&:hover": { backgroundColor: "#6D2323" },
                            fontWeight: "bold",
                        }}
                    >
                        {editData ? "Save Changes" : "Register"}
                    </Button>
                </DialogActions>
            </Dialog>


            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity="success" sx={{ width: "100%" }}>
                    Registrar registered successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default RegisterRegistrar;
