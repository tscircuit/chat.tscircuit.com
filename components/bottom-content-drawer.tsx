import * as React from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

interface BottomContentDrawerProps {
  /** Sets the initial expanded state of the drawer. */
  openByDefault?: boolean;
  children: React.ReactNode;
}

export function BottomContentDrawer({
  openByDefault = false,
  children,
}: BottomContentDrawerProps) {
  const [isExpanded, setIsExpanded] = React.useState(openByDefault);

  const toggleDrawer = () => {
    setIsExpanded((prev) => !prev);
  };

  // Define heights (in pixels) for the expanded drawer and its header-only state
  const expandedHeight = 800;
  const headerHeight = 40;

  return (
    <motion.div
      // When expanded, y is 0. When collapsed, slide down leaving only the header visible.
      initial={{ y: openByDefault ? 0 : expandedHeight - headerHeight }}
      animate={{ y: isExpanded ? 0 : expandedHeight - headerHeight }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ height: expandedHeight }}
      className="fixed left-0 right-0 bottom-0 z-50 shadow-lg border-t border-gray-200 bg-white shadow-lg rounded-t-lg"
    >
      <div className="h-full flex flex-col">
        {/* Drawer Header */}
        <div className="flex justify-center items-center p-2">
          <button onClick={toggleDrawer} className="text-gray-500 w-full text-center justify-center items-center flex">
            {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>
        </div>
        {/* Drawer Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
