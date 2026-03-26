#!/usr/bin/env node
/**
 * BazaAI - Enhanced Chat Application with Voice Input
 * Fixed duplicate message issue.
 * Expert-level UI with MTN yellow accent (#FFCC00)
 * Added: animated quick replies, themes, chat summary, bot personality
 * BEAUTIFUL VERSION - Enhanced with premium animations and design
 */

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import { registerRootComponent } from "expo";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Import Audio for voice recording
import { Audio } from 'expo-av';

// Import beautiful enhanced components
import {
  BeautifulButton,
  BeautifulChatBubble,
  BeautifulChip,
  BeautifulLoadingOverlay,
  BeautifulThemeSelector,
  BeautifulVoiceButton
} from './beautiful-components';

import { enhancedStyles } from './enhanced-styles';

// Import advanced animations and premium features
import {
  FloatingParticles,
  MorphingBackground,
  ShimmerEffect
} from './advanced-animations';

import {
  ExpandableCard,
  FloatingActionButton,
  MagneticButton
} from './premium-features';

axios.defaults.headers.post["Content-Type"] = "application/json; charset=utf-8";

const STORAGE_KEY_PROFILE = "baza_user_profile";
const STORAGE_KEY_THEME = "baza_theme";
const STORAGE_KEY_PERSONALITY = "baza_personality";
const UNSENT_KEY = "unsent_messages_queue";
const BACKEND_URL = "http://192.168.43.176:8000"; // Your backend server

/* ---------------------------------- App ---------------------------------- */

export default function App() {
  // --- App State ---
  const [screen, setScreen] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [profileServer, setProfileServer] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [quickReplies, setQuickReplies] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const [appLoading, setAppLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [processingPurchaseId, setProcessingPurchaseId] = useState(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInstance, setRecordingInstance] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const recordingTimerRef = useRef(null);
  const isStoppingRecording = useRef(false);

  // New states for enhancements
  const [personality, setPersonality] = useState("Friendly"); // Professional, Friendly, Humorous
  const [themes, setThemes] = useState([
    { name: "MTN Yellow", primary: "#8d730aa6", background: "#F5F5F5", card: "#FFFFFF", text: "#222", sub: "#666", input: "#F0F0F0", darkPrimary: "#FFCC00", darkBackground: "#121212", darkCard: "#1E1E1E", darkText: "#FFF", darkSub: "#BBB", darkInput: "#2C2C2C", userBubbleLight: "#FFF9C4", userBubbleDark: "#3A3A00" },
    { name: "Dark", primary: "#a78707c4", background: "#121212", card: "#1E1E1E", text: "#FFF", sub: "#BBB", input: "#2C2C2C", darkPrimary: "#FFCC00", darkBackground: "#121212", darkCard: "#1E1E1E", darkText: "#FFF", darkSub: "#BBB", darkInput: "#2C2C2C", userBubbleLight: "#3A3A00", userBubbleDark: "#3A3A00" },
    { name: "Light", primary: "#967906c5", background: "#F5F5F5", card: "#FFFFFF", text: "#222", sub: "#666", input: "#F0F0F0", darkPrimary: "#FFCC00", darkBackground: "#F5F5F5", darkCard: "#FFFFFF", darkText: "#222", darkSub: "#666", darkInput: "#F0F0F0", userBubbleLight: "#FFF9C4", userBubbleDark: "#FFF9C4" },
    { name: "Ocean", primary: "#0077BE", background: "#E6F2FF", card: "#FFFFFF", text: "#003366", sub: "#336699", input: "#CCE5FF", darkPrimary: "#0077BE", darkBackground: "#003366", darkCard: "#004C99", darkText: "#E6F2FF", darkSub: "#99CCFF", darkInput: "#0066CC", userBubbleLight: "#B3D9FF", userBubbleDark: "#004C99" },
    { name: "Forest", primary: "#20632383", background: "#E8F5E9", card: "#FFFFFF", text: "#1B5E20", sub: "#4CAF50", input: "#C8E6C9", darkPrimary: "#2E7D32", darkBackground: "#1B5E20", darkCard: "#2E7D32", darkText: "#E8F5E9", darkSub: "#A5D6A7", darkInput: "#388E3C", userBubbleLight: "#C8E6C9", userBubbleDark: "#1B5E20" },
  ]);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0); // default MTN Yellow
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  const knob = useRef(new Animated.Value(2)).current;
  const screenFade = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const userTypingTimeout = useRef(null);

  // Build dynamic theme based on darkMode and selectedTheme
  const theme = useMemo(() => {
    const base = themes[selectedThemeIndex];
    return {
      background: darkMode ? base.darkBackground : base.background,
      card: darkMode ? base.darkCard : base.card,
      text: darkMode ? base.darkText : base.text,
      sub: darkMode ? base.darkSub : base.sub,
      input: darkMode ? base.darkInput : base.input,
      accent: darkMode ? base.darkPrimary : base.primary,
      track: darkMode ? "#333" : "#DDD",
      knob: darkMode ? base.darkPrimary : "#000",
      userBubble: darkMode ? base.userBubbleDark : base.userBubbleLight,
      darkMode: darkMode,
    };
  }, [darkMode, selectedThemeIndex]);

  const translations = useMemo(() => ({
    en: {
      app: "BazaAI", hero: "Chat Smarter with AI", sub: "Airtime • Money • Balance • Support",
      start: "Start Chat", chat: "Conversation", placeholder: "Type message...", send: "Send",
      clear: "Clear Chat", back: "Back", dark: "Dark Mode", lang: "Kinyarwanda",
      features: [{ text: "Buy airtime & bundles", icon: "cellphone" }, { text: "Send & withdraw money", icon: "cash-multiple" }, { text: "Check your balance", icon: "wallet-outline" }, { text: "Secure messaging", icon: "shield-check" }],
      quick_examples: ["Show bundles", "My balance", "Buy 1GB", "Help"],
      logout: "Logout", profile: "Profile", login: "Login", registerTitle: "Register", submit: "Submit",
      namePlaceholder: "Name", phonePlaceholder: "Phone Number", pinPlaceholder: "PIN", confirmPinPlaceholder: "Confirm PIN", existingUserPrompt: "Existing user? Login",
      loginTitle: "Login", loginButton: "Login", registerButton: "Register",
      alertPhoneRequiredTitle: "Phone required", alertPhoneRequiredBody: "Please enter your phone number to login.",
      alertRegisterFirstTitle: "Register first", alertRegisterFirstBody: "Please register your name & phone before chatting.",
      alertPermissionDeniedTitle: "Permission denied", alertPermissionDeniedBody: "Please allow access to your photos to upload an avatar.",
      alertAvatarUploaded: "Avatar uploaded", alertUploadFailed: "Upload failed", alertUploadFailedBody: "Could not upload avatar.",
      editProfileTitle: "Edit Profile", quickActions: "Quick Actions", topUp: "Top-up", recommendations: "Recommendations",
      recentPurchases: "Recent purchases", editProfileBtn: "Edit Profile", confirmLogoutTitle: "Logout",
      confirmLogoutBody: "Are you sure you want to logout?", cancel: "Cancel", save: "Save",
      buyConfirmTitle: "Confirm Purchase", buyConfirmBody: "Buy {display} ?", buySuccess: "Purchase successful", buyFailed: "Purchase failed",
      online: "Online", offline: "Offline", retryText: "Retry", botTyping: "Bot is typing…",
      continueChat: "Continue Chat", whatElse: "What else can I help with?",
      newMessages: "New", pullToRefresh: "Pull to refresh", refreshing: "Refreshing...",
      stats: { messages: "Messages", purchases: "Purchases", loyalty: "Loyalty Points" },
      // Voice recording translations
      recording: "Recording... Release to send",
      transcribing: "Transcribing audio...",
      voiceSent: "Voice message sent",
      voiceFailed: "Voice message failed",
      permissionRequired: "Permission Required",
      permissionMicrophone: "Please allow microphone access to use voice input",
      // New translations
      personality: "Bot Personality",
      professional: "Professional",
      friendly: "Friendly",
      humorous: "Humorous",
      theme: "Theme",
      summarize: "Summarize",
      summary: "Conversation Summary",
      close: "Close",
    },
    kin: {
      app: "BazaAI", hero: "Vugana n'ubwenge bwa AI", sub: "Amainite • Amafaranga • Konti • Ubufasha",
      start: "Tangira Ikiganiro", chat: "Ikiganiro", placeholder: "Andika ubutumwa...", send: "Ohereza",
      clear: "Siba Ikiganiro", back: "Subira Inyuma", dark: "Uburyo bw'umwijima", lang: "English",
      features: [{ text: "Gura amainite na bundles", icon: "cellphone" }, { text: "Ohereza & Kurura amafaranga", icon: "cash-multiple" }, { text: "Reba ayo usigaranye", icon: "wallet-outline" }, { text: "Ubutumwa bufite umutekano", icon: "shield-check" }],
      quick_examples: ["Erekana bundles", "Balance yanjye", "Gura 1GB", "Ubufasha"],
      logout: "Sohoka", profile: "Konti", login: "Injira", registerTitle: "Kwiyandikisha", submit: "Ohereza",
      namePlaceholder: "Amazina", phonePlaceholder: "Numero ya Telefoni", pinPlaceholder: "PIN", confirmPinPlaceholder: "Emeza PIN", existingUserPrompt: "Usanzwe uri umukiliya? Injira",
      loginTitle: "Injira", loginButton: "Injira", registerButton: "Iyandikishe",
      alertPhoneRequiredTitle: "Numero irakenewe", alertPhoneRequiredBody: "Injiza numero yawe ya telefone kugirango winjire.",
      alertRegisterFirstTitle: "Iyandikishe mbere", alertRegisterFirstBody: "Nyamuneka wiyandikishe mbere yo kuganira.",
      alertPermissionDeniedTitle: "Uburenganzira bwanzwe", alertPermissionDeniedBody: "Nyamuneka wemere ko iyi app ibona amafoto kugirango ushyireho ifoto.",
      alertAvatarUploaded: "Ifoto yashyizweho", alertUploadFailed: "Kunanirwa gushyiraho ifoto", alertUploadFailedBody: "Ntibyashobotse gushyiraho ifoto.",
      editProfileTitle: "Hindura Konti", quickActions: "Ibikorwa Byihuse", topUp: "Ongera amafaranga", recommendations: "Inama",
      recentPurchases: "Ibicuruzwa umaze kugura", editProfileBtn: "Hindura Konti", confirmLogoutTitle: "Sohoka", confirmLogoutBody: "Urifuza koko gusohoka?",
      cancel: "Guhagarika", save: "Bika", buyConfirmTitle: "Emeza Kugura", buyConfirmBody: "Ukeneye kugura {display} ?",
      buySuccess: "Kugura byagenze neza", buyFailed: "Kunanirwa kugura", online: "Kuri murandasi", offline: "Ntabwo kuri murandasi",
      retryText: "Gerageza", botTyping: "Bot irimo kwandika…",
      continueChat: "Komeza Ikiganiro", whatElse: "Ninde nabafasha?",
      newMessages: "Gishya", pullToRefresh: "Kurura kugirango usubire", refreshing: "Bisubira...",
      stats: { messages: "Ubutumwa", purchases: "Ibicuruzwa", loyalty: "Amanota" },
      // Voice recording translations
      recording: "ndi gufata amajwi... kanda  kwohereza",
      transcribing: "ndirimo guhindura amajwi...",
      voiceSent: "Ubutumwa bwa voice bwoherejwe",
      voiceFailed: "Ubutumwa bwa voice ntibwajyiye",
      permissionRequired: "Uburenganzira bukenewe",
      permissionMicrophone: "Nyamuneka wemere kugira ngo microphone ikoreshwe kugirango ukoreshe amajwi",
      // New translations
      personality: "Imiterere ya Bot",
      professional: "Yubushobozi",
      friendly: "Yubugenzi",
      humorous: "Yuruseke",
      theme: "Isura",
      summarize: "Sobanura",
      summary: "Incamake y'ikiganiro",
      close: "Funga",
    }
  }), []);

  const t = translations[language];

  // Add early return if theme or translations are not ready
  if (!theme || !translations || !t) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: "#333" }}>Loading...</Text>
      </View>
    );
  }

  /* ----------------------- Helper Functions ----------------------- */

  // Format time to relative (2m ago, 1h ago, etc.)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Get random color for avatar based on name
  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
      '#073B4C', '#EF476F', '#7209B7', '#3A86FF', '#FB5607'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // Mark messages as read when chat screen is focused
  useEffect(() => {
    if (screen === "chat") {
      setUnreadCount(0);
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    }
  }, [screen]);

  // Update unread count when new messages arrive
  useEffect(() => {
    if (screen !== "chat") {
      const unread = messages.filter(msg => msg.from === 'ai' && !msg.read).length;
      setUnreadCount(unread);
    }
  }, [messages, screen]);

  // Handle user typing indicator
  useEffect(() => {
    if (inputText.length > 0) {
      setIsUserTyping(true);
      if (userTypingTimeout.current) {
        clearTimeout(userTypingTimeout.current);
      }
      userTypingTimeout.current = setTimeout(() => {
        setIsUserTyping(false);
      }, 1000);
    } else {
      setIsUserTyping(false);
    }
    
    return () => {
      if (userTypingTimeout.current) {
        clearTimeout(userTypingTimeout.current);
      }
    };
  }, [inputText]);

  // Load saved theme and personality on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEY_THEME);
        if (savedTheme !== null) {
          setSelectedThemeIndex(parseInt(savedTheme, 10));
        }
        const savedPersonality = await AsyncStorage.getItem(STORAGE_KEY_PERSONALITY);
        if (savedPersonality !== null) {
          setPersonality(savedPersonality);
        }
      } catch (e) {
        console.warn("Failed to load settings", e);
      }
    };
    loadSettings();
  }, []);

  /* -------------------- Voice Recording Functions -------------------- */

  const startRecording = async () => {
    console.log('startRecording called:', {
      hasInstance: !!recordingInstance,
      isRecording,
      isStopping: isStoppingRecording.current
    });
    
    try {
      // Stop any existing recording first
      if (recordingInstance && isRecording) {
        console.log('Stopping existing recording before starting new one...');
        try {
          await recordingInstance.stopAndUnloadAsync();
        } catch (e) {
          console.warn('Recording already stopped:', e);
        }
        setRecordingInstance(null);
        setIsRecording(false);
      }
      
      // Clear any existing timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          t.permissionRequired,
          t.permissionMicrophone
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      console.log('Creating new recording instance...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      console.log('Recording created successfully');
      setRecordingInstance(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    console.log('stopRecording called:', { 
      hasInstance: !!recordingInstance, 
      isRecording, 
      isStopping: isStoppingRecording.current 
    });
    
    if (!recordingInstance || !isRecording || isStoppingRecording.current) {
      console.log('stopRecording early return - conditions not met');
      return;
    }
    
    // Set stopping flag to prevent multiple calls
    isStoppingRecording.current = true;
    setIsRecording(false);

    try {
      console.log('Attempting to stop recording...');
      
      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Stop recording
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      
      console.log('Recording stopped successfully, URI:', uri);
      
      // Reset recording state
      setRecordingInstance(null);
      setRecordingDuration(0);

      // Send audio to backend for transcription
      if (uri) {
        await sendAudioToBackend(uri);
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      // Don't show alert for "Recorder does not exist" as it's expected
      if (!error.message || !error.message.includes('Recorder does not exist')) {
        Alert.alert('Error', 'Could not process recording');
      }
    } finally {
      // Reset stopping flag
      isStoppingRecording.current = false;
    }
  };

  const sendAudioToBackend = async (audioUri) => {
    if (!phone) {
      Alert.alert(t.alertRegisterFirstTitle, t.alertRegisterFirstBody);
      return;
    }

    setTranscribing(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('language', language);
      
      // Extract filename from URI
      const filename = audioUri.split('/').pop();
      
      // Append audio file
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: filename || 'recording.m4a'
      });

      // Send to backend transcription endpoint
      const response = await fetch(`${BACKEND_URL}/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Send transcribed text as a normal message (no duplicate placeholder)
      await sendMessage(data.text || "Voice message");

    } catch (error) {
      console.error('Audio transcription error:', error);
      Alert.alert(t.voiceFailed, "Could not transcribe audio message");
    } finally {
      setTranscribing(false);
    }
  };

  // Auto-stop recording after 60 seconds
  useEffect(() => {
    if (recordingDuration >= 60 && isRecording) {
      stopRecording();
    }
  }, [recordingDuration, isRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recordingInstance) {
        recordingInstance.stopAndUnloadAsync();
      }
    };
  }, []);

  /* ------------------------------ Effects ------------------------------ */

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
        if (raw) {
          const profile = JSON.parse(raw);
          if (mounted) {
            setName(profile.name || "");
            setPhone(profile.phone || "");
            setLanguage(profile.language || "en");
            setQuickReplies(translations[profile.language || "en"].quick_examples);
            if (profile.phone) fetchServerProfile(profile.phone);
          }
        } else {
          if (mounted) setQuickReplies(translations["en"].quick_examples);
        }
      } catch (e) {
        console.warn("Failed to load profile", e);
      } finally {
        setTimeout(() => { if (mounted) setAppLoading(false); }, 350);
      }
    })();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);
      if (connected) retryQueuedMessages();
    });

    return () => { mounted = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (screen === "profile") {
      setEditName((profileServer && profileServer.name) || name || "");
      setEditBio((profileServer && profileServer.bio) || "");
    }
  }, [screen, profileServer, name]);

  useEffect(() => {
    screenFade.setValue(0);
    Animated.timing(screenFade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [screen]);

  /* ------------------------- Helper Functions ------------------------- */

  const persistLocalProfile = useCallback(async (profile) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
      const existing = raw ? JSON.parse(raw) : {};
      const merged = { ...(existing || {}), ...(profile || {}) };
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(merged));
      setName(merged.name || "");
      setPhone(merged.phone || "");
      if (merged.language) {
        setLanguage(merged.language);
        setQuickReplies(translations[merged.language]?.quick_examples || translations["en"].quick_examples);
      }
    } catch (e) {
      console.warn("Failed to persist profile locally", e);
    }
  }, []);

  const enqueueUnsentMessage = useCallback(async (payload) => {
    try {
      const raw = await AsyncStorage.getItem(UNSENT_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      await AsyncStorage.setItem(UNSENT_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("Failed to enqueue unsent message", e);
    }
  }, []);

  const retryQueuedMessages = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(UNSENT_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      if (!queue.length) return;
      const failed = [];
      for (const item of queue) {
        try { await axios.post(`${BACKEND_URL}/chat`, item); }
        catch (e) { failed.push(item); }
      }
      if (failed.length) await AsyncStorage.setItem(UNSENT_KEY, JSON.stringify(failed));
      else await AsyncStorage.removeItem(UNSENT_KEY);
    } catch (e) {
      console.warn("Failed to retry queued messages", e);
    }
  }, []);

  /* ------------------------- Server Communication ------------------------- */

  const fetchServerProfile = useCallback(async (phoneArg) => {
    if (!phoneArg) return;
    try {
      const resp = await axios.get(`${BACKEND_URL}/profile`, { params: { phone: phoneArg } });
      const data = resp.data || {};
      if (data.avatar_url && data.avatar_url.startsWith("/")) {
        data.avatar_url = BACKEND_URL.replace(/\/$/, "") + data.avatar_url;
      }
      setProfileServer(data);
      const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
      const existing = raw ? JSON.parse(raw) : {};
      const local = {
        name: data.name || existing.name || name,
        phone: data.phone || existing.phone || phoneArg,
        avatar_url: data.avatar_url,
        language: existing.language || language,
      };
      await persistLocalProfile(local);
    } catch (e) {
      console.warn("Failed to fetch server profile", e);
    }
  }, [language, name, persistLocalProfile]);

  /* ------------------------- Authentication ------------------------- */

  const loginExistingUser = useCallback(async () => {
    const p = loginPhone?.trim();
    const pin = loginPin?.trim();
    if (!p || !pin) {
      return Alert.alert(t.alertPhoneRequiredTitle, "Please enter phone number and PIN");
    }
    setLoggingIn(true);
    try {
      const resp = await axios.post(`${BACKEND_URL}/login`, { 
        phone: p, 
        pin: pin 
      }, { 
        headers: { "Content-Type": "application/json; charset=utf-8" } 
      });
      const data = resp.data || {};
      if (data.avatar_url && data.avatar_url.startsWith("/")) {
        data.avatar_url = BACKEND_URL.replace(/\/$/, "") + data.avatar_url;
      }
      setProfileServer(data);
      const profile = { 
        name: data.name || "", 
        phone: data.phone || p, 
        avatar_url: data.avatar_url, 
        language: data.language || language 
      };
      await persistLocalProfile(profile);
      Alert.alert(t.loginTitle, `${profile.name || profile.phone} — ${t.loginButton}`);
      setLoginPhone("");
      setLoginPin("");
      setScreen("home");
    } catch (e) {
      console.error("Login failed", e);
      Alert.alert(t.loginTitle, e?.response?.data?.detail || "Login failed. Check your credentials.");
    } finally { 
      setLoggingIn(false); 
    }
  }, [loginPhone, loginPin, language, persistLocalProfile]);

  const submitRegistration = useCallback(async () => {
    if (!name.trim() || !phone.trim() || !pin.trim()) {
      return Alert.alert(t.registerTitle, "Please enter name, phone number and PIN");
    }
    if (pin !== confirmPin) {
      return Alert.alert(t.registerTitle, "PINs do not match");
    }
    if (pin.length < 5) {
      return Alert.alert(t.registerTitle, "PIN must be at least 5 digits");
    }
    setRegistering(true);
    try {
      await axios.post(
        `${BACKEND_URL}/register`, 
        { 
          name: name.trim(), 
          phone: phone.trim(), 
          pin: pin.trim(),
          confirm_pin: confirmPin.trim(),
          language 
        }, 
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
      const profile = { name: name.trim(), phone: phone.trim(), language };
      await persistLocalProfile(profile);
      await fetchServerProfile(profile.phone);
      Alert.alert(t.registerTitle, `${profile.name} ${t.submit} ${profile.phone}`);
      setName("");
      setPhone("");
      setPin("");
      setConfirmPin("");
      setScreen("home");
    } catch (e) {
      console.error("Registration failed", e);
      Alert.alert(t.registerTitle, e?.response?.data?.detail || "Unable to register. Try again.");
    } finally { 
      setRegistering(false); 
    }
  }, [name, phone, pin, confirmPin, language, persistLocalProfile, fetchServerProfile]);

  /* ------------------------- Avatar Upload ------------------------- */

  const pickAndUploadAvatar = useCallback(async () => {
    if (!phone) { 
      Alert.alert(t.alertRegisterFirstTitle, t.alertRegisterFirstBody); 
      return; 
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { 
        Alert.alert(t.alertPermissionDeniedTitle, t.alertPermissionDeniedBody); 
        return; 
      }
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 0.7 
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      
      const asset = result.assets[0];
      const uri = asset.uri;
      if (!uri) return;
      
      const filename = uri.split("/").pop();
      let mime = "image/jpeg";
      if (filename.toLowerCase().endsWith(".png")) mime = "image/png";
      else if (filename.toLowerCase().endsWith(".webp")) mime = "image/webp";
      
      const form = new FormData();
      form.append("phone", phone); 
      form.append("language", language);
      form.append("avatar", { 
        uri, 
        name: filename, 
        type: mime 
      });
      
      setUploadingAvatar(true);
      const resp = await fetch(`${BACKEND_URL}/profile/avatar`, { 
        method: "POST", 
        body: form,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!resp.ok) {
        throw new Error(`Upload failed with status: ${resp.status}`);
      }
      
      const data = await resp.json();
      if (data && data.avatar_url) {
        const avatarFull = data.avatar_url.startsWith("http") ? 
          data.avatar_url : 
          BACKEND_URL.replace(/\/$/, "") + data.avatar_url;
        setProfileServer((prev) => ({ ...(prev || {}), avatar_url: avatarFull }));
        await persistLocalProfile({ name, phone, avatar_url: avatarFull, language });
        Alert.alert(t.alertAvatarUploaded);
      } else {
        Alert.alert(t.alertUploadFailed, data?.detail || t.alertUploadFailedBody);
      }
    } catch (e) {
      console.warn("Avatar upload failed", e);
      Alert.alert(t.alertUploadFailed, e.message || t.alertUploadFailedBody);
    } finally { 
      setUploadingAvatar(false); 
    }
  }, [phone, language, name, persistLocalProfile]);

  /* ------------------------- Profile Management ------------------------- */

  const saveProfileEdits = useCallback(async () => {
    if (!phone) return Alert.alert(t.alertRegisterFirstTitle, t.alertRegisterFirstBody);
    setSavingProfile(true);
    try {
      await axios.patch(`${BACKEND_URL}/profile`, { 
        phone, 
        name: editName, 
        bio: editBio, 
        language 
      });
      await fetchServerProfile(phone);
      setEditingProfile(false);
      Alert.alert(t.editProfileTitle, t.save);
    } catch (e) {
      console.warn("Update failed", e);
      Alert.alert(t.editProfileTitle, e?.response?.data?.detail || "Could not update profile");
    } finally { 
      setSavingProfile(false); 
    }
  }, [phone, editName, editBio, language, fetchServerProfile]);

  // Theme change handler
  const changeTheme = useCallback(async (index) => {
    setSelectedThemeIndex(index);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_THEME, index.toString());
    } catch (e) {
      console.warn("Failed to save theme", e);
    }
  }, []);

  // Personality change handler
  const changePersonality = useCallback(async (newPersonality) => {
    setPersonality(newPersonality);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PERSONALITY, newPersonality);
    } catch (e) {
      console.warn("Failed to save personality", e);
    }
  }, []);

  // Chat summary function
  const summarizeChat = useCallback(async () => {
    if (messages.length === 0) {
      Alert.alert(t.summary, "No messages to summarize.");
      return;
    }
    // Get last 10 messages (or all if less)
    const recentMessages = messages.slice(-10).map(m => `${m.from === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
    try {
      const response = await axios.post(`${BACKEND_URL}/summarize`, {
        messages: recentMessages,
        language,
      });
      setSummaryText(response.data.summary || "Summary not available.");
      setSummaryModalVisible(true);
    } catch (error) {
      console.error("Summarize error:", error);
      Alert.alert(t.summary, "Failed to generate summary.");
    }
  }, [messages, language]);

  /* ------------------------- Chat Logic ------------------------- */

  const sendMessage = useCallback(async (overrideText) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    if (!textToSend || !textToSend.trim() || isLoading) return;
    
    if (!phone || !phone.trim()) {
      Alert.alert(t.alertRegisterFirstTitle, t.alertRegisterFirstBody, [
        { text: t.cancel, style: "cancel" },
        { text: t.registerButton, onPress: () => setScreen("register") },
      ]);
      return;
    }

    const ts = new Date().toISOString();
    const userMessage = { 
      id: Date.now().toString(), 
      from: "user", 
      text: textToSend, 
      createdAt: new Date().toISOString(), 
      status: "sending",
      read: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setQuickReplies([]);
    setIsLoading(true);
    
    const aiPlaceholder = { 
      id: Date.now().toString() + "_ai", 
      from: "ai", 
      text: "...", 
      createdAt: new Date().toISOString(), 
      status: "sending",
      read: false
    };
    setMessages(prev => [...prev, aiPlaceholder]);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/chat`, { 
        phone: phone, 
        message: textToSend
      }, { 
        headers: { "Content-Type": "application/json; charset=utf-8" } 
      });
      
      const replyText = response.data.reply || "No reply";
      const quickReplies = response.data.quick_replies || [];
      
      setMessages((prev) => 
        prev.filter((m) => m.id !== aiPlaceholder.id)
        .concat([{ 
          id: Date.now().toString() + "_ai", 
          from: "ai", 
          text: replyText, 
          createdAt: new Date().toISOString(), 
          status: "sent", 
          read: screen === "chat"
        }])
      );

      if (quickReplies && Array.isArray(quickReplies)) {
        setQuickReplies(quickReplies);
      } else {
        setQuickReplies(translations[language].quick_examples);
      }
      
    } catch (e) {
      console.warn("Chat failed", e);
      setMessages((prev) => 
        prev.map((m) => 
          m.id === aiPlaceholder.id 
            ? { ...m, text: t.error, status: "failed" }
            : m
        )
      );
      
      // Add to unsent queue for retry
      try {
        const queue = JSON.parse(await AsyncStorage.getItem(UNSENT_KEY) || "[]");
        queue.push({ userId: phone, text: textToSend, timestamp: new Date().toISOString() });
        await AsyncStorage.setItem(UNSENT_KEY, JSON.stringify(queue));
      } catch (queueErr) {
        console.warn("Failed to save to queue", queueErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText, phone, language, t, screen, translations]);

  const retryMessage = useCallback(async (msg) => {
    if (!msg) return;
    sendMessage(msg.text);
    setMessages((prev) => prev.filter((m) => !(m.status === "failed" && m.from === "ai")));
  }, [sendMessage]);

  const clearChat = useCallback(() => { 
    setMessages([]); 
    setQuickReplies(translations[language].quick_examples); 
  }, [language, translations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset quick replies and optionally reload something
    setQuickReplies(translations[language].quick_examples);
    setTimeout(() => setRefreshing(false), 1000);
  }, [language, translations]);

  /* ------------------------- Purchase Flow ------------------------- */

  const handlePurchase = useCallback(async (option) => {
    if (!phone) return Alert.alert(t.alertRegisterFirstTitle, t.alertRegisterFirstBody);
    
    Alert.alert(t.buyConfirmTitle, t.buyConfirmBody.replace("{display}", option.display || option.name), [
      { text: t.cancel, style: "cancel" },
      {
        text: t.submit,
        onPress: async () => {
          setProcessingPurchaseId(option.qp_id);
          const tempMsg = { 
            id: Date.now().toString() + "_purchase", 
            from: "user", 
            text: `Purchase ${option.display || option.name}`, 
            createdAt: new Date().toISOString(), 
            status: "sent",
            read: true
          };
          setMessages((prev) => [...prev, tempMsg]);
          setPurchasing(true);
          
          try {
            // Match main.py purchase endpoint format
            const payload = { 
              phone: phone, 
              qp_id: option.qp_id || option.id || 1 
            };
            
            const resp = await axios.post(`${BACKEND_URL}/purchase`, payload, { 
              headers: { "Content-Type": "application/json; charset=utf-8" } 
            });
            
            const aiResponse = { 
              id: Date.now().toString() + "_ai_purchase", 
              from: "ai", 
              text: resp.data.reply || t.buySuccess, 
              createdAt: new Date().toISOString(), 
              status: "sent",
              options: resp.data.options || null,
              read: screen === "chat"
            };
            
            setMessages((prev) => [...prev, aiResponse]);
            
            // Update quick replies if provided
            if (resp.data.quick_replies && Array.isArray(resp.data.quick_replies)) {
              setQuickReplies(resp.data.quick_replies);
            } else if (resp.data.options && Array.isArray(resp.data.options)) {
              setQuickReplies(resp.data.options.slice(0, 4).map(o => o.display || o.name));
            } else {
              setQuickReplies(translations[language].quick_examples);
            }
            
            fetchServerProfile(phone);
          } catch (e) {
            console.error("Purchase failed", e.response?.data || e.message);
            setMessages((prev) => [...prev, { 
              id: Date.now().toString() + "_ai_purchase_fail", 
              from: "ai", 
              text: `⚠️ ${t.buyFailed}. ${e.response?.data?.detail || e.message || t.retryText}`, 
              createdAt: new Date().toISOString(), 
              status: "failed",
              read: false
            }]);
          } finally { 
            setPurchasing(false); 
            setProcessingPurchaseId(null);
          }
        }
      }
    ]);
  }, [phone, t, screen, language, translations, fetchServerProfile]); 

  /* ------------------------- Render Message ------------------------- */

  const renderMessage = useCallback(({ item }) => {
    const time = formatTime(item.createdAt);
    const isUser = item.from === "user";
    
    const onRetryPress = () => {
      if (item.status === "failed" && item.from === "ai") {
        const lastUser = [...messages].reverse().find((m) => m.from === "user");
        if (lastUser) retryMessage(lastUser);
      } else if (item.status === "failed" && item.from === "user") {
        sendMessage(item.text);
      }
    };

    return (
      <BeautifulChatBubble 
        message={item} 
        isUser={isUser} 
        theme={theme}
        onRetry={onRetryPress}
      />
    );
  }, [messages, theme, sendMessage, retryMessage]);

  /* ------------------------- Theme & Language ------------------------- */

  const toggleTheme = useCallback(() => {
    Animated.timing(knob, { 
      toValue: darkMode ? 2 : 24, 
      duration: 200, 
      easing: Easing.ease, 
      useNativeDriver: false 
    }).start();
    setDarkMode((d) => !d);
  }, [darkMode]);

  const toggleLanguage = useCallback(async () => {
    const next = language === "en" ? "kin" : "en";
    setLanguage(next);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
      const profile = raw ? JSON.parse(raw) : {};
      profile.language = next;
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) { console.warn("Failed to persist language", e); }
    setQuickReplies(translations[next].quick_examples);
  }, [language, translations]);

  // Add missing API functions for main.py endpoints
  
  // Get balance from main.py
  const getBalance = useCallback(async () => {
    if (!phone) return null;
    try {
      const response = await axios.get(`${BACKEND_URL}/balance`, { 
        params: { phone } 
      });
      return response.data;
    } catch (e) {
      console.warn("Balance fetch failed", e);
      return null;
    }
  }, [phone]);

  // Get purchases from main.py
  const getPurchases = useCallback(async () => {
    if (!phone) return [];
    try {
      const response = await axios.get(`${BACKEND_URL}/purchases`, { 
        params: { phone, limit: 20 } 
      });
      return response.data.purchases || [];
    } catch (e) {
      console.warn("Purchases fetch failed", e);
      return [];
    }
  }, [phone]);

  // Get recommendations from main.py
  const getRecommendations = useCallback(async () => {
    if (!phone) return [];
    try {
      const response = await axios.get(`${BACKEND_URL}/recommendations`, { 
        params: { phone, limit: 6 } 
      });
      return response.data.recommendations || [];
    } catch (e) {
      console.warn("Recommendations fetch failed", e);
      return [];
    }
  }, [phone]);

  // Transfer airtime using main.py endpoint
  const transferAirtime = useCallback(async (toPhone, amount) => {
    if (!phone) return { status: "error", reply: "Phone number required" };
    try {
      const response = await axios.post(`${BACKEND_URL}/transfer`, {
        from_phone: phone,
        to_phone: toPhone,
        amount: amount
      });
      return response.data;
    } catch (e) {
      console.warn("Transfer failed", e);
      return { status: "error", reply: "Transfer failed. Please try again." };
    }
  }, [phone]);

  const confirmLogout = useCallback(() => {
    Alert.alert(t.confirmLogoutTitle, t.confirmLogoutBody, [
      { text: t.cancel, style: "cancel" },
      { 
        text: t.logout, 
        style: "destructive", 
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEY_PROFILE);
            setName(""); 
            setPhone(""); 
            setPin("");
            setConfirmPin("");
            setLoginPhone("");
            setLoginPin("");
            setProfileServer(null); 
            setMessages([]); 
            setQuickReplies(translations[language].quick_examples); 
            setScreen("home");
          } catch (e) { 
            console.warn("Logout failed", e); 
            Alert.alert(t.confirmLogoutTitle, "Failed to logout. Try again."); 
          }
        } 
      }
    ], { cancelable: true });
  }, [language, t, translations]);

  /* ------------------------- Loading Screen ------------------------- */

  if (appLoading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: theme.background }]}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <MaterialCommunityIcons name="robot-happy-outline" size={72} color={theme.accent} />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "700", color: theme.text }}>{t.app}</Text>
        <Text style={{ marginTop: 8, color: theme.sub }}>{t.sub}</Text>
        <View style={{ marginTop: 24 }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </View>
    );
  }

  /* ------------------------- Home Screen ------------------------- */

  if (screen === "home") {
    return (
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: screenFade }]}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        
        {/* Beautiful Background Effects */}
        <MorphingBackground theme={theme} />
        <FloatingParticles theme={theme} count={15} />
        
        <ScrollView contentContainerStyle={[styles.home, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.logo, { color: theme.text }]}>{translations[language].app}</Text>

          <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity onPress={toggleLanguage} style={styles.langRow}>
              <MaterialCommunityIcons name="translate" size={22} color={theme.accent} />
              <Text style={{ color: theme.accent, marginLeft: 8, fontWeight: '600' }}>{translations[language].lang}</Text>
            </TouchableOpacity>

            <View style={{ alignItems: "flex-end" }}>
              {phone ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <TouchableOpacity onPress={() => setScreen("profile")} style={{ marginRight: 12, padding: 6, position: 'relative' }}>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons name="account-circle" size={36} color={darkMode ? theme.accent : theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmLogout} style={{ padding: 6 }}>
                    <MaterialCommunityIcons name="logout" size={24} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setScreen("login")} style={{ padding: 6 }}>
                  <MaterialCommunityIcons name="login" size={28} color={theme.accent} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ShimmerEffect visible={appLoading}>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleTrack, { backgroundColor: theme.track }]} onPress={toggleTheme}>
                  <Animated.View style={[styles.knob, { backgroundColor: theme.knob, left: knob }]} />
                </TouchableOpacity>
                <Text style={[styles.toggleText, { color: theme.text }]}>{t.dark}</Text>
              </View>

              <MaterialCommunityIcons name="robot-happy-outline" size={44} color={theme.accent} style={{ marginTop: 14 }} />
              <Text style={[styles.hero, { color: theme.text }]}>{translations[language].hero}</Text>
              <Text style={{ color: theme.sub, textAlign: "center", marginBottom: 12 }}>{translations[language].sub}</Text>

              <View style={{ width: "100%", alignItems: "center" }}>
                <MagneticButton theme={theme}>
                  <BeautifulButton
                    onPress={() => { 
                      if (!phone || !phone.trim()) { 
                        setScreen("register"); 
                        return; 
                      } 
                      setScreen("chat"); 
                    }}
                    loading={false}
                    icon="chat"
                    style={{ width: "100%" }}
                  >
                    {translations[language].start}
                  </BeautifulButton>
                </MagneticButton>

                {!phone || !phone.trim() ? (
                  <BeautifulButton 
                    onPress={() => setScreen("register")} 
                    loading={false} 
                    icon="account-plus"
                    style={{ width: "100%", marginTop: 12 }}
                  >
                    {translations[language].registerButton}
                  </BeautifulButton>
                ) : null}
              </View>
            </View>
          </ShimmerEffect>

          <ExpandableCard title="Features" theme={theme}>
            {translations[language].features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <MaterialCommunityIcons name={f.icon} size={22} color={theme.accent} />
                <Text style={[styles.featureText, { color: theme.text }]}>{f.text}</Text>
              </View>
            ))}
          </ExpandableCard>
        </ScrollView>

        {/* Floating Action Button */}
        <FloatingActionButton
          actions={[
            { icon: "chat", onPress: () => setScreen("chat"), color: theme.accent },
            { icon: "account", onPress: () => setScreen("profile"), color: "#4CAF50" },
            { icon: "cog", onPress: () => Alert.alert("Settings", "Coming soon!"), color: "#2196F3" },
          ]}
          theme={theme}
        />
      </Animated.View>
    );
  }

  /* ------------------------- Register Screen ------------------------- */

  if (screen === "register") {
    return (
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: screenFade }]}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <KeyboardAvoidingView style={{ flex: 1, padding: 24 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Text style={[styles.chatTitle, { color: theme.text, marginBottom: 20 }]}>{t.registerTitle}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialCommunityIcons name="account" color={theme.text} />
            <TextInput 
              placeholder={t.namePlaceholder} 
              placeholderTextColor={theme.sub} 
              value={name} 
              onChangeText={setName} 
              style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]} 
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialCommunityIcons name="phone" color={theme.text} />
            <TextInput 
              placeholder={t.phonePlaceholder} 
              placeholderTextColor={theme.sub} 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
              style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]} 
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialCommunityIcons name="lock" color={theme.text} />
            <TextInput 
              placeholder={t.pinPlaceholder} 
              placeholderTextColor={theme.sub} 
              value={pin} 
              onChangeText={setPin} 
              secureTextEntry={true}
              keyboardType="numeric"
              maxLength={5}
              style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]} 
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <MaterialCommunityIcons name="lock-check" color={theme.text} />
            <TextInput 
              placeholder={t.confirmPinPlaceholder} 
              placeholderTextColor={theme.sub} 
              value={confirmPin} 
              onChangeText={setConfirmPin} 
              secureTextEntry={true}
              keyboardType="numeric"
              maxLength={5}
              style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]} 
            />
          </View>

          <BeautifulButton onPress={submitRegistration} loading={registering} icon="check-circle">
            {t.submit}
          </BeautifulButton>

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity onPress={() => setScreen("login")} style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="login" color={theme.accent} />
              <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>{t.existingUserPrompt}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen("home")} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.accent, fontWeight: "700" }}>{t.back}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  }

  /* ------------------------- Login Screen ------------------------- */

  if (screen === "login") {
    return (
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: screenFade }]}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <KeyboardAvoidingView style={{ flex: 1, padding: 24 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Text style={[styles.chatTitle, { color: theme.text, marginBottom: 20 }]}>{t.loginTitle}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialCommunityIcons name="phone" color={theme.text} />
            <TextInput 
              placeholder={t.phonePlaceholder} 
              placeholderTextColor={theme.sub} 
              value={loginPhone} 
              onChangeText={setLoginPhone} 
              keyboardType="phone-pad" 
              style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]} 
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <MaterialCommunityIcons name="lock" color={theme.text} />
            <TextInput 
              placeholder={t.pinPlaceholder} 
              placeholderTextColor={theme.sub} 
              value={loginPin} 
              onChangeText={setLoginPin} 
              secureTextEntry={true}
              keyboardType="numeric"
              maxLength={5}
              style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]} 
            />
          </View>

          <BeautifulButton onPress={loginExistingUser} loading={loggingIn} icon="login">
            {t.loginButton}
          </BeautifulButton>

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity onPress={() => setScreen("register")} style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="account-plus" color={theme.accent} />
              <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>{t.registerButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen("home")} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.accent, fontWeight: "700" }}>{t.back}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  }

  /* ------------------------- Profile Screen ------------------------- */

  if (screen === "profile") {
    const server = profileServer || { name, phone, avatar_url: null, airtime: 0, loyalty_points: 0, recent_purchases: [], recommendations: [] };
    const avatarColor = getAvatarColor(server.name);
    const userMessagesCount = messages.filter(m => m.from === 'user').length;
    const purchasesCount = (server.recent_purchases || []).length;

    const avatarContent = uploadingAvatar ? (
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.card }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    ) : server.avatar_url ? (
      <Image source={{ uri: server.avatar_url }} style={styles.avatarImage} />
    ) : (
      <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFF" }}>
          {(server.name || "U")[0].toUpperCase()}
        </Text>
      </View>
    );

    return (
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: screenFade }]}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchServerProfile(phone);
                setTimeout(() => setRefreshing(false), 1000);
              }}
              colors={[theme.accent]}
              tintColor={theme.accent}
            />
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploadingAvatar}>
              {avatarContent}
            </TouchableOpacity>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: theme.text }}>{server.name || name}</Text>
              <Text style={{ color: theme.sub, marginTop: 2 }}>{server.phone || phone}</Text>
            </View>
          </View>

          {/* Personality Selector */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: "900", color: theme.text, fontSize: 18 }}>{t.personality}</Text>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              {["Professional", "Friendly", "Humorous"].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => changePersonality(p)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: personality === p ? theme.accent : theme.input,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: personality === p ? "#000" : theme.text, fontWeight: "600" }}>
                    {t[p.toLowerCase()]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Theme Selector */}
          <BeautifulThemeSelector
            themes={themes}
            selectedTheme={selectedThemeIndex}
            onSelectTheme={changeTheme}
            theme={theme}
          />

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: "900", color: theme.text, fontSize: 18 }}>{t.quickActions}</Text>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <BeautifulButton 
                onPress={() => setScreen("chat")}
                icon="chat"
                style={{ flex: 1, marginRight: 10 }}
              >
                {t.chat}
              </BeautifulButton>
              <BeautifulButton 
                onPress={() => Alert.alert(t.topUp, "Top-up functionality coming soon!")}
                icon="wallet"
                style={{ flex: 1 }}
              >
                {t.topUp}
              </BeautifulButton>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: "900", color: theme.text, fontSize: 18 }}>{t.recommendations}</Text>
            <ScrollView horizontal style={{ marginTop: 12 }} showsHorizontalScrollIndicator={false}>
              {(server.recommendations || []).length > 0 ? (
                (server.recommendations || []).map((r, i) => (
                  <View key={i} style={{ padding: 16, backgroundColor: theme.card, borderRadius: 12, marginRight: 12, width: 220 }}>
                    <Text style={{ fontWeight: "700", color: theme.text, fontSize: 15 }}>{r.display}</Text>
                    {r.price && <Text style={{ color: theme.accent, marginTop: 4 }}>Price: {r.price}</Text>}
                    <BeautifulButton 
                      onPress={() => handlePurchase(r)} 
                      loading={purchasing}
                      icon="cart"
                      style={{ marginTop: 12 }}
                    >
                      Buy
                    </BeautifulButton>
                  </View>
                ))
              ) : (
                <View style={{ padding: 16, backgroundColor: theme.card, borderRadius: 12 }}>
                  <Text style={{ color: theme.sub }}>No recommendations yet. Start chatting!</Text>
                </View>
              )}
            </ScrollView>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: "900", color: theme.text, fontSize: 18 }}>{t.recentPurchases}</Text>
            <ScrollView style={{ marginTop: 12, maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {(server.recent_purchases || []).length > 0 ? (
                (server.recent_purchases || []).map((p) => (
                  <View key={p.id} style={{ padding: 14, backgroundColor: theme.card, borderRadius: 10, marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontWeight: "700", color: theme.text }}>{p.sub_category || p.qp_id}</Text>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={theme.sub} />
                    </View>
                    <Text style={{ color: theme.sub, marginTop: 4 }}>
                      {new Date(p.purchase_date).toLocaleString()} • Price: {p.price}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.sub, textAlign: 'center', marginTop: 20 }}>No recent purchases</Text>
              )}
            </ScrollView>
          </View>

          <View style={{ marginTop: 20, alignItems: "center", paddingBottom: 20 }}>
            <TouchableOpacity onPress={() => setEditingProfile(true)} style={{ padding: 12, flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="pencil" color={theme.accent} />
              <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>{t.editProfileBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={{ padding: 12, flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="logout" color="#E53935" />
              <Text style={{ color: "#E53935", fontWeight: "700", marginLeft: 8 }}>{t.logout}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen("home")} style={{ padding: 12, flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="arrow-left" color={theme.sub} />
              <Text style={{ color: theme.sub, marginLeft: 8 }}>{t.back}</Text>
            </TouchableOpacity>
          </View>

          <Modal visible={editingProfile} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: theme.text }}>{t.editProfileTitle}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                  <MaterialCommunityIcons name="account" color={theme.text} />
                  <TextInput 
                    placeholder={t.namePlaceholder} 
                    placeholderTextColor={theme.sub} 
                    value={editName} 
                    onChangeText={setEditName} 
                    style={[styles.input, { marginLeft: 12, backgroundColor: theme.input, color: theme.text, flex: 1 }]} 
                  />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                  <MaterialCommunityIcons name="information-outline" color={theme.text} />
                  <TextInput 
                    placeholder="Bio" 
                    placeholderTextColor={theme.sub} 
                    value={editBio} 
                    onChangeText={setEditBio} 
                    style={[styles.input, { marginLeft: 12, backgroundColor: theme.input, color: theme.text, flex: 1 }]} 
                  />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                  <TouchableOpacity onPress={() => setEditingProfile(false)} style={{ padding: 12 }}>
                    <Text style={{ color: theme.sub, fontWeight: '600' }}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <BeautifulButton onPress={saveProfileEdits} loading={savingProfile} icon="content-save">
                    {t.save}
                  </BeautifulButton>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>

        <BeautifulLoadingOverlay visible={uploadingAvatar} message="Uploading avatar..." />
      </Animated.View>
    );
  }

  /* ------------------------- Chat Screen ------------------------- */

  if (screen === "chat") {
    return (
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: screenFade }]}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        
        {/* Header */}
        <View style={[styles.chatHeader, { backgroundColor: theme.card, borderBottomColor: darkMode ? '#333' : '#EEE' }]}>
          <TouchableOpacity onPress={() => setScreen("home")} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.accent} />
          </TouchableOpacity>
          <Text style={[styles.chatHeaderTitle, { color: theme.text }]}>BazaAI Chat</Text>
          <TouchableOpacity onPress={clearChat} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="delete" size={24} color="#E53935" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListFooterComponent={
            isLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={{ color: theme.text, marginLeft: 12, fontSize: 14 }}>{t.botTyping}</Text>
              </View>
            ) : null
          }
        />

        {/* Quick Replies with animated chips */}
        {quickReplies.length > 0 && (
          <View style={[styles.quickRow, { backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: darkMode ? '#333' : '#EEE' }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            >
              {quickReplies.map((q, idx) => (
                <BeautifulChip
                  key={idx}
                  text={q}
                  onPress={() => sendMessage(q)}
                  disabled={isLoading}
                  theme={theme}
                  index={idx}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar with Voice Button */}
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: darkMode ? '#333' : '#EEE' }]}>
          <BeautifulVoiceButton
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            theme={theme}
          />
          
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: theme.input, borderRadius: 24, paddingHorizontal: 16, marginHorizontal: 12 }}>
            <MaterialCommunityIcons name="message-text" color={theme.sub} style={{ marginRight: 8 }} />
            <TextInput 
              placeholder={t.placeholder} 
              placeholderTextColor={theme.sub} 
              value={inputText} 
              onChangeText={setInputText} 
              style={[styles.input, { backgroundColor: 'transparent', color: theme.text, paddingVertical: 14, flex: 1 }]} 
              editable={!isLoading && !transcribing}
              onSubmitEditing={() => sendMessage()}
            />
          </View>

          <TouchableOpacity 
            onPress={() => sendMessage()} 
            disabled={isLoading || !inputText.trim() || transcribing} 
            style={{ opacity: (isLoading || !inputText.trim() || transcribing) ? 0.5 : 1 }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}>
              {isLoading || transcribing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialCommunityIcons name="send" size={22} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Show transcribing indicator */}
        {transcribing && (
          <View style={enhancedStyles.transcribingContainer}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={enhancedStyles.transcribingText}>
              {t.transcribing}
            </Text>
          </View>
        )}

        {/* Summary Modal */}
        <Modal visible={summaryModalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={enhancedStyles.modalContent}>
              <Text style={[enhancedStyles.modalTitle, { color: theme.text }]}>Chat Summary</Text>
              <Text style={[enhancedStyles.modalText, { color: theme.text }]}>{summaryText}</Text>
              <BeautifulButton onPress={() => setSummaryModalVisible(false)} style={{ marginTop: 20 }}>
                Close
              </BeautifulButton>
            </View>
          </View>
        </Modal>

        <BeautifulLoadingOverlay visible={transcribing} message={t.transcribing} />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, opacity: screenFade }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Text style={{ color: theme.text, textAlign: "center", marginTop: 100 }}>Screen not found</Text>
    </View>
  );
}

/* ------------------------- Styles ------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  home: { padding: 20, paddingBottom: 100 },
  logo: { fontSize: 32, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  langRow: { flexDirection: "row", alignItems: "center" },
  card: { 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 3, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  toggleRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  toggleTrack: { width: 52, height: 28, borderRadius: 14, justifyContent: "center" },
  knob: { width: 24, height: 24, borderRadius: 12, position: "absolute", top: 2 },
  toggleText: { marginLeft: 12, fontSize: 16, fontWeight: "600" },
  hero: { fontSize: 24, fontWeight: "700", textAlign: "center", marginVertical: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  featureText: { marginLeft: 12, fontSize: 15, flex: 1 },
  buttonBase: { 
    borderRadius: 12, 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    alignItems: "center", 
    justifyContent: "center", 
    elevation: 2, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3 
  },
  chatHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  chatHeaderTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  bubble: { 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 8, 
    maxWidth: "80%" 
  },
  bubbleMeta: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 8, 
    alignItems: "center" 
  },
  quickRow: { 
    position: "absolute", 
    bottom: 70, 
    left: 0, 
    right: 0 
  },
  inputBar: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 8 
  },
  input: { fontSize: 16 },
  profileContainer: { padding: 20 },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50 
  },
  avatarImage: {
    width: 100, 
    height: 100, 
    borderRadius: 50 
  },
  avatarImage: {
    width: 100, 
    height: 100, 
    borderRadius: 50 
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  avatarEdit: { 
    position: "absolute", 
    bottom: 0, 
    right: 0, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: "#007AFF", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  profileName: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  profilePhone: { fontSize: 14, marginTop: 4 },
  section: { 
    paddingVertical: 16, 
    borderTopWidth: 1 
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  balance: { fontSize: 18, fontWeight: "700" },
  editModal: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    padding: 20 
  },
  editModalContent: { 
    borderRadius: 16, 
    padding: 20 
  },
  editModalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  editInput: { 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12, 
    fontSize: 16 
  },
  editModalButtons: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  editButton: { 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    flex: 1, 
    marginHorizontal: 8 
  },
  editButtonText: { 
    textAlign: "center", 
    fontWeight: "600" 
  },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  unreadBadge: { 
    position: "absolute", 
    top: -2, 
    right: -2, 
    backgroundColor: "#E53935", 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  unreadBadgeText: { 
    color: "#FFF", 
    fontSize: 10, 
    fontWeight: "700" 
  },
  networkToast: { 
    position: "absolute", 
    top: 50, 
    left: 20, 
    right: 20, 
    backgroundColor: "#FF5722", 
    padding: 12, 
    borderRadius: 8, 
    flexDirection: "row", 
    alignItems: "center", 
    zIndex: 1000,
    marginTop: 2
  },
});

// Register the app with Expo
registerRootComponent(App);
