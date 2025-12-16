import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' or 'chat'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' or 'kin'

  const texts = {
    en: {
      appName: 'BazaAI',
      heroTitle: 'Chat Smarter with AI',
      heroSubtitle: 'Your intelligent AI companion for fast, smart, and insightful conversations.',
      startChat: 'Start Chat',
      whyTitle: 'Why BazaAI?',
      features: ['AI-Powered Responses', 'Fast & Efficient', 'Insightful Conversations', 'Secure & Private'],
      chatTitle: 'BazaAI Chat',
      placeholder: 'Type your message...',
      send: 'Send',
      clear: 'Clear Chat',
      back: 'Back',
    },
    kin: {
      appName: 'BazaAI',
      heroTitle: 'Vugana ubwenge n’AI',
      heroSubtitle: 'Umufasha wawe w’ubwenge wihuta, w’ubwenge kandi wuzuye amakuru.',
      startChat: 'Tangira Ikiganiro',
      whyTitle: 'Impamvu BazaAI?',
      features: ['Ibisubizo by’ubwenge bwa AI', 'Byihuse kandi neza', 'Ikiganiro cyuzuye amakuru', 'Byizewe kandi bibitse neza'],
      chatTitle: 'Ikiganiro BazaAI',
      placeholder: 'Andika ubutumwa bwawe...',
      send: 'Ohereza',
      clear: 'Siba Ikiganiro',
      back: 'Garuka',
    },
  };

  const t = texts[language];

  const handleSend = () => {
    if (inputText.trim() === '') return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText }]);
    setInputText('');
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'kin' : 'en'));
  };

  if (screen === 'chat') {
    return (
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="dark" />
        <View style={styles.chatHeader}>
          <Text style={styles.chatHeaderTitle}>{t.chatTitle}</Text>
          <View style={styles.chatHeaderButtons}>
            <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>{t.clear}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('home')} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>{t.back}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.messagesList}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={t.placeholder}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>{t.send}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Home Screen
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>{t.appName}</Text>
        <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
          <Text style={styles.languageButtonText}>{language === 'en' ? 'Kinyarwanda' : 'English'}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{t.heroSubtitle}</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => setScreen('chat')}>
          <Text style={styles.ctaButtonText}>{t.startChat}</Text>
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <View style={styles.features}>
        <Text style={styles.featuresTitle}>{t.whyTitle}</Text>
        {t.features.map((feature, index) => (
          <View style={styles.featureItem} key={index}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  languageButton: {
    marginTop: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  languageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 50,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  features: {
    width: '100%',
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flexShrink: 1,
  },
  // Chat Screen Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  chatHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  chatHeaderButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  clearButton: {
    marginRight: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButtonContainer: {},
  backButton: {
    fontSize: 16,
    color: '#4F46E5',
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  messageBubble: {
    backgroundColor: '#E0E7FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageText: {
    color: '#111827',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
