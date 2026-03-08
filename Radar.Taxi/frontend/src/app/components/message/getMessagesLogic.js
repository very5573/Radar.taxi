// api function
import API from "../../../utils/axiosInstance";

export const getMessages = async ({ conversationId }) => {
  if (!conversationId) return null;

  try {
    const res = await API.get(`/messages/${conversationId}`);

    const conversation = res.data.conversation || null;
    const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];

    const serializedMessages = msgs
      .map((m) => ({
        ...m,
        createdAt: new Date(m.createdAt).toISOString(),
        read: m.read ?? false,
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return { conversation, messages: serializedMessages };
  } catch (err) {
    console.error("❌ getMessages error:", err);
    return null;
  }
};
