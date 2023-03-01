import React from "react";

export default function Avatar({ userId, username }) {
  const colors = [
    "bg-red-200",
    "bg-green-200",
    "bg-purple-200",
    "bg-blue-200",
    "bg-yellow-200",
    "bg-teal-200",
    "bg-green-200",
    "bg-zinc-200",
    "bg-slate-200",
    "bg-orange-200",
  ];
  const userIdToBase10 = parseInt(userId, 16) % colors.length;

  return (
    <div
      className={
        "w-8 h-8 rounded-full flex items-center justify-center capitalize font-semibold " +
        colors[userIdToBase10]
      }
    >
      <span>{username[0]}</span>
    </div>
  );
}
