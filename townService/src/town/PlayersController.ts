import { getDatabase, ref, set, get, child, update } from 'firebase/database';
import Pet, { PetType } from '../lib/Pet';

/*
API Calls to make
 - add a user
 - add a pet
 - update a pet
 - delete a pet
 - 
*/
const db = getDatabase();
export default class PlayersController {
  async addUser(userID: string, username: string, email: string) {
    await set(ref(db, `users/${userID}`), {
      userID,
      username,
      email,
    });
  }

  async addPet(petName: string, petID: string, petType: PetType, ownerID: string) {
    const userPetsRef = ref(db, `users/${ownerID}/pets`);

    // Fetch existing pets
    const snapshot = await get(userPetsRef);

    // If user has other pets, set their isVisible values to false
    if (snapshot.exists()) {
      const existingPets = snapshot.val();
      for (const existingPetID in existingPets) {
        if (Object.prototype.hasOwnProperty.call(existingPets, existingPetID)) {
          const updates: Record<string, boolean> = {};
          updates[`${existingPetID}/currentPet`] = false;
          update(ref(db), updates);
        }
      }
    }

    await set(ref(db, `users/${ownerID}/pets/${petID}`), {
      name: petName,
      type: petType,
      id: petID,
      owner: ownerID,
      health: 100,
      hunger: 100,
      happiness: 100,
      inHospital: false,
      currentPet: true,
    });
  }

  async getPet(userID: string): Promise<Pet | undefined> {
    const userPetsRef = ref(db, `users/${userID}/pets`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const existingPets = snapshot.val();
      for (const existingPetID in existingPets) {
        if (Object.prototype.hasOwnProperty.call(existingPets, existingPetID)) {
          const { pet } = existingPets[existingPetID];
          if (pet.currentPet === true) {
            return new Promise<Pet | undefined>((resolve, reject) => {
              const currentPet = new Pet(
                pet.name,
                pet.type,
                pet.ownerID,
                pet.health,
                pet.hunger,
                pet.happiness,
                pet.inHospital,
                pet.currentPet,
                pet.id,
              );
              resolve(currentPet);
              // Do something with isVisible value
            });
          }
        }
      }
    }
    return undefined;
  }

  async getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined> {
    const petRef = ref(db);
    return new Promise<boolean | undefined>((resolve, reject) => {
      get(child(petRef, `users/${ownerID}/pets/${petID}`))
        .then(snapshot => {
          if (snapshot.exists()) {
            const petData = snapshot.val();
            if (petData.currentPet) {
              const inHospitalValue = petData.inHospital;
              resolve(inHospitalValue);
            } else {
              resolve(false);
            }
          } else {
            resolve(undefined); // or you can reject with an error
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  async changeHappiness(ownerID: string, petID: string, delta: number) {
    const userPetsRef = ref(db, `users/${ownerID}/pets/${petID}`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const petData = snapshot.val();
      if (petData.currentPet) {
        const happinessVal = petData.happiness;
        const updates: Record<string, number> = {};
        updates[`$/happiness`] = happinessVal + delta;
        update(userPetsRef, updates);
      }
    }
  }

  async changeHealth(ownerID: string, petID: string, delta: number) {
    const userPetsRef = ref(db, `users/${ownerID}/pets/${petID}`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      if (petData.currentPet) {
        const healthVal = petData.health;
        const updates: Record<string, number> = {};
        updates[`$/health`] = healthVal + delta;
        update(userPetsRef, updates);
      }
    }
  }

  async changeHunger(ownerID: string, petID: string, delta: number) {
    const userPetsRef = ref(db, `users/${ownerID}/pets/${petID}`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      if (petData.currentPet) {
        const hungerVal = petData.hunger;
        const updates: Record<string, number> = {};
        updates[`$/hunger`] = hungerVal + delta;
        update(userPetsRef, updates);
      }
    }
  }
}
