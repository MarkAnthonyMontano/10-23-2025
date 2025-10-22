import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  FormControl,
  Select,
  TableCell,
  MenuItem,
  InputLabel,
  TableBody,
  Button,
} from '@mui/material';
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";

const ClassRoster = () => {
  const settings = useContext(SettingsContext);
  const [fetchedLogo, setFetchedLogo] = useState(null);
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

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [adminData, setAdminData] = useState({ dprtmnt_id: "" });
  const [students, setStudents] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [semesters, setSchoolSemester] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSchoolSemester, setSelectedSchoolSemester] = useState('');
  const [department, setDepartment] = useState([]);
  const [allCurriculums, setAllCurriculums] = useState([]);
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Regular");
  const [selectedRemarkFilter, setSelectedRemarkFilter] = useState("Ongoing");
  const [selectedCampus, setSelectedCampus] = useState("0");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const divToPrintRef = useRef();
  const itemsPerPage = 10;
  const remarksMap = {
    0: "Ongoing",
    1: "Passed",
    2: "Failed",
    3: "Incomplete",
    4: "Drop"
  };


  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const loggedInPersonId = localStorage.getItem("person_id");

    if (!storedUser || !storedRole || !loggedInPersonId) {
      window.location.href = "/login";
      return;
    }

    setUser(storedUser);
    setUserRole(storedRole);
    setUserID(loggedInPersonId);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchPersonData = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/admin_data/${user}`);
          setAdminData(res.data);
        } catch (err) {
          console.error("Error fetching admin data:", err);
        }
      };
      fetchPersonData();
    }
  }, [user]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/student_number");
        setStudents(res.data);
      } catch (err) {
        console.error("Error fetching student data:", err);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/get_school_year/`)
      .then((res) => setSchoolYears(res.data))
      .catch((err) => console.error(err));
  }, []);

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
    if (!adminData.dprtmnt_id) return;
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/departments/${adminData.dprtmnt_id}`);
        setDepartment(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, [adminData.dprtmnt_id]);

  useEffect(() => {
    if (!adminData.dprtmnt_id) return;
    const fetchCurriculums = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/applied_program/${adminData.dprtmnt_id}`);
        setCurriculumOptions(response.data);
      } catch (error) {
        console.error("Error fetching curriculum options:", error);
      }
    };
    fetchCurriculums();
  }, [adminData.dprtmnt_id]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/applied_program")
      .then(res => {
        setAllCurriculums(res.data);
        setCurriculumOptions(res.data);
      });
  }, []);

  useEffect(() => {
    if (department.length > 0 && !selectedDepartmentFilter) {
      const firstDept = department[0].dprtmnt_id;
      setSelectedDepartmentFilter(firstDept);
      handleDepartmentChange(firstDept);
    }
  }, [department, selectedDepartmentFilter]);

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };

  const handleSchoolSemesterChange = (event) => {
    setSelectedSchoolSemester(event.target.value);
  };

  const handleDepartmentChange = (selectedDept) => {
    setSelectedDepartmentFilter(selectedDept);
    if (!selectedDept) {
      setCurriculumOptions(allCurriculums);
    } else {
      setCurriculumOptions(
        allCurriculums.filter(opt => opt.dprtmnt_id === selectedDept)
      );
    }
    setSelectedProgramFilter("");
  };

  const filteredStudents = students
    .filter((s) => {
      const matchesCampus =
        selectedCampus === "" || String(s.campus) === String(selectedCampus);

      const matchesDepartment =
        selectedDepartmentFilter === "" ||
        s.dprtmnt_id === selectedDepartmentFilter;

      const matchesProgram =
        selectedProgramFilter === "" ||
        s.program_id === selectedProgramFilter;

      const schoolYear = schoolYears.find((sy) => sy.year_id === selectedSchoolYear);
      const matchesSchoolYear =
        selectedSchoolYear === "" ||
        (schoolYear && String(s.created_at?.split("-")[0]) === String(schoolYear.current_year));

      const matchesSemester =
        selectedSchoolSemester === "" ||
        String(s.semester_id) === String(selectedSchoolSemester);

      const matchesStatus =
        selectedStatusFilter === "" ||
        (selectedStatusFilter === "Regular" && Number(s.status) === 1) ||
        (selectedStatusFilter === "Irregular" && Number(s.status) !== 1);

      const matchesRemark =
        selectedRemarkFilter === "" ||
        remarksMap[s.en_remarks] === selectedRemarkFilter;

      return (
        matchesCampus &&
        matchesDepartment &&
        matchesProgram &&
        matchesSchoolYear &&
        matchesSemester &&
        matchesStatus &&
        matchesRemark
      );
    })
    .sort((a, b) => {
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();

      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const printDiv = () => {
    // ✅ Determine dynamic campus address (dropdown or custom)
    let campusAddress = "";
    if (settings?.campus_address && settings.campus_address.trim() !== "") {
      campusAddress = settings.campus_address;
    } else if (settings?.address && settings.address.trim() !== "") {
      campusAddress = settings.address;
    } else {
      campusAddress = "No address set in Settings";
    }

    // ✅ Dynamic logo and company name
    const logoSrc = fetchedLogo || EaristLogo;
    const name = companyName?.trim() || "";

    // ✅ Split company name into two balanced lines
    const words = name.split(" ");
    const middleIndex = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middleIndex).join(" ");
    const secondLine = words.slice(middleIndex).join(" ");

    // ✅ Open new print window
    const newWin = window.open("", "Print-Window");
    newWin.document.open();
    newWin.document.write(`
  <html>
    <head>
      <title>Student List</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .print-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .print-header {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 100%;
        }
        .print-header img {
          position: absolute;
          left: 0;
          margin-left: 10px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 20px;
          border: 1.2px solid black;
          table-layout: fixed;
        }
        th, td {
          border: 1.2px solid black;
          padding: 4px 6px;
          font-size: 12px;
          text-align: center;
          box-sizing: border-box;
        }
        th {
          background-color: #800000;
          color: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .name { min-width: 180px; }
        .year-level { min-width: 60px; }
        .semester { min-width: 80px; }
      </style>
    </head>
    <body onload="window.print(); setTimeout(() => window.close(), 100);">
      <div class="print-container">

        <!-- ✅ HEADER -->
        <div class="print-header">
          <img src="${logoSrc}" alt="School Logo" />
          <div>
            <div>Republic of the Philippines</div>
            ${name
        ? `
                  <b style="letter-spacing: 1px; font-size: 20px; font-family: 'Times New Roman', serif;">
                    ${firstLine}
                  </b>
                  ${secondLine
          ? `<div style="letter-spacing: 1px; font-size: 20px; font-family: 'Times New Roman', serif;"><b>${secondLine}</b></div>`
          : ""
        }
                `
        : ""
      }
            <div style="font-size: 12px;">${campusAddress}</div>

            <div style="margin-top: 30px;">
              <b style="font-size: 20px; letter-spacing: 1px;">STUDENT LIST</b>
            </div>
          </div>
        </div>

        <!-- ✅ TABLE -->
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student Number</th>
              <th>Name</th>
              <th>Program Code</th>
              <th>Year Level</th>
              <th>Semester</th>
              <th>Remarks</th>
              <th>Date Enrolled</th>
              <th>Student Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents
        .map((student, index) => {
          const program = curriculumOptions.find(
            item => String(item.program_id) === String(student.program_id)
          );
          return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${student.student_number ?? "N/A"}</td>
                    <td class="name">${student.last_name}, ${student.first_name} ${student.middle_name ?? ""} ${student.extension ?? ""}</td>
                    <td>${program?.program_code ?? "N/A"}</td>
                    <td>${student.year_level_description ?? "N/A"}</td>
                    <td>${semesters.find(s => String(s.semester_id) === String(student.semester_id))?.semester_description ?? "N/A"}</td>
                    <td>${remarksMap[student.en_remarks] ?? "N/A"}</td>
                    <td>${student.created_at ? new Date(student.created_at).toLocaleDateString("en-PH") : "N/A"}</td>
                    <td>${Number(student.status) === 1 ? "Regular" : "Irregular"}</td>
                  </tr>
                `;
        })
        .join("")}
          </tbody>
        </table>
      </div>
    </body>
  </html>
`);
    newWin.document.close();
  };

  // 🔒 Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 🔒 Block DevTools shortcuts + Ctrl+P silently
  document.addEventListener('keydown', (e) => {
    const isBlockedKey =
      e.key === 'F12' || // DevTools
      e.key === 'F11' || // Fullscreen
      (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) || // Ctrl+Shift+I/J
      (e.ctrlKey && e.key.toLowerCase() === 'u') || // Ctrl+U (View Source)
      (e.ctrlKey && e.key.toLowerCase() === 'p');   // Ctrl+P (Print)

    if (isBlockedKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  return (
    <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', pr: 1, p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4" fontWeight="bold" color="maroon">
          CLASS LIST
        </Typography>
      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />
      <TableContainer component={Paper} sx={{ width: '100%', }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
            <TableRow>
              <TableCell colSpan={10} sx={{ border: "2px solid maroon", py: 0.5, backgroundColor: '#6D2323', color: "white" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {/* Left: Total Count */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Students: {filteredStudents.length}
                  </Typography>

                  {/* Right: Pagination Controls */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* First & Prev */}
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
                        }
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
                        }
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
                            color: 'white', // dropdown arrow icon color
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: '#fff', // dropdown background
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
                      {totalPages} page{totalPages > 1 ? 's' : ''}
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
                        }
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
                        }
                      }}
                    >
                      Last
                    </Button>
                    <Button
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 100,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      Sort: {sortOrder === "asc" ? "A–Z" : "Z–A"}
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", flexWrap: "wrap", gap: "2rem" }}>
          <Box sx={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
            <button
              onClick={printDiv}
              style={{
                padding: "5px 20px",
                border: "2px solid black",
                backgroundColor: "#f0f0f0",
                color: "black",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "background-color 0.3s, transform 0.2s",
                height: "40px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                maxWidth: "220px",
                userSelect: "none",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d3d3d3"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              type="button"
            >
              <FcPrint size={20} />
              Print Student List
            </button>
            <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 200 }}>
              <Typography fontSize={13} sx={{ minWidth: "100px" }}>Campus:</Typography>
              <FormControl size="small" sx={{ width: "200px" }}>
                <Select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                >
                  <MenuItem value=""><em>All Campuses</em></MenuItem>
                  <MenuItem value="0">MANILA</MenuItem>
                  <MenuItem value="1">CAVITE</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={13} sx={{ minWidth: "100px" }}>Student Status:</Typography>
                <FormControl size="small" sx={{ width: "200px" }}>
                  <Select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Regular">Regular</MenuItem>
                    <MenuItem value="Irregular">Irregular</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={13} sx={{ minWidth: "100px" }}>Remarks:</Typography>
                <FormControl size="small" sx={{ width: "200px" }}>
                  <Select
                    value={selectedRemarkFilter}
                    onChange={(e) => setSelectedRemarkFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Ongoing">Ongoing</MenuItem>
                    <MenuItem value="Passed">Passed</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                    <MenuItem value="Incomplete">Incomplete</MenuItem>
                    <MenuItem value="Drop">Drop</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={13} sx={{ minWidth: "100px" }}>School Year:</Typography>
                <FormControl size="small" sx={{ width: "200px" }}>
                  <InputLabel>School Years</InputLabel>
                  <Select
                    label="School Years"
                    value={selectedSchoolYear}
                    onChange={handleSchoolYearChange}
                    displayEmpty
                  >
                    {schoolYears.length > 0 ? (
                      schoolYears.map((sy) => (
                        <MenuItem value={sy.year_id} key={sy.year_id}>
                          {sy.current_year} - {sy.next_year}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>School Year is not found</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={13} sx={{ minWidth: "100px" }}>Semester:</Typography>
                <FormControl size="small" sx={{ width: "200px" }}>
                  <InputLabel>School Semester</InputLabel>
                  <Select
                    label="School Semester"
                    value={selectedSchoolSemester}
                    onChange={handleSchoolSemesterChange}
                    displayEmpty
                  >
                    {semesters.length > 0 ? (
                      semesters.map((sem) => (
                        <MenuItem value={sem.semester_id} key={sem.semester_id}>
                          {sem.semester_description}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>School Semester is not found</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={13} sx={{ minWidth: "100px" }}>Department:</Typography>
                <FormControl size="small" sx={{ width: "400px" }}>
                  <Select
                    value={selectedDepartmentFilter}
                    onChange={(e) => {
                      const selectedDept = e.target.value;
                      setSelectedDepartmentFilter(selectedDept);
                      handleDepartmentChange(selectedDept);
                    }}
                    displayEmpty
                  >
                    {department.map((dep) => (
                      <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_id}>
                        {dep.dprtmnt_name} ({dep.dprtmnt_code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={13} sx={{ minWidth: "100px" }}>Program:</Typography>
                <FormControl size="small" sx={{ width: "400px" }}>
                  <Select
                    value={selectedProgramFilter}
                    onChange={(e) => setSelectedProgramFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">All Programs</MenuItem>
                    {curriculumOptions.map((prog) => (
                      <MenuItem key={prog.curriculum_id} value={prog.program_id}>
                        {prog.program_code} - {prog.program_description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </Box>
      </TableContainer>
      <TableContainer component={Paper} sx={{ width: "100%", marginTop: "2rem" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323" }}>
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>#</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Student Number</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Name</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Program Description</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Program Code</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Year Level</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Semester</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Remarks</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Date Enrolled</TableCell>
              <TableCell sx={{ color: "white", textAlign: "center", fontSize: "12px", border: "1px solid maroon" }}>Student Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.map((s, i) => (
              <TableRow key={s.student_number}>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>
                  {(currentPage - 1) * itemsPerPage + i + 1}
                </TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{s.student_number}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>
                  {s.last_name}, {s.first_name} {s.middle_name || ""}
                </TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{s.program_description}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{s.program_code}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{s.year_level_description}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{s.semester_description}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{remarksMap[s.en_remarks] || ""}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{s.created_at || ""}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid maroon" }}>{s.status === 1 ? "Regular" : "Irregular"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClassRoster;