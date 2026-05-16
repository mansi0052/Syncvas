import { create } from "zustand";
import type { User } from "@shared/types";

interface VoiceUser extends User {
  isSpeaking?: boolean;
  audioLevel?: number;
}

interface VoiceState {
  localUserId: string;
  isMuted: boolean;
  isPushToTalk: boolean;
  pushToTalkKey: string;
  voiceEnabled: boolean;
  users: VoiceUser[];
  speakingUsers: Set<string>;

  setLocalUserId: (id: string) => void;
  setMuted: (muted: boolean) => void;
  setPushToTalk: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setUsers: (users: VoiceUser[]) => void;
  updateUserSpeaking: (userId: string, isSpeaking: boolean, audioLevel?: number) => void;
  addUser: (user: VoiceUser) => void;
  removeUser: (userId: string) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  localUserId: "",
  isMuted: false,
  isPushToTalk: true,
  pushToTalkKey: " ",
  voiceEnabled: true,
  users: [],
  speakingUsers: new Set<string>(),

  setLocalUserId: (localUserId) => set({ localUserId }),

  setMuted: (isMuted) => set({ isMuted }),

  setPushToTalk: (isPushToTalk) => set({ isPushToTalk }),

  setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),

  setUsers: (users) => set({ users }),

  updateUserSpeaking: (userId, isSpeaking, audioLevel) => set((state) => {
    const newSpeaking = new Set(state.speakingUsers);
    if (isSpeaking) {
      newSpeaking.add(userId);
    } else {
      newSpeaking.delete(userId);
    }
    return {
      speakingUsers: newSpeaking,
      users: state.users.map((u) =>
        u.id === userId ? { ...u, isSpeaking, audioLevel } : u
      ),
    };
  }),

  addUser: (user) => set((state) => ({
    users: [...state.users.filter((u) => u.id !== user.id), user],
  })),

  removeUser: (userId) => set((state) => ({
    users: state.users.filter((u) => u.id !== userId),
    speakingUsers: new Set([...state.speakingUsers].filter((id) => id !== userId)),
  })),

  reset: () => set({
    localUserId: "",
    isMuted: false,
    isPushToTalk: true,
    voiceEnabled: true,
    users: [],
    speakingUsers: new Set<string>(),
  }),
}));
