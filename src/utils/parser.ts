import type { ChatMessage } from '../types';

export function parseWhatsAppChat(text: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const lines = text.split('\n');

  // Matches iOS format: [12/31/22, 10:15:30 AM] Name: Message
  // Matches Android format: 12/31/22, 10:15 - Name: Message
  // Also supports DD/MM/YYYY vs MM/DD/YYYY to some extent
  const dateRegexiOS = /^\[(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s+(.*?):\s+(.*)$/;
  const dateRegexAndroid = /^(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*-\s+(.*?):\s+(.*)$/;

  let currentMessage: ChatMessage | null = null;
  let counter = 0;

  for (const line of lines) {
    if (line.trim() === '') continue;

    let match = line.match(dateRegexiOS) || line.match(dateRegexAndroid);

    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [_, dateStr, timeStr, sender, content] = match;
      const timestamp = new Date(`${dateStr} ${timeStr}`);

      currentMessage = {
        id: `msg-${counter++}`,
        timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
        sender: sender.trim(),
        content: content.trim(),
        isSystem: false,
      };
    } else {
      // Continuation of previous multi-line message OR a system message
      if (currentMessage) {
        currentMessage.content += '\n' + line.trim();
      }
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  // Filter out system messages (usually don't have a valid sender or contain standard WhatsApp text)
  return messages.filter(m => 
    !m.content.includes('end-to-end encrypted') && 
    !m.sender.includes('added') &&
    !m.sender.includes('removed') &&
    m.sender !== 'Messages and calls are end-to-end encrypted'
  );
}
