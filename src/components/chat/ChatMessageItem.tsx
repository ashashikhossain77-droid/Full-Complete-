/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tag, AtSign, Check, MessageSquare, AlertCircle, Sparkles, Pin } from 'lucide-react';
import { UserChatMessage, ChatUserMember } from '../../types';
import { ChatMentionGroup } from '../../data/userChatData';

interface ChatMessageItemProps {
  msg: UserChatMessage;
  isSelf: boolean;
  currentUserId: string;
  currentUserName: string;
  allMembers: ChatUserMember[];
  allGroups: ChatMentionGroup[];
  onToggleReaction: (msgId: string, emoji: string) => void;
  onAcknowledgeAlert: (msgId: string) => void;
  onMentionUser: (name: string) => void;
  onViewMemberProfile: (member: ChatUserMember) => void;
  onTogglePin?: (msgId: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  isSelf,
  currentUserId,
  currentUserName,
  allMembers,
  allGroups,
  onToggleReaction,
  onAcknowledgeAlert,
  onMentionUser,
  onViewMemberProfile,
  onTogglePin
}) => {
  // Check if current user is mentioned
  const normalizedContent = msg.content.toLowerCase();
  const isDirectlyMentioned =
    !isSelf &&
    (normalizedContent.includes(`@${currentUserName.toLowerCase()}`) ||
      (currentUserName.toLowerCase().includes('ashik') && normalizedContent.includes('@ashik')) ||
      normalizedContent.includes('@ie team') ||
      normalizedContent.includes('@all'));

  // Parse text to identify mentions and format them into interactive badges
  const renderFormattedContent = (content: string) => {
    // Regex matching @[Name or Group]
    const mentionRegex = /(@[A-Za-z0-9. _-]+(?:\b|\s|$))/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('@')) {
        const handleWithoutAt = trimmed.slice(1).trim();

        // Check if group mention
        const matchedGroup = allGroups.find(
          g => g.handle.toLowerCase() === trimmed.toLowerCase() || g.name.toLowerCase() === handleWithoutAt.toLowerCase()
        );

        if (matchedGroup) {
          return (
            <span
              key={index}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold transition-transform ${
                isSelf
                  ? 'bg-teal-900/60 text-teal-100 border border-teal-400/40'
                  : 'bg-teal-50 text-[#176f78] border border-teal-300'
              }`}
            >
              <AtSign className="w-2.5 h-2.5" />
              <span>{matchedGroup.name}</span>
            </span>
          );
        }

        // Check if member mention
        const matchedMember = allMembers.find(
          m => m.name.toLowerCase() === handleWithoutAt.toLowerCase() ||
               m.name.toLowerCase().startsWith(handleWithoutAt.toLowerCase())
        );

        if (matchedMember) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onViewMemberProfile(matchedMember)}
              title={`View ${matchedMember.name} profile`}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                isSelf
                  ? 'bg-white/25 text-white border border-white/40'
                  : matchedMember.department === 'IE'
                  ? 'bg-[#176f78]/15 text-[#176f78] border border-[#176f78]/30 hover:bg-[#176f78]/25'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <AtSign className="w-2.5 h-2.5" />
              <span>{matchedMember.name}</span>
            </button>
          );
        }

        // Default @ tag
        return (
          <span
            key={index}
            className={`inline-flex items-center gap-0.5 px-1 py-0.2 mx-0.5 rounded font-bold ${
              isSelf ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {part}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const senderMember = allMembers.find(m => m.id === msg.senderId || m.name === msg.senderName);

  return (
    <div
      id={`chat-msg-${msg.id}`}
      className={`group relative flex gap-2.5 max-w-[95%] sm:max-w-[80%] transition-all ${
        isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'
      }`}
    >
      {/* Avatar with click to open profile */}
      <div className="shrink-0 mt-0.5 relative">
        <button
          type="button"
          onClick={() => senderMember && onViewMemberProfile(senderMember)}
          title={`View ${msg.senderName}'s IE card (${senderMember?.status || 'member'})`}
          className="focus:outline-none cursor-pointer group-hover:ring-2 group-hover:ring-[#176f78]/40 rounded-full transition-all relative block"
        >
          {msg.senderAvatar ? (
            <img
              src={msg.senderAvatar}
              alt={msg.senderName}
              className="w-8 h-8 rounded-full object-cover border border-[#d9d2c2]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#176f78] text-white font-bold text-xs flex items-center justify-center">
              {msg.senderName.slice(0, 2).toUpperCase()}
            </div>
          )}
          {senderMember && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                senderMember.status === 'online'
                  ? 'bg-emerald-500'
                  : senderMember.status === 'on_floor'
                  ? 'bg-sky-500'
                  : senderMember.status === 'busy'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
              title={`Status: ${senderMember.status.replace('_', ' ')}`}
            />
          )}
        </button>
      </div>

      {/* Message Content Body */}
      <div className="space-y-1 min-w-0 flex-1">
        {/* Sender Meta */}
        <div className={`flex items-center gap-1.5 text-[11px] ${isSelf ? 'justify-end' : 'justify-start'}`}>
          <button
            type="button"
            onClick={() => senderMember && onViewMemberProfile(senderMember)}
            className="font-bold text-[#17343a] hover:text-[#176f78] truncate cursor-pointer"
          >
            {msg.senderName}
          </button>
          <span className="text-[#527078] hidden sm:inline truncate text-[10px]">
            ({msg.senderRole.split('(')[0]})
          </span>
          <span className="text-slate-400 text-[10px]">{msg.timestamp}</span>

          {msg.isPinned && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Pin className="w-2.5 h-2.5 fill-amber-600 text-amber-700" />
              <span>Pinned</span>
            </span>
          )}

          {msg.isUrgent && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-600 text-white uppercase animate-pulse">
              Urgent Alert
            </span>
          )}

          {isDirectlyMentioned && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-900 border border-amber-400/40 flex items-center gap-0.5">
              <AtSign className="w-2.5 h-2.5" /> Mentioned You
            </span>
          )}
        </div>

        {/* Text Bubble */}
        <div
          className={`relative p-3 rounded-2xl text-xs leading-relaxed border shadow-2xs transition-shadow ${
            msg.isPinned
              ? isSelf
                ? 'bg-[#176f78] text-white border-amber-300/80 ring-2 ring-amber-400/50'
                : 'bg-[#fffdf7] border-amber-300 text-[#17343a] ring-2 ring-amber-400/40 shadow-xs'
              : msg.isUrgent
              ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
              : isSelf
              ? 'bg-[#176f78] text-white border-[#11565e]'
              : isDirectlyMentioned
              ? 'bg-[#fef9ee] border-amber-300 text-[#17343a] ring-1 ring-amber-300'
              : 'bg-white border-[#d9d2c2] text-[#17343a]'
          }`}
        >
          {/* Pinned Ribbon at top of bubble */}
          {msg.isPinned && (
            <div
              className={`flex items-center justify-between gap-1 text-[10px] font-semibold -mx-3 -mt-3 mb-2 px-3 py-1 rounded-t-2xl border-b ${
                isSelf
                  ? 'bg-amber-400/20 border-amber-300/30 text-amber-100'
                  : 'bg-amber-50 border-amber-200/80 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-1">
                <Pin className="w-3 h-3 fill-amber-500 text-amber-700 shrink-0" />
                <span className="font-bold">Pinned Notice</span>
                {msg.pinnedBy && (
                  <span className="opacity-80 hidden sm:inline">by {msg.pinnedBy}</span>
                )}
              </div>
              {onTogglePin && (
                <button
                  type="button"
                  onClick={() => onTogglePin(msg.id)}
                  title="Unpin message"
                  className="text-[10px] underline hover:no-underline font-bold opacity-85 hover:opacity-100 cursor-pointer"
                >
                  Unpin
                </button>
              )}
            </div>
          )}

          {msg.taggedLine && (
            <div
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mb-1.5 mr-1.5 ${
                isSelf
                  ? 'bg-white/20 text-white'
                  : 'bg-[#dceceb] text-[#176f78]'
              }`}
            >
              <Tag className="w-2.5 h-2.5" />
              <span>{msg.taggedLine}</span>
            </div>
          )}

          {msg.taggedStation && (
            <div
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mb-1.5 mr-1.5 ${
                isSelf
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              <span>{msg.taggedStation}</span>
            </div>
          )}

          <div className="whitespace-pre-wrap break-words">{renderFormattedContent(msg.content)}</div>

          {/* Alert Acknowledgment Action */}
          {msg.isUrgent && (
            <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center justify-between text-[10px]">
              <span className="text-rose-700 font-bold">
                {msg.acknowledgedBy?.length
                  ? `Acknowledged by ${msg.acknowledgedBy.length} member(s)`
                  : 'Pending acknowledgment'}
              </span>
              <button
                type="button"
                onClick={() => onAcknowledgeAlert(msg.id)}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer active:scale-95"
              >
                Ack Issue
              </button>
            </div>
          )}
        </div>

        {/* Reaction Bar & Quick Actions (Mobile-Optimized Touch Targets) */}
        <div className={`flex items-center gap-1 flex-wrap ${isSelf ? 'justify-end' : 'justify-start'}`}>
          {['👍', '✅', '🚨', '🔧', '🎯'].map(emoji => {
            const count = msg.reactions?.[emoji]?.length || 0;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(msg.id, emoji)}
                className={`min-h-[26px] px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  count > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-2xs'
                    : 'bg-white/70 border-slate-200 text-slate-500 hover:border-[#d9d2c2] hover:bg-white'
                }`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="font-semibold text-[10px]">{count}</span>}
              </button>
            );
          })}

          {/* Quick Mention Reply Button */}
          {!isSelf && (
            <button
              type="button"
              onClick={() => onMentionUser(msg.senderName)}
              title={`Reply and mention ${msg.senderName}`}
              className="min-h-[26px] px-2 py-0.5 rounded-full text-[10px] bg-white border border-[#d9d2c2] hover:border-[#176f78] text-[#176f78] font-bold flex items-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <AtSign className="w-2.5 h-2.5" />
              <span>Reply</span>
            </button>
          )}

          {/* Pin/Unpin Action Button */}
          {onTogglePin && (
            <button
              type="button"
              onClick={() => onTogglePin(msg.id)}
              title={msg.isPinned ? 'Unpin message' : 'Pin message for all team members'}
              className={`min-h-[26px] px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs ${
                msg.isPinned
                  ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                  : 'bg-white border-[#d9d2c2] text-slate-600 hover:text-amber-800 hover:border-amber-300'
              }`}
            >
              <Pin className={`w-2.5 h-2.5 ${msg.isPinned ? 'fill-amber-600 text-amber-700' : 'text-slate-500'}`} />
              <span>{msg.isPinned ? 'Pinned' : 'Pin'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
