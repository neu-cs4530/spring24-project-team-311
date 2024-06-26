import { getDatabase, ref, set, get, child, update, remove } from 'firebase/database';
import Pet from '../lib/Pet';
import { PetType } from '../types/CoveyTownSocket';

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
    const snapshot = await get(userPetsRef);
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
            resolve(undefined);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  async getHealth(ownerID: string, petID: string): Promise<number | undefined> {
    const petRef = ref(db);
    return new Promise<number | undefined>((resolve, reject) => {
      get(child(petRef, `users/${ownerID}/pets/${petID}`))
        .then(snapshot => {
          if (snapshot.exists()) {
            const petData = snapshot.val();
            if (petData.currentPet) {
              resolve(petData.health);
            } else {
              resolve(100);
            }
          } else {
            resolve(undefined);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  async getHappiness(ownerID: string, petID: string): Promise<number | undefined> {
    const petRef = ref(db);
    return new Promise<number | undefined>((resolve, reject) => {
      get(child(petRef, `users/${ownerID}/pets/${petID}`))
        .then(snapshot => {
          if (snapshot.exists()) {
            const petData = snapshot.val();
            if (petData.currentPet) {
              resolve(petData.happiness);
            } else {
              resolve(100);
            }
          } else {
            resolve(undefined);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  async getHunger(ownerID: string, petID: string): Promise<number | undefined> {
    const petRef = ref(db);
    return new Promise<number | undefined>((resolve, reject) => {
      get(child(petRef, `users/${ownerID}/pets/${petID}`))
        .then(snapshot => {
          if (snapshot.exists()) {
            const petData = snapshot.val();
            if (petData.currentPet) {
              resolve(petData.hunger);
            } else {
              resolve(100);
            }
          } else {
            resolve(undefined);
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
        if (delta > 0) {
          updates[`$/happiness`] = Math.max(happinessVal + delta, 100);
        } else {
          updates[`$/happiness`] = Math.min(happinessVal + delta, 0);
        }
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
        if (delta > 0) {
          updates[`$/health`] = Math.max(healthVal + delta, 100);
        } else {
          updates[`$/health`] = Math.min(healthVal + delta, 0);
        }
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
        if (delta > 0) {
          updates[`$/hunger`] = Math.max(hungerVal + delta, 100);
        } else {
          updates[`$/hunger`] = Math.min(hungerVal + delta, 0);
        }
        update(userPetsRef, updates);
      }
    }
  }

  async deletePet(ownerID: string, petID: string) {
    const userPetsRef = ref(db, `users/${ownerID}/pets/${petID}`);
    await remove(userPetsRef);
  }

  async changeOwner(currentOwner: string, newOwner: string, petID: string) {
    const userPetsRef = ref(db, `users/${currentOwner}/pets/${petID}`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      this.addPet(petData.name, petID, petData.type, newOwner);
      this.deletePet(currentOwner, petID);
    }
  }
}
