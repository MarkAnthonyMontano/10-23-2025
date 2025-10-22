import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    FormControl,
    Select,
    Card,
    TableCell,
    TextField,
    MenuItem,
    InputLabel,
    TableBody,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { Snackbar, Alert } from '@mui/material';
import { useNavigate, useLocation } from "react-router-dom";
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { io } from "socket.io-client";
import LoadingOverlay from '../components/LoadingOverlay';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";


const socket = io("http://localhost:5000");


const QualifyingExamScore = () => {
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

    const words = companyName.trim().split(" ");
    const middle = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middle).join(" ");
    const secondLine = words.slice(middle).join(" ");


    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const queryPersonId = (queryParams.get("person_id") || "").trim();

    const handleRowClick = (person_id) => {
        if (!person_id) return;

        sessionStorage.setItem("admin_edit_person_id", String(person_id));
        sessionStorage.setItem("admin_edit_person_id_source", "applicant_list");
        sessionStorage.setItem("admin_edit_person_id_ts", String(Date.now()));

        // ✅ Always pass person_id in the URL
        navigate(`/student_dashboard1?person_id=${person_id}`);
    };

    const tabs = [
        { label: "Admission Process For College", to: "/applicant_list", icon: <SchoolIcon fontSize="large" /> },
        { label: "Applicant Form", to: "/registrar_dashboard1", icon: <AssignmentIcon fontSize="large" /> },
        { label: "Student Requirements", to: "/registrar_requirements", icon: <AssignmentTurnedInIcon fontSize="large" /> },
        { label: "Interview Room Assignment", to: "/assign_interview_exam", icon: <MeetingRoomIcon fontSize="large" /> },
        { label: "Interview Schedule Management", to: "/assign_schedule_applicants_interview", icon: <ScheduleIcon fontSize="large" /> },
        { label: "Interviewer Applicant's List", to: "/interviewer_applicant_list", icon: <PeopleIcon fontSize="large" /> },
        { label: "Qualifying Exam Score", to: "/qualifying_exam_scores", icon: <PersonSearchIcon fontSize="large" /> },
        { label: "Student Numbering", to: "/student_numbering_per_college", icon: <DashboardIcon fontSize="large" /> },
    ];
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(6);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };




    const [persons, setPersons] = useState([]);

    const [selectedPerson, setSelectedPerson] = useState(null);
    const [assignedNumber, setAssignedNumber] = useState('');
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [adminData, setAdminData] = useState({ dprtmnt_id: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const loggedInPersonId = localStorage.getItem("person_id");
        const searchedPersonId = sessionStorage.getItem("admin_edit_person_id");

        if (!storedUser || !storedRole || !loggedInPersonId) {
            window.location.href = "/login";
            return;
        }

        setUser(storedUser);
        setUserRole(storedRole);

        const allowedRoles = ["registrar", "applicant", "superadmin"];
        if (allowedRoles.includes(storedRole)) {
            const targetId = queryPersonId || searchedPersonId || loggedInPersonId;
            sessionStorage.setItem("admin_edit_person_id", targetId);
            setUserID(targetId);
            return;
        }

        window.location.href = "/login";
    }, [queryPersonId]);

    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
    const [person, setPerson] = useState({
        campus: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        document_status: "",
        extension: "",
        generalAverage1: "",
        program: "",
        created_at: "",
        middle_code: "",
        emailAddress: "",
    });
    const [allApplicants, setAllApplicants] = useState([]);

    // ⬇️ Add this inside ApplicantList component, before useEffect

    // ✅ fetch applicants WITH exam scores
    const fetchApplicants = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/applicants-with-number", {
                params: { department_id: adminData.dprtmnt_id }
            });

            // ignore rows that have already been emailed (action === 1)
            const data = Array.isArray(res.data) ? res.data : [];
            const filtered = data.filter(p => Number(p.action) !== 1); // keep only action != 1
            const withAssignedFlag = filtered.map(p => ({ ...p, assigned: false }));
            setPersons(withAssignedFlag);
            setPerson(withAssignedFlag);
        } catch (err) {
            console.error("Error fetching applicants:", err);
            setPersons([]);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, [adminData.dprtmnt_id]);

    useEffect(() => {
        fetchApplicants();
    }, []);

    const fetchPersonData = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/admin_data/${user}`);
            setAdminData(res.data); // { dprtmnt_id: "..." }
        } catch (err) {
            console.error("Error fetching admin data:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPersonData();
        }
    }, [user]);

    const [curriculumOptions, setCurriculumOptions] = useState([]);

    useEffect(() => {
        if (!adminData.dprtmnt_id) return;
        const fetchCurriculums = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/applied_program/${adminData.dprtmnt_id}`);
                console.log("✅ curriculumOptions:", response.data);
                setCurriculumOptions(response.data);
            } catch (error) {
                console.error("Error fetching curriculum options:", error);
            }
        };
        fetchCurriculums();
    }, [adminData.dprtmnt_id]);

    const [selectedApplicantStatus, setSelectedApplicantStatus] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const [selectedRegistrarStatus, setSelectedRegistrarStatus] = useState("");

    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
    const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
    const [department, setDepartment] = useState([]);
    const [allCurriculums, setAllCurriculums] = useState([]);
    const [schoolYears, setSchoolYears] = useState([]);
    const [semesters, setSchoolSemester] = useState([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
    const [selectedSchoolSemester, setSelectedSchoolSemester] = useState('');
    const [selectedActiveSchoolYear, setSelectedActiveSchoolYear] = useState('');

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
    }, [])

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

    const handleSchoolYearChange = (event) => {
        setSelectedSchoolYear(event.target.value);
    };

    const handleSchoolSemesterChange = (event) => {
        setSelectedSchoolSemester(event.target.value);
    };

    // helper to make string comparisons robust
    const normalize = (s) => (s ?? "").toString().trim().toLowerCase();
    const [showSubmittedOnly, setShowSubmittedOnly] = useState(false);
    const [topCount, setTopCount] = useState(100);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [minScore, setMinScore] = useState("");
    const [maxScore, setMaxScore] = useState("");
    const [exactRating, setExactRating] = useState("");
    const [editScores, setEditScores] = useState({});

    const filteredPersons = persons.filter((personData) => {
        const finalRating = Number(personData.final_rating) || 0;

        const matchesScore =
            (minScore === "" || finalRating >= Number(minScore)) &&
            (maxScore === "" || finalRating <= Number(maxScore));

        const matchesExactRating =
            exactRating === "" || finalRating === Number(exactRating);

        const query = searchQuery.toLowerCase();
        const fullName = `${personData.first_name ?? ""} ${personData.middle_name ?? ""} ${personData.last_name ?? ""}`.toLowerCase();

        const matchesApplicantID = personData.applicant_number?.toString().toLowerCase().includes(query);
        const matchesName = fullName.includes(query);
        const matchesEmail = personData.emailAddress?.toLowerCase().includes(query);

        const programInfo = allCurriculums.find(
            (opt) => opt.curriculum_id?.toString() === personData.program?.toString()
        );
        const matchesProgramQuery = programInfo?.program_code?.toLowerCase().includes(query);

        const matchesDepartment =
            selectedDepartmentFilter === "" || programInfo?.dprtmnt_name === selectedDepartmentFilter;

        const matchesProgramFilter =
            selectedProgramFilter === "" || programInfo?.program_code === selectedProgramFilter;

        const applicantAppliedYear = new Date(personData.created_at).getFullYear();
        const schoolYear = schoolYears.find((sy) => sy.year_id === selectedSchoolYear);

        const matchesSchoolYear =
            selectedSchoolYear === "" || (schoolYear && (String(applicantAppliedYear) === String(schoolYear.current_year)));

        const matchesSemester =
            selectedSchoolSemester === "" ||
            String(personData.middle_code) === String(selectedSchoolSemester);

        return (
            (matchesApplicantID || matchesName || matchesEmail || matchesProgramQuery) &&
            matchesDepartment &&
            matchesProgramFilter &&
            matchesSchoolYear &&
            matchesSemester &&
            matchesScore &&
            matchesExactRating
        );
    });

    const sortedPersons = React.useMemo(() => {
        return filteredPersons
            .slice()
            .sort((a, b) => {
                const aExam = Number(editScores[a.person_id]?.qualifying_exam_score ?? a.qualifying_exam_score ?? 0);
                const aInterview = Number(editScores[a.person_id]?.qualifying_interview_score ?? a.qualifying_interview_score ?? 0);
                const aTotal = (aExam + aInterview) / 2;

                const bExam = Number(editScores[b.person_id]?.qualifying_exam_score ?? b.qualifying_exam_score ?? 0);
                const bInterview = Number(editScores[b.person_id]?.qualifying_interview_score ?? b.qualifying_interview_score ?? 0);
                const bTotal = (bExam + bInterview) / 2;

                if (bTotal !== aTotal) return bTotal - aTotal;           // highest total first
                return new Date(a.created_at) - new Date(b.created_at);  // if tie, earliest created_at
            })
            .slice(0, topCount); // limit to top 10/20/30/50/100
    }, [filteredPersons, editScores, topCount]);

    // ✅ 3. Pagination logic AFTER sortedPersons exists
    const totalPages = Math.ceil(sortedPersons.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPersons = sortedPersons.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [sortedPersons.length, totalPages]);

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
        if (!adminData.dprtmnt_id) return;
        const fetchDepartments = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/departments/${adminData.dprtmnt_id}`); // ✅ Update if needed
                setDepartment(response.data);
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };
        fetchDepartments();
    }, [adminData.dprtmnt_id]);

    useEffect(() => {
        if (department.length > 0 && !selectedDepartmentFilter) {
            const firstDept = department[0].dprtmnt_name;
            setSelectedDepartmentFilter(firstDept);
            handleDepartmentChange(firstDept); // if you also want to trigger it
        }
    }, [department, selectedDepartmentFilter]);



    const handleSnackClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };



    useEffect(() => {
        axios.get("http://localhost:5000/api/applied_program")
            .then(res => {
                setAllCurriculums(res.data);
                setCurriculumOptions(res.data);
            });
    }, []);

    const handleDepartmentChange = (selectedDept) => {
        setSelectedDepartmentFilter(selectedDept);
        if (!selectedDept) {
            setCurriculumOptions(allCurriculums);
        } else {
            setCurriculumOptions(
                allCurriculums.filter(opt => opt.dprtmnt_name === selectedDept)
            );
        }
        setSelectedProgramFilter("");
    };


    const [applicants, setApplicants] = useState([]);

    useEffect(() => {
        const personIdFromQuery = queryParams.get("person_id");

        if (personIdFromQuery) {
            // ✅ Fetch single applicant
            axios
                .get(`http://localhost:5000/api/person_with_applicant/${personIdFromQuery}`)
                .then((res) => {
                    // Ensure scores always have a value
                    const fixed = {
                        ...res.data,
                        qualifying_exam_score: res.data.qualifying_exam_score ?? 0,
                        qualifying_interview_score: res.data.qualifying_interview_score ?? 0,
                        final_rating: res.data.final_rating ?? 0,
                    };
                    setPersons([fixed]); // wrap in array for table rendering
                })
                .catch((err) => {
                    console.error("❌ Error fetching single applicant:", err);
                    setPersons([]); // fallback to empty list
                });
        } else {
            // ✅ Fetch all applicants (with scores)
            axios
                .get("http://localhost:5000/api/applicants-with-number")
                .then((res) => setPersons(res.data))
                .catch((err) => {
                    console.error("❌ Error fetching applicants:", err);
                    setPersons([]);
                });
        }
    }, [queryPersonId]);


    const handleStatusChange = async (applicantId, newStatus) => {
        try {
            await axios.put(
                `http://localhost:5000/api/interview_applicants/${applicantId}/status`,
                { status: newStatus }
            );

            setPersons((prev) =>
                prev.map((p) =>
                    p.applicant_number === applicantId
                        ? { ...p, college_approval_status: newStatus } // 👈 update correct field
                        : p
                )
            );

            setSnack({
                open: true,
                message: "Status updated successfully.",
                severity: "success",
            });

            fetchApplicants();
        } catch (err) {
            console.error("Error updating status:", err);
            setSnack({
                open: true,
                message: "Failed to update status.",
                severity: "error",
            });
        }
    };

    const divToPrintRef = useRef();


    const printDiv = () => {
        const newWin = window.open("", "Print-Window");
        newWin.document.open();

        // ✅ Dynamic logo and company name
        const logoSrc = fetchedLogo || EaristLogo;
        const name = companyName?.trim() || "No Company Name Available";

        // ✅ Split name into two balanced lines
        const words = name.split(" ");
        const middleIndex = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, middleIndex).join(" ");
        const secondLine = words.slice(middleIndex).join(" ");

        // ✅ Dynamic campus address (dropdown or custom from Settings)
        let campusAddress = "";
        if (settings?.campus_address) {
            campusAddress = settings.campus_address;
        } else if (settings?.address) {
            campusAddress = settings.address;
        } else {
            campusAddress = "No address set in Settings";
        }

        // ✅ HTML print layout
        const htmlContent = `
  <html>
    <head>
      <title>Qualifying Examination Score</title>
    <style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }

  .print-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 10px; /* ✅ ensures right/left borders are not cut off */
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

  /* ✅ Consistent and thicker table borders */
table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 20px;
  border: 1.5px solid black;
  table-layout: fixed; /* ✅ lock column widths */
}
th, td {
  border: 1.5px solid black;
  padding: 6px;
  font-size: 12px;
  text-align: center;
  word-wrap: break-word; /* ✅ prevent overflow */
  box-sizing: border-box;
}

  /* ✅ Force right border to print cleanly */
  th:last-child,
  td:last-child {
    border-right: 1.2px solid maroon !important;
  }

  /* ✅ Slight padding helps prevent printer cutoff */
  @media print {
    body {
      margin-right: 5mm;
      margin-left: 5mm;
    }
  }

  th {
    background-color: #800000;
    color: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>


    </head>
    <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
      <div class="print-container">
        <!-- ✅ HEADER -->
        <div class="print-header">
          <img src="${logoSrc}" alt="School Logo" />
          <div>
            <div>Republic of the Philippines</div>

            <!-- ✅ Dynamic Company Name -->
            <b style="letter-spacing: 1px; font-size: 20px; font-family: 'Times New Roman', serif;">
              ${firstLine}
            </b>
            ${secondLine
                ? `<div style="letter-spacing: 1px; font-size: 20px; font-family: 'Times New Roman', serif;">
                     <b>${secondLine}</b>
                   </div>`
                : ""
            }

            <!-- ✅ Dynamic Address -->
            <div style="font-size: 12px;">${campusAddress}</div>

            <div style="margin-top: 30px;">
              <b style="font-size: 24px; letter-spacing: 1px;">
                QUALIFYING EXAMINATION SCORE
              </b>
            </div>
          </div>
        </div>

        <!-- ✅ TABLE -->
        <table>
          <thead>
            <tr>
           <th style="width: 12%;">Applicant ID</th>
<th style="width: 25%;">Applicant Name</th>
<th style="width: 13%;">Program</th>
<th style="width: 10%;">Qualifying Exam Score</th>
<th style="width: 10%;">Qualifying Interview Score</th>
<th style="width: 10%;">Total Ave</th>
<th style="width: 10%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPersons
                .map((person) => {
                    const qualifyingExam =
                        editScores[person.person_id]?.qualifying_exam_score ??
                        person.qualifying_exam_score ??
                        0;
                    const qualifyingInterview =
                        editScores[person.person_id]?.qualifying_interview_score ??
                        person.qualifying_interview_score ??
                        0;
                    const computedTotalAve =
                        (Number(qualifyingExam) + Number(qualifyingInterview)) / 2;

                    return `
                <tr>
                  <td>${person.applicant_number ?? "N/A"}</td>
                  <td class="name-col">${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}</td>
                  <td>${curriculumOptions.find(
                        (item) =>
                            item.curriculum_id?.toString() === person.program?.toString()
                    )?.program_code ?? "N/A"
                        }</td>
                  <td>${qualifyingExam}</td>
                  <td>${qualifyingInterview}</td>
                  <td>${computedTotalAve.toFixed(2)}</td>
                  <td>${person.college_approval_status ?? "N/A"}</td>
                </tr>`;
                })
                .join("")}
          </tbody>
        </table>
      </div>
    </body>
  </html>
  `;

        newWin.document.write(htmlContent);
        newWin.document.close();
    };


    const [file, setFile] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);


    const handleClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };

    // when file chosen
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // when import button clicked
    const handleImport = async () => {
        try {
            if (!selectedFile) {
                setSnack({ open: true, message: "Please choose a file first!", severity: "warning" });
                return;
            }

            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            let sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

            sheet = sheet
                .filter(row => row["Applicant ID"])
                .map(row => ({
                    applicant_number: String(row["Applicant ID"]).trim(),
                    qualifying_exam_score: Number(row["Qualifying Exam Score"]) || 0,
                    qualifying_interview_score: Number(row["Qualifying Interview Score"]) || 0,
                    total_ave:
                        Number(row["Total Ave"]) ||
                        (Number(row["Qualifying Exam Score"]) + Number(row["Qualifying Interview Score"])) / 2,
                }));

            if (sheet.length === 0) {
                setSnack({ open: true, message: "Excel file had no valid rows!", severity: "warning" });
                return;
            }

            const res = await axios.post("http://localhost:5000/api/qualifying_exam/import", sheet, {
                headers: { "Content-Type": "application/json" },
            });

            setSnack({ open: true, message: res.data.message || "Import successful!", severity: "success" });

            fetchApplicants(); // ✅ refresh instantly
        } catch (err) {
            console.error("❌ Import error:", err.response?.data || err.message);
            setSnack({ open: true, message: "Import failed: " + (err.response?.data?.error || err.message), severity: "error" });
        }
    };


    useEffect(() => {
        const syncPendingScores = async () => {
            const pending = JSON.parse(localStorage.getItem("pendingQualifying") || "[]");
            if (pending.length === 0) return;

            const stillPending = [];
            for (const p of pending) {
                try {
                    await axios.post("http://localhost:5000/api/interview", p);
                    console.log("✅ Synced pending qualifying:", p);
                } catch {
                    stillPending.push(p); // keep if still failing
                }
            }
            localStorage.setItem("pendingQualifying", JSON.stringify(stillPending));
        };

        // run once + whenever internet comes back
        syncPendingScores();
        window.addEventListener("online", syncPendingScores);
        return () => window.removeEventListener("online", syncPendingScores);
    }, []);

    const debounceTimers = {};


    const handleScoreChange = (person, field, value) => {
        // 1️⃣ Update local state for instant UI feedback
        setEditScores((prev) => ({
            ...prev,
            [person.person_id]: {
                ...prev[person.person_id],
                [field]: value,
            },
        }));

        // 2️⃣ Prepare updated scores
        const updatedScores = {
            qualifying_exam_score:
                field === "qualifying_exam_score"
                    ? value
                    : (editScores[person.person_id]?.qualifying_exam_score ??
                        person.qualifying_exam_score ??
                        0),
            qualifying_interview_score:
                field === "qualifying_interview_score"
                    ? value
                    : (editScores[person.person_id]?.qualifying_interview_score ??
                        person.qualifying_interview_score ??
                        0),
        };

        // 3️⃣ Cancel any previous debounce for this applicant
        if (debounceTimers[person.applicant_number]) {
            clearTimeout(debounceTimers[person.applicant_number]);
        }

        // 4️⃣ Set new debounce timer
        debounceTimers[person.applicant_number] = setTimeout(async () => {
            const payload = {
                applicant_number: person.applicant_number,
                qualifying_exam_score: updatedScores.qualifying_exam_score,
                qualifying_interview_score: updatedScores.qualifying_interview_score,
                user_person_id: localStorage.getItem("person_id"),
            };

            try {
                // ✅ Make ONE stable save call — not multiple
                await axios.post("http://localhost:5000/api/interview/save", payload);
                console.log("✅ Saved qualifying/interview scores once:", payload);
            } catch (err) {
                console.error("❌ Auto-save error:", err.response?.data || err.message);
            }
        }, 1500); // Increased debounce to 1.5s to prevent overlap
    };

    const [customCount, setCustomCount] = useState(0);
    const [selectedSchedule, setSelectedSchedule] = useState("");

    useEffect(() => {
        socket.on("schedule_updated", ({ schedule_id }) => {
            console.log("📢 Schedule updated:", schedule_id);
            fetchSchedulesWithCount();  // ✅ always refresh counts
            fetchApplicants();
        });

        return () => socket.off("schedule_updated");
    }, []);


    const handleAssignSingle = (applicant_number) => {
        axios.put(`http://localhost:5000/api/interview_applicants/assign/${applicant_number}`)
            .then(res => {
                console.log("Assign response:", res.data);

                setPersons(prev =>
                    prev.map(p =>
                        p.applicant_number === applicant_number
                            ? { ...p, assigned: true }
                            : p
                    )
                );

                setSnack({
                    open: true,
                    message: `Applicant ${applicant_number} assigned.`,
                    severity: "success",
                });

                fetchApplicants();
            })
            .catch(err => {
                console.error("Failed to assign applicant:", err);
                setSnack({
                    open: true,
                    message: "Failed to assign applicant.",
                    severity: "error",
                });
            });
    };



    const handleAssignMax = () => {
        // ✅ Get only unassigned applicants in the selected department
        const unassigned = persons.filter(p => {
            if (p.assigned) return false;

            const programInfo = allCurriculums.find(
                (opt) => opt.curriculum_id?.toString() === p.program?.toString()
            );

            // School year filter: compare applicant year with selectedSchoolYear
            const applicantAppliedYear = new Date(p.created_at).getFullYear();
            const schoolYear = schoolYears.find(sy => sy.year_id === selectedSchoolYear);

            const matchesDepartment =
                !selectedDepartmentFilter || programInfo?.dprtmnt_name === selectedDepartmentFilter;

            const matchesProgram =
                !selectedProgramFilter || programInfo?.program_code === selectedProgramFilter;

            const matchesSchoolYear =
                !selectedSchoolYear || (schoolYear && (String(applicantAppliedYear) === String(schoolYear.current_year)));

            const matchesSemester =
                !selectedSchoolSemester || String(p.middle_code) === String(selectedSchoolSemester);

            return matchesDepartment && matchesProgram && matchesSchoolYear && matchesSemester;
        });

        if (unassigned.length === 0) {
            setSnack({ open: true, message: "No applicants available to assign in this department.", severity: "warning" });
            return;
        }

        // Limit to 100 applicants
        const maxToAssign = Math.min(unassigned.length, 100);
        const toAssign = unassigned.slice(0, maxToAssign);

        setPersons(prev =>
            prev.map(p =>
                toAssign.some(u => u.applicant_number === p.applicant_number)
                    ? { ...p, assigned: true }
                    : p
            )
        );

        axios.put("http://localhost:5000/api/interview_applicants/assign", {
            applicant_numbers: toAssign.map(a => a.applicant_number),
        })
            .then(res => {
                console.log("Updated statuses:", res.data);
                setSnack({
                    open: true,
                    message: `Assigned ${toAssign.length} applicant${toAssign.length > 1 ? "s" : ""} in ${selectedDepartmentFilter}.`,
                    severity: "success",
                });
                fetchApplicants();
            })
            .catch(err => {
                console.error("Failed to update applicant statuses:", err);
            });

    };


    const handleAssignCustom = (countParam) => {
        let count = typeof countParam === "number" && !isNaN(countParam)
            ? countParam
            : Number(customCount);

        if (isNaN(count) || count <= 0) {
            setSnack({
                open: true,
                message: "Please enter a valid number.",
                severity: "warning",
            });
            return;
        }

        // ✅ Get only unassigned applicants in the selected department
        const unassigned = persons.filter(p => {
            if (p.assigned) return false;

            const programInfo = allCurriculums.find(
                (opt) => opt.curriculum_id?.toString() === p.program?.toString()
            );

            // School year filter: compare applicant year with selectedSchoolYear
            const applicantAppliedYear = new Date(p.created_at).getFullYear();
            const schoolYear = schoolYears.find(sy => sy.year_id === selectedSchoolYear);

            const matchesDepartment =
                !selectedDepartmentFilter || programInfo?.dprtmnt_name === selectedDepartmentFilter;

            const matchesProgram =
                !selectedProgramFilter || programInfo?.program_code === selectedProgramFilter;

            const matchesSchoolYear =
                !selectedSchoolYear ||
                (schoolYear && (String(applicantAppliedYear) === String(schoolYear.current_year)));

            const matchesSemester =
                !selectedSchoolSemester || String(p.middle_code) === String(selectedSchoolSemester);

            return matchesDepartment && matchesProgram && matchesSchoolYear && matchesSemester;
        });

        if (unassigned.length === 0) {
            setSnack({
                open: true,
                message: "No applicants available to assign in this department.",
                severity: "warning",
            });
            return;
        }

        // ✅ Sort applicants by total average score (highest first)
        const sortedUnassigned = [...unassigned].sort((a, b) => {
            const aExam = editScores[a.person_id]?.qualifying_exam_score ?? a.qualifying_exam_score ?? 0;
            const aInterview = editScores[a.person_id]?.qualifying_interview_score ?? a.qualifying_interview_score ?? 0;
            const aScore = (Number(aExam) + Number(aInterview)) / 2;

            const bExam = editScores[b.person_id]?.qualifying_exam_score ?? b.qualifying_exam_score ?? 0;
            const bInterview = editScores[b.person_id]?.qualifying_interview_score ?? b.qualifying_interview_score ?? 0;
            const bScore = (Number(bExam) + Number(bInterview)) / 2;

            return bScore - aScore; // higher scores first
        });

        // ✅ Take only up to the requested count
        const maxToAssign = Math.min(sortedUnassigned.length, count);
        const toAssign = sortedUnassigned.slice(0, maxToAssign);

        // ✅ Update persons list (mark assigned)
        setPersons(prev =>
            prev.map(p =>
                toAssign.some(u => u.applicant_number === p.applicant_number)
                    ? { ...p, assigned: true }
                    : p
            )
        );

        axios.put("http://localhost:5000/api/interview_applicants/assign", {
            applicant_numbers: toAssign.map(a => a.applicant_number),
        })
            .then(res => {
                console.log("Updated statuses:", res.data);
                setSnack({
                    open: true,
                    message: `Assigned ${toAssign.length} applicant${toAssign.length > 1 ? "s" : ""} in ${selectedDepartmentFilter}.`,
                    severity: "success",
                });
                fetchApplicants();
            })
            .catch(err => {
                console.error("Failed to update applicant statuses:", err);
            });
    };

    const handleUnassignImmediate = (applicant_number) => {
        axios.put(`http://localhost:5000/api/interview_applicants/unassign/${applicant_number}`)
            .then(res => {
                console.log("Unassign response:", res.data);

                setPersons(prev =>
                    prev.map(p =>
                        p.applicant_number === applicant_number
                            ? { ...p, assigned: false }
                            : p
                    )
                );

                setSnack({
                    open: true,
                    message: `Applicant ${applicant_number} unassigned.`,
                    severity: "info",
                });

                fetchApplicants();
            })
            .catch(err => {
                console.error("Failed to unassign applicant:", err);
                setSnack({
                    open: true,
                    message: "Failed to unassign applicant.",
                    severity: "error",
                });
            });
    };

    // handleUnassignAll
    const handleUnassignAll = () => {
        setPersons(prev => prev.map(p => ({ ...p, assigned: false })));

        axios.put("http://localhost:5000/api/interview_applicants/unassign-all", {
            applicant_numbers: persons.map(a => a.applicant_number),
        })
            .then(res => {
                console.log("Updated statuses:", res.data);
                setSnack({
                    open: true,
                    message: "All applicants unassigned. They can be assigned again.",
                    severity: "info",
                });
                fetchApplicants();
            })
            .catch(err => {
                console.error("Failed to update applicant statuses:", err);
            });
    };


    const [selectedApplicants, setSelectedApplicants] = useState(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [emailSender, setEmailSender] = useState("");



    useEffect(() => {
        const fetchActiveSenders = async () => {
            if (!adminData.dprtmnt_id) return;

            try {
                const res = await axios.get(
                    `http://localhost:5000/api/email-templates/active-senders?department_id=${adminData.dprtmnt_id}`
                );
                if (res.data.length > 0) {
                    setEmailSender(res.data[0].sender_name);
                }
            } catch (err) {
                console.error("Error fetching active senders:", err);
            }
        };

        fetchActiveSenders();
    }, [user, adminData.dprtmnt_id]);

    const [emailMessage, setEmailMessage] = useState("");

    const handleOpenDialog = (applicant = null) => {
        const today = new Date();
        const validUntil = new Date(today);
        validUntil.setDate(today.getDate() + 7);

        const formattedValidUntil = validUntil.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

        const defaultMessage =
            `Dear ${applicant?.first_name || "Applicant"} ${applicant?.last_name || ""},

Congratulations on passing the Interview/Qualifying Exam!  

You must first proceed to the Clinic for your Medical Examination.  
Please bring and present your Medical Examination Permit so the Clinic can verify if you are fit to enroll.  

After completing your Medical Examination, you may then proceed to the Registrar’s Office to submit your Original Documents within 7 days.  
Submissions are accepted only during working hours, Monday to Friday, from 7:00 AM to 4:00 PM.  
Failure to comply within 7 days may result in the slot being given to another applicant.  

This email is valid until ${formattedValidUntil}.  

Thank you,  
EARIST Registrar's Office
`;


        setSelectedApplicant(applicant?.applicant_number || null);
        setEmailMessage(defaultMessage);
        setConfirmOpen(true);
    };


    const confirmSendEmails = async () => {
        setLoading(true)
        const targets = selectedApplicant
            ? persons.filter(p => p.applicant_number === selectedApplicant)
            : persons.filter(p => p.interview_status === 'Accepted');

        if (targets.length === 0) {
            setLoading(false);
            setSnack({ open: true, message: "No applicants to send email to.", severity: "warning" });
            return;
        }

        let successCount = 0;

        for (const applicant of targets) {
            // ✅ Try all possible email fields
            const recipientEmail = applicant.email || applicant.email_address || applicant.emailAddress;

            if (!recipientEmail) {
                console.warn(`⚠️ Applicant ${applicant.applicant_number} has no email field`);
                continue; // skip if no email available
            }

            try {
                // Send email
                await axios.post("http://localhost:5000/api/send-email", {
                    to: recipientEmail,
                    subject: emailSubject,
                    html: emailMessage.replace(/\n/g, "<br/>"),
                    senderName: emailSender,
                });

                // Mark as emailed
                await axios.put(
                    `http://localhost:5000/api/interview_applicants/${applicant.applicant_number}/action`
                );

                successCount++;
            } catch (err) {
                console.error(`❌ Failed for ${applicant.applicant_number}`, err);
                // Continue to next instead of breaking everything
            }

            // optional: small delay to avoid spam blocking (100–300ms)
            await new Promise(res => setTimeout(res, 200));
        }

        // remove the successfully emailed applicants
        setPersons(prev =>
            prev.filter(p => !targets.some(t => t.applicant_number === p.applicant_number))
        );

        setSnack({
            open: true,
            message: `Emails sent to ${successCount} out of ${targets.length} applicants`,
            severity: successCount === targets.length ? "success" : "warning",
        });

        setConfirmOpen(false);
        setSelectedApplicant(null);
        setLoading(false);
    };


    // Email fields - start empty
    const [emailSubject, setEmailSubject] = useState("Submission of Original Documents");


    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const res = await axios.get("http://localhost:5000/interview_schedules_with_count");
                setSchedules(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching schedules:", err);
            }
        };

        fetchSchedules();
    }, []);

    const [selectedApplicant, setSelectedApplicant] = useState(null);


    const [acceptCount, setAcceptCount] = useState(10);
    const handleAcceptTop = async () => {
        try {
            if (!acceptCount || acceptCount <= 0) {
                return setSnack({
                    open: true,
                    message: "Please enter a valid number of applicants to accept.",
                    severity: "error",
                });
            }

            const unassigned = persons.filter(p => {
                if (p.assigned) return false;

                const programInfo = allCurriculums.find(
                    (opt) => opt.curriculum_id?.toString() === p.program?.toString()
                );

                // School year filter: compare applicant year with selectedSchoolYear
                const applicantAppliedYear = new Date(p.created_at).getFullYear();
                const schoolYear = schoolYears.find(sy => sy.year_id === selectedSchoolYear);

                const matchesDepartment =
                    !selectedDepartmentFilter || programInfo?.dprtmnt_name === selectedDepartmentFilter;

                const matchesProgram =
                    !selectedProgramFilter || programInfo?.program_code === selectedProgramFilter;

                const matchesSchoolYear =
                    !selectedSchoolYear || (schoolYear && (String(applicantAppliedYear) === String(schoolYear.current_year)));

                const matchesSemester =
                    !selectedSchoolSemester || String(p.middle_code) === String(selectedSchoolSemester);

                return matchesDepartment && matchesProgram && matchesSchoolYear && matchesSemester;
            });

            if (unassigned.length === 0) {
                setSnack({ open: true, message: "No applicants available to assign in this department.", severity: "warning" });
                return;
            }

            const sortedUnassigned = [...unassigned].sort((a, b) => {
                const aExam = editScores[a.person_id]?.qualifying_exam_score ?? a.qualifying_exam_score ?? 0;
                const aInterview = editScores[a.person_id]?.qualifying_interview_score ?? a.qualifying_interview_score ?? 0;
                const aScore = (Number(aExam) + Number(aInterview)) / 2;

                const bExam = editScores[b.person_id]?.qualifying_exam_score ?? b.qualifying_exam_score ?? 0;
                const bInterview = editScores[b.person_id]?.qualifying_interview_score ?? b.qualifying_interview_score ?? 0;
                const bScore = (Number(bExam) + Number(bInterview)) / 2;

                return bScore - aScore; // higher scores first
            });

            // ✅ Take only up to the requested count
            const maxToAssign = Math.min(sortedUnassigned.length, acceptCount);
            const toAssign = sortedUnassigned.slice(0, maxToAssign);

            setPersons(prev =>
                prev.map(p =>
                    toAssign.some(u => u.applicant_number === p.applicant_number)
                        ? { ...p, assigned: true }
                        : p
                )
            );

            axios.put("http://localhost:5000/api/interview_applicants/assign", {
                applicant_numbers: toAssign.map(a => a.applicant_number),
            })
                .then(res => {
                    console.log("Updated statuses:", res.data);
                    setSnack({
                        open: true,
                        message: `Top ${acceptCount} applicants in ${selectedDepartmentFilter} are now accepted.`,
                        severity: "success",
                    });
                    fetchApplicants();
                })
                .catch(err => {
                    console.error("Failed to update applicant statuses:", err);
                });
        } catch (err) {
            console.error("Error accepting top applicants:", err);
            setSnack({
                open: true,
                message: err.response?.data?.message || "Failed to accept applicants.",
                severity: "error",
            });
        }
    };


    return (
        <Box sx={{ height: 'calc(100vh - 150px)', overflowY: 'auto', pr: 1, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" fontWeight="bold" color="maroon">
                    QUALIFYING EXAMINATION SCORING
                </Typography>


                <Box>

                    <TextField
                        variant="outlined"
                        placeholder="Search Applicant Name / Email / Applicant ID"
                        size="small"
                        style={{ width: '450px' }}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Corrected
                        }}

                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1 }} />,
                        }}
                    />
                </Box>
            </Box>


            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <div style={{ height: "20px" }}></div>


            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "nowrap", // ❌ prevent wrapping
                    width: "100%",
                    mt: 3,
                    gap: 2,
                }}
            >
                {tabs.map((tab, index) => (
                    <Card
                        key={index}
                        onClick={() => handleStepClick(index, tab.to)}
                        sx={{
                            flex: `1 1 ${100 / tabs.length}%`, // evenly divide row
                            height: 120,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            borderRadius: 2,
                            border: "2px solid #6D2323",
                            backgroundColor: activeStep === index ? "#6D2323" : "#E8C999",
                            color: activeStep === index ? "#fff" : "#000",
                            boxShadow:
                                activeStep === index
                                    ? "0px 4px 10px rgba(0,0,0,0.3)"
                                    : "0px 2px 6px rgba(0,0,0,0.15)",
                            transition: "0.3s ease",
                            "&:hover": {
                                backgroundColor: activeStep === index ? "#5a1c1c" : "#f5d98f",
                            },
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Box sx={{ fontSize: 40, mb: 1 }}>{tab.icon}</Box>
                            <Typography sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
                                {tab.label}
                            </Typography>
                        </Box>
                    </Card>
                ))}
            </Box>


            <div style={{ height: "20px" }}></div>


            <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#6D2323' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', textAlign: "Center" }}>Qualifiying Examination Score</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ width: "100%", border: "2px solid maroon", p: 2 }}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={2}>
                    {/* Left Side: From and To Date */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* From Date + Print Button */}
                        <Box display="flex" alignItems="flex-end" gap={2}>
                            <FormControl size="small" sx={{ width: 200 }}>
                                <InputLabel shrink htmlFor="from-date">From Date</InputLabel>
                                <TextField
                                    id="from-date"
                                    type="date"
                                    size="small"
                                    name="fromDate"
                                    value={person.fromDate || ""}
                                    onChange={(e) => setPerson(prev => ({ ...prev, fromDate: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </FormControl>

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
                                    userSelect: "none",
                                    width: "275px", // ✅ same width as Import
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d3d3d3"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
                                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                type="button"
                            >
                                <FcPrint size={20} />
                                Print Qualfying Examination Scores
                            </button>
                        </Box>

                        {/* To Date + Import Button */}
                        <Box display="flex" alignItems="flex-end" gap={2}>
                            <FormControl size="small" sx={{ width: 200 }}>
                                <InputLabel shrink htmlFor="to-date">To Date</InputLabel>
                                <TextField
                                    id="to-date"
                                    type="date"
                                    size="small"
                                    name="toDate"
                                    value={person.toDate || ""}
                                    onChange={(e) => setPerson(prev => ({ ...prev, toDate: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </FormControl>

                            {/* ✅ Import Excel beside To Date */}
                            <Box display="flex" alignItems="center" gap={1}>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                    id="excel-upload"
                                />

                                {/* ✅ Button that triggers file input */}
                                <button
                                    onClick={() => document.getElementById("excel-upload").click()}
                                    style={{
                                        padding: "5px 20px",
                                        border: "2px solid green",
                                        backgroundColor: "#f0fdf4",
                                        color: "green",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        height: "40px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        userSelect: "none",
                                        width: "200px", // ✅ same width as Print
                                    }}
                                    type="button"
                                >
                                    <FaFileExcel size={20} />
                                    Choose Excel
                                </button>
                            </Box>

                            <Button
                                variant="contained"
                                sx={{
                                    height: "40px",
                                    width: "200px", // ✅ matches Print
                                    backgroundColor: "green",
                                    "&:hover": { backgroundColor: "#166534" },
                                    fontWeight: "bold",
                                }}
                                onClick={handleImport}
                            >
                                Import Applicants
                            </Button>
                        </Box>
                    </Box>

                    {/* Right Side: Campus Dropdown */}
                    <Box display="flex" flexDirection="column" gap={1} sx={{ minWidth: 200 }}>
                        <Typography fontSize={13}>Campus:</Typography>
                        <FormControl size="small" sx={{ width: "200px" }}>
                            <InputLabel id="campus-label">Campus</InputLabel>
                            <Select
                                labelId="campus-label"
                                id="campus-select"
                                name="campus"
                                value={person.campus ?? ""}
                                onChange={(e) => {
                                    setPerson(prev => ({ ...prev, campus: e.target.value }));
                                    setCurrentPage(1);
                                }}
                            >
                                <MenuItem value=""><em>All Campuses</em></MenuItem>
                                <MenuItem value="0">MANILA</MenuItem>
                                <MenuItem value="1">CAVITE</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </TableContainer>



            <TableContainer component={Paper} sx={{ width: '100%', }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                        <TableRow>
                            <TableCell colSpan={10} sx={{ border: "2px solid maroon", py: 0.5, backgroundColor: '#6D2323', color: "white" }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    {/* Left: Total Count */}
                                    <Typography fontSize="14px" fontWeight="bold" color="white">
                                        Total Applicants: {filteredPersons.length}
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
                                            of {totalPages} page{totalPages > 1 ? 's' : ''}
                                        </Typography>


                                        {/* Next & Last */}
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
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>






            <TableContainer component={Paper} sx={{ width: '100%', border: "2px solid maroon", p: 2 }}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={3} columnGap={5}>

                    {/* LEFT COLUMN: Sorting & Status Filters */}
                    <Box display="flex" flexDirection="column" gap={2}>

                        {/* Sort By */}
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "10px" }}>Sort By:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} displayEmpty>
                                    <MenuItem value="">Select Field</MenuItem>
                                    <MenuItem value="name">Applicant's Name</MenuItem>
                                    <MenuItem value="id">Applicant ID</MenuItem>
                                    <MenuItem value="email">Email Address</MenuItem>
                                </Select>
                            </FormControl>
                            <Typography fontSize={13} sx={{ minWidth: "10px" }}>Sort Order:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} displayEmpty>
                                    <MenuItem value="">Select Order</MenuItem>
                                    <MenuItem value="asc">Ascending</MenuItem>
                                    <MenuItem value="desc">Descending</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>



                        <Box display="flex" alignItems="center" gap={3} mb={2}>
                            {/* 🔢 Top Highest (just for display/filtering) */}
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontSize={13} sx={{ minWidth: "80px", textAlign: "right" }}>
                                    Top Highest:
                                </Typography>
                                <FormControl size="small" sx={{ width: 120 }}>
                                    <Select
                                        value={topCount}
                                        onChange={(e) => {
                                            setTopCount(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <MenuItem value={10}>Top 10</MenuItem>
                                        <MenuItem value={25}>Top 25</MenuItem>
                                        <MenuItem value={50}>Top 50</MenuItem>
                                        <MenuItem value={100}>Top 100</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* ✅ Accept Top N Waiting List */}
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontSize={13} sx={{ minWidth: "90px", textAlign: "right" }}>
                                    Accept Count:
                                </Typography>
                                <FormControl size="small" sx={{ width: 120 }}>
                                    <Select
                                        value={acceptCount}
                                        onChange={(e) => setAcceptCount(Number(e.target.value))}
                                    >
                                        {[10, 25, 50, 100].map((n) => (
                                            <MenuItem key={n} value={n}>Top {n}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleAcceptTop}
                                    sx={{ ml: 1, height: 40 }}
                                >
                                    Accept Top
                                </Button>
                            </Box>
                        </Box>
                    </Box>

                    {/* MIDDLE COLUMN: SY & Semester */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>School Year:</Typography>
                            <FormControl size="small" sx={{ width: "200px" }}>
                                <InputLabel id="school-year-label">School Years</InputLabel>
                                <Select
                                    labelId="school-year-label"
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
                                <InputLabel id="semester-label">School Semester</InputLabel>
                                <Select
                                    labelId="semester-label"
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

                    {/* RIGHT COLUMN: Department & Program */}
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
                                        <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_name}>
                                            {dep.dprtmnt_name} ({dep.dprtmnt_code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} sx={{ minWidth: "100px" }}>Program:</Typography>
                            <FormControl size="small" sx={{ width: "350px" }}>
                                <Select
                                    value={selectedProgramFilter}
                                    onChange={(e) => setSelectedProgramFilter(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">All Programs</MenuItem>
                                    {curriculumOptions.map((prog) => (
                                        <MenuItem key={prog.curriculum_id} value={prog.program_code}>
                                            {prog.program_code} - {prog.program_description}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </Box>

                    </Box>
                    {/* RIGHT SIDE: Action Buttons */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",  // ✅ pushes everything to the right
                            width: "100%",
                            mt: 2
                        }}
                    >
                        <Box display="flex" gap={2} alignItems="center">
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleAssignMax}
                                sx={{ minWidth: 150 }}
                            >
                                Assign Max
                            </Button>

                            {/* 🔥 New Custom Assign Input + Button */}
                            <TextField
                                type="number"
                                size="small"
                                label="Custom Count"
                                value={customCount}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setCustomCount(v === "" ? 0 : parseInt(v, 10));
                                }}
                                sx={{ width: 120 }}
                            />

                            <Button
                                variant="contained"
                                color="warning"
                                onClick={() => handleAssignCustom()}
                                sx={{ minWidth: 150 }}
                            >
                                Assign Custom
                            </Button>

                            {/* 🔥 New Unassign All Button */}
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleUnassignAll}
                                sx={{ minWidth: 150 }}
                            >
                                Unassign All
                            </Button>

                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => handleOpenDialog(null)} // for batch mode
                                sx={{ width: "130px", height: "37px" }}
                            >
                                Send Email
                            </Button>
                        </Box>
                    </Box>

                </Box>
            </TableContainer>

            <div ref={divToPrintRef}>

            </div>


            <TableContainer component={Paper} sx={{ width: "100%" }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: "#6D2323" }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "2%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                #
                            </TableCell>

                            <TableCell sx={{ color: "white", textAlign: "center", width: "8%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Applicant ID
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "25%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Name
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "20%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Program
                            </TableCell>

                            {/* Exam Columns */}
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Qualifying Exam Score
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Qualifying Interview Score
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Total Ave.
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Status
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Date
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "10%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                Action
                            </TableCell>
                            <TableCell sx={{ color: "white", textAlign: "center", width: "15%", py: 0.5, fontSize: "12px", border: "2px solid maroon" }}>
                                User
                            </TableCell>



                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentPersons.map((person, index) => {
                            const qualifyingExam = editScores[person.person_id]?.qualifying_exam_score ?? person.qualifying_exam_score ?? 0;
                            const qualifyingInterview = editScores[person.person_id]?.qualifying_interview_score ?? person.qualifying_interview_score ?? 0;
                            const computedTotalAve = (Number(qualifyingExam) + Number(qualifyingInterview)) / 2;
                            const applicantId = person.applicant_number;
                            const isAssigned = !!person.schedule_id; // ✅ check if already assigned


                            return (
                                <TableRow key={person.person_id}>
                                    {/* # */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: "2px solid maroon",
                                            borderLeft: "2px solid maroon",
                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {index + 1}
                                    </TableCell>

                                    {/* Applicant Number */}
                                    <TableCell
                                        sx={{
                                            color: "blue",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            border: "2px solid maroon",
                                            borderLeft: "2px solid maroon",
                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                        onClick={() => handleRowClick(person.person_id)}
                                    >
                                        {person.applicant_number ?? "N/A"}
                                    </TableCell>

                                    {/* Applicant Name */}
                                    <TableCell
                                        sx={{
                                            color: "blue",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            border: "2px solid maroon",
                                            borderLeft: "2px solid maroon",
                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                        onClick={() => handleRowClick(person.person_id)}
                                    >
                                        {`${person.last_name}, ${person.first_name} ${person.middle_name ?? ""} ${person.extension ?? ""}`}
                                    </TableCell>

                                    {/* Program */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: "2px solid maroon",
                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {curriculumOptions.find(
                                            (item) =>
                                                item.curriculum_id?.toString() === person.program?.toString()
                                        )?.program_code ?? "N/A"}
                                    </TableCell>

                                    {/* Qualifying Exam Score */}
                                    <TableCell sx={{ border: "2px solid maroon", textAlign: "center" }}>
                                        <TextField
                                            value={qualifyingExam}
                                            onChange={(e) =>
                                                handleScoreChange(person, "qualifying_exam_score", Number(e.target.value))
                                            }
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>

                                    {/* Qualifying Interview Score */}
                                    <TableCell sx={{ border: "2px solid maroon", textAlign: "center" }}>
                                        <TextField
                                            value={qualifyingInterview}
                                            onChange={(e) =>
                                                handleScoreChange(person, "qualifying_interview_score", Number(e.target.value))
                                            }
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>

                                    {/* ✅ Total Average (read-only, comes from DB or recomputed) */}
                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: "2px solid maroon",
                                            py: 0.5,
                                            fontSize: "15px",
                                        }}
                                    >
                                        {computedTotalAve.toFixed(2)}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            textAlign: "center",
                                            border: "2px solid maroon",
                                            fontSize: "12px",
                                        }}
                                    >
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={
                                                    person.college_approval_status && person.college_approval_status !== "On Process"
                                                        ? person.college_approval_status
                                                        : "Waiting List"   // ✅ default to Waiting List
                                                }
                                                onChange={(e) =>
                                                    handleStatusChange(person.applicant_number, e.target.value)
                                                }
                                                displayEmpty
                                            >
                                                <MenuItem value="Accepted">Accepted</MenuItem>
                                                <MenuItem value="Rejected">Rejected</MenuItem>
                                                <MenuItem value="Waiting List">Waiting List</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </TableCell>


                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: "2px solid maroon",

                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {person.created_at}
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            textAlign: "center",
                                            border: "2px solid maroon",

                                            verticalAlign: "middle",
                                        }}
                                    >
                                        {person.interview_status === "Accepted" ? (
                                            <Box
                                                display="flex"
                                                justifyContent="center"
                                                alignItems="center"
                                                gap={2}
                                                sx={{ width: "100%" }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    sx={{ width: "120px", height: "38px" }}
                                                    onClick={() => handleUnassignImmediate(person.applicant_number)}
                                                >
                                                    Unassign
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => handleOpenDialog(null)} // for batch mode
                                                    sx={{ width: "120px", height: "38px" }}
                                                >
                                                    Send Email
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                color="success"
                                                size="small"
                                                sx={{ width: "100px", height: "40px" }}
                                                onClick={() => handleAssignSingle(person.applicant_number)}
                                            >
                                                Assign
                                            </Button>
                                        )}
                                    </TableCell>



                                    <TableCell
                                        sx={{
                                            color: "black",
                                            textAlign: "center",
                                            border: "2px solid maroon",

                                            py: 0.5,
                                            fontSize: "12px",
                                        }}
                                    >
                                        {person.registrar_user_email
                                            ? person.registrar_user_email // ✅ only email, no (registrar)
                                            : person.exam_user_email
                                                ? person.exam_user_email // ✅ only email, no (exam)
                                                : "N/A"}
                                    </TableCell>

                                </TableRow>
                            );
                        })}
                    </TableBody>


                </Table>
            </TableContainer>

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: "#800000", color: "white" }}>
                    ✉️ Edit & Send Email
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    {/* Sender */}
                    <TextField
                        label="Sender"
                        value={emailSender}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        sx={{ mb: 3 }}
                    />

                    {/* Subject */}
                    <TextField
                        label="Subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        fullWidth
                        sx={{ mb: 3 }}
                    />

                    {/* Message */}
                    <TextField
                        label="Message"
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        fullWidth
                        multiline
                        minRows={10}
                        placeholder="Write your message here..."
                        sx={{
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap",
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
                    <Button
                        onClick={() => setConfirmOpen(false)}
                        color="error"
                        variant="outlined"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={confirmSendEmails}
                        color="success"
                        variant="contained"
                        sx={{ minWidth: "140px", height: "40px" }}
                    >
                        Send Emails
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snack.severity} onClose={handleClose} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>



            <Snackbar
                open={snack.open}

                onClose={handleSnackClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
            <LoadingOverlay open={loading} message="Sending emails, please wait..." />
        </Box >
    );
};

export default QualifyingExamScore;