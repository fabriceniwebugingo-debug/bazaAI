import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
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
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  // Registration state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

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
    },
  };

  const t = translations[language];

  const toggleLanguage = () =>
    setLanguage(language === "en" ? "kin" : "en");

  // ------------ BACKEND URL CONFIGURATION ------------
  // Replace this with the correct backend address for your setup:
  // - running backend on same machine and testing on Android emulator (AVD): use http://10.0.2.2:8000
  // - running on device or physical phone using same Wi-Fi: use your machine's LAN IP, e.g. http://192.168.43.171:8000
  // - running on iOS simulator: use http://localhost:8000
  // The default here is the IP you provided earlier. Change if required.
  const BACKEND_URL = "http://192.168.43.171:8000";

  // --- Chat Handlers ---
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = { id: Date.now().toString(), from: "user", text: inputText };
    setMessages((prev) => [...prev, userMessage]);

    const messageText = inputText;
    setInputText("");

    try {
      const response = await axios.post(
        `${BACKEND_URL}/chat`,
        { phone: phone || "+250781077741", message: messageText },
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
      const reply = response.data.reply;

      const aiMessage = {
        id: Date.now().toString() + "_ai",
        from: "ai",
        text: reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_ai",
          from: "ai",
          text: "⚠️ Failed to reach server. Please try again.",
        },
      ]);
    }
  };

  const clearChat = () => setMessages([]);

  // --- Registration Handler ---
  const submitRegistration = () => {
    if (!name.trim() || !phone.trim()) {
      return alert("Please enter name and phone number");
    }
    alert(`Registered ${name} with phone ${phone}`);
    setScreen("home");
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
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor:
                    item.from === "user" ? theme.accent : theme.card,
                  alignSelf:
                    item.from === "user" ? "flex-end" : "flex-start",
                },
              ]}
            >
              <Text style={{ color: item.from === "user" ? "#000" : theme.text }}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={[styles.inputBar, { backgroundColor: theme.card }]}>
          <TextInput
            placeholder={t.placeholder}
            placeholderTextColor={theme.sub}
            value={inputText}
            onChangeText={setInputText}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
          />
          <TouchableOpacity onPress={sendMessage}>
            <MaterialCommunityIcons
              name="send-circle"
              size={42}
              color={theme.accent}
            />
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
        <Text style={[styles.chatTitle, { color: theme.text, marginBottom: 20 }]}>
          Register
        </Text>

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

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: theme.accent }]}
          onPress={submitRegistration}
        >
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
    <ScrollView
      contentContainerStyle={[styles.home, { backgroundColor: theme.background }]}
    >
      <StatusBar style={darkMode ? "light" : "dark"} />

      <Text style={[styles.logo, { color: theme.text }]}>{t.app}</Text>

      <TouchableOpacity onPress={toggleLanguage} style={styles.langRow}>
        <MaterialCommunityIcons name="translate" size={22} color={theme.accent} />
        <Text style={{ color: theme.accent }}>{t.lang}</Text>
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleTrack, { backgroundColor: theme.track }]}
            onPress={toggleTheme}
          >
            <Animated.View
              style={[styles.knob, { backgroundColor: theme.knob, left: knob }]}
            />
          </TouchableOpacity>
          <Text style={[styles.toggleText, { color: theme.text }]}>{t.dark}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <MaterialCommunityIcons
          name="robot-happy-outline"
          size={44}
          color={theme.accent}
        />
        <Text style={[styles.hero, { color: theme.text }]}>{t.hero}</Text>
        <Text style={{ color: theme.sub }}>{t.sub}</Text>

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: theme.accent }]}
          onPress={() => setScreen("chat")}
        >
          <MaterialCommunityIcons name="chat" size={20} color="#000" />
          <Text style={styles.startText}>{t.start}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: "#4CAF50", marginTop: 12 }]}
          onPress={() => setScreen("register")}
        >
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
});