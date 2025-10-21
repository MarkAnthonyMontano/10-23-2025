import React, { useState, useEffect } from "react";
import axios from "axios";
import { Typography, Box, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

const RequirementsForm = () => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Regular"); // ✅ Default category
  const [requirements, setRequirements] = useState([]);
  const [shortLabel, setShortLabel] = useState("");

  // Fetch all requirements
  const fetchRequirements = async () => {
    try {
      const res = await axios.get("http://localhost:5000/requirements");
      setRequirements(res.data);
    } catch (err) {
      console.error("Error fetching requirements:", err);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const [documentStatus, setDocumentStatus] = useState("On Process");


  // Handle submission of a new requirement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Please enter a requirement description.");
      return;
    }
    if (!category) {
      alert("Please select a category.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/requirements", {
        requirements_description: description,
        short_label: shortLabel,
        category: category,
        document_status: documentStatus,  // ✅ new field
      });
      setDescription("");
      setShortLabel("");
      setCategory("Regular");
      fetchRequirements();
    } catch (err) {
      console.error("Error saving requirement:", err);
    }
  };

  // Handle deletion of a requirement
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/requirements/${id}`);
      fetchRequirements();
    } catch (err) {
      console.error("Error deleting requirement:", err);
    }
  };


  // ✅ Group requirements by category
  const groupedRequirements = requirements.reduce((acc, req) => {
    const cat = req.category || "Regular";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(req);
    return acc;
  }, {});

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mt: 2,
          mb: 2,
          px: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "maroon", fontSize: "36px" }}>
          MANAGE REQUIREMENTS
        </Typography>
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
        {/* Left Side - Form */}
        <div style={{ border: "2px solid maroon" }} className="md:w-1/2 bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 style={{ color: "maroon" }} className="text-xl font-semibold mb-4">
            Add a New Requirement
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter requirement description"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={shortLabel}
              onChange={(e) => setShortLabel(e.target.value)}
              placeholder="Enter short label (e.g., F138)"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />


            {/* ✅ Category Selector */}
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="Regular">Regular Requirements</MenuItem>
                <MenuItem value="Medical">Medical Requirements</MenuItem>
                <MenuItem value="Others">Other Requirements</MenuItem>
              </Select>
            </FormControl>

          
            <button
              type="submit"
              className="w-full py-3 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300"
              style={{ backgroundColor: "#800000" }}
            >
              Save Requirement
            </button>
          </form>
        </div>

        {/* Right Side - Display Saved Requirements */}
        <div style={{ border: "2px solid maroon" }} className="md:w-1/2 bg-gray-50 p-6 rounded-lg shadow-sm max-h-96 overflow-y-auto">
          <h3 style={{ color: "maroon" }} className="text-xl font-semibold mb-4">
            Saved Requirements
          </h3>

          {Object.keys(groupedRequirements).map((cat) => (
            <div key={cat}>
              <h4 className="font-bold text-maroon mt-3 mb-2">{cat}:</h4>
              <ul className="space-y-2">
                {groupedRequirements[cat].map((req) => (
                  <li
                    key={req.id}
                    className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center"
                  >
                    <span className="text-gray-800">{req.description}</span>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(req.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
};

export default RequirementsForm;
