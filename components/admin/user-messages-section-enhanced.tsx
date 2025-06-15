"use client";

import { EnhancedMessageCenter } from "@/components/messages/enhanced-message-center";
import { motion } from "framer-motion";

interface UserMessagesSectionEnhancedProps {
  userId: string;
  userName: string;
}

export function UserMessagesSectionEnhanced({
  userId,
  userName,
}: UserMessagesSectionEnhancedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Direct Messages
          </h3>
          <p className="text-gray-600 mt-1">
            Real-time communication with{" "}
            <span className="font-medium text-blue-600">{userName}</span>
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <EnhancedMessageCenter
          recipientId={userId}
          recipientName={userName}
          isAdminView={true}
        />
      </motion.div>
    </motion.div>
  );
}
