import { Box, Typography, TextField, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Paper, TableContainer } from "@mui/material";
import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import EaristLogo from "../assets/EaristLogo.png";
import { Search } from "@mui/icons-material";
import axios from 'axios';

const ReportOfGrade = () => {
    const settings = useContext(SettingsContext);
    const [fetchedLogo, setFetchedLogo] = useState(EaristLogo); // ✅ fallback
    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        if (settings) {
            // ✅ load dynamic logo
            if (settings.logo_url) {
                setFetchedLogo(`http://localhost:5000${settings.logo_url}`);
            } else {
                setFetchedLogo(EaristLogo);
            }

            // ✅ load dynamic name + address
            if (settings.company_name) setCompanyName(settings.company_name);
            if (settings.campus_address) setCampusAddress(settings.campus_address);
        }
    }, [settings]);

    const words = companyName.trim().split(" ");
    const middle = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middle).join(" ");
    const secondLine = words.slice(middle).join(" ");

    const [campusAddress, setCampusAddress] = useState("");

    useEffect(() => {
        if (settings && settings.address) {
            setCampusAddress(settings.address);
        }
    }, [settings]);


    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [studentData, setStudentData] = useState([]);
    const [studentNumber, setStudentNumber] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [studentDetails, setStudentDetails] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [schoolYears, setSchoolYears] = useState([]);
    const [schoolSemester, setSchoolSemester] = useState([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
    const [selectedSchoolSemester, setSelectedSchoolSemester] = useState('');
    const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const storedID = localStorage.getItem("person_id");

        if (storedUser && storedRole && storedID) {
            setUser(storedUser);
            setUserRole(storedRole);
            setUserID(storedID);

            if (storedRole !== "registrar") {
                window.location.href = "/login";
            } else {
                console.log("Hello")
            }
        } else {
            window.location.href = "/login";
        }
    }, []);

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 9) {
            setSelectedStudent(null);
            setStudentData([]);
            return;
        }

        const fetchStudent = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/program_evaluation/${searchQuery}`);
                const data = await res.json();

                if (data) {
                    setSelectedStudent(data);
                    setStudentData(data);

                    const detailsRes = await fetch(`http://localhost:5000/api/program_evaluation/details/${searchQuery}`);
                    const detailsData = await detailsRes.json();
                    if (Array.isArray(detailsData) && detailsData.length > 0) {
                        setStudentDetails(detailsData);
                    } else {
                        setStudentDetails([]);
                        setSnackbarMessage("No enrolled subjects found for this student.");
                        setOpenSnackbar(true);
                    }
                } else {
                    setSelectedStudent(null);
                    setStudentData([]);
                    setStudentDetails([]);
                    setSnackbarMessage("No student data found.");
                    setOpenSnackbar(true);
                }
            } catch (err) {
                console.error("Error fetching student", err);
                setSnackbarMessage("Server error. Please try again.");
                setOpenSnackbar(true);
            }
        };

        fetchStudent();
    }, [searchQuery]);

    useEffect(() => {
        axios
            .get(`http://localhost:5000/get_school_year/`)
            .then((res) => setSchoolYears(res.data))
            .catch((err) => console.error(err));
    }, [])

    useEffect(() => {
        axios
            .get(`http://localhost:5000/get_school_semester/`)
            .then((res) => setSchoolSemester(res.data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        axios
            .get(`http://localhost:5000/active_school_year`)
            .then((res) => {
                if (res.data.length > 0) {
                    setSelectedSchoolYear(res.data[0].year_id);
                    setSelectedSchoolSemester(res.data[0].semester_id);
                }
            })
            .catch((err) => console.error(err));

    }, []);

    useEffect(() => {
        if (selectedSchoolYear && selectedSchoolSemester) {
            axios
                .get(`http://localhost:5000/get_selecterd_year/${selectedSchoolYear}/${selectedSchoolSemester}`)
                .then((res) => {
                    if (res.data.length > 0) {
                        setSelectedActiveSchoolYear(res.data[0].school_year_id);
                    }
                })
                .catch((err) => console.error(err));
        }
    }, [selectedSchoolYear, selectedSchoolSemester]);

    const handleSchoolYearChange = (event) => {
        setSelectedSchoolYear(event.target.value);
    };

    const handleSchoolSemesterChange = (event) => {
        setSelectedSchoolSemester(event.target.value);
    };

    const filteredStudents = studentDetails
        .filter((s) => {
            const matchesYear =
                selectedSchoolYear === "" || String(s.year_id) === String(selectedSchoolYear);

            const matchesSemester =
                selectedSchoolSemester === "" || String(s.semester_id) === String(selectedSchoolSemester);

            return matchesYear && matchesSemester;
        })

    const getLevelBySection = (section) => {
        if (!section) return null;
        const yearNumber = parseInt(section[0]);
        switch (yearNumber) {
            case 1: return "First Year";
            case 2: return "Second Year";
            case 3: return "Third Year";
            case 4: return "Fourth Year";
            case 5: return "Fifth Year";
            default: return "unknown";
        }
    }

    const getShortTerm = (semester) => {
        if (!semester) return null;
        switch (semester) {
            case "First Semester": return "First";
            case "Second Semester": return "Second";
            case "Summer": return "Summer";
            default: return "unknown";
        }
    }

    const totalUnitPerSubject = (course_unit, lab_unit) => {
        const lec = Number(course_unit) || 0;
        const lab = Number(lab_unit) || 0;
        return lec + lab;
    };



    const divToPrintRef = useRef();

    const printDiv = () => {
        window.print();
    };

    return (
        <Box className="body" sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden', pr: 1, p: 2 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    mb: 2,
                    px: 2,
                    background: "white",
                }}
            >
                {/* Title */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: "bold",
                        color: "maroon",
                        fontSize: "36px",
                    }}
                >
                    TRANSCRIPT OF RECORDS
                </Typography>

                {/* Right Section: Search Field + Print Button */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                        mt: { xs: 2, sm: 0 },
                    }}
                >
                    <TextField
                        variant="outlined"
                        placeholder="Enter Student Number"
                        size="small"
                        value={studentNumber}
                        onChange={(e) => {
                            setStudentNumber(e.target.value);
                            setSearchQuery(e.target.value);
                        }}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
                        sx={{
                            width: { xs: "100%", sm: "425px" },
                            background: "white",
                        }}
                    />

                    <button
                        onClick={printDiv}
                        className="bg-maroon-500 w-[10rem] h-[3rem] text-[18px] text-white rounded"
                    >
                        Print
                    </button>
                </Box>
            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />


            <style>
                {`
                @media print {
                    @page {
                        margin: 0; 
                        padding-right: 3rem
                    }
                
                    body * {
                        visibility: hidden;
                        
                    }

                    .body{
                        margin-top: -22rem;
                        margin-left: -27rem;
                        overflow: visible !important;  /* show all content */
                        height: auto !important;       /* expand height */
                        max-height: none !important;   /* no max height limit */
                        
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        scale: 0.9;
                        position: absolute;
                        left:0%;
                        top: -9rem;
                        width: 100%;
                        font-family: "Poppins", sans-serif;
                        margin-top: -4.5rem;
                        padding: 0;
                    }
                    button {
                        display: none !important; /* hide buttons */
                    }
                }
                `}
            </style>

            <TableContainer component={Paper} sx={{ maxWidth: '100%', border: "2px solid maroon", p: 2, position: "relative", marginTop: "3rem" }}>
                <Box sx={{ display: "flex", alignItems: "center", margin: "1rem 0", padding: "0 1rem", }} gap={20}>
                    <Box style={{ display: "flex", flexDirection: "column" }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>School Year:</Typography>
                            <FormControl fullWidth>
                                <InputLabel id="demo-simple-select-label">School Years</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    style={{ width: "200px" }}
                                    value={selectedSchoolYear}
                                    label="School Years"
                                    onChange={handleSchoolYearChange}
                                >
                                    {schoolYears.length > 0 ? (
                                        schoolYears.map((sy) => (
                                            <MenuItem value={sy.year_id} key={sy.year_id}>
                                                {sy.current_year} - {sy.next_year}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>School Year is not found</MenuItem>
                                    )
                                    }
                                </Select>
                            </FormControl>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Semester: </Typography>
                            <FormControl fullWidth>
                                <InputLabel id="demo-simple-select-label">School Semester</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    style={{ width: "200px", }}
                                    value={selectedSchoolSemester}
                                    label="School Semester"
                                    onChange={handleSchoolSemesterChange}
                                >
                                    {schoolSemester.length > 0 ? (
                                        schoolSemester.map((sem) => (
                                            <MenuItem value={sem.semester_id} key={sem.semester_id}>
                                                {sem.semester_description}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>School Semester is not found</MenuItem>
                                    )
                                    }
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Box>
            </TableContainer>

            <Box
                className="print-container"
                style={{
                    paddingRight: "1.5rem",
                    marginTop: "5rem",
                    paddingBottom: "1.5rem",
                    maxWidth: "600px",
                }}
                ref={divToPrintRef}
            >
                <Box
                    style={{
                        display: "flex",
                        alignItems: "center",
                        width: "70rem",
                        justifyContent: "center",
                        gap: "0.5rem", // ✅ adds spacing between logo and text
                    }}
                >
                    {/* LEFT - Logo */}
                    <Box
                        style={{
                            paddingTop: "1.5rem",
                            paddingRight: "3rem",
                        }}
                    >
                        <img
                            src={fetchedLogo || EaristLogo} // ✅ Use dynamic logo with fallback
                            alt="School Logo"
                            style={{
                                width: "8rem",
                                height: "8rem",
                                display: "block",
                                objectFit: "cover",
                                borderRadius: "50%",
                            }}
                        />
                    </Box>

                    {/* CENTER - School Info */}
                    <Box style={{ marginTop: "1.5rem" }}>
                        <td
                            colSpan={15}
                            style={{
                                textAlign: "center",
                                fontFamily: "Arial",
                                fontSize: "10px",
                                lineHeight: "1.5",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "12px",
                                    letterSpacing: "1px",
                                }}
                            >
                                Republic of the Philippines
                            </div>

                            {/* ✅ Dynamically split company name into two lines */}
                            {companyName ? (
                                (() => {
                                    const name = companyName.trim();
                                    const words = name.split(" ");
                                    const middleIndex = Math.ceil(words.length / 2);
                                    const firstLine = words.slice(0, middleIndex).join(" ");
                                    const secondLine = words.slice(middleIndex).join(" ");

                                    return (
                                        <>
                                            <Typography
                                                style={{
                                                    textAlign: "center",
                                                    marginTop: "0rem",
                                                    lineHeight: "1",
                                                    fontSize: "1.6rem",
                                                    letterSpacing: "-1px",
                                                    fontWeight: "600",
                                                    fontFamily: "Times New Roman",
                                                }}
                                            >
                                                {firstLine} <br />
                                                {secondLine}
                                            </Typography>

                                            {/* ✅ Dynamic Campus Address */}
                                            {campusAddress && (
                                                <Typography
                                                    style={{
                                                        mt: 1,
                                                        textAlign: "center",
                                                        fontSize: "12px",
                                                        letterSpacing: "1px",
                                                        
                                                    }}
                                                >
                                                    {campusAddress}
                                                </Typography>
                                            )}
                                        </>
                                    );
                                })()
                            ) : (
                                <div style={{ height: "24px" }}></div>
                            )}
                        </td>
                    </Box>
                </Box>


                {filteredStudents.length > 0 && (
                    <>
                        <Typography style={{ marginLeft: "1rem", textAlign: "center", width: "80rem", fontSize: "1.6rem", letterSpacing: "-1px", fontWeight: "500", textDecoration: "underline", textUnderlineOffset: "0.4rem" }}>REPORT OF GRADES</Typography>
                        <Typography style={{ marginLeft: "1rem", marginTop: "-0.2rem", width: "80rem", textAlign: "center", letterSpacing: "-1px" }}>{filteredStudents[0]?.semester_description},  School Year {filteredStudents[0]?.current_year} - {filteredStudents[0]?.next_year}</Typography>
                    </>
                )}

                <Box style={{ display: "flex" }}>
                    <Box>
                        <Box sx={{ padding: "1rem", marginLeft: "1rem", width: "70rem" }}>
                            <Box sx={{ display: "flex" }}>
                                <Box style={{ display: "flex", width: "38rem" }}>
                                    <Typography style={{ width: "9rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Full Name:</Typography>
                                    <Typography style={{ fontSize: "1.06rem", fontWeight: "500" }}>{studentData.last_name && studentData.first_name && studentData.middle_name ? `${studentData.last_name}, ${studentData.first_name} ${studentData.middle_name}` : ""}</Typography>
                                </Box>
                                <Box style={{ display: "flex", width: "38rem" }}>
                                    <Typography style={{ width: "9rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Student No:</Typography>
                                    <Typography style={{ fontSize: "1.06rem", fontWeight: "500" }}>{studentData.student_number}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex" }}>
                                <Box style={{ display: "flex", width: "38rem" }}>
                                    <Typography style={{ width: "9rem", marginTop: "0.7rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Gender</Typography>
                                    <Typography style={{ fontSize: "1.06rem", fontWeight: "500", marginTop: "0.7rem" }}>{studentData.gender === 0 ? "Male" : studentData.gender === 1 ? "Female" : ""}</Typography>
                                </Box>
                                <Box style={{ display: "flex", width: "38rem" }}>
                                    <Typography style={{ width: "9rem", marginTop: "0.7rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Academic Year:</Typography>
                                    {filteredStudents.length > 0 && (
                                        <>
                                            <Typography style={{ fontSize: "1.06rem", fontWeight: "500", marginTop: "0.7rem" }}>{getShortTerm(filteredStudents[0]?.semester_description)} , {filteredStudents[0]?.current_year} - {filteredStudents[0]?.next_year}</Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex" }}>
                                <Box style={{ display: "flex", width: "38rem" }}>
                                    <Typography style={{ width: "9rem", marginTop: "0.7rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>College:</Typography>
                                    <Typography style={{ fontSize: "1.06rem", fontWeight: "500", marginTop: "0.7rem" }}>{studentData.dprtmnt_name}</Typography>
                                </Box>
                                <Box style={{ display: "flex" }}>
                                    <Typography style={{ width: "9rem", marginTop: "0.7rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Year Level:</Typography>
                                    {filteredStudents.length > 0 && (
                                        <>
                                            <Typography style={{ fontSize: "1.06rem", fontWeight: "500", marginTop: "0.7rem" }}>{getLevelBySection(filteredStudents[0]?.section)}</Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                            <Box style={{ display: "flex", width: "38rem" }}>
                                <Typography style={{ width: "9rem", marginTop: "0.7rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Program:</Typography>
                                <Typography style={{ fontSize: "1.06rem", fontWeight: "500", marginTop: "0.7rem" }}>{studentData.program_description}</Typography>
                            </Box>
                            <Box sx={{ display: "flex" }}>
                                <Box style={{ display: "flex", width: "38rem" }}>
                                    <Typography style={{ width: "9rem", marginTop: "0.7rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Major:</Typography>
                                    <Typography style={{ fontSize: "1.06rem", fontWeight: "500", marginTop: "0.7rem" }}>{studentData.major}</Typography>
                                </Box>
                                <Box style={{ display: "flex", width: "38rem" }}>
                                    <Typography style={{ width: "9rem", marginTop: "0.7rem", fontSize: "1.05rem", letterSpacing: "-1px" }}>Rentention Status: </Typography>
                                    <Typography style={{ fontSize: "1.06rem", fontWeight: "500", marginTop: "0.7rem" }}></Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box style={{ display: "flex", flexWrap: "wrap" }}>
                            <Box style={{ paddingLeft: "1rem", flex: "0 0 50%", marginBottom: "1rem", boxSizing: "border-box" }}>
                                <table style={{ border: "black 1px solid" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid black" }}>
                                            <td style={{ display: "flex", height: "35px", alignItems: "center", justifyContent: "center", fontWeight: "600" }}>{studentData.program_description}</td>
                                        </tr>
                                        <tr style={{ display: "flex", height: "50px", borderBottom: "solid 1px black" }}>
                                            <td style={{ fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "10rem" }}>
                                                <span>CODE</span>
                                            </td>
                                            <td style={{ fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "24rem" }}>
                                                <span>TITLE</span>
                                            </td>
                                            <td style={{ fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "12rem" }}>
                                                <span>CLASS SECTION</span>
                                            </td>
                                            <td style={{ fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "6rem" }}>
                                                <span>GRADES</span>
                                            </td>
                                            <td style={{ fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "6rem" }}>
                                                <span>RE-EXAM</span>
                                            </td>
                                            <td style={{ fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "6rem" }}>
                                                <span style={{ textAlign: "center" }}>CREDIT UNIT</span>
                                            </td>
                                            <td style={{ fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "10rem" }}>
                                                <span style={{ textAlign: "center" }}>REMARKS</span>
                                            </td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((p) => (
                                            <tr style={{ display: "flex", height: "35px", alignItems: "center" }} key={p.enrolled_id}>
                                                <td style={{ display: "flex", alignItems: "center", justifyContent: "left", width: "10rem" }}>
                                                    <span style={{ paddingLeft: "5px" }}>{p.course_code}</span>
                                                </td>
                                                <td style={{ display: "flex", width: "24rem" }}>
                                                    <span style={{ margin: "0", padding: "0" }}>{p.course_description}</span>
                                                </td>
                                                <td style={{ display: "flex", width: "12rem", justifyContent: "center" }}>
                                                    <span style={{ margin: "0", padding: "0" }}>{p.program_code} {p.section}</span>
                                                </td>
                                                <td>
                                                    <span style={{ margin: "0", padding: "0", display: "flex", justifyContent: "center", width: "6rem" }}>{p.final_grade}</span>
                                                </td>
                                                <td>
                                                    <span style={{ margin: "0", padding: "0", display: "flex", justifyContent: "center", width: "6rem" }}></span>
                                                </td>
                                                <td>
                                                    <span style={{ margin: "0", padding: "0", display: "flex", justifyContent: "center", width: "6rem" }}>
                                                        {totalUnitPerSubject(p.course_unit, p.lab_unit)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ margin: "0", padding: "0", display: "flex", justifyContent: "center", width: "10rem" }}>
                                                        {p.en_remarks === 0 ? "Ongoing" :
                                                            p.en_remarks === 1 ? "PASSED" :
                                                                p.en_remarks === 2 ? "FAILED" :
                                                                    p.en_remarks === 3 ? "INCOMPLETE" :
                                                                        p.en_remarks === 4 ? "DROPPED" :
                                                                            ""
                                                        }
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "0.5rem" }}>
                                                <div>
                                                    ***
                                                </div>
                                                <div style={{ height: "30px", margin: "0px 5px", fontSize: "0.9rem" }}>
                                                    Nothing Follows
                                                </div>
                                                <div>
                                                    ***
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Box>
                        </Box>
                        <Box style={{ display: "flex", marginTop: "-1rem" }}>
                            <Box style={{ maxWidth: "47rem" }}>
                                <Box style={{ display: "flex", justifyContent: "end" }}>
                                    <Typography style={{ width: "45rem", display: "flex", justifyContent: "end", fontSize: "0.9rem" }}>Total Subject Enrolled:</Typography>
                                    <Typography style={{ padding: "0rem 0.5rem", display: "flex", justifyContent: "end", fontSize: "0.9rem", width: "3rem" }}>
                                        {filteredStudents.length}
                                    </Typography>
                                </Box>
                                <Box style={{ display: "flex", justifyContent: "end" }}>
                                    <Typography style={{ width: "45rem", display: "flex", justifyContent: "end", fontSize: "0.9rem" }}>Total Credits Enrolled:</Typography>
                                    <Typography style={{ padding: "0rem 0.5rem", display: "flex", justifyContent: "end", fontSize: "0.9rem", width: "3rem" }}>
                                        {filteredStudents
                                            .reduce((total, subj) => total + (Number(subj.course_unit) || 0) + (Number(subj.lab_unit) || 0), 0)
                                            .toFixed(1)
                                        }
                                    </Typography>
                                </Box>
                                <Box style={{ display: "flex", justifyContent: "end" }}>
                                    <Typography style={{ width: "45rem", display: "flex", justifyContent: "end", fontSize: "0.9rem" }}>Total Credits Earned:</Typography>
                                    <Typography style={{ padding: "0rem 0.5rem", display: "flex", justifyContent: "end", fontSize: "0.9rem", width: "3rem" }}>
                                        {filteredStudents
                                            .filter(subj => subj.en_remarks === 1)
                                            .reduce((total, subj) => total + (Number(subj.course_unit) || 0) + (Number(subj.lab_unit) || 0), 0)
                                        }
                                    </Typography>
                                </Box>
                                <Box style={{ display: "flex", justifyContent: "end" }}>
                                    <Typography style={{ width: "45rem", display: "flex", justifyContent: "end", fontSize: "0.9rem" }}>Grade Point Average:</Typography>
                                    <Typography style={{ padding: "0rem 0.5rem", display: "flex", justifyContent: "end", fontSize: "0.9rem", width: "3rem" }}>
                                        {(
                                            filteredStudents.reduce((total, subj) => total + (Number(subj.final_grade) || 0), 0) / 8
                                        ).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box style={{ height: "4.5rem", marginLeft: "6rem", width: "100%", display: "flex", flexDirection: "column", alignItems: "end", justifyContent: "end" }}>
                                <Box style={{ width: "100%", textAlign: "center", margin: "0", padding: "0" }}>
                                    <Typography style={{ borderBottom: "1px black solid", width: "100%" }}></Typography>
                                    <Typography style={{ fontSize: "0.7rem", marginBottom: "-0.2rem" }}>Registrar</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box style={{ border: "black solid 1px", marginLeft: "1rem", padding: "1.5rem" }}>
                            <Box>
                                <Typography style={{ fontSize: "0.9rem" }}>Grading System</Typography>
                            </Box>
                            <Box style={{ display: "flex", alignItems: "center" }}>
                                <Box style={{ display: "flex", marginLeft: "1.2rem" }}>
                                    <Box>
                                        <Typography style={{ width: "6.5rem", fontSize: "0.9rem" }}>1.00 (97 - 100)</Typography>
                                        <Typography style={{ fontSize: "0.9rem" }}>1.25 (94 - 96)</Typography>
                                        <Typography style={{ fontSize: "0.9rem" }}>1.50 (91 - 93)</Typography>
                                        <Typography style={{ fontSize: "0.9rem" }}>1.75 (88 - 90)</Typography>
                                        <Typography style={{ fontSize: "0.9rem" }}>2.00 (85 - 87)</Typography>
                                    </Box>
                                    <Box>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Marked Excellent</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Excellent</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Very Superior</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Superior</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Very Good</Typography>
                                    </Box>
                                </Box>
                                <Box style={{ display: "flex" }}>
                                    <Box>
                                        <Typography style={{ width: "6.5rem", fontSize: "0.9rem" }}>2.00 (82 - 84)</Typography>
                                        <Typography style={{ width: "6.5rem", fontSize: "0.9rem" }}>2.25 (79 - 81)</Typography>
                                        <Typography style={{ width: "6.5rem", fontSize: "0.9rem" }}>2.50 (76 - 78)</Typography>
                                        <Typography style={{ width: "6.5rem", fontSize: "0.9rem" }}>3.00 (75)</Typography>
                                        <Typography style={{ width: "6.5rem", fontSize: "0.9rem" }}>4.00 (70 - 74)</Typography>
                                    </Box>
                                    <Box>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Good</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Satisfactory</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Fair</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Passed</Typography>
                                        <Typography style={{ width: "20rem", fontSize: "0.9rem" }}>Conditional Failure</Typography>
                                    </Box>
                                </Box>
                                <Box style={{ display: "flex" }}>
                                    <Box>
                                        <Typography style={{ width: "6rem", fontSize: "0.9rem" }}>5.00 (Below 70)</Typography>
                                        <Typography style={{ width: "6rem", fontSize: "0.9rem" }}>INC</Typography>
                                        <Typography style={{ width: "6rem", fontSize: "0.9rem" }}>DRP</Typography>
                                        <Typography style={{ width: "6rem", fontSize: "0.9rem" }}></Typography>
                                        <Typography style={{ width: "6rem", fontSize: "0.9rem" }}></Typography>
                                    </Box>
                                    <Box>
                                        <Typography style={{ fontSize: "0.9rem" }}>Failed</Typography>
                                        <Typography style={{ fontSize: "0.9rem" }}>Incomplete</Typography>
                                        <Typography style={{ fontSize: "0.9rem" }}>Drop Subject</Typography>
                                        <Typography style={{ fontSize: "0.9rem", height: "20px" }}></Typography>
                                        <Typography style={{ fontSize: "0.9rem", height: "20px" }}></Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={4000}
                            onClose={() => setOpenSnackbar(false)}
                            anchorOrigin={{ vertical: "top", horizontal: "center" }}
                        >
                            <Alert onClose={() => setOpenSnackbar(false)} severity="warning" sx={{ width: "100%" }}>
                                {snackbarMessage}
                            </Alert>
                        </Snackbar>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default ReportOfGrade;