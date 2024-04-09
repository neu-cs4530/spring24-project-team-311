import { getDatabase, ref, set, get, update, remove } from 'firebase/database';
import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';

export default class PetDatabase extends APetDatabase {
  async updateLocation(userID: string, location: PlayerLocation): Promise<void> {
    let newLocation = location;

    if (!location.interactableID) {
      newLocation = {
        x: location.x,
        y: location.y,
        rotation: location.rotation,
        moving: location.moving,
        interactableID: 'unknown',
      };
    }

    const uesrRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(uesrRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, PlayerLocation> = {};
      updates.location = newLocation;
      update(uesrRef, updates);
    }

    const userPetsRef = ref(this._db, `users/${userID}/pet`);
    const snapshotPet = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshotPet.val();
      const updates: Record<string, PlayerLocation> = {};
      updates.location = newLocation;
      update(userPetsRef, updates);
    }
  }

  private _db;

  constructor() {
    super();
    this._db = getDatabase();
  }

  async addUser(userID: string, username: string, location: PlayerLocation): Promise<void> {
    let newLocation = location;

    if (!location.interactableID) {
      newLocation = {
        x: location.x,
        y: location.y,
        rotation: location.rotation,
        moving: location.moving,
        interactableID: 'unknown',
      };
    }

    await set(ref(this._db, `users/${userID}`), {
      userID,
      username,
      logoutTimeLeft: 0,
      loginTime: 0,
      newLocation,
    });
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
      return false;
    }

    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      return false;
    }

    let newLocation = location;

    if (!location.interactableID) {
      newLocation = {
        x: location.x,
        y: location.y,
        rotation: location.rotation,
        moving: location.moving,
        interactableID: 'unknown',
      };
    }

    await set(ref(this._db, `users/${ownerID}/pet`), {
      name: petName,
      type: petType,
      id: petID,
      owner: ownerID,
      health: 50,
      hunger: 50,
      happiness: 50,
      inHospital: false,
      currentPet: true,
      isSick: false,
      newLocation,
    });

    return true;
  }

  async getOrAddPlayer(
    userID: string,
    username: string,
    location: PlayerLocation,
  ): Promise<Player | undefined> {
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
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
    await this.addUser(userID, username, location);
    return undefined;
  }

  async setUserLoginTime(userID: string, loginTime: number): Promise<void> {
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
      return {
        userName: petData.name,
        type: petData.type,
        ownerID: petData.ownerID,
        health: petData.health,
        hunger: petData.hunger,
        happiness: petData.happiness,
        inHospital: petData.inHospital,
        isSick: petData.isSick,
        id: petData.id,
        location: petData.location,
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

  async changeHappiness(ownerID: string, petID: string, happinessVal: number) {
    console.log(`Change Happiness called for: ${ownerID}`);
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      console.log('Console Exists');
      const petData = snapshot.val();
      const updates: Record<string, number> = {};
      updates.happiness = happinessVal;
      await update(userPetsRef, updates);
      const updatedSnapshot = await get(userPetsRef);
      const updatedPetData = updatedSnapshot.val();
      console.log(`Updated DB Happiness: ${updatedPetData.happiness}`);
    }
  }

  async changeHealth(ownerID: string, petID: string, healthVal: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, number> = {};
      updates.health = healthVal;
      update(userPetsRef, updates);
    }
  }

  async changeHunger(ownerID: string, petID: string, hungerVal: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, number> = {};
      updates.hunger = hungerVal;
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
