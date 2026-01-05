import { db } from "../../../firebase.config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const collectionRef = collection(db, "habitaciones");

export const subscribeToHabitaciones = (callback) => {
  const q = query(collectionRef, orderBy("numero"));

  return onSnapshot(q, (snapshot) => {
    const habitaciones = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(habitaciones);
  });
};
