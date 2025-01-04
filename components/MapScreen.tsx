import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Switch } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTasks } from '@/contexts/TaskProvider';
import { useProjects } from '@/contexts/ProjectProvider';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/FirebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [publicProjects, setPublicProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
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
      
      // Fetch public projects
      fetchPublicProjects();
    })();
  }, []);

  const fetchPublicProjects = async () => {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('isPublic', '==', true));
      const querySnapshot = await getDocs(q);
      
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
      });
      
      setPublicProjects(projects);
    } catch (error) {
      console.error('Error fetching public projects:', error);
    }
  };

  const handleMarkerPress = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const toggleProjectVisibility = async (projectId, currentValue) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        isPublic: !currentValue
      });
      fetchPublicProjects(); // Refresh public projects
    } catch (error) {
      console.error('Error updating project visibility:', error);
    }
  };

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
      <View style={styles.projectHeader}>
        <Text style={styles.itemTitle}>{item.projectName}</Text>
        {item.ownerId === userId && (
          <TouchableOpacity 
            style={[
              styles.visibilityButton,
              { backgroundColor: item.isPublic ? '#4CAF50' : '#FF3B30' }
            ]}
            onPress={() => toggleProjectVisibility(item.id, item.isPublic)}
          >
            <Text style={styles.visibilityButtonText}>
              {item.isPublic ? '🌍 Public' : '🔒 Private'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.projectDescription}>
        {item.description || 'No description provided'}
      </Text>
      {item.location && (
        <Text style={styles.locationText}>
          📍 Located at: {item.location.address || 'Custom location'}
        </Text>
      )}
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

  const ProjectDetailsModal = () => (
    <Modal
      visible={showProjectDetails}
      transparent={true}
      onRequestClose={() => setShowProjectDetails(false)}
      animationType="slide"
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedProject?.projectName}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProjectDetails(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.projectDescription}>
              {selectedProject?.description || 'No description provided'}
            </Text>
            
            <View style={styles.projectStats}>
              <Text style={styles.statsText}>
                👥 Members: {selectedProject?.members?.length || 0}
              </Text>
              {selectedProject?.location?.address && (
                <Text style={styles.statsText}>
                  📍 {selectedProject.location.address}
                </Text>
              )}
            </View>

            {!userProjects.find(p => p.id === selectedProject?.id) && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => {
                  // Implement join project logic
                  setShowProjectDetails(false);
                }}
              >
                <Text style={styles.joinButtonText}>Join Project</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
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
      <Text style={styles.title}>Project Map</Text>
      
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
            {/* User location marker */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              onPress={() => setShowModal(true)}
            >
              <Callout>
                <Text>My Location</Text>
              </Callout>
            </Marker>

            {/* Project markers */}
            {publicProjects.map((project) => (
              project.location && (
                <Marker
                  key={project.id}
                  coordinate={{
                    latitude: project.location.latitude,
                    longitude: project.location.longitude,
                  }}
                  pinColor="#FF6F61"
                  onPress={() => handleMarkerPress(project)}
                >
                  <Callout>
                    <Text>{project.projectName}</Text>
                  </Callout>
                </Marker>
              )
            ))}
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

      <ProjectDetailsModal />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    // Main Container Styles
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
  
    // Map Styles
    mapContainer: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: '#FF6F61',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    map: {
      width: '100%',
      height: '100%',
    },
  
    // Modal Styles
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    modalContent: {
      padding: 16,
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
  
    // Tab Navigation Styles
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
  
    // List Item Styles
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
      shadowColor: '#FF6F61',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333',
      marginBottom: 8,
      flex: 1,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      gap: 12,
    },
  
    // Task Item Specific Styles
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
  
    // Project Item Specific Styles
    projectDescription: {
      fontSize: 14,
      color: '#666666',
      marginBottom: 12,
      lineHeight: 20,
    },
    locationText: {
      fontSize: 14,
      color: '#666666',
      marginVertical: 8,
    },
    projectDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
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
  
    // Visibility Button Styles
    visibilityButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    visibilityButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  
    // Project Stats Styles
    projectStats: {
      backgroundColor: '#FFF5EC',
      padding: 12,
      borderRadius: 8,
      marginVertical: 12,
    },
    statsText: {
      fontSize: 14,
      color: '#666666',
      marginVertical: 4,
    },
  
    // Join Button Styles
    joinButton: {
      backgroundColor: '#FF6F61',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    joinButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  
    // Utility Styles
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
      marginTop: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#f72a25',
      textAlign: 'center',
      marginTop: 20,
    },
    projectName: {
      fontSize: 14,
      color: '#666666',
      fontStyle: 'italic',
    },
  });