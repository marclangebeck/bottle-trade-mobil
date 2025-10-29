// Test-Chat-Daten für die Entwicklung
// Diese Funktionen können verwendet werden, um Test-Chats zu erstellen

import { getCurrentUser } from './testAuth';

// Erstelle einen Test-Chat zwischen zwei Usern
export const createTestChat = (participant1Id, participant2Id, participant1Name, participant2Name) => {
  const currentUser = getCurrentUser();
  const isCurrentUserInChat = currentUser?.uid === participant1Id || currentUser?.uid === participant2Id;
  
  if (!isCurrentUserInChat) {
    console.log('❌ Aktueller User ist nicht Teilnehmer des Chats');
    return null;
  }

  const chat = {
    id: `test-chat-${Date.now()}`,
    participants: [participant1Id, participant2Id],
    participantNames: [participant1Name, participant2Name],
    lastMessage: 'Test-Chat erstellt',
    lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    unreadCount: 0,
    type: 'direct',
    tradeRequestId: null
  };

  console.log('✅ Test-Chat erstellt:', chat);
  return chat;
};

// Erstelle Test-Nachrichten für einen Chat
export const createTestMessages = (chatId, senderId, receiverId) => {
  const messages = [
    {
      id: `msg-${Date.now()}-1`,
      senderId: senderId,
      senderName: senderId === 'admin-123' ? 'Marc Langebeck' : 'Max Mustermann',
      text: 'Hallo! Das ist eine Test-Nachricht.',
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      reactions: {}
    },
    {
      id: `msg-${Date.now()}-2`,
      senderId: receiverId,
      senderName: receiverId === 'admin-123' ? 'Marc Langebeck' : 'Max Mustermann',
      text: 'Hallo zurück! Wie geht es dir?',
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      reactions: { '👍': [senderId] }
    }
  ];

  console.log('✅ Test-Nachrichten erstellt:', messages);
  return messages;
};

// Test-User-IDs
export const TEST_USERS = {
  ADMIN: {
    id: 'admin-123',
    name: 'Marc Langebeck (Admin)',
    email: 'admin@bottle-trade.de'
  },
  TEST: {
    id: 'test-456', 
    name: 'Max Mustermann',
    email: 'test@bottle-trade.de'
  }
};

// Erstelle einen Test-Chat zwischen Admin und Test-User
export const createAdminTestChat = () => {
  return createTestChat(
    TEST_USERS.ADMIN.id,
    TEST_USERS.TEST.id,
    TEST_USERS.ADMIN.name,
    TEST_USERS.TEST.name
  );
};

// Erstelle einen Test-Chat zwischen Test-User und Admin (umgekehrt)
export const createTestAdminChat = () => {
  return createTestChat(
    TEST_USERS.TEST.id,
    TEST_USERS.ADMIN.id,
    TEST_USERS.TEST.name,
    TEST_USERS.ADMIN.name
  );
};

// Erstelle Test-Nachrichten für Admin-Test-Chat
export const createAdminTestMessages = () => {
  return createTestMessages(
    'test-chat-admin-test',
    TEST_USERS.ADMIN.id,
    TEST_USERS.TEST.id
  );
};
