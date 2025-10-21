import {
  EventNote,          // for Schedule Plotting Form
  Apartment,          // for Department Section Panel
  Assignment,         // for Department Panel
  MeetingRoom         // for Department Room Panel
} from "@mui/icons-material";
import React from "react";
import { Link } from 'react-router-dom';

const DepartmentManagement = () => {
  return (
    <div className="p-2 px-10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

        {/* Schedule Plotting Form */}
        <div className="relative">
          <Link to={'/select_college'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <EventNote className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              SCHEDULE PLOTTING FORM
            </button>
          </Link>
        </div>

        {/* Department Section Panel */}
        <div className="relative">
          <Link to={'/department_section_panel'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <Apartment className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              DEPARTMENT SECTION PANEL
            </button>
          </Link>
        </div>

        {/* Department Panel */}
        <div className="relative">
          <Link to={'/department_registration'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <Assignment className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              DEPARTMENT PANEL
            </button>
          </Link>
        </div>

        {/* Department Room Panel */}
        <div className="relative">
          <Link to={'/department_room'}>
            <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
              <MeetingRoom className="text-maroon-500 text-2xl" />
            </div>
            <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
              DEPARTMENT ROOM PANEL
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default DepartmentManagement;
