// chat/chatDateUtils.js

export const formatLastSeen = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);

  return `${date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

export const getDateLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatMessageTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
