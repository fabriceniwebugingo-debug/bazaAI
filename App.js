import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
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

export default function App() {
  // --- App State ---
  const [screen, setScreen] = useState("home"); // home | chat | register
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  // Chat state
  const [messages, setMessages] = useState([]); // messages contain {id, from, text, createdAt, status, options?}
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // loader for backend response
  const [isConnected, setIsConnected] = useState(true);
  const UNSENT_KEY = "unsent_messages_queue";

  // Registration state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

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
    MTN_YELLOW: "#FFD400",
    BLACK: "#000",
  };

  const theme = {
    background: darkMode ? "#000" : "#F6F6F6",
    card: darkMode ? "#111" : "#FFF",
    text: darkMode ? "#FFF" : "#111",
    sub: darkMode ? "#BBB" : "#555",
    input: darkMode ? "#1E1E1E" : "#EEE",
    accent: COLORS.MTN_YELLOW,
    track: darkMode ? "#333" : "#DDD",
    knob: darkMode ? COLORS.MTN_YELLOW : COLORS.BLACK,
  };

  // --- Translations ---
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
    },
  };

  const t = translations[language];

  const toggleLanguage = () => setLanguage(language === "en" ? "kin" : "en");

  // ------------ BACKEND URL CONFIGURATION ------------
  // Replace this with the correct backend address for your setup:
  // - running backend on same machine and testing on Android emulator (AVD): use http://10.0.2.2:8000
  // - running on device or physical phone using same Wi-Fi: use your machine's LAN IP, e.g. http://192.168.43.171:8000
  // - running on iOS simulator: use http://localhost:8000
  // The default here is the IP you provided earlier. Change if required.
  const BACKEND_URL = "http://192.168.43.171:8000";

  // --- Effects: network status + retry queue ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
      if (state.isConnected) {
        retryQueuedMessages();
      }
    });
    // load suggested quick replies default
    setQuickReplies(t.quick_examples);
    return () => unsubscribe();
  }, [language]);

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
      for (const item of queue) {
        try {
          await axios.post(`${BACKEND_URL}/chat`, item, {
            headers: { "Content-Type": "application/json; charset=utf-8" },
          });
          // could integrate responses, but for now we simply clear on success
        } catch (e) {
          console.warn("Retry failed for queued item", e);
          // stop further retries to avoid rapid loops
          return;
        }
      }
      await AsyncStorage.removeItem(UNSENT_KEY);
    } catch (e) {
      console.warn("Failed to retry queued messages", e);
    }
  };

  // --- Chat Handlers ---
  const sendMessage = async (overrideText) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    if (!textToSend || !textToSend.trim() || isLoading) return;

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

    // Clear input when user typed (but not when using quick-reply override)
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

    const payload = { phone: phone || "+250781077741", message: textToSend };

    if (!isConnected) {
      // Queue the message for later and mark AI reply as failed
      await enqueueUnsentMessage(payload);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiPlaceholder.id
            ? {
                ...m,
                text: "⚠️ You're offline. Message queued and will be sent when you're online.",
                status: "failed",
              }
            : m
        )
      );
      setIsLoading(false);
      // restore quick replies
      setQuickReplies(t.quick_examples);
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/chat`,
        payload,
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );

      // Remove placeholder and append actual AI response
      const replyText = response.data.reply || "No reply";
      const options = response.data.options || null; // structured options (bundles, periods, etc.)
      const serverQuick = response.data.quick_replies || null; // server-provided quick replies

      // update AI bubble (replace placeholder)
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

      // If server provided structured options, offer quick-replies or render cards
      if (serverQuick && Array.isArray(serverQuick)) {
        setQuickReplies(serverQuick);
      } else if (options && Array.isArray(options)) {
        // build quick replies from the first few options
        const derived = options.slice(0, 4).map((o) => o.display || o.name || `${o.index}`);
        setQuickReplies(derived);
      } else {
        setQuickReplies(t.quick_examples);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // replace placeholder with failure message and retry action
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiPlaceholder.id
            ? {
                ...m,
                text: "⚠️ Failed to reach server. Tap to retry.",
                status: "failed",
              }
            : m
        )
      );
      // enqueue the original payload for retry when back online
      await enqueueUnsentMessage(payload);
      setQuickReplies(t.quick_examples);
    } finally {
      setIsLoading(false);
    }
  };

  const retryMessage = async (msg) => {
    // retry sending the previous user message by resending its text
    if (!msg) return;
    sendMessage(msg.text);
    // remove the failed ai bubble (if any)
    setMessages((prev) => prev.filter((m) => m.status !== "failed" || m.from !== "ai"));
  };

  const clearChat = () => {
    setMessages([]);
    setQuickReplies(t.quick_examples);
  };

  // --- Purchase flow (client-side) ---
  const handlePurchase = (option) => {
    // option expected to have qp_id and display/name
    Alert.alert(
      "Confirm Purchase",
      `Buy ${option.display || option.name} ?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Buy",
          onPress: async () => {
            // show immediate feedback
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
              const resp = await axios.post(
                `${BACKEND_URL}/purchase`,
                { phone: phone || "+250781077741", qp_id: option.qp_id },
                { headers: { "Content-Type": "application/json; charset=utf-8" } }
              );
              // append server confirmation
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + "_ai_purchase",
                  from: "ai",
                  text: resp.data.reply || "Purchase response received",
                  createdAt: new Date().toISOString(),
                  status: "sent",
                },
              ]);
            } catch (e) {
              console.error("Purchase failed", e);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + "_ai_purchase_fail",
                  from: "ai",
                  text: "⚠️ Purchase failed. Please try again or contact support.",
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

  // --- Registration Handler ---
  const submitRegistration = () => {
    if (!name.trim() || !phone.trim()) {
      return alert("Please enter name and phone number");
    }
    alert(`Registered ${name} with phone ${phone}`);
    setScreen("home");
  };

  // --- Render helpers ---
  const renderMessage = ({ item }) => {
    const time = new Date(item.createdAt).toLocaleTimeString();
    const isUser = item.from === "user";
    const bubbleBg = isUser ? theme.accent : theme.card;
    const textColor = isUser ? "#000" : theme.text;

    const onRetryPress = () => {
      if (item.status === "failed" && item.from === "ai") {
        // retry last user message
        const lastUser = [...messages].reverse().find((m) => m.from === "user");
        if (lastUser) retryMessage(lastUser);
      } else if (item.status === "failed" && item.from === "user") {
        // re-send user message
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

        {/* Render structured options as cards if present */}
        {!isUser && item.options && Array.isArray(item.options) && (
          <FlatList
            data={item.options}
            keyExtractor={(o) => `${o.qp_id || o.index}-${o.display || o.name}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
            renderItem={({ item: o }) => (
              <View style={[styles.cardItem, { backgroundColor: theme.input }]}>
                <Text style={{ fontWeight: "700", color: theme.text }}>
                  {o.display || o.name}
                </Text>
                {o.price ? (
                  <Text style={{ color: theme.sub }}>Price: {o.price}</Text>
                ) : null}
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: theme.accent, marginTop: 8 }]}
                  onPress={() => handlePurchase(o)}
                >
                  <Text style={{ fontWeight: "700" }}>Buy</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={{ color: theme.sub, fontSize: 12 }}>{time}</Text>
          {item.status === "failed" ? (
            <TouchableOpacity onPress={onRetryPress}>
              <Text style={{ color: "#E53935", fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          ) : item.status === "sending" ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : null}
        </View>
      </View>
    );
  };

  // helper to send quick reply when tapped
  const sendQuick = (q) => {
    // if quick reply matches pattern "Buy ..." we prefer to call sendMessage with that text
    sendMessage(q);
  };

  // --- Render Screens ---
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
                  <Text style={{ color: theme.text }}>Bot is typing…</Text>
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
                style={[styles.chip, { backgroundColor: theme.input }]}
              >
                <Text style={{ color: theme.text }}>{q}</Text>
              </TouchableOpacity>
            ))}
            {/* Connectivity indicator */}
            <View style={{ justifyContent: "center", marginLeft: 8 }}>
              <Text style={{ color: isConnected ? "#4CAF50" : "#E53935", fontSize: 12 }}>
                {isConnected ? "Online" : "Offline"}
              </Text>
            </View>
          </ScrollView>
        </View>

        <View style={[styles.inputBar, { backgroundColor: theme.card }]}>
          <TextInput
            placeholder={t.placeholder}
            placeholderTextColor={theme.sub}
            value={inputText}
            onChangeText={setInputText}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
            editable={!isLoading}
          />
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
        <Text style={[styles.chatTitle, { color: theme.text, marginBottom: 20 }]}>Register</Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor={theme.sub}
          value={name}
          onChangeText={setName}
          style={[styles.input, { marginBottom: 12, backgroundColor: theme.input, color: theme.text }]}
        />

        <TextInput
          placeholder="Phone Number"
          placeholderTextColor={theme.sub}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[styles.input, { marginBottom: 20, backgroundColor: theme.input, color: theme.text }]}
        />

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.accent }]} onPress={submitRegistration}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#000" />
          <Text style={styles.startText}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen("home")} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.accent, fontWeight: "700" }}>Back</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.home, { backgroundColor: theme.background }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      <Text style={[styles.logo, { color: theme.text }]}>{t.app}</Text>

      <TouchableOpacity onPress={toggleLanguage} style={styles.langRow}>
        <MaterialCommunityIcons name="translate" size={22} color={theme.accent} />
        <Text style={{ color: theme.accent }}>{t.lang}</Text>
      </TouchableOpacity>

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
        <Text style={[styles.hero, { color: theme.text }]}>{t.hero}</Text>
        <Text style={{ color: theme.sub }}>{t.sub}</Text>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.accent }]} onPress={() => setScreen("chat")}>
          <MaterialCommunityIcons name="chat" size={20} color="#000" />
          <Text style={styles.startText}>{t.start}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: "#4CAF50", marginTop: 12 }]} onPress={() => setScreen("register")}>
          <MaterialCommunityIcons name="account-plus" size={20} color="#FFF" />
          <Text style={[styles.startText, { color: "#FFF" }]}>Register</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {t.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <MaterialCommunityIcons name={f.icon} size={22} color={theme.accent} />
            <Text style={[styles.featureText, { color: theme.text }]}>{f.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- Styles ---
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
  smallBtn: { padding: 8, borderRadius: 8, alignItems: "center" },
});