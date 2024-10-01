import React from "react";
import { motion } from "framer-motion";

type UIButtonProps = {
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: React.HTMLAttributes<HTMLButtonElement>["className"];
};

const UIButton: React.FC<UIButtonProps> = ({
  color = "bg-gray-600",
  onClick,
  children,
  className,
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex-1 py-2 ${color} rounded-full font-semibold transition-all duration-300 ease-in-out ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

export default UIButton;
