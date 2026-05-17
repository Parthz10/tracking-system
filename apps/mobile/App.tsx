import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import axios from "axios";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const api = axios.create({ baseURL: API_URL });

type RootStackParamList = {
  Home: undefined;
  Report: undefined;
  Track: undefined;
  MissingPersons: undefined;
  SubmitMissing: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [token, setToken] = useState<string>();

  useEffect(() => {
    async function bootstrap() {
      const existing = await SecureStore.getItemAsync("anonymousToken");
      if (existing) {
        setToken(existing);
        return;
      }

      const response = await api.post("/api/tokens");
      await SecureStore.setItemAsync("anonymousToken", response.data.token);
      setToken(response.data.token);
    }

    bootstrap().catch(() => Alert.alert("Connection error", "Could not create anonymous reporting token."));
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#102136" }, headerTintColor: "#fff" }}>
        <Stack.Screen name="Home" options={{ title: "Community Safety" }}>
          {(props) => <HomeScreen {...props} token={token} />}
        </Stack.Screen>
        <Stack.Screen name="Report" options={{ title: "Submit Tip" }}>
          {(props) => <ReportScreen {...props} token={token} />}
        </Stack.Screen>
        <Stack.Screen name="Track" options={{ title: "Track Report" }}>
          {(props) => <TrackScreen {...props} token={token} />}
        </Stack.Screen>
        <Stack.Screen name="MissingPersons" component={MissingPersonsScreen} options={{ title: "Missing Persons" }} />
        <Stack.Screen name="SubmitMissing" options={{ title: "Report Missing Person" }}>
          {(props) => <SubmitMissingScreen {...props} token={token} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen({ navigation, token }: any) {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.kicker}>Anonymous civic reporting</Text>
      <Text style={styles.title}>Lumbini Province Police Safety App</Text>
      <Text style={styles.copy}>Your device stores a private token. No name, phone number, or device ID is sent with a report.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Tracking token</Text>
        <Text selectable style={styles.token}>{token ?? "Creating secure token..."}</Text>
      </View>
      <Button label="Report Crime or Suspicious Activity" onPress={() => navigation.navigate("Report")} />
      <Button label="Track My Report" onPress={() => navigation.navigate("Track")} />
      <Button label="Browse Missing Persons" onPress={() => navigation.navigate("MissingPersons")} />
      <Button label="Report Missing Person" onPress={() => navigation.navigate("SubmitMissing")} />
    </SafeAreaView>
  );
}

function ReportScreen({ token }: any) {
  const [type, setType] = useState("SUSPICIOUS_ACTIVITY");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [useLocation, setUseLocation] = useState(false);

  async function submit() {
    if (!token) return;
    let coords: { latitude?: number; longitude?: number } = {};
    if (useLocation) {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      }
    }

    await api.post("/api/reports", { token, type, description, district: district || undefined, ...coords });
    setDescription("");
    Alert.alert("Report received", "Use Track My Report to see status updates.");
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.label}>Report type</Text>
      {["CRIME", "SUSPICIOUS_ACTIVITY", "TRAFFICKING", "OTHER"].map((option) => (
        <Pressable key={option} style={[styles.choice, option === type && styles.choiceActive]} onPress={() => setType(option)}>
          <Text style={option === type ? styles.choiceTextActive : styles.choiceText}>{option}</Text>
        </Pressable>
      ))}
      <TextInput style={styles.input} placeholder="District" value={district} onChangeText={setDistrict} />
      <TextInput style={[styles.input, styles.textarea]} placeholder="Describe what happened" multiline value={description} onChangeText={setDescription} />
      <Pressable style={styles.row} onPress={() => setUseLocation((value) => !value)}>
        <View style={[styles.checkbox, useLocation && styles.checkboxActive]} />
        <Text>Attach current GPS coordinates</Text>
      </Pressable>
      <Button label="Submit Anonymous Report" onPress={submit} />
    </ScrollView>
  );
}

function TrackScreen({ token }: any) {
  const [reports, setReports] = useState<any[]>([]);

  async function track() {
    const response = await api.get(`/api/reports/track/${token}`);
    setReports(response.data.reports);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.copy}>Track reports linked only to your anonymous token.</Text>
      <Button label="Refresh Status" onPress={track} />
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.type}</Text>
            <Text>{item.status} · {item.priority}</Text>
            {item.updates.map((update: any) => <Text key={update.id} style={styles.timeline}>{update.status}: {update.note}</Text>)}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function MissingPersonsScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/missing-persons").then((response) => setItems(response.data.missingPersons));
  }, []);

  return (
    <FlatList
      contentContainerStyle={styles.screen}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text>{item.age ? `${item.age} years · ` : ""}{item.district ?? "District unknown"}</Text>
          <Text style={styles.copy}>{item.lastSeenLocation}</Text>
        </View>
      )}
    />
  );
}

function SubmitMissingScreen({ token }: any) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [district, setDistrict] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");

  async function submit() {
    await api.post("/api/missing-persons", {
      token,
      name,
      age: age ? Number(age) : undefined,
      district: district || undefined,
      lastSeenLocation
    });
    setName("");
    setAge("");
    setDistrict("");
    setLastSeenLocation("");
    Alert.alert("Missing person report received");
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="District" value={district} onChangeText={setDistrict} />
      <TextInput style={[styles.input, styles.textarea]} placeholder="Last seen location and details" multiline value={lastSeenLocation} onChangeText={setLastSeenLocation} />
      <Button label="Submit Missing Person Report" onPress={submit} />
    </ScrollView>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: 20, gap: 14, backgroundColor: "#f7f8fa" },
  kicker: { color: "#c9282d", fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: "#102136" },
  copy: { color: "#4b5563", lineHeight: 21 },
  label: { fontWeight: "700", color: "#102136" },
  token: { fontFamily: "monospace", color: "#102136" },
  card: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: "#d8dee8", backgroundColor: "#fff", gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#102136" },
  button: { backgroundColor: "#102136", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, backgroundColor: "#fff", padding: 12 },
  textarea: { minHeight: 130, textAlignVertical: "top" },
  choice: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  choiceActive: { backgroundColor: "#102136", borderColor: "#102136" },
  choiceText: { color: "#102136", fontWeight: "700" },
  choiceTextActive: { color: "#fff", fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: "#64748b" },
  checkboxActive: { backgroundColor: "#c9282d", borderColor: "#c9282d" },
  timeline: { marginTop: 6, color: "#4b5563" }
});
