import {
  CollectionsBookmark,
  Description,
  EditNote,
  MenuBook,
  LibraryBooks,
} from "@mui/icons-material";
import React from "react";
import { Link } from "react-router-dom";

const CourseManagement = () => {
  const menuItems = [
    {
      title: "PROGRAM TAGGING PANEL",
      link: "/program_tagging",
      icon: <CollectionsBookmark className="text-maroon-500 text-2xl" />,
    },
    {
      title: "PROGRAM PANEL FORM",
      link: "/program_panel",
      icon: <LibraryBooks className="text-maroon-500 text-2xl" />,
    },
    {
      title: "CREATE CURRICULUM",
      link: "/curriculum_panel",
      icon: <EditNote className="text-maroon-500 text-2xl" />,
    },
    {
      title: "COURSE PANEL FORM",
      link: "/course_panel",
      icon: <MenuBook className="text-maroon-500 text-2xl" />,
    },
  ];

  return (
    <div className="p-2 px-10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuItems.map((item, idx) => (
          <div className="relative" key={idx}>
            <Link to={item.link}>
              <div className="bg-white p-4 border-4 rounded-lg border-maroon-500 absolute left-16 top-12 w-enough">
                {item.icon}
              </div>
              <button className="bg-white text-maroon-500 border-4 rounded-lg border-maroon-500 p-4 w-80 h-32 font-medium mt-20 ml-8 flex items-end justify-center">
                {item.title}
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseManagement;
