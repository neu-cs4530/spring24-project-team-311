import { getDatabase, ref, set, get, update, remove } from 'firebase/database';
import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';

export default class PetDatabase extends APetDatabase {
  private _db;

  constructor() {
    super();
    this._db = getDatabase();
  }

  async addUser(
    userID: string,
    username: string,
    loginTime: number,
    location: PlayerLocation,
  ): Promise<void> {
    // if (
    //   userID !== undefined &&
    //   username !== undefined &&
    //   loginTime !== undefined &&
    //   location !== undefined
    // ) {
    await set(ref(this._db, `users/${userID}`), {
      userID,
      username,
      logoutTimeLeft: 0,
      loginTime,
      location,
    });
    // return {
    //   userName: username,
    //   id: userID,
    //   location,
    // };
  }

  async addPet(
    petName: string,
    petID: string,
    petType: PetType,
    ownerID: string,
    location: PlayerLocation,
  ): Promise<boolean> {
    const userRef = ref(this._db, `users/${ownerID}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      // User does not exist, return false
      return false;
    }

    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      return false;
    }

    await set(ref(this._db, `users/${ownerID}/pet`), {
      name: petName,
      type: petType,
      id: petID,
      owner: ownerID,
      health: 100,
      hunger: 100,
      happiness: 100,
      inHospital: false,
      currentPet: true,
      isSick: false,
      location,
    });

    return true;
  }

  async getOrAddPlayer(
    userID: string,
    username: string,
    location: PlayerLocation,
    loginTime: number,
  ): Promise<Player | undefined> {
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
      await this._updateLoginTime(userID, loginTime);
      let existingPlayer: Player = {
        userName: user.userName,
        id: user.userID,
        location,
      };
      const pet: Pet | undefined = await this.getPet(userID);
      if (pet !== undefined) {
        existingPlayer = {
          userName: user.userName,
          id: user.userID,
          location,
          pet,
        };
      }
      return existingPlayer;
    }
    await this.addUser(userID, username, loginTime, location);
    return undefined;
  }

  private async _updateLoginTime(userID: string, loginTime: number): Promise<void> {
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, number> = {};
      updates.loginTime = loginTime;
      update(userRef, updates);
    }
  }

  async getUserLogOutTime(userID: string): Promise<number> {
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
      return user.logoutTimeLeft;
    }
    return 0;
  }

  async setUserLogOutTime(userID: string, logoutTime: number): Promise<void> {
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, number> = {};
      updates.logoutTimeLeft =
        (logoutTime - petData.loginTime - petData.logoutTimeLeft) % (15 * 60 * 1000);
      update(userRef, updates);
    }
  }

  async getPet(userID: string): Promise<Pet | undefined> {
    const userPetRef = ref(this._db, `users/${userID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const { pet } = petData;
      return {
        userName: pet.name,
        type: pet.type,
        ownerID: pet.ownerID,
        health: pet.health,
        hunger: pet.hunger,
        happiness: pet.happiness,
        inHospital: pet.inHospital,
        isSick: pet.isSick,
        id: pet.id,
        location: pet.location,
      };
    }
    return undefined;
  }

  async getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.inHospital;
    }
    return undefined;
  }

  async getSickStatus(ownerID: string, petID: string): Promise<boolean | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.isSick;
    }
    return undefined;
  }

  async getHealth(ownerID: string, petID: string): Promise<number | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.health;
    }
    return undefined;
  }

  async getHappiness(ownerID: string, petID: string): Promise<number | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.happiness;
    }
    return undefined;
  }

  async getHunger(ownerID: string, petID: string): Promise<number | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.hunger;
    }
    return undefined;
  }

  async changeHappiness(ownerID: string, petID: string, delta: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet}`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const petData = snapshot.val();
      const happinessVal = petData.happiness;
      const updates: Record<string, number> = {};
      if (delta > 0) {
        updates.happiness = Math.max(happinessVal + delta, 100);
      } else {
        updates.happiness = Math.min(happinessVal + delta, 0);
      }
      update(userPetsRef, updates);
    }
  }

  async changeHealth(ownerID: string, petID: string, delta: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      if (petData.currentPet) {
        const healthVal = petData.health;
        const updates: Record<string, number> = {};
        if (delta > 0) {
          updates.health = Math.max(healthVal + delta, 100);
        } else {
          updates.health = Math.min(healthVal + delta, 0);
        }
        update(userPetsRef, updates);
      }
    }
  }

  async changeHunger(ownerID: string, petID: string, delta: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const hungerVal = petData.hunger;
      const updates: Record<string, number> = {};
      if (delta > 0) {
        updates.hunger = Math.max(hungerVal + delta, 100);
      } else {
        updates.hunger = Math.min(hungerVal + delta, 0);
      }
      update(userPetsRef, updates);
    }
  }

  async updateHospitalStatus(ownerID: string, petID: string, status: boolean) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, boolean> = {};
      updates.inHospital = status;
      update(userPetsRef, updates);
    }
  }

  async updateSickStatus(ownerID: string, petID: string, status: boolean) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, boolean> = {};
      updates.isSick = status;
      update(userPetsRef, updates);
    }
  }

  async deletePet(ownerID: string, petID: string) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    await remove(userPetsRef);
  }

  async changeOwner(currentOwner: string, newOwner: string, petID: string) {
    const userPetsRef = ref(this._db, `users/${currentOwner}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      this.addPet(petData.name, petID, petData.type, newOwner, petData.location);
      this.deletePet(currentOwner, petID);
    }
  }
}
