import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../core/store/hooks';
import { selectUser } from '../../core/auth/authSlice';
import socket from '../../core/socket/socket';
import {
  fetchConversations,
  fetchMessages,
  searchUser,
  startConversation,
  setActiveConversation,
  addMessage,
  addConversation,
  clearSearch,
  markAsRead,
  selectConversations,
  selectActiveId,
  selectActiveConversation,
  selectMessages,
  selectSearchResult,
  selectSearchStatus,
  selectUnreadCount,
  type Conversation,
  type Message,
} from './conversationsSlice';

// ─── Layout ────────────────────────────────────────────────────────────────

const MessengerWrapper = styled.div`
  position: fixed;
  top: 6rem;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: var(--bg-dark);
  z-index: 10;
`;

const LeftPanel = styled.aside`
  width: 30rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-medium);
  border-right: 1px solid var(--border-color);
`;

const PanelHeader = styled.div`
  padding: 1.6rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const PanelTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--txt-primary);
  margin: 0;
`;

const NewButton = styled.button`
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  border: none;
  background: var(--accent-primary);
  color: white;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: #d63552;
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.2rem 1.6rem;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'rgba(233, 69, 96, 0.12)' : 'transparent')};
  border-left: 3px solid ${({ $active }) => ($active ? 'var(--accent-primary)' : 'transparent')};
  transition: background 0.15s;

  &:hover {
    background: ${({ $active }) => ($active ? 'rgba(233, 69, 96, 0.15)' : 'rgba(255,255,255,0.04)')};
  }
`;

const Avatar = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
`;

const ConvInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConvName = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--txt-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConvPreview = styled.div`
  font-size: 1.2rem;
  color: var(--txt-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.2rem;
`;

const UnreadBadge = styled.span`
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border-radius: 1rem;
  background: var(--accent-primary);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const RightPanel = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Placeholder = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--txt-muted);
  font-size: 1.6rem;
`;

// ─── Chat Panel ────────────────────────────────────────────────────────────

const ChatWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const ChatHeader = styled.div`
  padding: 1.4rem 2rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-medium);
  flex-shrink: 0;
`;

const ChatHeaderName = styled.h3`
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--txt-primary);
  margin: 0;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.6rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const MessageBubble = styled.div<{ $mine: boolean }>`
  max-width: 60%;
  padding: 0.8rem 1.2rem;
  border-radius: ${({ $mine }) => ($mine ? '1.2rem 1.2rem 0.2rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.2rem')};
  background: ${({ $mine }) => ($mine ? 'var(--accent-primary)' : 'var(--bg-medium)')};
  color: var(--txt-primary);
  font-size: 1.4rem;
  line-height: 1.5;
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  border: ${({ $mine }) => ($mine ? 'none' : '1px solid var(--border-color)')};
  word-break: break-word;
`;

const InputForm = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1.2rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-medium);
  flex-shrink: 0;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 1rem 1.4rem;
  font-size: 1.4rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  color: var(--txt-primary);
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: var(--txt-muted);
  }

  &:focus {
    border-color: var(--accent-primary);
  }
`;

const SendButton = styled.button`
  padding: 1rem 2rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 2rem;
  font-size: 1.4rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #d63552;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ─── Modal ─────────────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const ModalCard = styled.div`
  background: var(--bg-medium);
  border: 1px solid var(--border-color);
  border-radius: 0.8rem;
  padding: 2rem;
  width: 32rem;
  max-height: 50rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;

const ModalTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--txt-primary);
  margin: 0 0 1.6rem;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--txt-muted);
  font-size: 2rem;
  cursor: pointer;
`;

const UserList = styled.div`
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const UserItem = styled.button`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1.2rem;
  background: transparent;
  border: none;
  border-radius: 0.6rem;
  cursor: pointer;
  text-align: left;
  color: var(--txt-primary);
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const UserName = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
`;

// ─── ConversationRow ───────────────────────────────────────────────────────

type ConversationRowProps = {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
};

const ConversationRow = ({ conv, active, onClick }: ConversationRowProps) => {
  const unread = useAppSelector(selectUnreadCount(conv.id));
  return (
    <ConversationItem $active={active} onClick={onClick}>
      <Avatar>{conv.otherUser.name[0].toUpperCase()}</Avatar>
      <ConvInfo>
        <ConvName>{conv.otherUser.name}</ConvName>
        {conv.lastMessage && <ConvPreview>{conv.lastMessage.text}</ConvPreview>}
      </ConvInfo>
      {unread > 0 && <UnreadBadge>{unread > 99 ? '99+' : unread}</UnreadBadge>}
    </ConversationItem>
  );
};

// ─── ChatPanel ─────────────────────────────────────────────────────────────

type ChatPanelProps = {
  conversation: Conversation;
  currentUserId: number;
};

const ChatPanel = ({ conversation, currentUserId }: ChatPanelProps) => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectMessages(conversation.id));
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchMessages(conversation.id));
    socket.emit('join_conversation', { conversationId: conversation.id });
  }, [conversation.id, dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit('send_message', { conversationId: conversation.id, text: trimmed });
    setText('');
  };

  return (
    <ChatWrapper>
      <ChatHeader>
        <ChatHeaderName>{conversation.otherUser.name}</ChatHeaderName>
      </ChatHeader>
      <MessagesList>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} $mine={msg.senderId === currentUserId}>
            {msg.text}
          </MessageBubble>
        ))}
        <div ref={bottomRef} />
      </MessagesList>
      <InputForm onSubmit={handleSend}>
        <MessageInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение..."
          autoFocus
        />
        <SendButton type="submit" disabled={!text.trim()}>
          Отправить
        </SendButton>
      </InputForm>
    </ChatWrapper>
  );
};

// ─── SearchUserModal ────────────────────────────────────────────────────────

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1.2rem;
  font-size: 1.4rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.4rem;
  color: var(--txt-primary);
  box-sizing: border-box;
  outline: none;
  margin-bottom: 1.6rem;
  transition: border-color 0.2s;

  &::placeholder {
    color: var(--txt-muted);
  }

  &:focus {
    border-color: var(--accent-primary);
  }
`;

const SearchHint = styled.div`
  font-size: 1.3rem;
  color: var(--txt-muted);
  text-align: center;
  padding: 1rem 0;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 0.6rem;
  margin-bottom: 1.2rem;
`;

const UserCardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserCardName = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--txt-primary);
`;

const UserCardUsername = styled.div`
  font-size: 1.2rem;
  color: var(--txt-muted);
  margin-top: 0.2rem;
`;

const StartButton = styled.button`
  padding: 0.7rem 1.4rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;

  &:hover {
    background: #d63552;
  }
`;

const Spinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 1rem auto;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

type SearchModalProps = {
  onClose: () => void;
  onStart: (userId: number) => void;
};

const SearchUserModal = ({ onClose, onStart }: SearchModalProps) => {
  const dispatch = useAppDispatch();
  const searchResult = useAppSelector(selectSearchResult);
  const searchStatus = useAppSelector(selectSearchStatus);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!query.startsWith('@') || query.length < 2) return;
    const timer = setTimeout(() => {
      dispatch(searchUser(query.slice(1)));
    }, 400);
    return () => clearTimeout(timer);
  }, [query, dispatch]);

  const handleClose = () => {
    dispatch(clearSearch());
    onClose();
  };

  const showSpinner = searchStatus === 'loading';
  const showNotFound = searchStatus === 'not_found';
  const showResult = searchStatus === 'idle' && searchResult !== null;
  const showHint = query.length === 0 || (!query.startsWith('@') && query.length > 0);

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalCard onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <ModalClose onClick={handleClose}>×</ModalClose>
        <ModalTitle>Новый диалог</ModalTitle>
        <SearchInput
          placeholder="@nickname"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {showHint && (
          <SearchHint>Введите @nickname чтобы найти пользователя</SearchHint>
        )}
        {showSpinner && <Spinner />}
        {showNotFound && (
          <SearchHint>Пользователь не найден</SearchHint>
        )}
        {showResult && searchResult && (
          <UserCard>
            <Avatar>{searchResult.name[0].toUpperCase()}</Avatar>
            <UserCardInfo>
              <UserCardName>{searchResult.name}</UserCardName>
              <UserCardUsername>@{searchResult.username}</UserCardUsername>
            </UserCardInfo>
            <StartButton onClick={() => onStart(searchResult.id)}>
              Написать
            </StartButton>
          </UserCard>
        )}
      </ModalCard>
    </ModalOverlay>
  );
};

// ─── ConversationsPage ─────────────────────────────────────────────────────

const ConversationsPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const conversations = useAppSelector(selectConversations);
  const activeId = useAppSelector(selectActiveId);
  const activeConversation = useAppSelector(selectActiveConversation);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const numId = id ? parseInt(id, 10) : null;
    dispatch(setActiveConversation(numId && !isNaN(numId) ? numId : null));
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    socket.connect();
    const handleNewMessage = ({ message }: { message: Message }) => {
      dispatch(addMessage(message));
    };
    const handleNewConversation = ({ conversation }: { conversation: Conversation }) => {
      dispatch(addConversation(conversation));
    };
    socket.on('new_message', handleNewMessage);
    socket.on('new_conversation', handleNewConversation);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_conversation', handleNewConversation);
      socket.disconnect();
    };
  }, [dispatch]);

  const handleSelectConversation = (conversationId: number) => {
    dispatch(markAsRead(conversationId));
    navigate(`/conversations/${conversationId}`);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleStartConversation = async (userId: number) => {
    const result = await dispatch(startConversation(userId));
    if (startConversation.fulfilled.match(result)) {
      navigate(`/conversations/${result.payload.id}`);
      setShowModal(false);
    }
  };

  return (
    <MessengerWrapper>
      <LeftPanel>
        <PanelHeader>
          <PanelTitle>Сообщения</PanelTitle>
          <NewButton onClick={handleOpenModal} title="Новый диалог">+</NewButton>
        </PanelHeader>
        <ConversationList>
          {conversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              active={conv.id === activeId}
              onClick={() => handleSelectConversation(conv.id)}
            />
          ))}
        </ConversationList>
      </LeftPanel>

      <RightPanel>
        {activeConversation && currentUser ? (
          <ChatPanel conversation={activeConversation} currentUserId={currentUser.id} />
        ) : (
          <Placeholder>Выберите диалог</Placeholder>
        )}
      </RightPanel>

      {showModal && (
        <SearchUserModal
          onClose={() => setShowModal(false)}
          onStart={handleStartConversation}
        />
      )}
    </MessengerWrapper>
  );
};

export default ConversationsPage;
