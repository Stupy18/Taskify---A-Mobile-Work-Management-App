// import React from "react";
// import {
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { auth, db } from "../FirebaseConfig";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import { router } from "expo-router";
// import { useTheme } from "@react-navigation/native";
// import { doc, setDoc, collection } from "firebase/firestore";

// const Login = () => {
//   const [email, setEmail] = React.useState("");
//   const [password, setPassword] = React.useState("");
//   const [username, setUsername] = React.useState("");
//   const { colors } = useTheme();

//   // Add user to Firestore after sign-up
//   const addUser = async (user) => {
//     try {
//       await setDoc(doc(collection(db, "users"), user.uid), {
//         username: username,
//         email: user.email,
//       });
//       console.log("User added to Firestore");
//     } catch (error) {
//       console.error("Error adding user: ", error);
//     }
//   };

//   // Sign-in function
//   const signIn = async () => {
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;
//       if (user) router.replace("/(tabs)");
//     } catch (error) {
//       console.log(error);
//       alert(error.message);
//     }
//   };

//   // Sign-up function
//   const signUp = async () => {
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       // Add user to Firestore after successful sign-up
//       await addUser(user);
//       if (user) router.replace("/(tabs)");
//     } catch (error) {
//       console.log(error);
//       alert(error.message);
//     }
//   };

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: colors.background }]}
//     >
//       <Text style={[styles.title, { color: colors.text }]}>Login</Text>
//       <TextInput
//         style={[
//           styles.input,
//           {
//             backgroundColor: colors.card,
//             color: colors.text,
//             borderColor: colors.border,
//           },
//         ]}
//         placeholder="Email"
//         placeholderTextColor={colors.border}
//         value={email}
//         onChangeText={(text) => setEmail(text)}
//       />
//       <TextInput
//         style={[
//           styles.input,
//           {
//             backgroundColor: colors.card,
//             color: colors.text,
//             borderColor: colors.border,
//           },
//         ]}
//         placeholder="Password"
//         placeholderTextColor={colors.border}
//         value={password}
//         onChangeText={(text) => setPassword(text)}
//         secureTextEntry
//       />
//       <TextInput
//         style={[
//           styles.input,
//           {
//             backgroundColor: colors.card,
//             color: colors.text,
//             borderColor: colors.border,
//           },
//         ]}
//         placeholder="Username"
//         placeholderTextColor={colors.border}
//         value={username}
//         onChangeText={(text) => setUsername(text)}  // Bind username field
//       />
//       <TouchableOpacity
//         style={[styles.button, { backgroundColor: colors.primary }]}
//         onPress={signIn}
//       >
//         <Text style={styles.buttonText}>Sign In</Text>
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={[styles.button, { backgroundColor: colors.primary }]}
//         onPress={signUp}
//       >
//         <Text style={styles.buttonText}>Sign Up</Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   input: {
//     height: 50,
//     borderRadius: 10,
//     borderWidth: 1,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     fontSize: 16,
//   },
//   button: {
//     height: 50,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   buttonText: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#ffffff",
//   },
// });

// export default Login;
