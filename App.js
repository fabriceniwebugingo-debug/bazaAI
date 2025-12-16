import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ChatInput from "./components/ChatInput";
import IconButton from "./components/IconButton";
import MessageBubble from "./components/MessageBubble";
import TypingIndicator from "./components/TypingIndicator";

/*
  ThemeProvider & theming with Animated transitions:
  We animate a single value (themeAnim) between 0 (light) and 1 (dark) and
  interpolate colors in components to achieve smooth theme transitions.
*/

const lightTheme = {
  background: "#F7F8FB",
  card: "#FFFFFF",
  text: "#0F1724",
  subtleText: "#6B7280",
  primary: "#6366F1",
  userBubble: "#DCF8C6",
  botBubble: "#FFFFFF",
  inputBg: "#FFFFFF"
};

const darkTheme = {
  background: "#0B1220",
  card: "#0E1722",
  text: "#E6EEF6",
  subtleText: "#9AA6B2",
  primary: "#7C8CFF",
  userBubble: "#2B6A39",
  botBubble: "#0E2233",
  inputBg: "#122133"
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function App() {
  // themeAnim: 0 -> light, 1 -> dark
  const themeAnim = useRef(new Animated.Value(0)).current;
  const [isDark, setIsDark] = useState(false);

  // messages state (front-end only). Each message has id, text, role, createdAt
  const [messages, setMessages] = useState([
    {
      id: "m1",
      role: "bot",
      text: "Hi! I'm your friendly UI demo assistant. Ask me anything — this is a front-end demo.",
      createdAt: new Date(Date.now() - 1000 * 60 * 5)
    },
    {
      id: "m2",
      role: "user",
      text: "Nice UI! How does it handle themes?",
      createdAt: new Date(Date.now() - 1000 * 60 * 4)
    },
    {
      id: "m3",
      role: "bot",
      text: "Light and dark themes are animated smoothly using an Animated value.",
      createdAt: new Date(Date.now() - 1000 * 60 * 3)
    }
  ]);

  const [botTyping, setBotTyping] = useState(false);
  const flatListRef = useRef(null);

  // Interpolated colors for the current theme
  const theme = useMemo(() => {
    const t = (k) =>
      themeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [lightTheme[k], darkTheme[k]]
      });

    return {
      background: t("background"),
      card: t("card"),
      text: t("text"),
      subtleText: t("subtleText"),
      primary: t("primary"),
      userBubble: t("userBubble"),
      botBubble: t("botBubble"),
      inputBg: t("inputBg")
    };
  }, [themeAnim]);

  // toggle theme with animation
  const toggleTheme = () => {
    Animated.timing(themeAnim, {
      toValue: isDark ? 0 : 1,
      duration: 420,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic)
    }).start();
    setIsDark(!isDark);
  };

  // format timestamp simply (e.g., "12:34")
  const formatTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  // Called when user sends a message; DOES NOT call backend here.
  // For demo we simulate a bot response after a short delay. Replace this with API logic.
  const handleSend = (text) => {
    if (!text || !text.trim()) return;
    const userMessage = {
      id: `m_${Date.now()}`,
      role: "user",
      text: text.trim(),
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    // Scroll to bottom
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    // Simulate bot typing, then response (front-end demo only)
    setBotTyping(true);
    const simulatedResponseDelay = 1000 + Math.min(3500, text.length * 80);

    setTimeout(() => {
      const botMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        text:
          "This is a simulated bot response. Replace the front-end demo call with your API call to fetch real responses.",
        createdAt: new Date()
      };
      setMessages((prev) => [...prev, botMessage]);
      setBotTyping(false);

      // Scroll after bot message
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }, simulatedResponseDelay);
  };

  // Render item for FlatList
  const renderItem = ({ item }) => (
    <MessageBubble
      key={item.id}
      message={item}
      themeAnim={themeAnim}
      isOwn={item.role === "user"}
      time={formatTime(item.createdAt)}
      screenWidth={SCREEN_WIDTH}
    />
  );

  return (
    <SafeAreaProvider>
      {/* StatusBar color can't be animated easily, so switch accordingly */}
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Animated.View
        style={[
          styles.container,
          {
            // Animated background color
            backgroundColor: theme.background
          }
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.header,
              {
                // Card background animated
                backgroundColor: theme.card
              }
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.brandCircle}>
                <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
              </View>
              <Animated.Text
                style={[
                  styles.headerTitle,
                  {
                    color: theme.text
                  }
                ]}
              >
                Chat UI Demo
              </Animated.Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconButton
                onPress={() => {
                  // toggle theme
                  toggleTheme();
                }}
                // tint color animated
                color={isDark ? darkTheme.primary : lightTheme.primary}
                iconName={isDark ? "sunny" : "moon"}
              />
            </View>
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: "height" })}
            style={styles.content}
            keyboardVerticalOffset={Platform.select({ ios: 90, android: 80 })}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />

            {/* Typing indicator */}
            {botTyping && (
              <View style={styles.typingWrap}>
                <TypingIndicator themeAnim={themeAnim} />
              </View>
            )}

            <Animated.View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: theme.inputBg,
                  // add shadow/elevation adapting to theme in a subtle way
                  borderTopColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"
                }
              ]}
            >
              <ChatInput onSend={handleSend} themeAnim={themeAnim} />
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  header: {
    height: 72,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row"
  },
  brandCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  content: {
    flex: 1,
    justifyContent: "flex-end"
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 8
  },
  inputWrap: {
    padding: 10,
    borderTopWidth: 1
  },
  typingWrap: {
    paddingHorizontal: 16,
    paddingBottom: 6
  }
});