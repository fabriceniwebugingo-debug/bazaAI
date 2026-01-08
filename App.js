import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Ensure axios always sends a valid Content-Type with charset to avoid "charset=undefined" issues
axios.defaults.headers.post["Content-Type"] = "application/json; charset=utf-8";

const STORAGE_KEY_PROFILE = "baza_user_profile";
const UNSENT_KEY = "unsent_messages_queue";

// Backend URL - change to your backend address
const BACKEND_URL = "http://192.168.43.171:8000";

export default function App() {
  // --- App State ---
  const [screen, setScreen] = useState("home"); // home | chat | register | profile | login
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  // User profile (persisted)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Server profile (fetched)
  const [profileServer, setProfileServer] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Login specific input (so login doesn't clobber register's inputs mid-flow)
  const [loginPhone, setLoginPhone] = useState("");

  // Chat state
  const [messages, setMessages] = useState([]); // messages contain {id, from, text, createdAt, status, options?}
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // loader for backend response
  const [isConnected, setIsConnected] = useState(true);

  // Suggested quick replies (will be augmented from server responses when available)
  const [quickReplies, setQuickReplies] = useState([]);

  // --- Theme & Animation ---
  const knob = useRef(new Animated.Value(2)).current;

  const toggleTheme = () => {
    Animated.timing(knob, {
      toValue: darkMode ? 2 : 24,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    setDarkMode(!darkMode);
  };

  const COLORS = {
    // Changed accent from bright yellow to a darker orange for better contrast
    MTN_ACCENT: "#79a479ff",
    BLACK: "#000",
  };

  const theme = {
    // Darkened the light background a little bit
    background: darkMode ? "#000" : "#ECECEC",
    // Slightly darker card than pure white
    card: darkMode ? "#111" : "#F8F8F8",
    text: darkMode ? "#FFF" : "#111",
    sub: darkMode ? "#BBB" : "#555",
    input: darkMode ? "#1E1E1E" : "#EEE",
    accent: COLORS.MTN_ACCENT,
    track: darkMode ? "#333" : "#DDD",
    knob: darkMode ? COLORS.MTN_ACCENT : COLORS.BLACK,
  };

  // --- Translations (expanded so every visible string is localized) ---
  const translations = {
    en: {
      app: "BazaAI",
      hero: "Chat Smarter with AI",
      sub: "Airtime • Money • Balance • Support",
      start: "Start Chat",
      chat: "Conversation",
      placeholder: "Type message...",
      send: "Send",
      clear: "Clear Chat",
      back: "Back",
      dark: "Dark Mode",
      lang: "Kinyarwanda",
      features: [
        { text: "Buy airtime & bundles", icon: "cellphone" },
        { text: "Send & withdraw money", icon: "cash-multiple" },
        { text: "Check your balance", icon: "wallet-outline" },
        { text: "Secure messaging", icon: "shield-check" },
      ],
      quick_examples: ["Show bundles", "My balance", "Buy 1GB", "Help"],
      logout: "Logout",
      profile: "Profile",
      login: "Login",
      registerTitle: "Register",
      submit: "Submit",
      namePlaceholder: "Name",
      phonePlaceholder: "Phone Number",
      existingUserPrompt: "Existing user? Login",
      loginTitle: "Login",
      loginButton: "Login",
      registerButton: "Register",
      alertPhoneRequiredTitle: "Phone required",
      alertPhoneRequiredBody: "Please enter your phone number to login.",
      alertRegisterFirstTitle: "Register first",
      alertRegisterFirstBody: "Please register your name & phone before chatting.",
      alertPermissionDeniedTitle: "Permission denied",
      alertPermissionDeniedBody: "Please allow access to your photos to upload an avatar.",
      alertAvatarUploaded: "Avatar uploaded",
      alertUploadFailed: "Upload failed",
      alertUploadFailedBody: "Could not upload avatar.",
      editProfileTitle: "Edit Profile",
      quickActions: "Quick Actions",
      topUp: "Top-up",
      recommendations: "Recommendations",
      recentPurchases: "Recent purchases",
      editProfileBtn: "Edit Profile",
      confirmLogoutTitle: "Logout",
      confirmLogoutBody: "Are you sure you want to logout?",
      cancel: "Cancel",
      save: "Save",
      buyConfirmTitle: "Confirm Purchase",
      buyConfirmBody: "Buy {display} ?",
      buySuccess: "Purchase successful",
      buyFailed: "Purchase failed",
      online: "Online",
      offline: "Offline",
      retryText: "Retry",
      botTyping: "Bot is typing…",
    },
    kin: {
      app: "BazaAI",
      hero: "Vugana n’ubwenge bwa AI",
      sub: "Amainite • Amafaranga • Konti • Ubufasha",
      start: "Tangira Ikiganiro",
      chat: "Ikiganiro",
      placeholder: "Andika ubutumwa...",
      send: "Ohereza",
      clear: "Siba Ikiganiro",
      back: "Subira Inyuma",
      dark: "Uburyo bw’umwijima",
      lang: "English",
      features: [
        { text: "Gura amainite na bundles", icon: "cellphone" },
        { text: "Ohereza & Kurura amafaranga", icon: "cash-multiple" },
        { text: "Reba ayo usigaranye", icon: "wallet-outline" },
        { text: "Ubutumwa bufite umutekano", icon: "shield-check" },
      ],
      quick_examples: ["Erekana bundles", "Balance yanjye", "Gura 1GB", "Ubufasha"],
      logout: "Sohoka",
      profile: "Konti",
      login: "Injira",
      registerTitle: "Kwiyandikisha",
      submit: "Ohereza",
      namePlaceholder: "Amazina",
      phonePlaceholder: "Numero ya Telefoni",
      existingUserPrompt: "Usanzwe uri umukiliya? Injira",
      loginTitle: "Injira",
      loginButton: "Injira",
      registerButton: "Iyandikishe",
      alertPhoneRequiredTitle: "Numero irakenewe",
      alertPhoneRequiredBody: "Injiza numero yawe ya telefone kugirango winjire.",
      alertRegisterFirstTitle: "Iyandikishe mbere",
      alertRegisterFirstBody: "Nyamuneka wiyandikishe mbere yo kuganira.",
      alertPermissionDeniedTitle: "Uburenganzira bwanzwe",
      alertPermissionDeniedBody: "Nyamuneka wemere ko iyi app ibona amafoto kugirango ushyireho ifoto.",
      alertAvatarUploaded: "Ifoto yashyizweho",
      alertUploadFailed: "Kunanirwa gushyiraho ifoto",
      alertUploadFailedBody: "Ntibyashobotse gushyiraho ifoto.",
      editProfileTitle: "Hindura Konti",
      quickActions: "Ibikorwa Byihuse",
      topUp: "Ongera amafaranga",
      recommendations: "Inama",
      recentPurchases: "Ibicuruzwa umaze kugura",
      editProfileBtn: "Hindura Konti",
      confirmLogoutTitle: "Sohoka",
      confirmLogoutBody: "Urifuza koko gusohoka?",
      cancel: "Guhagarika",
      save: "Bika",
      buyConfirmTitle: "Emeza Kugura",
      buyConfirmBody: "Ukeneye kugura {display} ?",
      buySuccess: "Kugura byagenze neza",
      buyFailed: "Kunanirwa kugura",
      online: "Kuri murandasi",
      offline: "Ntabwo kuri murandasi",
      retryText: "Gerageza",
      botTyping: "Bot irimo kwandika…",
    },
  };

  const t = translations[language];

  const toggleLanguage = async () => {
    const next = language === "en" ? "kin" : "en";
    setLanguage(next);
    // persist language in local profile if present
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
      const profile = raw ? JSON.parse(raw) : {};
      profile.language = next;
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn("Failed to persist language", e);
    }
    // update quick replies to localized defaults
    setQuickReplies(translations[next].quick_examples);
  };

  // --- Effects: load profile + network status + retry queue ---
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
        if (raw) {
          const profile = JSON.parse(raw);
          setName(profile.name || "");
          setPhone(profile.phone || "");
          if (profile.language) {
            setLanguage(profile.language);
            setQuickReplies(translations[profile.language]?.quick_examples || translations["en"].quick_examples);
          } else {
            setQuickReplies(translations["en"].quick_examples);
          }
          // fetch server profile to populate avatar, purchases, recs
          if (profile.phone) fetchServerProfile(profile.phone);
        } else {
          // default quick replies
          setQuickReplies(translations["en"].quick_examples);
        }
      } catch (e) {
        console.warn("Failed to load profile", e);
      }
    })();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
      if (state.isConnected) {
        retryQueuedMessages();
      }
    });
    return () => unsubscribe();
    // intentionally not adding language to deps here: language is set from storage on mount
  }, []);

  const enqueueUnsentMessage = async (payload) => {
    try {
      const raw = await AsyncStorage.getItem(UNSENT_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      await AsyncStorage.setItem(UNSENT_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("Failed to enqueue unsent message", e);
    }
  };

  const retryQueuedMessages = async () => {
    try {
      const raw = await AsyncStorage.getItem(UNSENT_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      if (!queue.length) return;
      const failed = [];
      for (const item of queue) {
        try {
          await axios.post(`${BACKEND_URL}/chat`, item, {
            headers: { "Content-Type": "application/json; charset=utf-8" },
          });
        } catch (e) {
          console.warn("Retry failed for queued item", e);
          failed.push(item);
        }
      }
      if (failed.length) {
        // put back failed ones
        await AsyncStorage.setItem(UNSENT_KEY, JSON.stringify(failed));
      } else {
        await AsyncStorage.removeItem(UNSENT_KEY);
      }
    } catch (e) {
      console.warn("Failed to retry queued messages", e);
    }
  };

  // --- Persist local profile helper ---
  const persistLocalProfile = async (profile) => {
    try {
      // ensure we don't remove existing language unless provided
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
  };

  // --- Fetch server profile (new feature) ---
  const fetchServerProfile = async (phoneArg) => {
    if (!phoneArg) return;
    try {
      const resp = await axios.get(`${BACKEND_URL}/profile`, { params: { phone: phoneArg } });
      const data = resp.data;
      // convert server avatar path to full URL if necessary
      if (data.avatar_url && data.avatar_url.startsWith("/")) {
        data.avatar_url = BACKEND_URL.replace(/\/$/, "") + data.avatar_url;
      }
      setProfileServer(data);
      // update local cached profile with some server fields (preserve language if already set)
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
  };

  // --- Allow existing user to login (calls existing /profile endpoint) ---
  const loginExistingUser = async () => {
    const p = loginPhone?.trim();
    if (!p) {
      return Alert.alert(t.alertPhoneRequiredTitle, t.alertPhoneRequiredBody);
    }
    try {
      setIsLoading(true);
      const resp = await axios.get(`${BACKEND_URL}/profile`, { params: { phone: p } });
      const data = resp.data;
      if (data) {
        if (data.avatar_url && data.avatar_url.startsWith("/")) {
          data.avatar_url = BACKEND_URL.replace(/\/$/, "") + data.avatar_url;
        }
        setProfileServer(data);
        const profile = {
          name: data.name || "",
          phone: data.phone || p,
          avatar_url: data.avatar_url,
          language: data.language || language,
        };
        await persistLocalProfile(profile);
        Alert.alert(t.loginTitle, `${profile.name || profile.phone} — ${t.loginButton}`);
        setLoginPhone("");
        setScreen("home");
      } else {
        Alert.alert(t.loginTitle, t.alertPhoneRequiredBody);
      }
    } catch (e) {
      console.error("Login failed", e);
      Alert.alert(t.loginTitle, e?.response?.data?.detail || "Unable to login. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Registration Handler (calls backend /register and persists profile locally) ---
  const submitRegistration = async () => {
    if (!name.trim() || !phone.trim()) {
      return Alert.alert(t.registerTitle, t.alertRegisterFirstBody || "Please enter name and phone number");
    }

    try {
      setIsLoading(true);
      const resp = await axios.post(
        `${BACKEND_URL}/register`,
        { name: name.trim(), phone: phone.trim(), language },
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
      // persist locally
      const profile = { name: name.trim(), phone: phone.trim(), language };
      await persistLocalProfile(profile);
      await fetchServerProfile(profile.phone);
      Alert.alert(t.registerTitle, `${profile.name} ${t.submit} ${profile.phone}`);
      setScreen("home");
    } catch (e) {
      console.error("Registration failed", e);
      Alert.alert(t.registerTitle, e?.response?.data?.detail || "Unable to register. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Logout ---
  const confirmLogout = () => {
    Alert.alert(
      t.confirmLogoutTitle,
      t.confirmLogoutBody,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.logout,
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY_PROFILE);
              setName("");
              setPhone("");
              setProfileServer(null);
              setMessages([]);
              setQuickReplies(translations[language].quick_examples);
              setScreen("home");
            } catch (e) {
              console.warn("Logout failed", e);
              Alert.alert(t.confirmLogoutTitle, "Failed to logout. Try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // --- Avatar upload (new) robust handler ---
  const pickAndUploadAvatar = async () => {
    if (!phone) {
      Alert.alert(t.alertRegisterFirstTitle, t.alertRegisterFirstBody);
      return;
    }
    try {
      // Request permissions first
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t.alertPermissionDeniedTitle, t.alertPermissionDeniedBody);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      // handle older/newer API shapes
      const cancelled = result.cancelled || result.canceled;
      const uri = result.uri ?? result.assets?.[0]?.uri;
      if (cancelled || !uri) return;

      const filename = uri.split("/").pop();
      // Guess mime type from extension (basic)
      const lower = filename.toLowerCase();
      let mime = "image/jpeg";
      if (lower.endsWith(".png")) mime = "image/png";
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";
      else if (lower.endsWith(".webp")) mime = "image/webp";

      const form = new FormData();
      form.append("phone", phone);
      // include language preference when uploading avatar so backend can use localized replies if desired
      form.append("language", language);
      // For Expo, the file object must have uri, name and type
      form.append("avatar", {
        uri,
        name: filename,
        type: mime,
      });

      setUploadingAvatar(true);

      // Do not set Content-Type header for multipart; let fetch set boundary
      const resp = await fetch(`${BACKEND_URL}/profile/avatar`, {
        method: "POST",
        body: form,
      });

      const data = await resp.json();
      if (data && data.avatar_url) {
        const avatarFull = data.avatar_url.startsWith("http") ? data.avatar_url : BACKEND_URL.replace(/\/$/, "") + data.avatar_url;
        setProfileServer((prev) => ({ ...(prev || {}), avatar_url: avatarFull }));
        // update cached local profile
        const local = { name, phone, avatar_url: avatarFull, language };
        await persistLocalProfile(local);
        Alert.alert(t.alertAvatarUploaded);
      } else {
        Alert.alert(t.alertUploadFailed, data?.detail || t.alertUploadFailedBody);
      }
    } catch (e) {
      console.warn("Avatar upload failed", e);
      Alert.alert(t.alertUploadFailed, t.alertUploadFailedBody);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- Update profile (name/bio) (new) ---
  const saveProfileEdits = async () => {
    if (!phone) return Alert.alert(t.alertRegisterFirstTitle, t.alertRegisterFirstBody);
    try {
      setIsLoading(true);
      await axios.patch(`${BACKEND_URL}/profile`, {
        phone,
        name: editName,
        bio: editBio,
        language,
      });
      // refresh
      await fetchServerProfile(phone);
      setEditingProfile(false);
      Alert.alert(t.editProfileTitle, t.save);
    } catch (e) {
      console.warn("Update failed", e);
      Alert.alert(t.editProfileTitle, e?.response?.data?.detail || "Could not update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Chat Handlers (kept) ---
  const sendMessage = async (overrideText) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    if (!textToSend || !textToSend.trim() || isLoading) return;

    // Ensure a profile phone exists; if not prompt to register
    if (!phone || !phone.trim()) {
      Alert.alert(
        t.alertRegisterFirstTitle,
        t.alertRegisterFirstBody,
        [
          { text: t.cancel, style: "cancel" },
          { text: t.registerButton, onPress: () => setScreen("register") },
        ]
      );
      return;
    }

    // Create and append user message with timestamp
    const ts = new Date().toISOString();
    const userMessage = {
      id: Date.now().toString(),
      from: "user",
      text: textToSend,
      createdAt: ts,
      status: "sent",
    };
    setMessages((prev) => [...prev, userMessage]);

    if (overrideText === undefined) setInputText("");

    // Add temporary AI placeholder indicating typing/loading
    const aiPlaceholder = {
      id: Date.now().toString() + "_ai_placeholder",
      from: "ai",
      text: "...",
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    setMessages((prev) => [...prev, aiPlaceholder]);
    setIsLoading(true);
    setQuickReplies([]); // hide generic quick replies while processing

    // include language preference in payload to help server choose translations/detection hint
    const payload = { phone: phone, message: textToSend, language };

    if (!isConnected) {
      await enqueueUnsentMessage(payload);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiPlaceholder.id
            ? {
                ...m,
                text: `⚠️ ${t.offline}. ${t.botTyping}`,
                status: "failed",
              }
            : m
        )
      );
      setIsLoading(false);
      setQuickReplies(translations[language].quick_examples);
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/chat`,
        payload,
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );

      const replyText = response.data.reply || "No reply";
      const options = response.data.options || null;
      const serverQuick = response.data.quick_replies || null;

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== aiPlaceholder.id)
          .concat([
            {
              id: Date.now().toString() + "_ai",
              from: "ai",
              text: replyText,
              createdAt: new Date().toISOString(),
              status: "sent",
              options,
            },
          ])
      );

      if (serverQuick && Array.isArray(serverQuick)) {
        setQuickReplies(serverQuick);
      } else if (options && Array.isArray(options)) {
        const derived = options.slice(0, 4).map((o) => o.display || o.name || `${o.index}`);
        setQuickReplies(derived);
      } else {
        setQuickReplies(translations[language].quick_examples);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiPlaceholder.id
            ? { ...m, text: `⚠️ ${t.botTyping} ${t.retryText}`, status: "failed" }
            : m
        )
      );
      // store language with queued message
      await enqueueUnsentMessage(payload);
      setQuickReplies(translations[language].quick_examples);
    } finally {
      setIsLoading(false);
    }
  };

  const retryMessage = async (msg) => {
    if (!msg) return;
    sendMessage(msg.text);
    setMessages((prev) => prev.filter((m) => m.status !== "failed" || m.from !== "ai"));
  };

  const clearChat = () => {
    setMessages([]);
    setQuickReplies(translations[language].quick_examples);
  };

  // --- Purchase flow (client-side) (kept) ---
  const handlePurchase = (option) => {
    Alert.alert(
      t.buyConfirmTitle,
      t.buyConfirmBody.replace("{display}", option.display || option.name),
      [
        {
          text: t.cancel,
          style: "cancel",
        },
        {
          text: t.submit,
          onPress: async () => {
            const tempMsg = {
              id: Date.now().toString() + "_purchase",
              from: "user",
              text: `Purchase ${option.display || option.name}`,
              createdAt: new Date().toISOString(),
              status: "sent",
            };
            setMessages((prev) => [...prev, tempMsg]);
            setIsLoading(true);
            try {
              // Call /purchase with qp_id (expects server-side qp_id)
              const resp = await axios.post(
                `${BACKEND_URL}/purchase`,
                { phone: phone, qp_id: option.qp_id },
                { headers: { "Content-Type": "application/json; charset=utf-8" } }
              );
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + "_ai_purchase",
                  from: "ai",
                  text: resp.data.reply || t.buySuccess,
                  createdAt: new Date().toISOString(),
                  status: "sent",
                },
              ]);
              // refresh profile after successful purchase
              fetchServerProfile(phone);
            } catch (e) {
              console.error("Purchase failed", e);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + "_ai_purchase_fail",
                  from: "ai",
                  text: `⚠️ ${t.buyFailed}. ${t.retryText}`,
                  createdAt: new Date().toISOString(),
                  status: "failed",
                },
              ]);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // --- Render helpers (kept and augmented) ---
  const renderMessage = ({ item }) => {
    const time = new Date(item.createdAt).toLocaleTimeString();
    const isUser = item.from === "user";
    const bubbleBg = isUser ? theme.accent : theme.card;
    const textColor = isUser ? "#000" : theme.text;

    const onRetryPress = () => {
      if (item.status === "failed" && item.from === "ai") {
        const lastUser = [...messages].reverse().find((m) => m.from === "user");
        if (lastUser) retryMessage(lastUser);
      } else if (item.status === "failed" && item.from === "user") {
        sendMessage(item.text);
      }
    };

    return (
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBg,
            alignSelf: isUser ? "flex-end" : "flex-start",
            opacity: item.status === "sending" ? 0.7 : 1,
          },
        ]}
      >
        <Text style={{ color: textColor }}>{item.text}</Text>

        {!isUser && item.options && Array.isArray(item.options) && (
          <FlatList
            data={item.options}
            keyExtractor={(o) => `${o.qp_id || o.index}-${o.display || o.name}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
            renderItem={({ item: o }) => (
              <View style={[styles.cardItem, { backgroundColor: theme.input }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "700", color: theme.text }}>{o.display || o.name}</Text>
                  <MaterialCommunityIcons name="tag" size={18} color={theme.sub} />
                </View>
                {o.price ? (
                  <Text style={{ color: theme.sub }}>Price: {o.price}</Text>
                ) : null}
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: theme.accent, marginTop: 8 }]}
                  onPress={() => handlePurchase(o)}
                >
                  <MaterialCommunityIcons name="cart" size={16} />
                  <Text style={{ fontWeight: "700", marginLeft: 6 }}>Buy</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={{ color: theme.sub, fontSize: 12 }}>{time}</Text>
          {item.status === "failed" ? (
            <TouchableOpacity onPress={onRetryPress}>
              <Text style={{ color: "#E53935", fontSize: 12 }}>{t.retryText}</Text>
            </TouchableOpacity>
          ) : item.status === "sending" ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : null}
        </View>
      </View>
    );
  };

  const sendQuick = (q) => {
    sendMessage(q);
  };

  // --- Profile Screen (new) ---
  const ProfileScreen = () => {
    const server = profileServer || { name, phone, avatar_url: null, airtime: 0, loyalty_points: 0, recent_purchases: [], recommendations: [] };

    useEffect(() => {
      // prefill edit fields
      setEditName(server.name || name);
      setEditBio(server.bio || "");
    }, [screen, profileServer]);

    const avatarContent = uploadingAvatar ? (
      <View style={{ width: 86, height: 86, borderRadius: 44, backgroundColor: "#DDD", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    ) : server.avatar_url ? (
      <Image source={{ uri: server.avatar_url }} style={{ width: 86, height: 86, borderRadius: 44 }} />
    ) : (
      <View style={{ width: 86, height: 86, borderRadius: 44, backgroundColor: "#DDD", alignItems: "center", justifyContent: "center" }}>
        <MaterialCommunityIcons name="camera" size={28} />
        <Text style={{ fontSize: 28, fontWeight: "900" }}>{(server.name || "U")[0]}</Text>
      </View>
    );

    return (
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploadingAvatar}>
              {avatarContent}
            </TouchableOpacity>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: theme.text }}>{server.name || name}</Text>
              <Text style={{ color: theme.sub }}>{server.phone || phone}</Text>
              <Text style={{ marginTop: 6, color: theme.text }}>{t.sub}: {server.airtime ?? 0}</Text>
              <Text style={{ color: theme.sub }}>{t.recentPurchases}: {server.loyalty_points ?? 0}</Text>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontWeight: "900", color: theme.text }}>{t.quickActions}</Text>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity style={{ padding: 12, backgroundColor: theme.accent, borderRadius: 10, marginRight: 10, flexDirection: "row", alignItems: "center" }} onPress={() => setScreen("chat")}>
                <MaterialCommunityIcons name="chat" size={16} />
                <Text style={{ fontWeight: "700", marginLeft: 8 }}>{t.chat}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 12, backgroundColor: "#4CAF50", borderRadius: 10, flexDirection: "row", alignItems: "center" }} onPress={() => Alert.alert(t.topUp, t.topUp)}>
                <MaterialCommunityIcons name="wallet" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>{t.topUp}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontWeight: "900", color: theme.text }}>{t.recommendations}</Text>
            <ScrollView horizontal style={{ marginTop: 10 }}>
              {(server.recommendations || []).map((r, i) => (
                <View key={i} style={{ padding: 12, backgroundColor: theme.card, borderRadius: 10, marginRight: 10, width: 220 }}>
                  <Text style={{ fontWeight: "700", color: theme.text }}>{r.display}</Text>
                  <Text style={{ color: theme.sub }}>Price: {r.price}</Text>
                  <TouchableOpacity style={{ marginTop: 8, backgroundColor: theme.accent, padding: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center" }} onPress={() => handlePurchase(r)}>
                    <MaterialCommunityIcons name="cart" size={14} />
                    <Text style={{ fontWeight: "900", marginLeft: 8 }}>Buy</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={{ marginTop: 18, height: 180 }}>
            <Text style={{ fontWeight: "900", color: theme.text }}>{t.recentPurchases}</Text>
            <ScrollView style={{ marginTop: 10 }}>
              {(server.recent_purchases || []).map((p) => (
                <View key={p.id} style={{ padding: 10, backgroundColor: theme.card, borderRadius: 8, marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "700" }}>{p.sub_category || p.qp_id}</Text>
                    <MaterialCommunityIcons name="clock-outline" size={12} color={theme.sub} />
                  </View>
                  <Text style={{ color: theme.sub }}>{new Date(p.purchase_date).toLocaleString()} • Price: {p.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={{ marginTop: 8, alignItems: "center" }}>
            <TouchableOpacity onPress={() => { setEditingProfile(true); }} style={{ padding: 10, flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="pencil" />
              <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>{t.editProfileBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={{ padding: 10, flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="logout" color="#E53935" />
              <Text style={{ color: "#E53935", fontWeight: "700", marginLeft: 8 }}>{t.logout}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen("home")} style={{ padding: 10, flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="arrow-left" />
              <Text style={{ color: theme.sub, marginLeft: 8 }}>{t.back}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Profile Modal */}
        <Modal visible={editingProfile} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: theme.text }}>{t.editProfileTitle}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                <MaterialCommunityIcons name="account" />
                <TextInput placeholder={t.namePlaceholder} placeholderTextColor={theme.sub} value={editName} onChangeText={setEditName} style={[styles.input, { marginLeft: 8, backgroundColor: theme.input, color: theme.text }]} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                <MaterialCommunityIcons name="information-outline" />
                <TextInput placeholder="Bio" placeholderTextColor={theme.sub} value={editBio} onChangeText={setEditBio} style={[styles.input, { marginLeft: 8, backgroundColor: theme.input, color: theme.text }]} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                <TouchableOpacity onPress={() => setEditingProfile(false)} style={{ padding: 10 }}>
                  <Text style={{ color: theme.sub }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveProfileEdits} style={{ padding: 10, flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="content-save" />
                  <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 6 }}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  };

  // --- Render Screens (preserve previous flows + new screens) ---
  if (screen === "chat") {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar style={darkMode ? "light" : "dark"} />
        <View style={[styles.chatHeader, { backgroundColor: theme.card }]}>
          <Text style={[styles.chatTitle, { color: theme.text }]}>{t.chat}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={clearChat} style={styles.iconBtn}>
              <MaterialCommunityIcons name="delete" size={22} color="#E53935" />
            </TouchableOpacity>
            {phone ? (
              <TouchableOpacity onPress={confirmLogout} style={{ marginRight: 10 }}>
                <MaterialCommunityIcons name="logout" size={22} color={theme.accent} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => setScreen("home")}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderMessage}
          ListFooterComponent={
            isLoading ? (
              <View style={{ paddingTop: 6, paddingBottom: 10, alignItems: "flex-start" }}>
                <View
                  style={[
                    styles.bubble,
                    { backgroundColor: theme.card, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
                  ]}
                >
                  <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={{ color: theme.text }}>{t.botTyping}</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick reply chips */}
        <View style={[styles.quickRow, { backgroundColor: theme.card }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {quickReplies.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => sendQuick(q)}
                style={[styles.chip, { backgroundColor: theme.input, flexDirection: "row", alignItems: "center" }]}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={14} />
                <Text style={{ color: theme.text, marginLeft: 8 }}>{q}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ justifyContent: "center", marginLeft: 8 }}>
              <Text style={{ color: isConnected ? "#4CAF50" : "#E53935", fontSize: 12 }}>
                {isConnected ? t.online : t.offline}
              </Text>
            </View>
          </ScrollView>
        </View>

        <View style={[styles.inputBar, { backgroundColor: theme.card }]}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="message-text" style={{ marginRight: 8 }} />
            <TextInput
              placeholder={t.placeholder}
              placeholderTextColor={theme.sub}
              value={inputText}
              onChangeText={setInputText}
              style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
              editable={!isLoading}
            />
          </View>
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={isLoading || !inputText.trim()}
            style={{ opacity: isLoading || !inputText.trim() ? 0.5 : 1 }}
          >
            <MaterialCommunityIcons name="send-circle" size={42} color={theme.accent} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (screen === "register") {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background, padding: 24 }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar style={darkMode ? "light" : "dark"} />
        <Text style={[styles.chatTitle, { color: theme.text, marginBottom: 20 }]}>{t.registerTitle}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <MaterialCommunityIcons name="account" />
          <TextInput
            placeholder={t.namePlaceholder}
            placeholderTextColor={theme.sub}
            value={name}
            onChangeText={setName}
            style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <MaterialCommunityIcons name="phone" />
          <TextInput
            placeholder={t.phonePlaceholder}
            placeholderTextColor={theme.sub}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]}
          />
        </View>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.accent }]} onPress={submitRegistration} disabled={isLoading}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#000" />
          <Text style={styles.startText}>{t.submit}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen("login")} style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}>
          <MaterialCommunityIcons name="login" />
          <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>{t.existingUserPrompt}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen("home")} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.accent, fontWeight: "700" }}>{t.back}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  // --- Login Screen for existing users ---
  if (screen === "login") {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background, padding: 24 }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar style={darkMode ? "light" : "dark"} />
        <Text style={[styles.chatTitle, { color: theme.text, marginBottom: 20 }]}>{t.loginTitle}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <MaterialCommunityIcons name="phone" />
          <TextInput
            placeholder={t.phonePlaceholder}
            placeholderTextColor={theme.sub}
            value={loginPhone}
            onChangeText={setLoginPhone}
            keyboardType="phone-pad"
            style={[styles.input, { marginLeft: 8, flex: 1, backgroundColor: theme.input, color: theme.text }]}
          />
        </View>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: "#4CAF50" }]} onPress={loginExistingUser} disabled={isLoading}>
          <MaterialCommunityIcons name="login" size={20} color="#fff" />
          <Text style={[styles.startText, { color: "#fff" }]}>{t.loginButton}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen("register")} style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}>
          <MaterialCommunityIcons name="account-plus" />
          <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>{t.registerButton}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen("home")} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.accent, fontWeight: "700" }}>{t.back}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  if (screen === "profile") {
    return <ProfileScreen />;
  }

  // default home screen (kept but removed profile text details, leaving linking icons only)
  return (
    <ScrollView contentContainerStyle={[styles.home, { backgroundColor: theme.background }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      <Text style={[styles.logo, { color: theme.text }]}>{translations[language].app}</Text>

      <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity onPress={toggleLanguage} style={styles.langRow}>
          <MaterialCommunityIcons name="translate" size={22} color={theme.accent} />
          <Text style={{ color: theme.accent }}>{translations[language].lang}</Text>
        </TouchableOpacity>

        {/* Only show linking icons on home (no name/phone text) */}
        <View style={{ alignItems: "flex-end" }}>
          {phone ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <TouchableOpacity onPress={() => setScreen("profile")} style={{ marginRight: 8, padding: 6 }}>
                {/* Increased size + dark-mode color change for profile icon */}
                <MaterialCommunityIcons
                  name="account-circle"
                  size={36}
                  color={darkMode ? theme.accent : theme.text}
                />
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

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleTrack, { backgroundColor: theme.track }]} onPress={toggleTheme}>
            <Animated.View style={[styles.knob, { backgroundColor: theme.knob, left: knob }]} />
          </TouchableOpacity>
          <Text style={[styles.toggleText, { color: theme.text }]}>{t.dark}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <MaterialCommunityIcons name="robot-happy-outline" size={44} color={theme.accent} />
        <Text style={[styles.hero, { color: theme.text }]}>{translations[language].hero}</Text>
        <Text style={{ color: theme.sub }}>{translations[language].sub}</Text>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.accent }]} onPress={() => {
          // If not registered, go to register screen first
          if (!phone || !phone.trim()) {
            setScreen("register");
            return;
          }
          setScreen("chat");
        }}>
          <MaterialCommunityIcons name="chat" size={20} color="#000" />
          <Text style={styles.startText}>{translations[language].start}</Text>
        </TouchableOpacity>

        {/* Show Register button only if user is not registered (phone missing) */}
        {!phone || !phone.trim() ? (
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: "#4CAF50", marginTop: 12 }]} onPress={() => setScreen("register")}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#FFF" />
            <Text style={[styles.startText, { color: "#FFF" }]}>{translations[language].registerButton}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {translations[language].features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <MaterialCommunityIcons name={f.icon} size={22} color={theme.accent} />
            <Text style={[styles.featureText, { color: theme.text }]}>{f.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- Styles (kept + unchanged from previous) ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  home: { padding: 24, alignItems: "center" },
  logo: { fontSize: 36, fontWeight: "900" },
  langRow: { flexDirection: "row", gap: 8, marginVertical: 8 },
  card: { width: "100%", padding: 22, borderRadius: 20, marginTop: 22, alignItems: "center" },
  hero: { fontSize: 24, fontWeight: "900", marginVertical: 10 },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, marginTop: 18 },
  startText: { fontWeight: "900", fontSize: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center" },
  toggleTrack: { width: 48, height: 26, borderRadius: 20 },
  knob: { width: 20, height: 20, borderRadius: 20, position: "absolute", top: 3 },
  toggleText: { marginLeft: 12, fontWeight: "700" },
  featureRow: { flexDirection: "row", gap: 12, marginVertical: 6 },
  featureText: { fontSize: 15 },

  chatHeader: { padding: 20, flexDirection: "row", justifyContent: "space-between" },
  chatTitle: { fontSize: 22, fontWeight: "900" },
  row: { flexDirection: "row", gap: 14 },
  bubble: { padding: 14, borderRadius: 14, marginBottom: 10, maxWidth: "75%" },
  inputBar: { flexDirection: "row", padding: 10, alignItems: "center" },
  input: { flex: 1, padding: 12, borderRadius: 18, marginRight: 10 },
  quickRow: { paddingVertical: 8, width: "100%" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  cardItem: { padding: 12, borderRadius: 12, marginRight: 10, width: 200 },
  smallBtn: { padding: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  iconBtn: { paddingHorizontal: 8 },
});