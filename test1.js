import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert, Image, Modal, Button } from 'react-native';
import Voice from '@react-native-voice/voice'; 
import Slider from '@react-native-community/slider'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { database, ref, onValue, set } from './firebase';

export default function App() {
  const [lightValue, setLightValue] = useState(0);
  const [temperatureValue, setTemperatureValue] = useState(0);
  const [activeLight, setActiveLight] = useState(false);
  const [activeTemperature, setActiveTemperature] = useState(false);
  const [ledState, setLedState] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [commandMessage, setCommandMessage] = useState('');
  const [language, setLanguage] = useState('vi-VN');
  const [isRecording, setIsRecording] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [newScheduleAction, setNewScheduleAction] = useState(false);

  useEffect(() => {
    const dbRef = ref(database, '/');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLightValue(data.LIGHT);
        setTemperatureValue(data.TEMPERATURE);
        setActiveLight(data.ACTIVE_LIGHT === 1);
        setActiveTemperature(data.ACTIVE_TEMPERATURE === 1);
        setLedState(data.LED === "ON");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    loadSchedule();

    const interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      const scheduledTime = `${selectedHour}:${selectedMinute}`;
      if (currentTime.startsWith(scheduledTime)) {
        toggleLedState(newScheduleAction);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedHour, selectedMinute, newScheduleAction]);

  const onSpeechResults = (event) => {
    const text = event.value[0];
    setRecognizedText(text);

    if (text.toLowerCase().includes("open") || text.toLowerCase().includes("mở")) {
      setCommandMessage("Đã nhận được lệnh mở rèm");
      toggleLedState(true);
    } else if (text.toLowerCase().includes("close") || text.toLowerCase().includes("đóng")) {
      setCommandMessage("Đã nhận được lệnh đóng rèm");
      toggleLedState(false);
    }
  };

  const onSpeechError = (event) => {
    Alert.alert('Lỗi', 'Đã xảy ra lỗi trong quá trình nhận diện giọng nói.');
    setCommandMessage('Đã xảy ra lỗi trong quá trình nhận diện giọng nói.');
  };

  const toggleLedState = (newState) => {
    setLedState(newState);
    set(ref(database, 'LED'), newState ? "ON" : "OFF");
  };

  const updateLightValue = (value) => setLightValue(Math.round(value));
  const updateTemperatureValue = (value) => setTemperatureValue(Math.round(value));
  const handleLightChangeComplete = () => set(ref(database, 'LIGHT'), lightValue);
  const handleTemperatureChangeComplete = () => set(ref(database, 'TEMPERATURE'), temperatureValue);
  const toggleActiveLight = (newValue) => set(ref(database, 'ACTIVE_LIGHT'), newValue ? 1 : 0);
  const toggleActiveTemperature = (newValue) => set(ref(database, 'ACTIVE_TEMPERATURE'), newValue ? 1 : 0);

  const startRecording = async () => {
    setRecognizedText('');
    setCommandMessage('');
    try {
      await Voice.start(language);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting Voice:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping Voice:', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const savedHour = await AsyncStorage.getItem('scheduleHour');
      const savedMinute = await AsyncStorage.getItem('scheduleMinute');
      const savedAction = await AsyncStorage.getItem('scheduleAction');
      if (savedHour) setSelectedHour(savedHour);
      if (savedMinute) setSelectedMinute(savedMinute);
      if (savedAction) setNewScheduleAction(savedAction === 'true');
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  };

  const saveSchedule = async () => {
    try {
      await AsyncStorage.setItem('scheduleHour', selectedHour);
      await AsyncStorage.setItem('scheduleMinute', selectedMinute);
      await AsyncStorage.setItem('scheduleAction', newScheduleAction.toString());
      setScheduleModalVisible(false);
    } catch (error) {
      console.error("Error saving schedule:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Image source={require('./assets/111.png')} style={styles.icon} />
          <Text style={styles.headerText}>IOT NHÓM 1</Text>
        </View>

        {/* Nút setup lịch */}
        <TouchableOpacity onPress={() => setScheduleModalVisible(true)} style={styles.scheduleButton}>
          <Image source={require('./assets/schedule_icon.png')} style={styles.scheduleIcon} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>LIGHT: {lightValue}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1200}
            step={1}
            value={lightValue}
            onValueChange={updateLightValue}
            onSlidingComplete={handleLightChangeComplete}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>TEMPERATURE: {temperatureValue}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={temperatureValue}
            onValueChange={updateTemperatureValue}
            onSlidingComplete={handleTemperatureChangeComplete}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.switchContainer}>
            <Text>ACTIVE LIGHT:</Text>
            <Switch value={activeLight} onValueChange={toggleActiveLight} />
          </View>
          <View style={styles.switchContainer}>
            <Text>ACTIVE TEMPERATURE:</Text>
            <Switch value={activeTemperature} onValueChange={toggleActiveTemperature} />
          </View>
          <View style={styles.switchContainer}>
            <Text>LED:</Text>
            <Switch value={ledState} onValueChange={() => toggleLedState(!ledState)} />
          </View>
          <View style={styles.switchContainer}>
            <Text>Ngôn ngữ: {language === 'vi-VN' ? 'Tiếng Việt' : 'Tiếng Anh'}</Text>
            <Switch value={language === 'en-US'} onValueChange={() => setLanguage(language === 'vi-VN' ? 'en-US' : 'vi-VN')} />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.recordButton, isRecording && styles.recording]} 
          onPressIn={startRecording} 
          onPressOut={stopRecording}
        >
          <Text style={styles.buttonText}>{isRecording ? "Đang ghi âm..." : "Giữ để ghi âm"}</Text>
        </TouchableOpacity>

        <View style={styles.textBox}>
          {recognizedText ? (
            <Text style={styles.recognizedText}>{recognizedText}</Text>
          ) : (
            <Text style={styles.emptyText}>Chưa có văn bản nhận diện</Text>
          )}
        </View>
        <Text style={styles.commandMessage}>{commandMessage}</Text>
      </View>

      {/* Modal thêm lịch */}
      <Modal visible={scheduleModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm lịch hẹn giờ</Text>

            <Text>Chọn Giờ:</Text>
            <Picker
              selectedValue={selectedHour}
              style={{ height: 50, width: 100 }}
              onValueChange={(itemValue) => setSelectedHour(itemValue)}
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <Picker.Item label={i.toString().padStart(2, "0")} value={i.toString().padStart(2, "0")} key={i} />
              ))}
            </Picker>

            <Text>Chọn Phút:</Text>
            <Picker
              selectedValue={selectedMinute}
              style={{ height: 50, width: 100 }}
              onValueChange={(itemValue) => setSelectedMinute(itemValue)}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <Picker.Item label={i.toString().padStart(2, "0")} value={i.toString().padStart(2, "0")} key={i} />
              ))}
            </Picker>

            <View style={styles.switchContainer}>
              <Text>Trạng thái:</Text>
              <Switch value={newScheduleAction} onValueChange={setNewScheduleAction} />
              <Text>{newScheduleAction ? "Mở" : "Đóng"}</Text>
            </View>

            <Button title="Lưu lịch" onPress={saveSchedule} />
            <Button title="Đóng" onPress={() => setScheduleModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    width: '100%',
    backgroundColor: '#d62d20',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  icon: {
    width: 50, 
    height: 50,
    borderRadius: 25,
  },
  headerText: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  scheduleButton: {
    position: 'absolute',
    right: 10,
    top: 15,
  },
  scheduleIcon: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  slider: {
    width: '100%',
    height: 30,
    marginVertical: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  recordButton: {
    backgroundColor: '#4eab95',
    padding: 8,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',
    width: '60%',
    elevation: 3,
  },
  recording: {
    backgroundColor: '#ff4d4d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 20,
    width: '75%',
  },
  recognizedText: {
    fontSize: 12,
    color: '#333',
  },
  emptyText: {
    fontSize: 12,
    color: '#999',
  },
  commandMessage: {
    marginTop: 10,
    fontSize: 14,
    color: '#ff4d4d',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
