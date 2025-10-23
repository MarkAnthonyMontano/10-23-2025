import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Grid,
  Snackbar,
  Alert
} from "@mui/material";

const RoomRegistration = () => {
  const [roomName, setRoomName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    fetchRoomList();
  }, []);

  const fetchRoomList = async () => {
    try {
      const res = await axios.get("http://localhost:5000/room_list");
      setRoomList(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setSnack({ open: true, message: "Failed to fetch rooms", severity: "error" });
    }
  };

  const handleAddRoom = async () => {
    if (!roomName.trim() || !buildingName.trim()) {
      setSnack({ open: true, message: "Room name and building name are required", severity: "warning" });
      return;
    }

    try {
      await axios.post("http://localhost:5000/room", {
        room_name: roomName,
        building_name: buildingName
      });

      setSnack({ open: true, message: "Room successfully added", severity: "success" });
      setRoomName("");
      setBuildingName("");
      fetchRoomList();
    } catch (err) {
      console.error("Error adding room:", err);
      setSnack({ open: true, message: "Failed to add room", severity: "error" });
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setBuildingName(room.building_description);
    setRoomName(room.room_description);
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      await axios.put(`http://localhost:5000/room/${editingRoom.room_id}`, {
        building_name: buildingName,
        room_name: roomName,
      });

      setSnack({ open: true, message: "Room updated successfully", severity: "success" });
      setEditingRoom(null);
      setBuildingName("");
      setRoomName("");
      fetchRoomList();
    } catch (err) {
      console.error("Error updating room:", err);
      setSnack({ open: true, message: "Failed to update room", severity: "error" });
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      await axios.delete(`http://localhost:5000/room/${roomId}`);
      setSnack({ open: true, message: "Room deleted successfully", severity: "success" });
      fetchRoomList();
    } catch (err) {
      console.error("Error deleting room:", err);
      setSnack({ open: true, message: "Failed to delete room", severity: "error" });
    }
  };

  const handleCloseSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // 🔒 Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 🔒 Block DevTools shortcuts + Ctrl+P silently
  document.addEventListener('keydown', (e) => {
    const isBlockedKey =
      e.key === 'F12' ||
      e.key === 'F11' ||
      (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) ||
      (e.ctrlKey && e.key.toLowerCase() === 'u') ||
      (e.ctrlKey && e.key.toLowerCase() === 'p');

    if (isBlockedKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent" }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          mt: 2,
          mb: 2,
          px: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: 'maroon',
            fontSize: '36px',
          }}
        >
          ROOM REGISTRATION
        </Typography>
      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />

      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, border: "2px solid maroon", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#800000" }}>
              {editingRoom ? "Edit Room" : "Register New Room"}
            </Typography>
            <Typography fontWeight={500}>Building Name:</Typography>
            <TextField
              fullWidth
              label="Building Name"
              variant="outlined"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography fontWeight={500}>Room Name:</Typography>
            <TextField
              fullWidth
              label="Room Name"
              variant="outlined"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={editingRoom ? handleUpdateRoom : handleAddRoom}
              sx={{
                backgroundColor: "#800000",
                "&:hover": { backgroundColor: "#a00000" },
              }}
            >
              {editingRoom ? "Update Room" : "Save"}
            </Button>
          </Paper>
        </Grid>

        {/* Room List Section */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, border: "2px solid maroon", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#800000" }}>
              Registered Rooms
            </Typography>

            <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Room ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Building</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Room Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomList.map((room, index) => (
                    <TableRow key={index}>
                      <TableCell>{room.room_id}</TableCell>
                      <TableCell>{room.building_description || "N/A"}</TableCell>
                      <TableCell>{room.room_description}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                            marginRight: 1,
                            "&:hover": { backgroundColor: "#45A049" },
                          }}
                          onClick={() => handleEditRoom(room)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: "#B22222",
                            color: "white",
                            "&:hover": { backgroundColor: "#8B0000" },
                          }}
                          onClick={() => handleDeleteRoom(room.room_id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar Notification */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleCloseSnack} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoomRegistration;
