import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

/**
 * Example data for the profile. Replace with real data or props.
 */
const profileData = {
  name: 'Amber',
  age: 21,
  height: `5'0"`,
  location: 'Alhambra',
  university: 'GCU',
  religion: 'Christian',
  hometown: 'Colorado',
  tagline: 'Figuring out my dating goals',
  photos: [
    {
      uri: 'https://placekitten.com/400/400',
      promptTitle: 'My self-care routine is',
      promptAnswer: 'Binge watching the same 3 shows on repeat',
    },
    {
      uri: 'https://placekitten.com/401/400',
      promptTitle: 'My most irrational fear',
      promptAnswer: 'The bare minimum',
    },
    {
      uri: 'https://placekitten.com/402/400',
      promptTitle: 'The one thing you should know about me is',
      promptAnswer: 'Major yapper alert 🚨',
    },
  ],
};

export default function DetailedProfileScreen({ onBack }) {
  return (
    <ScrollView style={styles.container}>
      {/* Top Section: Basic Info */}
      <View style={styles.topSection}>
        <Text style={styles.nameText}>{profileData.name}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{profileData.age}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{profileData.height}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{profileData.location}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.secondaryLabel}>{profileData.university}</Text>
          <Text style={styles.secondaryLabel}>{profileData.religion}</Text>
          <Text style={styles.secondaryLabel}>{profileData.hometown}</Text>
        </View>
        <View style={[styles.infoRow, { marginTop: 8 }]}>
          <Text style={styles.secondaryLabel}>{profileData.tagline}</Text>
        </View>
      </View>

      {/* Photo Cards + Prompts */}
      {profileData.photos.map((photo, index) => (
        <View key={index} style={styles.photoCard}>
          <Image source={{ uri: photo.uri }} style={styles.photo} />
          <Text style={styles.promptTitle}>{photo.promptTitle}</Text>
          <Text style={styles.promptAnswer}>{photo.promptAnswer}</Text>
        </View>
      ))}

      {/* Bottom Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity style={styles.dislikeButton} onPress={() => alert('X tapped!')}>
          <Text style={styles.buttonText}>X</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeButton} onPress={() => alert('Heart tapped!')}>
          <Text style={styles.buttonText}>♥</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.buttonText, { fontSize: 14 }]}>Back to Menu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9F9F9',
  },
  topSection: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    justifyContent: 'center',
    marginTop: 2,
  },
  infoItem: {
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 30,
    marginVertical: 20,
  },
  dislikeButton: {
    backgroundColor: '#ccc',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    backgroundColor: '#8B0000',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  backButton: {
    alignSelf: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 40,
  },
});
