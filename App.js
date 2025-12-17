import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
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
import Feather from "react-native-vector-icons/Feather";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState("en");
  const [dark, setDark] = useState(false);

  // Animated toggle knob
  const knobPos = useRef(new Animated.Value(dark ? 28 : 2)).current;

  const toggleTheme = () => {
    const newState = !dark;
    setDark(newState);
    Animated.timing(knobPos, {
      toValue: newState ? 28 : 2,
      duration: 230,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const YELLOW = "#FFD400";
  const BLACK = "#000";

  const theme = {
    bg: dark ? BLACK : "#F5F5F5",
    card: dark ? "#111" : "#fff",
    text: dark ? "#fff" : "#111",
    sub: dark ? "#999" : "#666",
    border: dark ? "#222" : "#DDD",
    field: dark ? "#1D1D1D" : "#ECECEC",
    accent: YELLOW,
    track: dark ? "#333" : "#CFCFCF",
    knob: dark ? YELLOW : "#fff",
  };

  const t = {
    en: {
      app: "BazaAI",
      hero: "Chat Smarter with AI",
      desc: "Buy airtime and bundles. Send & withdraw money. Check your balance.",
      start: "Start Chat",
      why: "Why BazaAI?",
      items: [
        "Buy airtime and bundles",
        "Send & withdraw money",
        "Check your balance",
        "Secure messaging",
      ],
      chat: "Conversation",
      placeholder: "Type message...",
      send: "Send",
      clear: "Clear Chat",
      back: "Back",
      switch: "Kinyarwanda",
      mode: "Dark Mode",
    },
    kin: {
      app: "BazaAI",
      hero: "Vugana na AI",
      desc: "Amainite, bundles, kohereza & kubikuza, kureba balance.",
      start: "Tangira Ikiganiro",
      why: "Impamvu BazaAI?",
      items: [
        "Gura airtime & bundles",
        "Ohereza & bikure amafaranga",
        "Reba ayo usigaranye",
        "Umutekano w’ubutumwa",
      ],
      chat: "Ikiganiro",
      placeholder: "Andika ubutumwa…",
      send: "Ohereza",
      clear: "Siba Ibiganoro",
      back: "Subira",
      switch: "English",
      mode: "Uburyo bw’Umwijima",
    },
  }[language];

  // Animations
  const fadeSlide = useRef(new Animated.Value(0)).current;
  const scaleBtn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeSlide, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const send = () => {
    if (!inputText.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: inputText }]);
    setInputText("");
  };

  const clear = () => setMessages([]);

  const toggleLang = () => setLanguage(language === "en" ? "kin" : "en");

  /* CHAT SCREEN */
  if (screen === "chat") {
    return (
      <KeyboardAvoidingView
        style={[styles.full, { backgroundColor: theme.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar style={dark ? "light" : "dark"} />
        <View style={[styles.topBar, { borderColor: theme.border }]}>
          <Text style={[styles.topTitle, { color: theme.text }]}>{t.chat}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.redBtn} onPress={clear}>
              <Feather name="trash-2" size={18} color="#fff" />
              <Text style={styles.redTxt}>{t.clear}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen("home")}>
              <Text style={[styles.back, { color: theme.accent }]}>{t.back}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 18 }}
          renderItem={({ item }) => {
            const msgAnim = new Animated.Value(0);
            useEffect(() => {
              Animated.timing(msgAnim, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }).start();
            }, []);
            return (
              <Animated.View
                style={[
                  styles.msg,
                  { opacity: msgAnim, backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={{ color: theme.text }}>{item.text}</Text>
              </Animated.View>
            );
          }}
        />

        <View style={[styles.inputRow, { borderColor: theme.border }]}>
          <TextInput
            value={inputText}
            placeholder={t.placeholder}
            placeholderTextColor={theme.sub}
            onChangeText={setInputText}
            style={[styles.field, { backgroundColor: theme.field, color: theme.text }]}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={send}>
            <Feather name="send" size={18} color={dark ? BLACK : "#000"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  /* HOME SCREEN */
  return (
    <ScrollView contentContainerStyle={[styles.home, { backgroundColor: theme.bg }]}>
      <StatusBar style={dark ? "light" : "dark"} />

      <Text style={[styles.logo, { color: theme.text }]}>{t.app}</Text>
      <TouchableOpacity onPress={toggleLang}>
        <Text style={[styles.link, { color: theme.accent }]}>{t.switch}</Text>
      </TouchableOpacity>

      {/* Animated Switch */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            transform: [
              {
                translateY: fadeSlide.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
              },
            ],
            opacity: fadeSlide,
          },
        ]}
      >
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.track, { backgroundColor: theme.track }]}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.knob, { backgroundColor: theme.knob, left: knobPos }]} />
          </TouchableOpacity>
          <Text style={[styles.mode, { color: theme.text }]}>{t.mode}</Text>
        </View>
      </Animated.View>

      {/* Hero */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            transform: [
              {
                translateY: fadeSlide.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
              },
            ],
            opacity: fadeSlide,
          },
        ]}
      >
        <Text style={[styles.hero, { color: theme.text }]}>{t.hero}</Text>
        <Text style={[styles.sub, { color: theme.sub }]}>{t.desc}</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={() => Animated.spring(scaleBtn, { toValue: 0.92, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(scaleBtn, { toValue: 1, useNativeDriver: true }).start()}
          onPress={() => setScreen("chat")}
        >
          <Animated.View style={{ transform: [{ scale: scaleBtn }], flexDirection: "row", paddingVertical: 16, borderRadius: 14, backgroundColor: theme.accent, justifyContent: "center", alignItems: "center", gap: 10 }}>
            <Feather name="message-square" size={18} />
            <Text style={styles.mainTxt}>{t.start}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Benefits */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            transform: [
              {
                translateY: fadeSlide.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
              },
            ],
            opacity: fadeSlide,
          },
        ]}
      >
        <Text style={[styles.section, { color: theme.text }]}>{t.why}</Text>
        {t.items.map((f, i) => (
          <View key={i} style={styles.iconRow}>
            <Feather name="check-circle" size={18} color={theme.accent} />
            <Text style={[styles.feature, { color: theme.text }]}>{f}</Text>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  home: { padding: 24, alignItems: "center" },
  logo: { fontSize: 38, fontWeight: "900" },
  link: { marginTop: 6, fontWeight: "800", fontSize: 15 },
  card: { width: "100%", borderRadius: 20, padding: 22, marginTop: 26, elevation: 4 },

  // Switch
  toggleRow: { flexDirection: "row", alignItems: "center" },
  track: { width: 56, height: 30, borderRadius: 30, padding: 2 },
  knob: { width: 24, height: 24, borderRadius: 24, position: "absolute" },
  mode: { marginLeft: 16, fontWeight: "700", fontSize: 16 },

  // Hero
  hero: { fontSize: 26, fontWeight: "900", marginBottom: 10 },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  mainBtn: { flexDirection: "row", gap: 10, paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  mainTxt: { fontSize: 16, fontWeight: "900" },

  // Benefits
  section: { fontSize: 20, fontWeight: "900", marginBottom: 14 },
  iconRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  feature: { fontSize: 15, marginLeft: 10, fontWeight: "600" },

  // Chat
  topBar: { padding: 22, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between" },
  topTitle: { fontSize: 22, fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center" },
  redBtn: { flexDirection: "row", backgroundColor: "#E53935", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, marginRight: 14, alignItems: "center", gap: 6 },
  redTxt: { fontWeight: "800", color: "#fff" },
  back: { fontWeight: "800", fontSize: 16 },

  msg: { borderWidth: 1, padding: 14, borderRadius: 14, marginBottom: 12 },
  inputRow: { padding: 12, borderTopWidth: 1, flexDirection: "row", alignItems: "center" },
  field: { flex: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginRight: 12 },
  sendBtn: { padding: 12, borderRadius: 50, alignItems: "center", justifyContent: "center" },
});
