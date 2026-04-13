import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function App() {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Ready");

  async function syncConcern() {
    try {
      const response = await fetch("http://localhost:3000/api/concerns/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: "mobile-dev-1",
          concerns: [{ title, description: "Created from mobile scaffold" }],
          voiceNotes: [],
          videos: [],
        }),
      });

      const data = await response.json();
      setStatus(`Synced: ${data.synced}`);
    } catch (error) {
      setStatus("Sync failed (check API host)");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sohojatra Mobile</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Concern title"
        style={styles.input}
      />
      <Button title="Sync Concern" onPress={syncConcern} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  status: { marginTop: 10, color: "#444" },
});
