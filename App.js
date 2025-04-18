import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Alert } from 'react-native';
import { Linking } from 'react-native';
import CheckBox from '@react-native-community/checkbox'; 

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { io } from 'socket.io-client';


/* -----------------------------------------------------
   SPLASH SCREEN (BLACK BG + LOGO)
----------------------------------------------------- */
function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <Image
        source={{ uri: 'https://i.imgur.com/WCNdeob.png' }}
        style={splashStyles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

/* -----------------------------------------------------
   HOME SCREEN (3 Big Buttons: Study, Friends, Date)
----------------------------------------------------- */
function HomeScreen({ onOptionPress }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <View style={homeStyles.container}>
        <Text style={homeStyles.title}>What are you looking for?</Text>

        <TouchableOpacity
          style={[homeStyles.menuButton, { backgroundColor: '#8C1D40' }]}
          onPress={() => onOptionPress('Study Partner')}
        >
          <Text style={homeStyles.buttonText}>Find Study Partner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[homeStyles.menuButton, { backgroundColor: '#8C1D40' }]}
          onPress={() => onOptionPress('Friend')}
        >
          <Text style={homeStyles.buttonText}>Find Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[homeStyles.menuButton, { backgroundColor: '#8C1D40' }]}
          onPress={() => onOptionPress('Date')}
        >
          <Text style={homeStyles.buttonText}>Find Date</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MatchScreen({ userId, searchIntent, setActiveTab, setNewMatchTrigger }) {
  const [genderFilter, setGenderFilter] = useState('Any');
  const [yearFilter, setYearFilter] = useState('Any');
  const [deptFilter, setDeptFilter] = useState('Any');

  const [modalVisible, setModalVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('');
  const [currentOptions, setCurrentOptions] = useState([]);
  const [onSelectCallback, setOnSelectCallback] = useState(() => {});

  const [currentProfile, setCurrentProfile] = useState(null);

  // Filter Options
  const GENDER_OPTIONS = ['Any', 'Male', 'Female', 'Other'];
  const YEAR_OPTIONS = [
    'Any',
    'Freshman',
    'Sophomore',
    'Junior',
    'Senior',
    'Graduate Student',
  ];
  const DEPT_OPTIONS = [
    'Any',
    'Barret',
    'Graduate',
    'Edson',
    'W.P. Carey',
    'Global futures',
    'Watts',
    'College of Health Solutions',
    'CISA',
    'Liberal Arts',
    'Walter Cronkite',
    'Mary Lou',
    'Herberger',
    'Sandra',
    'University College',
    'Ira A. Fulton',
    'New College',
  ];

  useEffect(() => {
    fetchNextProfile();
  }, [genderFilter, yearFilter, deptFilter]);

  const fetchNextProfile = async () => {
    try {
      const res = await axios.get(
        `https://devils-meet-backend.onrender.com/api/unseen-profiles/${userId}`,
        {
          params: {
            gender: genderFilter,
            year: yearFilter,
            department: deptFilter,
            searchIntent,
          },
        }
      );
      if (res.data) {
        setCurrentProfile(res.data);
      } else {
        alert(
          "We couldn’t find anyone looking for the same thing right now. Try changing your profile intent in your settings."
        );
        setCurrentProfile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwipe = async (liked) => {
    if (!currentProfile) {
      alert('No profiles to swipe.');
      return;
    }

    try {
      const res = await axios.post('https://devils-meet-backend.onrender.com/api/swipe', {
        swiperId: parseInt(userId), // Ensure these are numbers
        targetId: parseInt(currentProfile.user_id),
        liked,
      });

      if (res.data.match) {
        alert(`🔥 It’s a match with ${currentProfile.name}!`);
        // After alert and before switching tabs
        await axios.get(`https://devils-meet-backend.onrender.com/api/likes/${userId}`); 

      
        if (typeof setNewMatchTrigger === 'function') {
          setNewMatchTrigger(true);
        }        
      
        // 👇 Redirect to Chat tab
        if (typeof setActiveTab === 'function') {
          setActiveTab('chat');
        }
      }
       
    } catch (err) {
      console.error(err);
      alert('Error while swiping');
    }

    fetchNextProfile();
  };

  const handleLike = () => {
    handleSwipe(true);
  };

  const handleSkip = () => {
    handleSwipe(false);
  };

  const handleReport = () => {
    if (!currentProfile) {
      alert('No profile to report');
      return;
    }
  
    const reasons = ['Harassment', 'Nudity', 'Spam', 'Other'];
    Alert.alert(
      'Report Profile',
      'Why are you reporting this user?',
      reasons.map((reason) => ({
        text: reason,
        onPress: async () => {
          try {
            await axios.post('https://devils-meet-backend.onrender.com/api/report', {
              reporterId: userId,
              reportedId: currentProfile.user_id,
              reason,
            });
            alert('Thanks for reporting. We’ll look into it.');
          } catch (err) {
            console.error('❌ Report error:', err);
            alert('Failed to submit report');
          }
        },
      })),
      { cancelable: true }
    );
  };
  

  const handleFilterPress = (filterType) => {
    if (filterType === 'Gender') {
      setCurrentOptions(GENDER_OPTIONS);
      setOnSelectCallback(() => (sel) => setGenderFilter(sel));
    } else if (filterType === 'Year') {
      setCurrentOptions(YEAR_OPTIONS);
      setOnSelectCallback(() => (sel) => setYearFilter(sel));
    } else if (filterType === 'Department') {
      setCurrentOptions(DEPT_OPTIONS);
      setOnSelectCallback(() => (sel) => setDeptFilter(sel));
    }
    setCurrentFilter(filterType);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      {/* Filter buttons */}
      <View style={stylesFilterRow.filterContainer}>
        <TouchableOpacity
          style={stylesFilterRow.filterButton}
          onPress={() => handleFilterPress('Gender')}
        >
          <Text style={stylesFilterRow.filterText}>Gender: {genderFilter}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={stylesFilterRow.filterButton}
          onPress={() => handleFilterPress('Year')}
        >
          <Text style={stylesFilterRow.filterText}>Year: {yearFilter}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={stylesFilterRow.filterButton}
          onPress={() => handleFilterPress('Department')}
        >
          <Text style={stylesFilterRow.filterText}>Dept: {deptFilter}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={filterModalStyles.overlay}>
          <View style={filterModalStyles.modalBox}>
            <Text style={filterModalStyles.modalTitle}>
              Select {currentFilter}
            </Text>
            <ScrollView style={{ marginVertical: 10, maxHeight: 300 }}>
              {currentOptions.map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={filterModalStyles.optionButton}
                  onPress={() => {
                    onSelectCallback(option);
                    setModalVisible(false);
                  }}
                >
                  <Text style={filterModalStyles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={filterModalStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={filterModalStyles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Current profile display */}
      {currentProfile ? (
        <ScrollView>
          <View style={hingeStyles.topSection}>
            <Text style={hingeStyles.nameText}>
              {currentProfile.name} ({currentProfile.age})
            </Text>

            <View style={hingeStyles.infoRow}>
              <Text style={hingeStyles.infoLabel}>{currentProfile.gender}</Text>
              <Text style={hingeStyles.infoLabel}>{currentProfile.year}</Text>
              <Text style={hingeStyles.infoLabel}>
                {currentProfile.department}
              </Text>
            </View>

            <View style={hingeStyles.infoRow}>
              <Text style={hingeStyles.infoLabel}>{currentProfile.height}</Text>
              <Text style={hingeStyles.infoLabel}>{currentProfile.location}</Text>
            </View>

            <View style={hingeStyles.infoRow}>
              <Text style={hingeStyles.secondaryLabel}>
                {currentProfile.university}
              </Text>
              <Text style={hingeStyles.secondaryLabel}>
                {currentProfile.religion}
              </Text>
              <Text style={hingeStyles.secondaryLabel}>
                {currentProfile.hometown}
              </Text>
            </View>
            <Text style={[hingeStyles.secondaryLabel, { marginTop: 8 }]}>
              {currentProfile.tagline}
            </Text>
          </View>

          {currentProfile.photos.map((photo) => (
            <View key={photo.uri} style={hingeStyles.photoCard}>
              <Image source={{ uri: photo.uri }} style={hingeStyles.photo} />
              <Text style={hingeStyles.promptTitle}>{photo.promptTitle}</Text>
              <Text style={hingeStyles.promptAnswer}>{photo.promptAnswer}</Text>
            </View>
          ))}

          <View style={stylesMatchButtons.buttonRow}>
            <TouchableOpacity
              style={[stylesMatchButtons.circleButton, { backgroundColor: '#CCC' }]}
              onPress={handleSkip}
            >
              <Text style={stylesMatchButtons.buttonText}>X</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[stylesMatchButtons.circleButton, { backgroundColor: '#8B0000' }]}
              onPress={handleLike}
            >
              <Text style={stylesMatchButtons.buttonText}>♥</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{ marginVertical: 10, alignSelf: 'center' }}
            onPress={handleReport}
          >
            <Text style={{ color: '#8B0000', textDecorationLine: 'underline' }}>
              Report this profile
            </Text>
          </TouchableOpacity>

        </ScrollView>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>No profiles match your filters.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

/* --------------------------------------------------------
   LIKES SCREEN
-------------------------------------------------------- */
function LikesScreen({ userId }) {
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    axios
      .get(`https://devils-meet-backend.onrender.com/api/likes/${userId}`)
      .then((res) => setLikes(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={stylesLikes.headerRow}>
        <Text style={stylesLikes.headerTitle}>Likes You</Text>
      </View>

      <View style={stylesLikes.filterRow}>
        <TouchableOpacity
          style={stylesLikes.dropdownButton}
          onPress={() => alert('Choose filter')}
        >
          <Text style={stylesLikes.dropdownText}>Recent ▼</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {likes.length > 0 ? (
          likes.map((u) => (
            <View key={u.user_id} style={stylesLikes.userCard}>
              <Text style={stylesLikes.reasonText}>Liked your profile</Text>
              <Text style={stylesLikes.userName}>{u.first_name}</Text>
              <Image
                source={{
                  uri: `https://devils-meet-backend.onrender.com${u.uri}`,
                }}
                style={stylesLikes.userPhoto}
              />
            </View>
          ))
        ) : (
          <Text
            style={{ textAlign: 'center', marginTop: 40, color: '#999' }}
          >
            No new likes yet.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* --------------------------------------------------------
   CHAT SCREEN
-------------------------------------------------------- */
function ChatScreen({ userId, activeTab, newMatchTrigger, setNewMatchTrigger }) {
  const [matches, setMatches] = useState([]);
  const [openChat, setOpenChat] = useState(null); // The match you're chatting with
  const [conversation, setConversation] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);


  
  useEffect(() => {
    if (activeTab === 'chat' || newMatchTrigger) {
      fetchMatches();
      setNewMatchTrigger(false);
    }
  }, [activeTab, newMatchTrigger]);
  
  


  useEffect(() => {
    const newSocket = io('https://devils-meet-backend.onrender.com', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
  
    setSocket(newSocket);
  
    newSocket.on('connect', () => {
      console.log('🟢 Connected to socket server');
      newSocket.emit('join', userId);
    });
  
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });
  
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔁 Reconnected on attempt #${attemptNumber}`);
    });
  
    newSocket.on('error', (error) => {
      console.error('⚠️ General socket error:', error);
    });
  
    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (!socket) return;
  
    const handleMessage = (msg) => {
      console.log('📨 New message received:', msg);
      if (openChat && msg.sender_id === openChat.user_id) {
        setConversation((prev) => [...prev, msg]);
      }
    };
  
    socket.on('new_message', handleMessage);
  
    return () => {
      socket.off('new_message', handleMessage);
    };
  }, [socket, openChat]);
  

  

  const fetchMatches = async () => {
    try {
      const res = await axios.get(
        `https://devils-meet-backend.onrender.com/api/matches/${userId}`
      );
      console.log('[💬 MATCHES RECEIVED]', res.data); // Add this line
      setMatches(res.data);
    } catch (err) {
      console.error('❌ Error fetching matches:', err);
    }
  };
  

  const openChatWithUser = async (match) => {
    setOpenChat(match);
    try {
      const res = await axios.get(
        `https://devils-meet-backend.onrender.com/api/messages/${userId}/${match.user_id}`
      );
      setConversation(res.data);
    } catch (err) {
      console.error('❌ Error loading conversation:', err);
    }
  };

  const fetchMessagesWithUser = async (otherUserId) => {
    try {
      const res = await axios.get(
        `https://devils-meet-backend.onrender.com/api/messages/${userId}/${otherUserId}`
      );
      setConversation(res.data);
    } catch (err) {
      console.error('❌ Error reloading conversation:', err);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const newMessage = {
      sender_id: userId,
      receiver_id: openChat.user_id,
      content: message.trim(),
    };
  
    try {
      await axios.post(
        'https://devils-meet-backend.onrender.com/api/messages',
        newMessage
      );
  
      // ✅ Add the message immediately to conversation
      setConversation((prev) => [
        ...prev,
        { ...newMessage, sent_at: new Date().toISOString() },
      ]);
  
      setMessage('');
      // Optional: Refresh full thread (comment out if unnecessary)
      // await fetchMessagesWithUser(openChat.user_id);
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  };
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={stylesChat.title}>Your Matches</Text>

        {matches.length > 0 ? (
          matches.map((match) => (
            <TouchableOpacity
              key={match.user_id}
              style={stylesChat.matchRow}
              onPress={() => openChatWithUser(match)}
            >
              <Image
                source={{
                  uri: `https://devils-meet-backend.onrender.com${match.uri}`,
                }}
                style={stylesChat.userAvatar}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={stylesChat.userName}>{match.first_name}</Text>
                <Text style={stylesChat.userSnippet}>Tap to chat</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
            No matches yet.
          </Text>
        )}
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={!!openChat}
        animationType="slide"
        onRequestClose={() => setOpenChat(null)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#EEE',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              {openChat?.first_name}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setOpenChat(null);
                setConversation([]);
              }}
            >
              <Text style={{ fontSize: 16, color: '#8B0000' }}>Close</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Block User',
                `Are you sure you want to block ${openChat?.first_name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await axios.post('https://devils-meet-backend.onrender.com/api/block-user', {
                          blockerId: userId,
                          blockedId: openChat.user_id,
                        });

                        alert(`${openChat?.first_name} has been blocked.`);

                        // Close the modal and remove from match list
                        setOpenChat(null);
                        setConversation([]);
                        setMatches(matches.filter(m => m.user_id !== openChat.user_id));
                      } catch (err) {
                        console.error('❌ Block failed', err);
                        alert('Failed to block user.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={{ fontSize: 16, color: 'red', marginLeft: 16 }}>
              🚫 Block User
            </Text>
          </TouchableOpacity>


          {/* Messages */}
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {conversation.map((msg, idx) => (
              <View
                key={msg.message_id || `${msg.sender_id}-${msg.sent_at}-${idx}`}
                style={{
                  alignSelf:
                    msg.sender_id === userId ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender_id === userId ? '#8B0000' : '#EEE',
                  marginVertical: 4,
                  padding: 8,
                  borderRadius: 8,
                  maxWidth: '70%',
                }}
              >
                <Text
                  style={{
                    color: msg.sender_id === userId ? '#FFF' : '#000',
                  }}
                >
                  {msg.content}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: msg.sender_id === userId ? '#EEE' : '#666',
                    marginTop: 4,
                    textAlign: 'right',
                  }}
                >
                  {new Date(msg.sent_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View
              style={{
                flexDirection: 'row',
                padding: 8,
                borderTopWidth: 1,
                borderTopColor: '#EEE',
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#CCC',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginRight: 8,
                }}
                placeholder="Type a message..."
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={{
                  backgroundColor: '#8B0000',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* --------------------------------------------------------
   PROFILE SCREEN
-------------------------------------------------------- */
function ProfileScreen({
  userId,
  setScreen,
  setEmail,
  setPassword,
  setConfirmPassword,
}) {
  console.log('🔍 ProfileScreen loaded with userId:', userId);

  // 💡 FIX: Default to “View” tab first
  const [isEditTab, setIsEditTab] = useState(false);
  const [inSettings, setInSettings] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [intent, setIntent] = useState('');

  const [photos, setPhotos] = useState([]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `https://devils-meet-backend.onrender.com/api/users/${userId}`
      );
      const data = res.data;
      console.log('📄 Loaded profile:', data);

      setName(data.first_name ?? '');
      setAge(data.age != null ? data.age.toString() : '');
      setHeight(data.height ?? '');
      setYear(data.year ?? '');
      setDepartment(data.department ?? '');
      setFirstName(data.first_name ?? '');
      setLastName(data.last_name ?? '');
      setGender(data.gender ?? '');
      setIntent(data.intent ?? '');
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // 🔥 NEW useEffect: Fetch saved photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await axios.get(
          `https://devils-meet-backend.onrender.com/api/photos/${userId}`
        );
        const photoUris = res.data.map(
          (p) => `https://devils-meet-backend.onrender.com${p.uri}`
        );
        setPhotos(photoUris);
        console.log('📸 Loaded photos:', photoUris);
      } catch (err) {
        console.error('❌ Error loading photos:', err);
      }
    };

    if (userId) {
      fetchPhotos();
    }
  }, [userId]);

  const removePhoto = async (idx) => {
    const photoToDelete = photos[idx];
    const uriPath = photoToDelete.replace(
      'https://devils-meet-backend.onrender.com',
      ''
    );

    try {
      await axios.delete(
        `https://devils-meet-backend.onrender.com/api/photos/${userId}`,
        {
          data: { uri: uriPath },
        }
      );

      const updated = [...photos];
      updated.splice(idx, 1);
      setPhotos(updated);
    } catch (err) {
      console.error('❌ Failed to delete photo:', err);
      alert('Error deleting photo');
    }
  };

  const pickImage = async () => {
    console.log('📸 pickImage function triggered');

    // (Optional) request permission first
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    // Launch image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('📂 Selected URI:', uri);

      const formData = new FormData();
      formData.append('photo', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      try {
        const res = await axios.post(
          `https://devils-meet-backend.onrender.com/api/upload-photo/${userId}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        const photoUrl = `https://devils-meet-backend.onrender.com${res.data.photoUrl}`;
        setPhotos((prev) => [...prev, photoUrl]);
        console.log('✅ Uploaded and added photo:', photoUrl);
      } catch (err) {
        console.error('❌ Upload error:', err);
        alert('Upload failed');
      }
    }
  };

  const handleCancel = () => {
    alert('Cancel editing!');
    setIsEditTab(false); // Jump back to "View" mode
  };

  const handleDone = async () => {
    console.log('Saving profile with userId:', userId);
    try {
      const res = await axios.put(
        `https://devils-meet-backend.onrender.com/api/users/${userId}`,
        {
          first_name: firstName,
          last_name: lastName,
          name,
          gender,
          age: parseInt(age),
          height,
          year,
          department,
          intent,
          tagline: 'Looking to meet new people!',
          location: 'Tempe',
          university: 'ASU',
          religion: 'None',
          hometown: 'Phoenix',
          intent,
        }
      );

      console.log('✅ Save response:', res.data);
      alert('Profile saved!');
      fetchProfile(); // refresh local state
      setIsEditTab(false);
    } catch (err) {
      console.error('❌ Save failed:', err);
      alert('Failed to save profile');
    }
  };

  if (inSettings) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFF',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            right: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Settings</Text>
          <TouchableOpacity onPress={() => setInSettings(false)}>
            <Text style={{ fontSize: 26 }}>←</Text>
          </TouchableOpacity>
        </View>
  
        {/* Logout Button */}
        <TouchableOpacity
          onPress={() => {
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setInSettings(false);
            setScreen('login');
          }}
          style={{
            backgroundColor: '#e74c3c',
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 30,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            marginTop: 20,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
            Log Out
          </Text>
        </TouchableOpacity>
  
        {/* ✅ Delete Account Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const res = await axios.delete(
                        `https://devils-meet-backend.onrender.com/api/users/${userId}`
                      );
                      alert(res.data.message || 'Account deleted successfully');
                      setEmail('');
                      setPassword('');
                      setConfirmPassword('');
                      setUserId(null);
                      setInSettings(false);     // ✅ Add this to close the settings screen
                      setScreen('login');
                    } catch (err) {
                      console.error('❌ Failed to delete account:', err);
                      alert('Error deleting account');
                    }
                  },
                },
              ]
            );
          }}
          style={{
            backgroundColor: '#999',
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 30,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            marginTop: 20,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={profileStyles.headerBar}>
        <TouchableOpacity onPress={handleCancel} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={profileStyles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[profileStyles.barText, profileStyles.barTitle]}>
            {name}
          </Text>
          <TouchableOpacity
            onPress={() => setInSettings(true)}
            style={{ marginLeft: 12 }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleDone} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={profileStyles.headerButton}>Done</Text>
        </TouchableOpacity>
      </View>

      <View>
        <View style={profileStyles.tabRow}>
          <TouchableOpacity
            style={profileStyles.tabButton}
            onPress={() => setIsEditTab(true)}
            hitSlop={{top:10,bottom:10,left:10,right:10}}
          >
            <Text
              style={[
                profileStyles.tabText,
                isEditTab ? profileStyles.tabActive : {},
              ]}
            >
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={profileStyles.tabButton}
            onPress={() => setIsEditTab(false)}
            hitSlop={{top:10,bottom:10,left:10,right:10}}
          >
            <Text
              style={[
                profileStyles.tabText,
                !isEditTab ? profileStyles.tabActive : {},
              ]}
            >
              View
            </Text>
          </TouchableOpacity>
        </View>

        {(!gender || !year || !department) && (
          <View
            style={{
              backgroundColor: '#fdecea',
              padding: 12,
              margin: 12,
              borderRadius: 10,
            }}
          >
            <Text
              style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 14 }}
            >
              ⚠️ Please complete your profile (Gender, Year, Department) to start
              matching.
            </Text>
          </View>
        )}
      </View>

      {/** 💡 FIX: Wrap the edit form in a bigger ScrollView with keyboardShouldPersistTaps */}
      {isEditTab ? (
        <ScrollView
          style={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={profileStyles.sectionTitle}>My Photos</Text>
          <View style={profileStyles.photoGrid}>
            {photos.map((uri, idx) => (
              <View key={uri} style={profileStyles.photoSlot}>
                <Image source={{ uri }} style={profileStyles.photoImage} />
                <TouchableOpacity
                  style={profileStyles.removeX}
                  onPress={() => removePhoto(idx)}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={profileStyles.addPhotoBtn}
            onPress={pickImage}
          >
            <Text style={profileStyles.addPhotoBtnText}>Tap to add photo</Text>
          </TouchableOpacity>

          <ProfileField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <ProfileField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
          <ProfileField label="Name (Display)" value={name} onChangeText={setName} />
          <ProfileField label="Age" value={age} onChangeText={setAge} />
          <ProfileField label="Height" value={height} onChangeText={setHeight} />

          <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 4 }}>
            Gender
          </Text>
          <Picker selectedValue={gender} onValueChange={setGender}>
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>

          <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 4 }}>
            Year
          </Text>
          <Picker selectedValue={year} onValueChange={setYear}>
            <Picker.Item label="Select Year" value="" />
            <Picker.Item label="Freshman" value="Freshman" />
            <Picker.Item label="Sophomore" value="Sophomore" />
            <Picker.Item label="Junior" value="Junior" />
            <Picker.Item label="Senior" value="Senior" />
            <Picker.Item
              label="Graduate Student"
              value="Graduate Student"
            />
          </Picker>

          <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 4 }}>
            Department
          </Text>
          <Picker selectedValue={department} onValueChange={setDepartment}>
            <Picker.Item label="Select Department" value="" />
            <Picker.Item label="Barret" value="Barret" />
            <Picker.Item label="Graduate" value="Graduate" />
            <Picker.Item label="Edson" value="Edson" />
            <Picker.Item label="W.P. Carey" value="W.P. Carey" />
            <Picker.Item label="Global futures" value="Global futures" />
            <Picker.Item label="Watts" value="Watts" />
            <Picker.Item
              label="College of Health Solutions"
              value="College of Health Solutions"
            />
            <Picker.Item label="CISA" value="CISA" />
            <Picker.Item label="Liberal Arts" value="Liberal Arts" />
            <Picker.Item label="Walter Cronkite" value="Walter Cronkite" />
            <Picker.Item label="Mary Lou" value="Mary Lou" />
            <Picker.Item label="Herberger" value="Herberger" />
            <Picker.Item label="Sandra" value="Sandra" />
            <Picker.Item
              label="University College"
              value="University College"
            />
            <Picker.Item label="Ira A. Fulton" value="Ira A. Fulton" />
            <Picker.Item label="New College" value="New College" />
          </Picker>

          <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 4 }}>
            I'm open to:
          </Text>
          <Picker selectedValue={intent} onValueChange={setIntent}>
            <Picker.Item label="Select Intent" value="" />
            <Picker.Item label="Study Partner" value="Study Partner" />
            <Picker.Item label="Friend" value="Friend" />
            <Picker.Item label="Date" value="Date" />
          </Picker>

          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        // VIEW Tab
        <ScrollView style={{ padding: 16 }}>
          <Text style={profileStyles.sectionTitle}>My Photos</Text>
          <View style={profileStyles.photoGrid}>
            {photos.map((uri) => (
              <View key={uri} style={profileStyles.photoSlot}>
                <Image source={{ uri }} style={profileStyles.photoImage} />
              </View>
            ))}
          </View>

          <Text style={profileStyles.sectionTitle}>About Me</Text>
          <Text style={profileStyles.viewText}>
            <Text style={{ fontWeight: '700' }}>Name: </Text> {name}
          </Text>
          <Text style={profileStyles.viewText}>
            <Text style={{ fontWeight: '700' }}>Age: </Text> {age}
          </Text>
          <Text style={profileStyles.viewText}>
            <Text style={{ fontWeight: '700' }}>Height: </Text> {height}
          </Text>
          <Text style={profileStyles.viewText}>
            <Text style={{ fontWeight: '700' }}>Year: </Text> {year}
          </Text>
          <Text style={profileStyles.viewText}>
            <Text style={{ fontWeight: '700' }}>Department: </Text> {department}
          </Text>
          <Text style={profileStyles.viewText}>
            <Text style={{ fontWeight: '700' }}>Open To: </Text> {intent}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ProfileField({ label, value, onChangeText }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: '600', marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={profileStyles.inputField}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

/* -----------------------------------------------------
   GUIDED ONBOARDING SCREEN
----------------------------------------------------- */
function GuidedOnboardingScreen({ userId, setScreen, setActiveTab }) {
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [formData, setFormData] = useState({});
  const [photos, setPhotos] = useState([]);


  const questions = [
    { key: 'first_name', label: 'What’s your first name?', type: 'text' },
    { key: 'last_name', label: 'What’s your last name?', type: 'text' },
    { key: 'gender', label: 'What’s your gender?', type: 'picker', options: ['Male', 'Female', 'Other'] },
    { key: 'age', label: 'How old are you?', type: 'text' },
    { key: 'year', label: 'What year are you in?', type: 'picker', options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate Student'] },
    { key: 'department', label: 'What’s your department?', type: 'picker', options: [
      'Barret', 'Graduate', 'Edson', 'W.P. Carey', 'Global futures', 'Watts',
      'College of Health Solutions', 'CISA', 'Liberal Arts', 'Walter Cronkite',
      'Mary Lou', 'Herberger', 'Sandra', 'University College', 'Ira A. Fulton', 'New College'
    ]},
    { key: 'intent', label: 'What are you open to?', type: 'picker', options: ['Study Partner', 'Friend', 'Date'] },
    { key: 'photos', label: 'Upload 3 photos to complete your profile', type: 'photo' },
  ];

  const current = questions[step];

  const handleNext = async () => {
    const updated = { ...formData, [current.key]: inputValue.trim() };
    setFormData(updated); 
    setInputValue('');

    if (current.key === 'photos') {
      if (photos.length < 3) {
        alert('Please upload at least 3 photos to complete your profile.');
        return;
      }
    
      const finalData = { ...updated, photos };
      setFormData(finalData); // ✅ Save the correct formData

    
      try {
        await axios.put(`https://devils-meet-backend.onrender.com/api/users/${userId}`, {
          ...finalData,
          age: parseInt(finalData.age || '0', 10),        
          tagline: 'Looking to meet new people!',
          location: 'Tempe',
          university: 'ASU',
          religion: 'None',
          hometown: 'Phoenix',
        });
    
        alert('You’re all set!');
        setActiveTab('profile');
        setScreen('tabs');
      } catch (err) {
        console.error('❌ Failed onboarding:', err);
        alert('Something went wrong. Try again.');
      }
      return;
    }
    
    

    if (step < questions.length - 1) {
      setStep(step + 1);
      setInputValue('');
    } else {
      // Final step => Save data to server
      try {
        await axios.put(`https://devils-meet-backend.onrender.com/api/users/${userId}`, {
          ...updated,
          age: parseInt(updated.age || '0', 10),        
          tagline: 'Looking to meet new people!',
          location: 'Tempe',
          university: 'ASU',
          religion: 'None',
          hometown: 'Phoenix',
        });

        alert('You’re all set!');
        setActiveTab('profile');
        setScreen('tabs');
      } catch (err) {
        console.error('❌ Failed onboarding:', err);
        alert('Something went wrong. Try again.');
      }
    }
  };
  
  // ✅ Add below this line:
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access photos is required!');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
  
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('photo', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });
  
      try {
        const res = await axios.post(
          `https://devils-meet-backend.onrender.com/api/upload-photo/${userId}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        const uploadedUrl = `https://devils-meet-backend.onrender.com${res.data.photoUrl}`;
        setPhotos((prev) => [...prev, uploadedUrl]);
      } catch (err) {
        console.error('❌ Upload error:', err);
        alert('Failed to upload photo');
      }
    }
  };
  

  // 💡 FIX: Wrap entire screen in a ScrollView for smoother picks
  return (
    <SafeAreaView style={{ flex: 1 }}>
  <ScrollView
    contentContainerStyle={{
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
      paddingBottom: 120, // 💡 Gives breathing space at the bottom
    }}
    keyboardShouldPersistTaps="handled"
  >
    <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
      {current.label}
    </Text>

    {current.type === 'picker' && (
  <Picker
    selectedValue={inputValue}
    onValueChange={(val) => setInputValue(val)}
    style={{ width: '100%', height: 50, marginBottom: 20 }}
  >
    <Picker.Item label={`Select ${current.key}`} value="" />
    {current.options.map((opt) => (
      <Picker.Item key={opt} label={opt} value={opt} />
    ))}
  </Picker>
)}

{current.type === 'photo' && (
  <>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {photos.map((uri, idx) => (
        <Image key={idx} source={{ uri }} style={{ width: 100, height: 100, margin: 5 }} />
      ))}
    </View>
    <TouchableOpacity
      onPress={pickImage}
      style={{
        backgroundColor: '#8B0000',
        padding: 12,
        marginTop: 20,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#FFF', textAlign: 'center' }}>Add Photo</Text>
    </TouchableOpacity>
  </>
)}

{current.type === 'text' && (
  <TextInput
    style={{
      width: '100%',
      height: 50,
      borderWidth: 1,
      borderColor: '#CCC',
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
      marginBottom: 20,
    }}
    value={inputValue}
    onChangeText={setInputValue}
    placeholder="Type here..."
  />
)}

  </ScrollView>

  {/* OK Button placed cleanly above bottom with spacing */}
  <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
    <TouchableOpacity
      style={{
        backgroundColor: '#8B0000',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignSelf: 'center',
      }}
      onPress={handleNext}
      disabled={
        (current.type === 'text' && !inputValue.trim()) ||
        (current.type === 'picker' && !inputValue)
      }
      
    >
      <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>OK</Text>
    </TouchableOpacity>
  </View>
</SafeAreaView>

  );
}

/* -----------------------------------------------------
   MAIN APP: SPLASH -> LOGIN -> TABS
   TABS: "home","match","likes","chat","profile"
----------------------------------------------------- */
export default function App() {
  const [screen, setScreen] = useState('splash'); // 'splash','login','tabs','signUp'
  const [activeTab, setActiveTab] = useState('home');
  const [searchIntent, setSearchIntent] = useState('');

  // Basic login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [newMatchTrigger, setNewMatchTrigger] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);


  // Show splash for 2 seconds
  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        setScreen('login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // 🔄 If userId is null while in tabs, go to login
useEffect(() => {
  if (!userId && screen === 'tabs') {
    setScreen('login');
  }
}, [userId, screen]);


  // Renders the 5-tab layout
  const renderTabs = () => {
    let CurrentComp = null;

    if (activeTab === 'home') {
      CurrentComp = (
        <HomeScreen
          onOptionPress={(intent) => {
            setSearchIntent(intent); // sets the intent
            setActiveTab('match');   // navigate to Match tab
          }}
        />
      );
    } else if (activeTab === 'match') {
      CurrentComp = (
        <MatchScreen
          userId={userId}
          searchIntent={searchIntent}
          setActiveTab={setActiveTab}
          setNewMatchTrigger={setNewMatchTrigger}
        />
      );      
    } else if (activeTab === 'likes') {
      CurrentComp = <LikesScreen userId={userId} />;
    } else if (activeTab === 'chat') {
      CurrentComp = <ChatScreen userId={userId} activeTab={activeTab} newMatchTrigger={newMatchTrigger} setNewMatchTrigger={setNewMatchTrigger} />;
    } else if (activeTab === 'profile') {
      CurrentComp = (
        <ProfileScreen
          userId={userId}
          setScreen={setScreen}
          setEmail={setEmail}
          setPassword={setPassword}
          setConfirmPassword={setConfirmPassword}
        />
      );
    }

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{CurrentComp}</View>

        {/* Bottom nav bar with 5 tabs */}
        <View style={navStyles.navBar}>
          <TouchableOpacity
            style={navStyles.navButton}
            onPress={() => setActiveTab('home')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 💡 bigger clickable area
          >
            <Text
              style={[
                navStyles.navText,
                activeTab === 'home' && navStyles.activeText,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={navStyles.navButton}
            onPress={() => setActiveTab('match')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                navStyles.navText,
                activeTab === 'match' && navStyles.activeText,
              ]}
            >
              Match
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={navStyles.navButton}
            onPress={() => setActiveTab('likes')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                navStyles.navText,
                activeTab === 'likes' && navStyles.activeText,
              ]}
            >
              Likes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={navStyles.navButton}
            onPress={() => {
              setActiveTab('chat');
              window.newMatch = true; // ✅ Trigger refetch in ChatScreen's useEffect
            }}
            
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                navStyles.navText,
                activeTab === 'chat' && navStyles.activeText,
              ]}
            >
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={navStyles.navButton}
            onPress={() => setActiveTab('profile')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                navStyles.navText,
                activeTab === 'profile' && navStyles.activeText,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Main screen logic
  const renderScreen = () => {
    if (screen === 'splash') {
      return <SplashScreen />;
    }

    if (screen === 'login') {
      return (
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1583864697784-7401f7739f98?fit=crop&w=480&q=80',
          }}
          style={globalStyles.bg}
        >
          <View style={globalStyles.overlay} />
          <ScrollView contentContainerStyle={stylesLogin.scrollContainer}>
            <Text style={globalStyles.title}>Devils Meet</Text>
            <Text style={globalStyles.subtitle}>
              Welcome back, Fellow Sun Devil!
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={globalStyles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[
                globalStyles.button,
                isLoggingIn && { backgroundColor: '#AAA' },
              ]}
              disabled={isLoggingIn}
              onPress={async () => {
                if (!email || !password) {
                  alert('Please enter your credentials!');
                  return;
                }

                console.log('🚀 Starting login...');
                setIsLoggingIn(true);

                try {
                  console.log('📡 Sending login request...');
                  const res = await axios.post(
                    'https://devils-meet-backend.onrender.com/api/login',
                    {
                      email: email.trim().toLowerCase(),
                      password: password.trim(),
                    },
                    {
                      timeout: 10000, // wait max 10 seconds
                    }
                  );

                  console.log('✅ Login response received:', res.data);

                  if (res.data.token && res.data.userId) {
                    setUserId(res.data.userId);
                    alert('Login successful!');
                    setScreen('tabs');
                  } else {
                    alert(
                      'Login failed. ' + (res.data.error || 'Unknown error')
                    );
                  }
                } catch (error) {
                  console.log('❌ Login error:', error);
                  alert(error.response?.data?.error || 'Login error');
                } finally {
                  console.log('🧹 Resetting login state');
                  setIsLoggingIn(false);
                }
              }}
            >
              <Text style={globalStyles.buttonText}>
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <Text style={globalStyles.link}>
              Don’t have an account? (No problem!)
            </Text>

            <TouchableOpacity
              style={[globalStyles.signUpButton, { marginTop: 12 }]}
              onPress={() => setScreen('signUp')}
            >
              <Text style={globalStyles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>
      );
    }

    if (screen === 'signUp') {
      return (
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1583864697784-7401f7739f98?fit=crop&w=480&q=80',
          }}
          style={globalStyles.bg}
        >
          <View style={globalStyles.overlay} />
          <View style={globalStyles.centerBox}>
            <Text style={globalStyles.title}>Sign Up</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={globalStyles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={globalStyles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
              <CheckBox
                value={agreedToTerms}
                onValueChange={setAgreedToTerms}
              />
              <Text style={{ marginLeft: 8, color: 'white' }}>
                I agree to the{' '}
                <Text
                  style={{ color: '#add8e6', textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL('https://sunnyblaze290.github.io/devilsmeet-terms/')}
                >
                  Terms of Use
                </Text>
              </Text>
            </View>


            <TouchableOpacity
              style={[globalStyles.button, !agreedToTerms && { backgroundColor: '#AAA' }]}
              disabled={!agreedToTerms}
              onPress={async () => {
                console.log('[📬 Sign Up Button] Pressed');

                if (!email || !password || !confirmPassword) {
                  alert('Please fill all fields!');
                  return;
                }
                if (password !== confirmPassword) {
                  alert('Passwords do not match!');
                  return;
                }

                setIsSigningUp(true);

                try {
                  const res = await axios.post(
                    'https://devils-meet-backend.onrender.com/api/signup',
                    {
                      email: email.trim(),
                      password: password.trim(),
                      agreedToTerms: agreedToTerms,
                    }
                  );

                  if (res.status === 200 && res.data.message) {
                    alert(res.data.message); // OTP sent
                    setScreen('verifyOtp');
                  }
                } catch (err) {
                  const errorMsg = err?.response?.data?.error;
                  console.error('[❌ Signup Failed]', errorMsg, err);
                  if (errorMsg === 'OTP already sent. Please verify.') {
                    alert(errorMsg);
                    setScreen('verifyOtp');
                  } else {
                    alert(errorMsg || 'Sign up failed');
                  }
                } finally {
                  setIsSigningUp(false);
                }
              }}
            >
              <Text style={globalStyles.buttonText}>
                {isSigningUp ? 'Signing Up...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.signUpButton, { marginTop: 12 }]}
              onPress={() => setScreen('login')}
            >
              <Text style={globalStyles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      );
    }

    // OTP verification screen
    if (screen === 'verifyOtp') {
      return (
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1583864697784-7401f7739f98?fit=crop&w=480&q=80',
          }}
          style={globalStyles.bg}
        >
          <View style={globalStyles.overlay} />
          <View style={globalStyles.centerBox}>
            <Text style={globalStyles.title}>Verify OTP</Text>
            <Text
            style={{
              color: '#FFF',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 16,
              paddingHorizontal: 10,
            }}
          >
            OTP not received? Wait a moment, then check spam.
          </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={globalStyles.input}
              placeholder="OTP Code"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity
              style={globalStyles.button}
              onPress={async () => {
                setIsVerifyingOtp(true);
                try {
                  const res = await axios.post(
                    'https://devils-meet-backend.onrender.com/api/verify-otp',
                    {
                      email: email.trim(),
                      otp: otp.trim(),
                    }
                  );

                  if (res.status === 201 && res.data.userId) {
                    setUserId(res.data.userId);
                    alert('Account verified successfully!');
                    setScreen('onboarding');
                  } else {
                    alert(res.data.error || 'OTP verification failed');
                  }
                } catch (err) {
                  alert(err.response?.data?.error || 'OTP verification failed');
                } finally {
                  setIsVerifyingOtp(false);
                }
              }}
            >
              <Text style={globalStyles.buttonText}>
                {isVerifyingOtp ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                globalStyles.signUpButton,
                { marginTop: 12 },
                isResendingOtp && { backgroundColor: '#ccc' },
              ]}
              onPress={async () => {
                if (!email) {
                  alert('Enter email first');
                  return;
                }

                setIsResendingOtp(true);
                try {
                  const res = await axios.post(
                    'https://devils-meet-backend.onrender.com/api/resend-otp',
                    {
                      email: email.trim(),
                    }
                  );
                  alert(res.data.message || 'OTP resent!');
                } catch (err) {
                  console.error('[❌ Resend Failed]', err);
                  alert(err.response?.data?.error || 'Failed to resend OTP');
                } finally {
                  setIsResendingOtp(false);
                }
              }}
              disabled={isResendingOtp}
            >
              <Text style={globalStyles.buttonText}>
                {isResendingOtp ? 'Resending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.signUpButton, { marginTop: 12 }]}
              onPress={() => setScreen('login')}
            >
              <Text style={globalStyles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      );
    }

    if (screen === 'onboarding') {
      return (
        <GuidedOnboardingScreen
          userId={userId}
          setScreen={setScreen}
          setActiveTab={setActiveTab}
        />
      );
    }

    if (screen === 'tabs') {
      return renderTabs();
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}

/* -----------------------------------------------------
   GLOBAL STYLES
----------------------------------------------------- */
const globalStyles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginVertical: 5,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 10,
    color: '#FFF',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  signUpButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 150,
  },
});

const stylesLogin = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

/* -----------------------------------------------------
   SPLASH STYLES
----------------------------------------------------- */
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
});

/* -----------------------------------------------------
   HOME STYLES
----------------------------------------------------- */
const homeStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },  
  menuButton: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

/* -----------------------------------------------------
   FILTER MODAL STYLES (Match)
----------------------------------------------------- */
const filterModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionButton: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 10,
  },
  closeText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

/* -----------------------------------------------------
   MATCH FILTER ROW
----------------------------------------------------- */
const stylesFilterRow = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterButton: {
    backgroundColor: '#EEE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

/* -----------------------------------------------------
   MATCH (HINGE STYLE)
----------------------------------------------------- */
const hingeStyles = StyleSheet.create({
  topSection: {
    paddingVertical: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  secondaryLabel: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  photoCard: {
    backgroundColor: '#FFF',
    margin: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  promptAnswer: {
    fontSize: 16,
    color: '#333',
  },
});

/* -----------------------------------------------------
   MATCH: LIKE/SKIP BUTTONS
----------------------------------------------------- */
const stylesMatchButtons = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

/* -----------------------------------------------------
   LIKES SCREEN
----------------------------------------------------- */
const stylesLikes = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  dropdownButton: {
    backgroundColor: '#EEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  userCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  userPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});

/* -----------------------------------------------------
   CHAT SCREEN STYLES
----------------------------------------------------- */
const stylesChat = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 6,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEE',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userSnippet: {
    fontSize: 14,
    color: '#666',
  },
  startChatButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startChatText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

/* -----------------------------------------------------
   BOTTOM NAV (5 TABS)
----------------------------------------------------- */
const navStyles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingVertical: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    color: '#AAA',
    fontSize: 18, // 💡 FIX: Increased for bigger tap target
  },
  activeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

/* -----------------------------------------------------
   PROFILE SCREEN STYLES
----------------------------------------------------- */
const profileStyles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  headerButton: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
  },
  barText: {
    fontSize: 16,
  },
  barTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#000',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  tabActive: {
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoSlot: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    backgroundColor: '#EEE',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeX: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  addPhotoBtn: {
    backgroundColor: '#EEE',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  addPhotoBtnText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  inputField: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  viewText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
});

