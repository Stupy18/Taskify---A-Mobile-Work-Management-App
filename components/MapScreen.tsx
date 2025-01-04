import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Animated } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTasks } from '@/contexts/TaskProvider';
import { useProjects } from '@/contexts/ProjectProvider';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '@/FirebaseConfig';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'projects'
  const { tasks } = useTasks();
  const { userProjects } = useProjects();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const renderTaskItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDate}>Due: {item.dueDate}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.projectName}>Project: {item.projectName}</Text>
    </View>
  );

  const renderProjectItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.projectName}</Text>
      <Text style={styles.projectDescription}>
        {item.description || 'No description provided'}
      </Text>
      <View style={styles.projectDetails}>
        <View style={styles.memberCount}>
          <Text style={styles.memberCountText}>
            {item.members?.length || 0} members
          </Text>
        </View>
        <View style={[styles.roleBadge, { 
          backgroundColor: item.ownerId === userId ? '#188038' : '#fbbc04'
        }]}>
          <Text style={styles.roleText}>
            {item.ownerId === userId ? 'Owner' : 'Member'}
          </Text>
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return '#f72a25';
      case 'Doing': return '#fbbc04';
      case 'Done': return '#188038';
      default: return '#666666';
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>My Location</Text>
      
      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              onPress={() => setShowModal(true)}
            >
              <Callout>
                <Text>View My Tasks & Projects</Text>
              </Callout>
            </Marker>
          </MapView>
        </View>
      )}

      <Modal
        visible={showModal}
        transparent={true}
        onRequestClose={() => setShowModal(false)}
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                My {activeTab === 'tasks' ? 'Tasks' : 'Projects'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
                onPress={() => setActiveTab('tasks')}
              >
                <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
                  Tasks
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
                onPress={() => setActiveTab('projects')}
              >
                <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
                  Projects
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeTab === 'tasks' 
                ? [...tasks.toDo, ...tasks.doing, ...tasks.done]
                : userProjects
              }
              renderItem={activeTab === 'tasks' ? renderTaskItem : renderProjectItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No {activeTab} found
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5EC',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF6F61',
    marginBottom: 20,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    fontSize: 16,
    color: '#f72a25',
    textAlign: 'center',
    marginTop: 20,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4CC',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6F61',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFF5EC',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6F61',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#FFF5EC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 14,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  projectName: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  projectDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  projectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    backgroundColor: '#FFE4CC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    color: '#FF6F61',
    fontSize: 12,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '300',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
});