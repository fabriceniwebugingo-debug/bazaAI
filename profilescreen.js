import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from "react-native";

const STORAGE_KEY_PROFILE = "baza_user_profile";
const BACKEND_URL = "http://192.168.1.81:8000";

export default function ProfileScreen({ navigation, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
      if (raw) {
        const p = JSON.parse(raw);
        setProfile(p);
        fetchServerProfile(p.phone);
      }
    })();
  }, []);

  const fetchServerProfile = async (phone) => {
    try {
      setLoading(true);
      const resp = await axios.get(`${BACKEND_URL}/profile`, { params: { phone }});
      // merge local + server
      setProfile(prev => ({ ...(prev||{}), ...(resp.data||{}) }));
    } catch (e) {
      console.warn("Failed fetch server profile", e);
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (res.cancelled) return;
    // POST file to backend /profile/avatar using form data; backend should return avatar_url
    const form = new FormData();
    form.append("phone", profile.phone);
    form.append("avatar", {
      uri: res.uri,
      name: "avatar.jpg",
      type: "image/jpeg"
    });
    try {
      setLoading(true);
      const r = await axios.post(`${BACKEND_URL}/profile/avatar`, form, { headers: { "Content-Type": "multipart/form-data" }});
      const avatar_url = r.data.avatar_url;
      const updated = { ...profile, avatar_url };
      setProfile(updated);
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    } catch (e) {
      Alert.alert("Upload failed", "Could not upload avatar.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Text>No profile found</Text></View>;
  }

  return (
    <View style={{flex:1,padding:20}}>
      <View style={{flexDirection:"row",alignItems:"center"}}>
        <TouchableOpacity onPress={pickAvatar}>
          {profile.avatar_url ? (
            <Image source={{uri:profile.avatar_url}} style={{width:80,height:80,borderRadius:40}} />
          ) : (
            <View style={{width:80,height:80,borderRadius:40,backgroundColor:"#EEE",justifyContent:"center",alignItems:"center"}}>
              <Text style={{fontSize:24,fontWeight:"700"}}>{profile.name ? profile.name[0] : "U"}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{marginLeft:16}}>
          <Text style={{fontSize:20,fontWeight:"900"}}>{profile.name}</Text>
          <Text style={{color:"#666"}}>{profile.phone}</Text>
          <Text style={{marginTop:6}}>Balance: {profile.airtime ?? "0"}</Text>
        </View>
      </View>

      <View style={{marginTop:20}}>
        <Text style={{fontWeight:"700"}}>Quick actions</Text>
        <View style={{flexDirection:"row",marginTop:10}}>
          <TouchableOpacity onPress={() => navigation.navigate("Chat")} style={{padding:12,backgroundColor:"#FFD400",borderRadius:10,marginRight:10}}>
            <Text>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("TopUp")} style={{padding:12,backgroundColor:"#4CAF50",borderRadius:10}}>
            <Text style={{color:"#fff"}}>Top up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{marginTop:20}}>
        <Text style={{fontWeight:"700"}}>Recent purchases</Text>
        {loading ? <ActivityIndicator/> : (profile.recent_purchases||[]).slice(0,3).map(p => (
          <View key={p.id} style={{padding:10,backgroundColor:"#fafafa",borderRadius:8,marginTop:8}}>
            <Text>{p.bundle || p.qp_id}</Text>
            <Text style={{color:"#666"}}>{p.date} • {p.price}</Text>
          </View>
        ))}
      </View>

      <View style={{flex:1,justifyContent:"flex-end"}}>
        <TouchableOpacity onPress={onLogout} style={{padding:12,alignItems:"center"}}>
          <Text style={{color:"#E53935"}}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}