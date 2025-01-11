import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import * as Location from "expo-location";
import Supercluster from "supercluster";
import { useTasks } from "@/contexts/TaskProvider";
import { useProjects } from "@/contexts/ProjectProvider";
import { ThemedView } from "@/components/ThemedView";
import { auth, db } from "@/FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

interface Project {
  id: string;
  projectName: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  members?: string[];
  [key: string]: any;
}

interface ProjectMarkersProps {
  projects: Project[];
  onMarkerPress: (project: Project) => void;
  mapRef: React.RefObject<any>;
}

interface ProjectMarkersRef {
  handleRegionChange: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
}

interface ClusterFeature {
  type: 'Feature';
  id?: number;
  properties: {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    projectId?: string;
  } & Partial<Project>;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

const ProjectMarkers = React.forwardRef<ProjectMarkersRef, ProjectMarkersProps>(
  ({ projects, onMarkerPress, mapRef }, ref) => {
    const [clusters, setClusters] = useState<ClusterFeature[]>([]);
    const [zoom, setZoom] = useState(10);
    const supercluster = useRef<Supercluster | null>(null);

    const initializeSupercluster = () => {
      if (!projects?.length) return;

      supercluster.current = new Supercluster({
        radius: 40,
        maxZoom: 20,
        minZoom: 1,
        minPoints: 2,
      });

      const points = projects
        .filter(p => p.location)
        .map(project => ({
          type: 'Feature' as const,
          properties: { cluster: false, projectId: project.id, ...project },
          geometry: {
            type: 'Point' as const,
            coordinates: [
              project.location.longitude,
              project.location.latitude,
            ],
          },
        }));

      supercluster.current.load(points);
      updateClusters(zoom);
    };

    

    useEffect(() => {
      initializeSupercluster();
    }, [projects]);

    const calculateZoom = (longitudeDelta: number): number => {
      return Math.round(Math.log(360 / longitudeDelta) / Math.LN2);
    };

    const updateClusters = (currentZoom: number) => {
      if (!supercluster.current) return;
      const newClusters = supercluster.current.getClusters(
        [-180, -85, 180, 85],
        Math.floor(currentZoom)
      ) as ClusterFeature[];
      setClusters(newClusters);
    };

    useImperativeHandle(ref, () => ({
      handleRegionChange: (region) => {
        const newZoom = calculateZoom(region.longitudeDelta);
        if (newZoom !== zoom) {
          setZoom(newZoom);
          updateClusters(newZoom);
        }
      }
    }));

    const handleClusterPress = (cluster: ClusterFeature) => {
      if (!cluster.id || !supercluster.current) return;

      const expansionZoom = Math.min(
        supercluster.current.getClusterExpansionZoom(cluster.id),
        20
      );

      const [longitude, latitude] = cluster.geometry.coordinates;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 360 / Math.pow(2, expansionZoom + 1),
        longitudeDelta: 360 / Math.pow(2, expansionZoom + 1),
      };

      mapRef.current?.animateToRegion(newRegion, 1000);
    };

    const renderMarker = (point: ClusterFeature) => {
      const [longitude, latitude] = point.geometry.coordinates;
      
      if (point.properties.cluster) {
        const pointCount = point.properties.point_count || 0;
        return (
          <Marker
            key={`cluster-${point.id}`}
            coordinate={{ latitude, longitude }}
            onPress={() => handleClusterPress(point)}
            tracksViewChanges={false}
          >
            <View style={[
              styles.clusterContainer,
              pointCount < 10 ? styles.smallCluster :
              pointCount < 20 ? styles.mediumCluster :
              styles.largeCluster
            ]}>
              <Text style={styles.clusterText}>{pointCount}</Text>
            </View>
          </Marker>
        );
      }

      return (
        <Marker
          key={`project-${point.properties.projectId}`}
          coordinate={{ latitude, longitude }}
          onPress={() => onMarkerPress(point.properties as Project)}
          tracksViewChanges={false}
        >
          <View style={styles.projectMarker}>
            <Text style={styles.markerText}>📍</Text>
          </View>
        </Marker>
      );
    };

    return (
      <>
        {clusters.map(point => renderMarker(point))}
      </>
    );
  }
);


export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [publicProjects, setPublicProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const mapRef = useRef<MapView>(null);
  const projectMarkersRef = useRef<{ handleRegionChange: (region: Region) => void }>(null);
  const { tasks } = useTasks();
  const { userProjects } = useProjects();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    // Create a query for public projects
    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("isPublic", "==", true));

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projects = [];
        snapshot.forEach((doc) => {
          projects.push({ id: doc.id, ...doc.data() });
        });
        setPublicProjects(projects);
      },
      (error) => {
        console.error("Error listening to public projects:", error);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  const handleJoinProject = async () => {
    if (!selectedProject || !userId) return;
  
    try {
      // Get the current project document
      const projectRef = doc(db, "projects", selectedProject.id);
      
      // Add the current user to the members array if they're not already a member
      await updateDoc(projectRef, {
        members: [...(selectedProject.members || []), userId]
      });
  
      // Close the modal
      setShowProjectDetails(false);
      
      // Show success message
      Alert.alert(
        "Success",
        `You have successfully joined ${selectedProject.projectName}`
      );
    } catch (error) {
      console.error("Error joining project:", error);
      Alert.alert(
        "Error",
        "Failed to join project. Please try again."
      );
    }
  };

  const handleMarkerPress = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const toggleProjectVisibility = async (projectId, currentValue) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        isPublic: !currentValue,
      });
      // No need to call fetchPublicProjects() anymore as the listener will update automatically
    } catch (error) {
      console.error("Error updating project visibility:", error);
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDate}>Due: {item.dueDate}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
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
              { backgroundColor: item.isPublic ? "#4CAF50" : "#FF3B30" },
            ]}
            onPress={() => toggleProjectVisibility(item.id, item.isPublic)}
          >
            <Text style={styles.visibilityButtonText}>
              {item.isPublic ? "🌍 Public" : "🔒 Private"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.projectDescription}>
        {item.description || "No description provided"}
      </Text>
      {item.location && (
        <Text style={styles.locationText}>
          📍 Located at: {item.location.address || "Custom location"}
        </Text>
      )}
      <View style={styles.projectDetails}>
        <View style={styles.memberCount}>
          <Text style={styles.memberCountText}>
            {item.members?.length || 0} members
          </Text>
        </View>
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: item.ownerId === userId ? "#188038" : "#fbbc04",
            },
          ]}
        >
          <Text style={styles.roleText}>
            {item.ownerId === userId ? "Owner" : "Member"}
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
            <Text style={styles.modalTitle}>
              {selectedProject?.projectName}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProjectDetails(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.projectDescription}>
              {selectedProject?.description || "No description provided"}
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

                        {!userProjects.find((p) => p.id === selectedProject?.id) && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinProject}
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
      case "To Do":
        return "#f72a25";
      case "Doing":
        return "#fbbc04";
      case "Done":
        return "#188038";
      default:
        return "#666666";
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
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onRegionChangeComplete={(region) => {
              if (mapRef.current) {
                projectMarkersRef.current?.handleRegionChange(region);
              }
            }}
          >
            {/* User location marker */}
            <Marker
              identifier="user-location"
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              onPress={() => setShowModal(true)}
              tracksViewChanges={false}
            >
              <View style={styles.userMarker}>
                <View style={styles.userDot} />
                <View style={styles.userMarkerTriangle} />
              </View>
              <Callout>
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle}>My Location</Text>
                </View>
              </Callout>
            </Marker>

            <ProjectMarkers
              ref={projectMarkersRef}
              projects={publicProjects}
              onMarkerPress={handleMarkerPress}
              mapRef={mapRef}
            />
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
                My {activeTab === "tasks" ? "Tasks" : "Projects"}
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
                style={[styles.tab, activeTab === "tasks" && styles.activeTab]}
                onPress={() => setActiveTab("tasks")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "tasks" && styles.activeTabText,
                  ]}
                >
                  Tasks
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "projects" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("projects")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "projects" && styles.activeTabText,
                  ]}
                >
                  Projects
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                activeTab === "tasks"
                  ? [...tasks.toDo, ...tasks.doing, ...tasks.done]
                  : userProjects
              }
              renderItem={
                activeTab === "tasks" ? renderTaskItem : renderProjectItem
              }
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No {activeTab} found</Text>
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
    backgroundColor: "#FFF5EC",
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF6F61",
    marginBottom: 20,
    textAlign: "center",
  },

  // Map Styles
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    width: "100%",
    height: "100%",
  },

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE4CC",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FF6F61",
  },

  // Tab Navigation Styles
  tabContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFF5EC",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#FF6F61",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
  },

  // List Item Styles
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: "#FFF5EC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE4CC",
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
    flex: 1,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },

  // Task Item Specific Styles
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 14,
    color: "#666666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  // Project Item Specific Styles
  projectDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
    lineHeight: 20,
  },
  locationText: {
    fontSize: 14,
    color: "#666666",
    marginVertical: 8,
  },
  projectDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  memberCount: {
    backgroundColor: "#FFE4CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    color: "#FF6F61",
    fontSize: 12,
    fontWeight: "500",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  // Visibility Button Styles
  visibilityButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  visibilityButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Project Stats Styles
  projectStats: {
    backgroundColor: "#FFF5EC",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  statsText: {
    fontSize: 14,
    color: "#666666",
    marginVertical: 4,
  },

  // Join Button Styles
  joinButton: {
    backgroundColor: "#FF6F61",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Utility Styles
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666666",
    fontWeight: "300",
  },
  emptyText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 16,
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#f72a25",
    textAlign: "center",
    marginTop: 20,
  },
  projectName: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
  },

  // User Location Marker Styles
  userMarker: {
    alignItems: "center",
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5,
  },
  userMarkerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#4285F4",
    transform: [{ translateY: -1 }],
  },

  // Project Marker Styles
  projectMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  projectMarkerEmoji: {
    fontSize: 40,
    height: 40,
    marginBottom: -8, // Adjust the bottom point of the pin
  },
  memberIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF6F61",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5,
  },

  // Callout Styles
  calloutContent: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#666666",
  },

  // Cluster Marker Styles
  clusterContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallCluster: {
    borderColor: "#FF6F61",
  },
  mediumCluster: {
    borderColor: "#FF8F61",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  largeCluster: {
    borderColor: "#FFA561",
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  clusterText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 2,
  },
  clusterEmoji: {
    fontSize: 16,
  },
  clusterCallout: {
    padding: 8,
    minWidth: 150,
  },

  // Cluster Project List Styles
  clusterProjectsList: {
    padding: 16,
  },
  clusterProjectItem: {
    backgroundColor: "#FFF5EC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE4CC",
  },
  projectInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  projectMembers: {
    fontSize: 14,
    color: "#666666",
  },
  viewButton: {
    backgroundColor: "#FF6F61",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  projectLocation: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  markerText: {
    fontSize: 24,
  },
});
