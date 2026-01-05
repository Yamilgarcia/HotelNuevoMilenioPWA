import { db } from "../../../firebase.config";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

const collectionRef = collection(db, "habitaciones");

export const createHabitacion = async (habitacion) => {
  return await addDoc(collectionRef, {
    ...habitacion,
    activo: true,
    estado: "Libre",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateHabitacion = async (id, data) => {
  const docRef = doc(db, "habitaciones", id);
  return await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};
