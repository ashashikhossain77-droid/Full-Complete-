/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  Users,
  MessageSquare,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  Clock,
  Flame,
  CheckCheck,
  Paperclip,
  Search,
  Volume2,
  VolumeX,
  ChevronDown,
  Layers,
  ThumbsUp,
  Flame as FlameIcon,
  RefreshCw,
  Sliders,
  Check,
  Tag,
  Share2,
  Maximize2,
  Minimize2,
  BellRing,
  Trash2,
  ShieldCheck,
  UserCheck,
  AtSign,
  Hash,
  Calculator,
  Compass,
  BarChart3,
  Target,
  Info,
  Pin,
  PinOff,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  History,
  ChevronsDown
} from 'lucide-react';
import { UserProfile, LineEntry, UserChatMessage, ChatChannel, ChatUserMember } from '../types';
import {
  DEFAULT_CHAT_MEMBERS,
  CHAT_MENTION_GROUPS,
  ChatMentionGroup,
  DEFAULT_CHAT_CHANNELS,
  INITIAL_USER_CHAT_MESSAGES,
  QUICK_SHOP_FLOOR_CHIPS
} from '../data/userChatData';
import { MentionSuggestionsMenu } from './chat/MentionSuggestionsMenu';
import { ChatMemberCardModal } from './chat/ChatMemberCardModal';
import { ChatMessageItem } from './chat/ChatMessageItem';
import { ChatUserListView } from './chat/ChatUserListView';
import { ChatHistoryModal } from './chat/ChatHistoryModal';

export type ChatHubTab = 'team-chat' | 'user-directory' | 'ai-advisor';
export type ChatRoleType = 'general' | 'complex' | 'fast';
export type ChannelCategoryFilter = 'all' | 'ie' | 'floor' | 'dm' | 'mentions';

interface UserChatHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines?: LineEntry[];
  profile: UserProfile;
  initialTab?: ChatHubTab;
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  MessageSquare,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  Clock,
  Flame,
  Sliders,
  Calculator,
  Compass,
  BarChart3,
  Target,
  Layers,
  Pin
};

export const UserChatHubModal: React.FC<UserChatHubModalProps> = ({
  isOpen,
  onClose,
  lines = [],
  profile,
  initialTab = 'team-chat'
}) => {
  const [activeTab, setActiveTab] = useState<ChatHubTab>(initialTab);
  const [activeChannelId, setActiveChannelId] = useState<string>('ie-line-balancing');
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ChannelCategoryFilter>('all');
  const [isPinnedDrawerOpen, setIsPinnedDrawerOpen] = useState(false);

  // Member profile popup state
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<ChatUserMember | null>(null);

  // Mention Autocomplete Engine State
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionTriggerPos, setMentionTriggerPos] = useState<number>(-1);

  // Active persona (allows testing chat as supervisor, mechanic, or yourself)
  const [activePersonaId, setActivePersonaId] = useState<string>('self');

  // User Presence & Status state (persisted to localStorage)
  const [myStatus, setMyStatus] = useState<'online' | 'busy' | 'on_floor' | 'offline'>(() => {
    try {
      return (localStorage.getItem('ie_user_presence_status') as any) || 'online';
    } catch {
      return 'online';
    }
  });

  const [myStatusNote, setMyStatusNote] = useState<string>(() => {
    try {
      return localStorage.getItem('ie_user_presence_note') || 'Active in Cockpit';
    } catch {
      return 'Active in Cockpit';
    }
  });

  const handleUpdateMyStatus = (status: 'online' | 'busy' | 'on_floor' | 'offline', note: string) => {
    setMyStatus(status);
    setMyStatusNote(note);
    try {
      localStorage.setItem('ie_user_presence_status', status);
      localStorage.setItem('ie_user_presence_note', note);
    } catch {}
  };

  // --- Team Chat Messages State ---
  const [teamMessages, setTeamMessages] = useState<UserChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ie_team_chat_messages_v2');
      if (saved) {
        const parsed: UserChatMessage[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasAnyPinned = parsed.some(m => m.isPinned);
          if (!hasAnyPinned) {
            return parsed.map(m => {
              const init = INITIAL_USER_CHAT_MESSAGES.find(im => im.id === m.id);
              if (init?.isPinned) {
                return { ...m, isPinned: true, pinnedBy: init.pinnedBy, pinnedAt: init.pinnedAt };
              }
              return m;
            });
          }
          return parsed;
        }
      }
    } catch {}
    return INITIAL_USER_CHAT_MESSAGES;
  });

  const [composerText, setComposerText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTagLine, setSelectedTagLine] = useState<string>('');
  const [isSimulatingTyping, setIsSimulatingTyping] = useState(false);
  const [simulatingName, setSimulatingName] = useState('');

  // --- AI Advisor State ---
  const [aiRoleType, setAiRoleType] = useState<ChatRoleType>('general');
  const [aiIncludeTelemetry, setAiIncludeTelemetry] = useState(true);
  const [aiInputText, setAiInputText] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: 'user' | 'model'; content: string; timestamp: string }>>(() => {
    try {
      const saved = localStorage.getItem('ie_gemini_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg_ai_welcome',
        role: 'model',
        content: `Hello ${profile?.name || 'Engineer'}! I am your AI Industrial Engineering Chatbot powered by Google Gemini.\n\nI can analyze real-time shop floor lines, balance workstation cycles, resolve bottlenecks, and optimize operator assignments. How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [aiSummaryModalText, setAiSummaryModalText] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Chat History Drawer / Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Scroll Container Refs and Scroll Tracking
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll detection in team messages container
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    const isNearTop = scrollTop < 50;

    setShowScrollBottom(!isNearBottom);
    setShowScrollTop(!isNearTop && scrollHeight > clientHeight + 100);
  };

  // Scroll handlers
  const handleScrollToTop = () => {
    if (activeTab === 'team-chat' && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeTab === 'ai-advisor' && aiMessagesContainerRef.current) {
      aiMessagesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToBottom = () => {
    if (activeTab === 'team-chat' && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else if (activeTab === 'ai-advisor' && aiMessagesContainerRef.current) {
      aiMessagesContainerRef.current.scrollTo({
        top: aiMessagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Reset default chat messages
  const handleRestoreDefaultMessages = () => {
    setTeamMessages(INITIAL_USER_CHAT_MESSAGES);
    try {
      localStorage.setItem('ie_team_chat_messages_v2', JSON.stringify(INITIAL_USER_CHAT_MESSAGES));
    } catch {}
  };

  // Clear chat history
  const handleClearChatHistory = () => {
    setTeamMessages([]);
    try {
      localStorage.setItem('ie_team_chat_messages_v2', JSON.stringify([]));
    } catch {}
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ie_team_chat_messages_v2', JSON.stringify(teamMessages));
    } catch {}
  }, [teamMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('ie_gemini_chat_history', JSON.stringify(aiMessages));
    } catch {}
  }, [aiMessages]);

  // Auto-scroll when messages or tab change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeTab, activeChannelId, teamMessages, aiMessages, isSimulatingTyping]);

  // Online members count for presence badges
  const onlineMembersCount = DEFAULT_CHAT_MEMBERS.filter(m => m.status === 'online').length;

  // Active DM member details if current channel is a direct message
  const dmTargetMember = activeChannelId.startsWith('dm_')
    ? DEFAULT_CHAT_MEMBERS.find(m => m.id === activeChannelId.replace('dm_', '')) || null
    : null;

  // Active channel
  const currentChannel = DEFAULT_CHAT_CHANNELS.find(c => c.id === activeChannelId) || {
    id: activeChannelId,
    name: dmTargetMember ? dmTargetMember.name : activeChannelId.replace('dm_', '@'),
    description: dmTargetMember
      ? `${dmTargetMember.role} • ${dmTargetMember.status.replace('_', ' ')}`
      : 'Direct confidential messaging',
    iconName: 'MessageSquare' as any,
    category: 'dm' as any,
    memberCount: 2
  };

  // Calculate sender details
  const getSenderDetails = () => {
    if (activePersonaId === 'self') {
      return {
        id: 'user_self',
        name: profile.name || 'Ashik Hossain',
        role: profile.jobTitle || 'Senior IE Lead',
        avatar: profile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        department: 'IE'
      };
    }
    const member = DEFAULT_CHAT_MEMBERS.find(m => m.id === activePersonaId);
    if (member) {
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        department: member.department
      };
    }
    return {
      id: 'user_self',
      name: profile.name || 'Ashik Hossain',
      role: profile.jobTitle || 'Senior IE Lead',
      avatar: profile.photoURL,
      department: 'IE'
    };
  };

  // Channel messages with search, category filtering, and urgent filter
  const senderDetails = getSenderDetails();
  const filteredTeamMessages = teamMessages
    .filter(m => {
      if (categoryFilter === 'mentions') {
        const text = m.content.toLowerCase();
        const myName = senderDetails.name.toLowerCase();
        return (
          text.includes(`@${myName}`) ||
          (myName.includes('ashik') && text.includes('@ashik')) ||
          text.includes('@ie team') ||
          text.includes('@all')
        );
      }
      return m.channelId === activeChannelId;
    })
    .filter(m => {
      if (filterUrgentOnly && !m.isUrgent) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.content.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          (m.taggedLine && m.taggedLine.toLowerCase().includes(q))
        );
      }
      return true;
    });

  // Pinned messages for the current active channel (or all pinned if in mentions view)
  const channelPinnedMessages = teamMessages.filter(m => {
    if (!m.isPinned) return false;
    if (categoryFilter === 'mentions') return true;
    return m.channelId === activeChannelId;
  });

  const playAudioBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {}
  };

  // Mention Autocomplete Handlers
  const handleComposerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setComposerText(val);

    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9. _-]*)$/);

    if (atMatch) {
      setMentionTriggerPos(cursor - atMatch[1].length - 1);
      setMentionQuery(atMatch[1]);
      setMentionMenuOpen(true);
      setMentionSelectedIndex(0);
    } else {
      setMentionMenuOpen(false);
    }
  };

  const handleInsertMention = (mentionTag: string) => {
    const tagToInsert = mentionTag.startsWith('@') ? mentionTag : `@${mentionTag}`;
    const withSpace = `${tagToInsert} `;

    if (mentionTriggerPos >= 0) {
      const before = composerText.slice(0, mentionTriggerPos);
      const cursor = textareaRef.current?.selectionStart ?? composerText.length;
      const after = composerText.slice(cursor);
      const newText = before + withSpace + after;
      setComposerText(newText);
    } else {
      setComposerText(prev => (prev ? `${prev.trim()} ${withSpace}` : withSpace));
    }

    setMentionMenuOpen(false);
    setMentionTriggerPos(-1);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = (composerText.length + withSpace.length);
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const getFilteredMentionsList = () => {
    const cleanQ = mentionQuery.toLowerCase().trim();
    const groups = CHAT_MENTION_GROUPS.filter(g =>
      g.name.toLowerCase().includes(cleanQ) ||
      g.handle.toLowerCase().includes(cleanQ) ||
      g.department.toLowerCase().includes(cleanQ)
    );
    const members = DEFAULT_CHAT_MEMBERS.filter(m =>
      m.name.toLowerCase().includes(cleanQ) ||
      m.role.toLowerCase().includes(cleanQ) ||
      m.department.toLowerCase().includes(cleanQ) ||
      (m.specialization && m.specialization.toLowerCase().includes(cleanQ))
    );
    return { groups, members, total: groups.length + members.length };
  };

  const handleKeyDownInComposer = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionMenuOpen) {
      const { groups, members, total } = getFilteredMentionsList();
      if (total > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionSelectedIndex(prev => (prev + 1) % total);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionSelectedIndex(prev => (prev - 1 + total) % total);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (mentionSelectedIndex < groups.length) {
            handleInsertMention(groups[mentionSelectedIndex].handle);
          } else {
            const memberIdx = mentionSelectedIndex - groups.length;
            if (members[memberIdx]) {
              handleInsertMention(`@${members[memberIdx].name}`);
            }
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setMentionMenuOpen(false);
          return;
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTeamMessage();
    }
  };

  // Send Team Message
  const handleSendTeamMessage = (textToSend?: string, urgentFlag?: boolean, tagLine?: string) => {
    const text = (textToSend !== undefined ? textToSend : composerText).trim();
    if (!text) return;

    const sender = getSenderDetails();
    const urgent = urgentFlag !== undefined ? urgentFlag : isUrgent;
    const tagged = tagLine !== undefined ? tagLine : selectedTagLine;

    // Detect mentions in the message
    const mentionedIds: string[] = [];
    DEFAULT_CHAT_MEMBERS.forEach(m => {
      if (text.toLowerCase().includes(`@${m.name.toLowerCase()}`)) {
        mentionedIds.push(m.id);
      }
    });
    CHAT_MENTION_GROUPS.forEach(g => {
      if (text.toLowerCase().includes(g.handle.toLowerCase())) {
        mentionedIds.push(g.id);
      }
    });

    const newMessage: UserChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatar: sender.avatar,
      channelId: activeChannelId,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      isUrgent: urgent,
      taggedLine: tagged || undefined,
      mentions: mentionedIds.length > 0 ? mentionedIds : undefined,
      reactions: {}
    };

    setTeamMessages(prev => [...prev, newMessage]);
    setComposerText('');
    setIsUrgent(false);
    setSelectedTagLine('');
    setMentionMenuOpen(false);

    if (urgent) {
      playAudioBeep();
    }

    // Automated simulated response for realistic IE departmental & floor interaction
    simulateColleagueResponse(activeChannelId, text, urgent);
  };

  // Simulate response from floor or IE colleague
  const simulateColleagueResponse = (channelId: string, userText: string, urgent: boolean) => {
    if (activePersonaId !== 'self') return; // Don't auto-reply if testing other persona

    let responder: ChatUserMember | null = null;
    let replyText = '';
    const lower = userText.toLowerCase();

    // Specific IE Mentions
    if (lower.includes('@nusrat') || lower.includes('nusrat jahan') || channelId === 'ie-line-balancing') {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_nusrat')!;
      replyText = lower.includes('line 04') || lower.includes('collar')
        ? 'Checked @Ashik Hossain! Running Yamazumi pitch chart. Offloading the 11.5s tab notch trimming to Station 07 pulls Station 08 cycle from 64s down to 47.2s (safely below 48.0s takt time). Floater repositioned.'
        : 'Line Balancing update: Takt time alignment is running within 96% Pitch Diagram balance efficiency. Let me know if any floater reassignment is needed.';
    } else if (lower.includes('@kamrul') || lower.includes('kamrul hasan') || channelId === 'ie-time-study') {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_kamrul')!;
      replyText = 'Work Study verified: Observed cycle averaged 28.4s across 15 stopwatch cycles. Rating factor 95% + 12.5% allowance yields standard SMV = 0.505 min (30.3s). GSD database updated.';
    } else if (lower.includes('@jannat') || lower.includes('jannatul') || channelId === 'ie-method-study') {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_jannat')!;
      replyText = 'Method Study review: Folder jig installation reduces operator motion path by 35%. Cycle time reduction is estimated at 6.4s per unit.';
    } else if (lower.includes('@ie team') || channelId === 'ie-capacity-planning' || channelId === 'ie-kaizen-ci') {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_kamrul')!;
      replyText = 'IE Department acknowledges! Work study team has logged this request in the continuous improvement board and will monitor pitch variance on next hourly run.';
    } else if (channelId === 'maintenance-alerts' || lower.includes('@faruk') || lower.includes('@maintenance') || lower.includes('breakdown') || lower.includes('jam') || lower.includes('mechanic')) {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_faruk')!;
      replyText = urgent
        ? '⚠️ Received emergency alert! I am personally heading to the workstation right now with replacement feed dog and timing gauge.'
        : 'Understood. Dispatching Junior Mechanic Jamal to inspect needle alignment and check motor drive belt tension.';
    } else if (channelId === 'line-bottlenecks' || lower.includes('@rafiqul') || lower.includes('@supervisors') || lower.includes('wip') || lower.includes('bottleneck') || lower.includes('cycle')) {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_rafiqul')!;
      replyText = 'Noted on Line 04. I am checking the bundle tickets and moving floater operator Aklima to balance the assembly seam.';
    } else if (channelId === 'quality-alerts' || lower.includes('@sultana') || lower.includes('@quality') || lower.includes('dhu') || lower.includes('defect')) {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_sultana')!;
      replyText = 'Acknowledged. We have flagged the 100% inspection station to pull 5 consecutive garment pieces for needle hole and stitch tension check.';
    }

    if (responder && replyText) {
      const respName = responder.name;
      setTimeout(() => {
        setIsSimulatingTyping(true);
        setSimulatingName(respName);
      }, 600);

      setTimeout(() => {
        setIsSimulatingTyping(false);
        setSimulatingName('');
        const botReply: UserChatMessage = {
          id: `msg_bot_${Date.now()}`,
          senderId: responder!.id,
          senderName: responder!.name,
          senderRole: responder!.role,
          senderAvatar: responder!.avatar,
          channelId,
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now(),
          reactions: { '👍': ['user_self'] }
        };
        setTeamMessages(prev => [...prev, botReply]);
        playAudioBeep();
      }, 1900);
    }
  };

  // Toggle emoji reaction
  const handleToggleReaction = (msgId: string, emoji: string) => {
    setTeamMessages(prev =>
      prev.map(msg => {
        if (msg.id !== msgId) return msg;
        const currentReactions = { ...(msg.reactions || {}) };
        const users = currentReactions[emoji] || [];
        const myId = getSenderDetails().id;

        if (users.includes(myId)) {
          currentReactions[emoji] = users.filter(u => u !== myId);
          if (currentReactions[emoji].length === 0) {
            delete currentReactions[emoji];
          }
        } else {
          currentReactions[emoji] = [...users, myId];
        }

        return { ...msg, reactions: currentReactions };
      })
    );
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = (msgId: string) => {
    const myId = getSenderDetails().id;
    setTeamMessages(prev =>
      prev.map(msg => {
        if (msg.id !== msgId) return msg;
        const acknowledged = msg.acknowledgedBy || [];
        if (!acknowledged.includes(myId)) {
          return { ...msg, acknowledgedBy: [...acknowledged, myId] };
        }
        return msg;
      })
    );
  };

  // Toggle Pin message
  const handleTogglePin = (msgId: string) => {
    const sender = getSenderDetails();
    setTeamMessages(prev =>
      prev.map(msg => {
        if (msg.id !== msgId) return msg;
        const nextPinned = !msg.isPinned;
        return {
          ...msg,
          isPinned: nextPinned,
          pinnedBy: nextPinned ? sender.name : undefined,
          pinnedAt: nextPinned ? Date.now() : undefined
        };
      })
    );
  };

  // Smooth jump to message with temporary highlight ring
  const handleJumpToMessage = (msgId: string) => {
    const el = document.getElementById(`chat-msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-amber-400', 'bg-amber-100/50', 'rounded-2xl', 'p-1', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'bg-amber-100/50', 'p-1');
      }, 3000);
    }
  };

  // Generate Floor Chat Summary with Gemini
  const handleGenerateChatSummary = async () => {
    setIsGeneratingSummary(true);
    setAiSummaryModalText(null);
    try {
      const recentMessages = teamMessages
        .slice(-12)
        .map(m => `[${m.timestamp}] ${m.senderName} (${m.senderRole}): ${m.content} ${m.isUrgent ? '[URGENT]' : ''}`)
        .join('\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleType: 'general',
          messages: [
            {
              role: 'user',
              content: `You are an executive Garment Factory Production & IE Director. Summarize the following shop floor chat communications into an actionable 3-point Shift Status Briefing (Bottlenecks, Maintenance Status, Quality Compliance, and Immediate Recommendations):\n\n${recentMessages}`
            }
          ]
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setAiSummaryModalText(data.content || data.reply || 'Summary generated successfully.');
    } catch (err) {
      setAiSummaryModalText(
        '📊 **Shop Floor Shift Summary** (Offline Fallback):\n• **Bottlenecks:** Line 04 Station 08 (Collar Join) was pacing at 64s; floater operator deployed to split trimming.\n• **Maintenance:** Overlock #M-0412 knife recalibration completed successfully; zero skip stitches observed at 4,500 RPM.\n• **Quality Compliance:** Line 01 in-line DHU held at 0.8% with approved 11-12 SPI collar band.'
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Send message to Gemini AI Advisor
  const handleSendAiMessage = async (textToSend?: string) => {
    const text = (textToSend || aiInputText).trim();
    if (!text || aiIsLoading) return;

    const userMessage = {
      id: `ai_user_${Date.now()}`,
      role: 'user' as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...aiMessages, userMessage];
    setAiMessages(newHistory);
    setAiInputText('');
    setAiIsLoading(true);

    try {
      const telemetryPayload = aiIncludeTelemetry
        ? {
            totalLines: lines.length,
            lines: lines.map(l => ({
              lineNo: l.lineNo,
              style: l.style,
              buyer: l.buyer,
              targetProd: l.targetProd,
              achievedProd: l.achievedProd,
              efficiency: l.efficiency,
              operators: l.mp?.Operator?.present ?? 0,
              helpers: l.mp?.Helper?.present ?? 0,
              smv: l.smv,
              bottleneckOp: l.bottleneck?.station || 'None'
            }))
          }
        : undefined;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          roleType: aiRoleType,
          factoryTelemetry: telemetryPayload
        })
      });

      if (!res.ok) throw new Error(`API error (${res.status})`);
      const data = await res.json();
      const modelMessage = {
        id: `ai_model_${Date.now()}`,
        role: 'model' as const,
        content: data.content || data.reply || 'No response returned from Gemini.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setAiMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      setAiMessages(prev => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'model' as const,
          content: `⚠️ Unable to connect to Gemini API. Please check server connectivity or API key.\n\nError details: ${err.message || 'Network error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="user-chat-hub-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="user-chat-hub-modal"
        onClick={e => e.stopPropagation()}
        className={`w-full bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 cockpit-shell ${
          isExpanded
            ? 'h-[100dvh] sm:h-[94vh] max-w-6xl rounded-t-3xl sm:rounded-2xl'
            : 'h-[92dvh] sm:h-[820px] max-w-4xl rounded-t-3xl sm:rounded-2xl'
        }`}
      >
        {/* Mobile Swipe / Dismiss Handle */}
        <div className="w-12 h-1.5 bg-[#d9d2c2] rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Modal Top Bar */}
        <header className="px-4 py-3 border-b border-[#e7e1d5] flex items-center justify-between shrink-0 bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
              {activeTab === 'team-chat' ? <MessageSquare className="w-5 h-5" /> : <Bot className="w-5 h-5 text-amber-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base sm:text-lg text-[#17343a]">
                  {activeTab === 'team-chat' ? 'Shop Floor Communications' : 'Industrial Engineering AI Advisor'}
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dceceb] text-[#176f78]">
                  {activeTab === 'team-chat' ? 'Team Real-Time' : 'Gemini 3.8 Flash'}
                </span>
              </div>
              <p className="text-xs text-[#527078] truncate">
                {activeTab === 'team-chat'
                  ? `#${currentChannel.name} • ${currentChannel.description}`
                  : 'Multi-turn line balancing, SMV calculation & bottleneck solver'}
              </p>
            </div>
          </div>

          {/* Action Tools & Close */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              className="p-2 rounded-xl text-slate-500 hover:bg-[#f1eee6] transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#176f78]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-500 hover:bg-[#f1eee6] transition-colors"
              title={isExpanded ? 'Restore size' : 'Expand window'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              aria-label="Close Chat Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Primary Tabs: Floor Team Chat vs Team Directory vs AI Advisor */}
        <div className="flex items-center border-b border-[#e7e1d5] px-2 sm:px-4 pt-1 bg-[#f5f3ec]/60 shrink-0 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('team-chat')}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
              activeTab === 'team-chat'
                ? 'border-[#176f78] text-[#176f78] bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#176f78]'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Channels & Chat</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono-numbers">
              {DEFAULT_CHAT_CHANNELS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('user-directory')}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
              activeTab === 'user-directory'
                ? 'border-[#176f78] text-[#176f78] bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#176f78]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Team Directory</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineMembersCount} Online</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ai-advisor')}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
              activeTab === 'ai-advisor'
                ? 'border-[#176f78] text-[#176f78] bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#176f78]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>IE AI Consultant</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
              AI
            </span>
          </button>
        </div>

        {/* TAB 1: FLOOR & IE DEPARTMENT CHAT */}
        {activeTab === 'team-chat' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
            {/* Left Channel & Member Drawer / Sidebar */}
            <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[#e7e1d5] bg-white/60 flex flex-col shrink-0">
              {/* Category Filter Pills (Mobile & Desktop) */}
              <div className="px-3 pt-2.5 pb-2 border-b border-[#e7e1d5] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 bg-[#fbfaf6]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'ie', label: '📐 IE Dept', count: DEFAULT_CHAT_CHANNELS.filter(c => c.category === 'ie').length },
                  { id: 'floor', label: '🏭 Floor', count: DEFAULT_CHAT_CHANNELS.filter(c => c.category !== 'ie').length },
                  { id: 'directory', label: `👥 Directory (${onlineMembersCount})` },
                  { id: 'dm', label: '💬 DMs' },
                  { id: 'mentions', label: '🔔 @Me' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'directory') {
                        setActiveTab('user-directory');
                        return;
                      }
                      setCategoryFilter(tab.id as ChannelCategoryFilter);
                      if (tab.id === 'ie') {
                        setActiveChannelId('ie-line-balancing');
                      } else if (tab.id === 'floor') {
                        setActiveChannelId('general-floor');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                      categoryFilter === tab.id
                        ? 'bg-[#176f78] text-white shadow-2xs'
                        : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#e7e1d5]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          categoryFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[#e5e0d3] text-[#17343a]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Mobile Swipeable Channel Bar */}
              <div className="md:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b border-[#e7e1d5] bg-white">
                {categoryFilter === 'dm' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('user-directory')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer bg-[#dceceb] text-[#176f78] font-bold border border-teal-300 active:scale-95"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>All Directory ({onlineMembersCount} Online)</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </button>
                    {DEFAULT_CHAT_MEMBERS.map(m => {
                      const isDmActive = activeChannelId === `dm_${m.id}`;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setActiveChannelId(`dm_${m.id}`)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
                            isDmActive
                              ? 'bg-[#176f78] text-white font-bold shadow-xs'
                              : 'bg-[#f1eee6] text-[#17343a] hover:bg-[#e7e1d5]'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-5 h-5 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                                m.status === 'online'
                                  ? 'bg-emerald-500'
                                  : m.status === 'on_floor'
                                  ? 'bg-sky-500'
                                  : m.status === 'busy'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <span className="font-semibold">{m.name.split(' ')[0]}</span>
                          {m.department === 'IE' && (
                            <span
                              className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                                isDmActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              IE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </>
                ) : categoryFilter === 'mentions' ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#176f78] font-bold px-1 py-0.5">
                    <AtSign className="w-3.5 h-3.5 text-amber-600" />
                    <span>Viewing messages tagging you or @IE Team</span>
                  </div>
                ) : (
                  DEFAULT_CHAT_CHANNELS.filter(c => {
                    if (categoryFilter === 'ie') return c.category === 'ie';
                    if (categoryFilter === 'floor') return c.category !== 'ie';
                    return true;
                  }).map(ch => {
                    const Icon = CHANNEL_ICONS[ch.iconName] || MessageSquare;
                    const isActive = activeChannelId === ch.id;
                    const isIe = ch.category === 'ie';
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChannelId(ch.id)}
                        className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-[#176f78] text-white font-bold shadow-xs'
                            : isIe
                            ? 'bg-teal-50 text-teal-900 border border-teal-200'
                            : 'bg-[#f1eee6] text-[#17343a] hover:bg-[#e7e1d5]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>#{ch.name}</span>
                        {ch.unreadCount ? (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-teal-600 text-white'
                            }`}
                          >
                            {ch.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Desktop Channel & Member Explorer */}
              <div className="hidden md:flex flex-col flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
                {/* Search filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search channels or messages..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-[#d9d2c2] text-[#17343a] placeholder:text-slate-400 focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                {/* Section 1: IE Department Specialized Channels */}
                {(categoryFilter === 'all' || categoryFilter === 'ie') && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800 px-1 bg-teal-50/70 p-1 rounded-lg border border-teal-100">
                      <div className="flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5 text-[#176f78]" />
                        <span>IE Department Channels</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-teal-600 text-white rounded-full font-bold">
                        IE Div
                      </span>
                    </div>

                    {DEFAULT_CHAT_CHANNELS.filter(c => c.category === 'ie').map(ch => {
                      const Icon = CHANNEL_ICONS[ch.iconName] || Calculator;
                      const isActive = activeChannelId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setActiveChannelId(ch.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#176f78] text-white font-bold shadow-xs'
                              : 'text-[#17343a] hover:bg-teal-50/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className="w-4 h-4 shrink-0 text-teal-600" />
                            <span className="text-xs truncate">#{ch.name}</span>
                          </div>
                          {ch.unreadCount ? (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {ch.unreadCount}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Section 2: Shop Floor & Cross-Team Operations */}
                {(categoryFilter === 'all' || categoryFilter === 'floor') && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#527078] px-1">
                      <span>Floor Operations</span>
                      <span className="text-[10px]">{DEFAULT_CHAT_CHANNELS.filter(c => c.category !== 'ie').length}</span>
                    </div>

                    {DEFAULT_CHAT_CHANNELS.filter(c => c.category !== 'ie').map(ch => {
                      const Icon = CHANNEL_ICONS[ch.iconName] || MessageSquare;
                      const isActive = activeChannelId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setActiveChannelId(ch.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#176f78] text-white font-bold shadow-xs'
                              : 'text-[#17343a] hover:bg-[#f1eee6]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-xs truncate">#{ch.name}</span>
                          </div>
                          {ch.category === 'urgent' && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isActive ? 'bg-amber-300' : 'bg-rose-500 animate-pulse'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Section 3: IE Engineers & Floor Leads with Quick @ Mention */}
                {(categoryFilter === 'all' || categoryFilter === 'dm') && (
                  <div className="space-y-1 pt-2 border-t border-[#e7e1d5]">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#527078] px-1">
                      <span>Team Directory</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('user-directory')}
                        className="text-[10px] text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        title="View complete member directory with contact details & live status"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>All ({onlineMembersCount} Online) →</span>
                      </button>
                    </div>

                    {DEFAULT_CHAT_MEMBERS.map(m => {
                      const isDmActive = activeChannelId === `dm_${m.id}`;
                      const isIe = m.department === 'IE';

                      return (
                        <div
                          key={m.id}
                          className={`group w-full flex items-center justify-between p-1.5 rounded-xl transition-all ${
                            isDmActive
                              ? 'bg-[#176f78] text-white font-bold shadow-xs'
                              : 'text-[#17343a] hover:bg-[#f1eee6]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedMemberForCard(m)}
                            title={`View ${m.name}'s profile (${m.status.replace('_', ' ')})`}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <div className="relative shrink-0">
                              <img
                                src={m.avatar}
                                alt={m.name}
                                className="w-7 h-7 rounded-full object-cover border border-white/60"
                                referrerPolicy="no-referrer"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                                  m.status === 'online'
                                    ? 'bg-emerald-500'
                                    : m.status === 'on_floor'
                                    ? 'bg-sky-500'
                                    : m.status === 'busy'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs truncate leading-tight flex items-center gap-1">
                                <span className="truncate">{m.name}</span>
                                {isIe && (
                                  <span
                                    className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                                      isDmActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                                    }`}
                                  >
                                    IE
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-[10px] truncate ${
                                  isDmActive ? 'text-teal-100' : 'text-[#527078]'
                                }`}
                              >
                                {m.statusMessage || m.specialization || m.role}
                              </div>
                            </div>
                          </button>

                          {/* Quick Mention Button */}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleInsertMention(m.name);
                            }}
                            title={`Mention @${m.name} in composer`}
                            className={`shrink-0 p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isDmActive
                                ? 'text-white hover:bg-white/20'
                                : 'text-[#176f78] hover:bg-[#dceceb]'
                            }`}
                          >
                            <AtSign className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Active Persona Tester Selector */}
                <div className="pt-2 border-t border-[#e7e1d5] bg-[#f5f3ec] p-2.5 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#527078]">
                    Send Messages As:
                  </div>
                  <select
                    value={activePersonaId}
                    onChange={e => setActivePersonaId(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-[#d9d2c2] rounded-lg p-1.5 text-[#17343a] focus:outline-none focus:border-[#176f78]"
                  >
                    <option value="self">You ({profile.name || 'Ashik Hossain'})</option>
                    {DEFAULT_CHAT_MEMBERS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            {/* Right Chat Message Stream & Composer */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#fbfaf6]">
              {/* Channel Header & AI Summary Action Bar */}
              <div className="px-3 sm:px-4 py-2.5 bg-white border-b border-[#e7e1d5] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {dmTargetMember ? (
                    <div className="flex items-center gap-2 truncate">
                      {/* Mobile back button to return to channels */}
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter('all');
                          setActiveChannelId('ie-line-balancing');
                        }}
                        className="p-1 -ml-1 text-slate-500 hover:text-[#17343a] hover:bg-[#f1eee6] rounded-lg md:hidden cursor-pointer"
                        title="Back to all channels"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMemberForCard(dmTargetMember)}
                        className="flex items-center gap-2 text-left cursor-pointer hover:opacity-85 transition-opacity truncate"
                        title="Click to view full profile details & contact card"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={dmTargetMember.avatar}
                            alt={dmTargetMember.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#d9d2c2]"
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                              dmTargetMember.status === 'online'
                                ? 'bg-emerald-500 animate-pulse'
                                : dmTargetMember.status === 'on_floor'
                                ? 'bg-sky-500'
                                : dmTargetMember.status === 'busy'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1 truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-xs sm:text-sm text-[#17343a] truncate">
                              {dmTargetMember.name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold capitalize ${
                                dmTargetMember.status === 'online'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : dmTargetMember.status === 'on_floor'
                                  ? 'bg-sky-100 text-sky-800'
                                  : dmTargetMember.status === 'busy'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {dmTargetMember.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#527078] truncate hidden sm:block">
                            {dmTargetMember.role} • {dmTargetMember.assignedLine || 'All Floors'}
                          </p>
                        </div>
                      </button>
                    </div>
                  ) : categoryFilter === 'mentions' ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs sm:text-sm text-[#17343a] flex items-center gap-1">
                        <AtSign className="w-4 h-4 text-amber-600" />
                        <span>All Mentions Feed</span>
                      </span>
                      <span className="text-xs text-[#527078] hidden sm:inline truncate">
                        • Messages tagging you or @IE Team
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs sm:text-sm text-[#17343a] truncate">
                        #{currentChannel.name}
                      </span>
                      {currentChannel.category === 'ie' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold uppercase">
                          IE Department
                        </span>
                      )}
                      <span className="text-xs text-[#527078] hidden sm:inline truncate">
                        • {currentChannel.description}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* Mobile Quick Directory Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('user-directory')}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold bg-[#dceceb] text-[#176f78] hover:bg-[#cde4e3] flex items-center gap-1 md:hidden transition-colors cursor-pointer active:scale-95"
                    title="Browse Team Directory and online presence"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Team</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </button>

                  {/* Chat History & Audit Button */}
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold bg-white border border-[#d9d2c2] hover:border-[#176f78] text-[#17343a] hover:bg-[#dceceb] flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    title="Open Searchable Chat History & Export Logs"
                  >
                    <History className="w-3.5 h-3.5 text-[#176f78]" />
                    <span className="hidden sm:inline">History</span>
                  </button>

                  {/* Scroll Up / Down Controls in Header */}
                  <div className="hidden sm:flex items-center rounded-xl border border-[#d9d2c2] bg-white overflow-hidden shadow-2xs h-[34px]">
                    <button
                      type="button"
                      onClick={handleScrollToTop}
                      className="p-1.5 text-slate-600 hover:text-[#176f78] hover:bg-[#f1eee6] cursor-pointer transition-colors h-full flex items-center justify-center"
                      title="Scroll to Top (Oldest Messages)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-[#e7e1d5]" />
                    <button
                      type="button"
                      onClick={handleScrollToBottom}
                      className="p-1.5 text-slate-600 hover:text-[#176f78] hover:bg-[#f1eee6] cursor-pointer transition-colors h-full flex items-center justify-center"
                      title="Scroll to Bottom (Newest Messages)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pinned Messages Header Button */}
                  <button
                    onClick={() => setIsPinnedDrawerOpen(!isPinnedDrawerOpen)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 ${
                      isPinnedDrawerOpen
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : channelPinnedMessages.length > 0
                        ? 'bg-amber-100/90 text-amber-900 border border-amber-300 hover:bg-amber-200'
                        : 'text-slate-500 bg-[#f1eee6] hover:bg-[#e7e1d5]'
                    }`}
                    title={
                      channelPinnedMessages.length > 0
                        ? `${channelPinnedMessages.length} Pinned Notice(s)`
                        : 'No pinned notices'
                    }
                  >
                    <Pin
                      className={`w-3.5 h-3.5 ${
                        channelPinnedMessages.length > 0 ? 'fill-amber-600 text-amber-700' : ''
                      }`}
                    />
                    <span className="hidden xs:inline sm:inline">{channelPinnedMessages.length}</span>
                    <span className="hidden xs:inline">Pinned</span>
                  </button>

                  <button
                    onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 ${
                      filterUrgentOnly
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'text-slate-500 bg-[#f1eee6] hover:bg-[#e7e1d5]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="hidden sm:inline">Urgent</span>
                  </button>

                  <button
                    onClick={handleGenerateChatSummary}
                    disabled={isGeneratingSummary}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold bg-[#dceceb] text-[#176f78] hover:bg-[#cde4e3] flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                    title="Generate executive AI shift briefing from recent floor messages"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#176f78]" />
                    <span className="hidden sm:inline">
                      {isGeneratingSummary ? 'Summarizing...' : 'AI Briefing'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Pinned Messages Header Ribbon & Collapsible Drawer */}
              {channelPinnedMessages.length > 0 && (
                <div className="border-b border-amber-200 bg-linear-to-r from-amber-50 via-amber-50/90 to-[#fefcf6] shrink-0 transition-all">
                  {/* Collapsed Ribbon Bar */}
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shrink-0 text-[10px] font-bold shadow-2xs">
                        <Pin className="w-3 h-3 fill-amber-600 text-amber-700" />
                        <span>Notice ({channelPinnedMessages.length})</span>
                      </div>

                      {/* Latest pinned message preview snippet */}
                      <button
                        type="button"
                        onClick={() => handleJumpToMessage(channelPinnedMessages[0].id)}
                        title="Click to jump to this pinned message"
                        className="text-xs text-left truncate text-[#17343a] hover:text-amber-900 flex items-center gap-1.5 cursor-pointer min-w-0 group"
                      >
                        <span className="font-bold text-[11px] text-[#17343a] shrink-0">
                          {channelPinnedMessages[0].senderName}:
                        </span>
                        <span className="truncate text-[11px] text-[#527078] group-hover:underline">
                          {channelPinnedMessages[0].content}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleJumpToMessage(channelPinnedMessages[0].id)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                      >
                        <span>Jump</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPinnedDrawerOpen(prev => !prev)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-900 hover:bg-amber-100 flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                        aria-expanded={isPinnedDrawerOpen}
                      >
                        <span>{isPinnedDrawerOpen ? 'Hide' : `View all (${channelPinnedMessages.length})`}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isPinnedDrawerOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Pinned Cards Drawer */}
                  {isPinnedDrawerOpen && (
                    <div className="px-3 sm:px-4 pb-3 pt-1 border-t border-amber-200/70 space-y-2 max-h-60 overflow-y-auto overscroll-contain">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
                        <span>Pinned Directives & High-Priority Notices</span>
                        <span className="text-[9px] text-amber-700/80 font-normal">Visible to all shifts</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {channelPinnedMessages.map(pMsg => (
                          <div
                            key={pMsg.id}
                            className="p-2.5 rounded-xl bg-white border border-amber-300/80 shadow-2xs hover:shadow-xs transition-all space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px]">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-[#17343a] truncate">{pMsg.senderName}</span>
                                <span className="text-[#527078] truncate text-[9px]">({pMsg.senderRole})</span>
                                <span className="text-slate-400 text-[9px]">{pMsg.timestamp}</span>
                              </div>
                              {pMsg.pinnedBy && (
                                <span className="text-[9px] text-amber-800 font-semibold shrink-0 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Pinned by {pMsg.pinnedBy}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#17343a] leading-relaxed line-clamp-3">
                              {pMsg.content}
                            </p>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-100 text-[10px]">
                              <div className="flex items-center gap-1.5">
                                {pMsg.taggedLine && (
                                  <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 font-bold text-[9px] border border-teal-200">
                                    {pMsg.taggedLine}
                                  </span>
                                )}
                                {pMsg.taggedStation && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 font-bold text-[9px] border border-amber-200">
                                    {pMsg.taggedStation}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleJumpToMessage(pMsg.id)}
                                  className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition-colors cursor-pointer active:scale-95"
                                >
                                  Jump
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(pMsg.id)}
                                  className="px-2 py-0.5 rounded-md bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-bold border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer active:scale-95"
                                >
                                  Unpin
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Shift Briefing Popover / Alert */}
              {aiSummaryModalText && (
                <div className="p-3 m-3 rounded-xl bg-[#dceceb]/70 border border-[#176f78]/30 shadow-xs relative animate-fadeIn">
                  <button
                    onClick={() => setAiSummaryModalText(null)}
                    className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#176f78] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#17343a] space-y-1 pr-4 whitespace-pre-line leading-relaxed">
                      {aiSummaryModalText}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Container with Scroll Ref, Scroll-To-Top and Floating Scroll-To-Bottom Indicator */}
              <div className="flex-1 relative min-h-0 flex flex-col">
                <div
                  id="chat-messages-scroll-container"
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  tabIndex={0}
                  aria-label="Channel message stream"
                  className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-4 sm:py-4 space-y-2.5 sm:space-y-3.5 min-h-0 overscroll-y-contain scroll-smooth -webkit-overflow-scrolling-touch outline-none focus-visible:ring-1 focus-visible:ring-teal-600/30"
                >
                  {filteredTeamMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#527078]">
                      <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-[#176f78]" />
                      <p className="font-bold text-sm text-[#17343a]">
                        {categoryFilter === 'mentions'
                          ? 'No user mentions found'
                          : `No messages in #${currentChannel.name}`}
                      </p>
                      <p className="text-xs">
                        {categoryFilter === 'mentions'
                          ? 'When a colleague tags @your name or @IE Team, it will appear here.'
                          : 'Post an update, mention an engineer with @, or select a preset chip below.'}
                      </p>
                    </div>
                  ) : (
                    filteredTeamMessages.map(msg => {
                      const isSelf =
                        msg.senderId === 'user_self' ||
                        msg.senderId === 'user_ashik' ||
                        msg.senderId === activePersonaId;

                      return (
                        <ChatMessageItem
                          key={msg.id}
                          msg={msg}
                          isSelf={isSelf}
                          currentUserId={senderDetails.id}
                          currentUserName={senderDetails.name}
                          allMembers={DEFAULT_CHAT_MEMBERS}
                          allGroups={CHAT_MENTION_GROUPS}
                          onToggleReaction={handleToggleReaction}
                          onAcknowledgeAlert={handleAcknowledgeAlert}
                          onMentionUser={name => handleInsertMention(name)}
                          onViewMemberProfile={member => setSelectedMemberForCard(member)}
                          onTogglePin={handleTogglePin}
                        />
                      );
                    })
                  )}

                  {/* Simulating Colleague Typing Indicator */}
                  {isSimulatingTyping && (
                    <div className="flex items-center gap-2 text-xs text-[#527078] italic p-2 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-[#176f78] animate-ping" />
                      <span>{simulatingName || 'IE Colleague'} is drafting a reply...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Floating Scroll Controls Pill Overlay */}
                <div className="absolute right-4 bottom-3 z-20 flex flex-col gap-1.5 pointer-events-none">
                  {showScrollTop && (
                    <button
                      type="button"
                      onClick={handleScrollToTop}
                      className="pointer-events-auto p-2 rounded-full bg-white/95 text-slate-700 hover:text-[#176f78] hover:bg-white shadow-md border border-[#d9d2c2] transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
                      title="Scroll Up to oldest messages"
                      aria-label="Scroll to top"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}

                  {showScrollBottom && (
                    <button
                      type="button"
                      onClick={handleScrollToBottom}
                      className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#176f78] text-white shadow-lg hover:bg-[#125860] border border-teal-600 transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold animate-bounce"
                      title="Scroll Down to latest messages"
                      aria-label="Scroll to bottom"
                    >
                      <span>Newer</span>
                      <ChevronsDown className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Preset Action Chips */}
              <div className="px-3 py-2 bg-[#f5f3ec] border-t border-[#e7e1d5] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-[#527078] uppercase shrink-0">Quick Actions:</span>
                {QUICK_SHOP_FLOOR_CHIPS.map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => handleSendTeamMessage(chip.text, chip.isUrgent)}
                    className="min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#d9d2c2] hover:border-[#176f78] hover:bg-[#dceceb] text-[#17343a] whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 flex items-center shadow-2xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Bottom Message Composer with @ Mention Suggestion Autocomplete */}
              <div className="p-3 bg-white border-t border-[#e7e1d5] shrink-0 space-y-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] relative">
                {/* Mention Autocomplete Suggestions Popup */}
                {mentionMenuOpen && (
                  <MentionSuggestionsMenu
                    query={mentionQuery}
                    members={DEFAULT_CHAT_MEMBERS}
                    groups={CHAT_MENTION_GROUPS}
                    selectedIndex={mentionSelectedIndex}
                    onSelectMention={tag => handleInsertMention(tag)}
                    onClose={() => setMentionMenuOpen(false)}
                  />
                )}

                {/* Composer controls row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Urgent Alert Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsUrgent(!isUrgent)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isUrgent
                          ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                          : 'bg-[#f1eee6] text-slate-600 hover:text-rose-600'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isUrgent ? 'URGENT ALERT ON' : 'Mark Urgent'}</span>
                    </button>

                    {/* Quick Trigger @ Mention Button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleInsertMention('');
                        setMentionMenuOpen(true);
                        setMentionQuery('');
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-[#dceceb] text-[#176f78] hover:bg-[#cae3e2] flex items-center gap-1 transition-all cursor-pointer"
                      title="Mention a team member or IE group"
                    >
                      <AtSign className="w-3.5 h-3.5" />
                      <span>Mention User</span>
                    </button>

                    {/* Tag Line Dropdown */}
                    <select
                      value={selectedTagLine}
                      onChange={e => setSelectedTagLine(e.target.value)}
                      className="text-xs bg-[#f1eee6] text-[#17343a] rounded-lg px-2 py-1 border border-[#d9d2c2] focus:outline-none focus:border-[#176f78]"
                    >
                      <option value="">Tag Line (Optional)</option>
                      <option value="Line 01">Line 01 (Padma)</option>
                      <option value="Line 02">Line 02 (Meghna)</option>
                      <option value="Line 03">Line 03 (Jamuna)</option>
                      <option value="Line 04">Line 04 (Karnafuli)</option>
                      <option value="Line 05">Line 05 (Surma)</option>
                    </select>
                  </div>

                  <span className="text-[11px] text-[#527078] hidden sm:inline">
                    Type <b>@</b> to mention • Enter sends
                  </span>
                </div>

                {/* Input & Send Form */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendTeamMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={composerText}
                    onChange={handleComposerChange}
                    onKeyDown={handleKeyDownInComposer}
                    placeholder={`Message #${currentChannel.name}... (type @ to tag someone)`}
                    className="flex-1 max-h-28 min-h-[44px] py-2.5 px-3.5 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] text-sm sm:text-xs text-[#17343a] placeholder:text-slate-400 focus:outline-none focus:border-[#176f78] focus:bg-white resize-none"
                  />

                  <button
                    type="submit"
                    disabled={!composerText.trim()}
                    className={`h-[44px] px-4 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                      composerText.trim()
                        ? 'bg-[#176f78] text-white hover:bg-[#11565e] shadow-xs active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </main>

          </div>
        )}

        {/* TAB 2: USER DIRECTORY & ONLINE STATUS */}
        {activeTab === 'user-directory' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#fbfaf6]">
            <ChatUserListView
              members={DEFAULT_CHAT_MEMBERS}
              profile={profile}
              myStatus={myStatus}
              myStatusNote={myStatusNote}
              onUpdateMyStatus={handleUpdateMyStatus}
              onSelectMemberForCard={member => setSelectedMemberForCard(member)}
              onStartDirectMessage={memberId => {
                setActiveChannelId(`dm_${memberId}`);
                setCategoryFilter('dm');
                setActiveTab('team-chat');
              }}
              onMentionMember={name => {
                handleInsertMention(name);
                setActiveTab('team-chat');
              }}
            />
          </div>
        )}

        {/* TAB 3: IE AI ADVISOR (GEMINI) */}
        {activeTab === 'ai-advisor' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#fbfaf6]">
            {/* Model & Persona Selection Ribbon */}
            <div className="px-4 py-2 bg-white border-b border-[#e7e1d5] flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#17343a]">AI Mode:</span>
                {(['general', 'complex', 'fast'] as ChatRoleType[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setAiRoleType(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      aiRoleType === r
                        ? 'bg-[#176f78] text-white shadow-xs'
                        : 'bg-[#f1eee6] text-slate-600 hover:bg-[#e7e1d5]'
                    }`}
                  >
                    {r === 'general' ? 'Lean IE' : r === 'complex' ? 'OR Balancing' : 'Rapid Floor'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-[#527078] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiIncludeTelemetry}
                    onChange={e => setAiIncludeTelemetry(e.target.checked)}
                    className="rounded accent-[#176f78]"
                  />
                  <span>Include Shop Floor Telemetry ({lines.length} lines)</span>
                </label>

                <button
                  onClick={() => {
                    setAiMessages([
                      {
                        id: `ai_reset_${Date.now()}`,
                        role: 'model',
                        content: `Chat session refreshed. Ready to assist with line balancing and cycle diagnostics.`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  title="Reset AI conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AI Messages Stream */}
            <div className="flex-1 relative min-h-0 flex flex-col">
              <div
                ref={aiMessagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scroll-smooth"
              >
                {aiMessages.map(msg => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-2xs mt-0.5 bg-slate-700">
                        {isUser ? <UserCheck className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-300" />}
                      </div>

                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 text-[11px] text-[#527078] ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-bold text-[#17343a]">{isUser ? 'You' : 'Gemini IE Advisor'}</span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed border whitespace-pre-wrap ${
                            isUser
                              ? 'bg-[#176f78] text-white border-[#11565e]'
                              : 'bg-white text-[#17343a] border-[#d9d2c2] shadow-2xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {aiIsLoading && (
                  <div className="flex items-center gap-2 p-3 text-xs text-[#176f78] animate-pulse">
                    <Bot className="w-4 h-4" />
                    <span>Gemini is calculating line balance and diagnostics...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll controls in AI Advisor */}
              <div className="absolute right-4 bottom-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                <button
                  type="button"
                  onClick={handleScrollToTop}
                  className="pointer-events-auto p-1.5 rounded-full bg-white/90 text-slate-600 hover:text-[#176f78] shadow-md border border-[#d9d2c2] transition-transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
                  title="Scroll to Top"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleScrollToBottom}
                  className="pointer-events-auto p-1.5 rounded-full bg-white/90 text-slate-600 hover:text-[#176f78] shadow-md border border-[#d9d2c2] transition-transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
                  title="Scroll to Bottom"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Suggested Prompts */}
            <div className="px-4 py-2 bg-[#f5f3ec] border-t border-[#e7e1d5] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                'Analyze Line 04 bottleneck at station 08',
                'Calculate pitch time for 24 min SAM style',
                'Suggest floater operator allocation plan',
                'How to recover 5% afternoon efficiency loss?'
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSendAiMessage(prompt)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-white border border-[#d9d2c2] hover:border-[#176f78] text-[#17343a] whitespace-nowrap shrink-0 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* AI Composer Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendAiMessage();
              }}
              className="p-3 bg-white border-t border-[#e7e1d5] flex items-center gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
            >
              <input
                type="text"
                value={aiInputText}
                onChange={e => setAiInputText(e.target.value)}
                placeholder="Ask Gemini about workstation cycle times, SMV, line balancing..."
                className="flex-1 h-[44px] px-3.5 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] text-xs text-[#17343a] placeholder:text-slate-400 focus:outline-none focus:border-[#176f78] focus:bg-white"
              />

              <button
                type="submit"
                disabled={!aiInputText.trim() || aiIsLoading}
                className={`h-[44px] px-4 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  aiInputText.trim() && !aiIsLoading
                    ? 'bg-[#176f78] text-white hover:bg-[#11565e] shadow-xs active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Global Member Profile Card Modal Popup */}
        {selectedMemberForCard && (
          <ChatMemberCardModal
            member={selectedMemberForCard}
            onClose={() => setSelectedMemberForCard(null)}
            onMentionMember={name => {
              handleInsertMention(name);
              setActiveTab('team-chat');
            }}
            onStartDirectMessage={memberId => {
              setActiveChannelId(`dm_${memberId}`);
              setCategoryFilter('dm');
              setActiveTab('team-chat');
            }}
          />
        )}

        {/* Global Searchable Chat History, Multi-Filter & Export Modal */}
        <ChatHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          messages={teamMessages}
          channels={DEFAULT_CHAT_CHANNELS}
          members={DEFAULT_CHAT_MEMBERS}
          currentChannelId={activeChannelId}
          onSelectChannelAndJump={(channelId, messageId) => {
            setActiveChannelId(channelId);
            setActiveTab('team-chat');
            // Give channel tab time to render before jumping
            setTimeout(() => {
              handleJumpToMessage(messageId);
            }, 80);
          }}
          onRestoreDefaults={handleRestoreDefaultMessages}
          onClearHistory={handleClearChatHistory}
          onViewMemberProfile={member => setSelectedMemberForCard(member)}
        />
      </div>
    </div>
  );
};
