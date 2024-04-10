import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { TownEmitter } from '../types/CoveyTownSocket';
import MockPetDatabase from './MockPetDatabase';
import PetsController from './PetsController';
import { PetCreateParams } from '../api/Model';

describe('PetsController', () => {
  let mockDB: MockPetDatabase;
  let controller: PetsController;
  let newPlayer: Player;

  beforeEach(() => {
    mockDB = new MockPetDatabase();
    controller = new PetsController(mockDB);
    newPlayer = new Player(nanoid(), nanoid(), mock<TownEmitter>());
    mockDB.addUser(newPlayer.id, newPlayer.userName);
  });

  describe('createNewPet Tests', () => {
    it('Creates a Pet for a newPlayer', async () => {
      const request: PetCreateParams = {
        petName: 'mockPet',
        petID: nanoid(),
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(request);
      const foundPet = mockDB._pets.find(p => p.ownerID === newPlayer.id);
      expect(foundPet?.id).toEqual(request.petID);
    });

    it('Attempts to create a pet for an already existing player. Duplicate Pets are not added', async () => {
      const request: PetCreateParams = {
        petName: 'mockPet',
        petID: nanoid(),
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(request);
      const foundPet = mockDB._pets.find(p => p.ownerID === newPlayer.id);
      expect(foundPet?.id).toEqual(request.petID);

      const newRequest: PetCreateParams = {
        petName: 'mockPet2',
        petID: request.petID,
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(newRequest);
      const filteredPet = mockDB._pets.filter(p => p.ownerID === newPlayer.id);
      expect(filteredPet.length).toEqual(1);
      const foundSamePet = mockDB._pets.find(p => p.ownerID === newPlayer.id);
      expect(foundSamePet?.userName).toEqual('mockPet');
    });
    it('Attempts to create a pet for an already existing player. Duplicate Pets are not added, Duplicate Pets are considered to be those with same OwnerID and PetID', async () => {
      const request: PetCreateParams = {
        petName: 'mockPet',
        petID: nanoid(),
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(request);
      const foundPet = mockDB._pets.find(p => p.ownerID === newPlayer.id);
      expect(foundPet?.id).toEqual(request.petID);

      const newRequest: PetCreateParams = {
        petName: 'mockPet2',
        petID: nanoid(),
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(newRequest);
      const filteredPet = mockDB._pets.filter(p => p.ownerID === newPlayer.id);
      expect(filteredPet.length).toEqual(2);
    });
  });

  describe('updateStats Tests', () => {
    it('updates statistics for a pet, given all of the correct updates, userID, and petID', async () => {
      const request: PetCreateParams = {
        petName: 'mockPet',
        petID: nanoid(),
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(request);
      const foundPet = mockDB._pets.find(p => p.ownerID === newPlayer.id && p.id === request.petID);
      expect(foundPet?.health).toEqual(50);
      expect(foundPet?.hunger).toEqual(50);
      expect(foundPet?.happiness).toEqual(50);
      expect(foundPet?.inHospital).toEqual(false);

      await controller.updateStats(newPlayer.id, request.petID, {
        health: 20,
        hospital: true,
        hunger: 20,
        happiness: 20,
      });

      const foundSamePet = mockDB._pets.find(
        p => p.ownerID === newPlayer.id && p.id === request.petID,
      );

      expect(foundSamePet?.health).toEqual(20);
      expect(foundSamePet?.hunger).toEqual(20);
      expect(foundSamePet?.happiness).toEqual(20);
      expect(foundSamePet?.inHospital).toEqual(true);
    });

    it('updates statistics for a pet, given correct updates and userID, but incorrect petID', async () => {
      const request: PetCreateParams = {
        petName: 'mockPet',
        petID: nanoid(),
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(request);
      const foundPet = mockDB._pets.find(p => p.ownerID === newPlayer.id && p.id === request.petID);
      expect(foundPet?.health).toEqual(50);
      expect(foundPet?.hunger).toEqual(50);
      expect(foundPet?.happiness).toEqual(50);
      expect(foundPet?.inHospital).toEqual(false);

      await controller.updateStats(newPlayer.id, nanoid(), {
        health: 20,
        hospital: true,
        hunger: 20,
        happiness: 20,
      });

      const foundSamePet = mockDB._pets.find(
        p => p.ownerID === newPlayer.id && p.id === request.petID,
      );

      expect(foundSamePet?.health).toEqual(50);
      expect(foundSamePet?.hunger).toEqual(50);
      expect(foundSamePet?.happiness).toEqual(50);
      expect(foundSamePet?.inHospital).toEqual(false);
    });
    it('updates statistics for a pet, given correct updates and petID, but incorrect userID', async () => {
      const request: PetCreateParams = {
        petName: 'mockPet',
        petID: nanoid(),
        ownerID: newPlayer.toPlayerModel(),
        type: 'Cat',
        location: newPlayer.location,
      };
      await controller.createNewPet(request);
      const foundPet = mockDB._pets.find(p => p.ownerID === newPlayer.id && p.id === request.petID);
      expect(foundPet?.health).toEqual(50);
      expect(foundPet?.hunger).toEqual(50);
      expect(foundPet?.happiness).toEqual(50);
      expect(foundPet?.inHospital).toEqual(false);

      await controller.updateStats(nanoid(), request.petID, {
        health: 20,
        hospital: true,
        hunger: 20,
        happiness: 20,
      });

      const foundSamePet = mockDB._pets.find(
        p => p.ownerID === newPlayer.id && p.id === request.petID,
      );

      expect(foundSamePet?.health).toEqual(50);
      expect(foundSamePet?.hunger).toEqual(50);
      expect(foundSamePet?.happiness).toEqual(50);
      expect(foundSamePet?.inHospital).toEqual(false);
    });
  });

  describe('updateLogIn Tests', () => {
    it('update logInTime for user', async () => {
      const currPlayer = mockDB._players.find(player => player.player.id === newPlayer.id);
      if (currPlayer) {
        const prevTime = currPlayer.loginTime;
        await controller.userLogIn(newPlayer.id);
        const currTime = currPlayer.loginTime;
        expect(currTime).toBeGreaterThan(prevTime);
      }
    });
  });
  describe('updateLogOut Tests', () => {
    it('update logOutTime for user', async () => {
      const currPlayer = mockDB._players.find(player => player.player.id === newPlayer.id);
      if (currPlayer) {
        const prevTime = currPlayer.logoutTimeLeft;
        await controller.userLogOut(newPlayer.id);
        const currTime = currPlayer.logoutTimeLeft;
        expect(currTime).toBeLessThan(15 * 60 * 1000);
      }
    });
  });

  describe('updateLocation Tests', () => {
    it('update location for user, correct userID', async () => {
      const currPlayer = mockDB._players.find(player => player.player.id === newPlayer.id);
      if (currPlayer) {
        expect(currPlayer.location).toEqual(newPlayer.location);
        const newLocation = {
          x: newPlayer.location.x + 1,
          y: newPlayer.location.y + 1,
          rotation: newPlayer.location.rotation,
          moving: newPlayer.location.moving,
          interactableID: newPlayer.location.interactableID,
        };
        await controller.updateLocation(newPlayer.id, newLocation);
        expect(currPlayer.location).toEqual(newLocation);
      }
    });
    it('update location for user, incorrect userID', async () => {
      const currPlayer = mockDB._players.find(player => player.player.id === newPlayer.id);
      if (currPlayer) {
        expect(currPlayer.location).toEqual(newPlayer.location);
        const newLocation = {
          x: newPlayer.location.x + 1,
          y: newPlayer.location.y + 1,
          rotation: newPlayer.location.rotation,
          moving: newPlayer.location.moving,
          interactableID: newPlayer.location.interactableID,
        };
        await controller.updateLocation(nanoid(), newLocation);
        expect(currPlayer.location).toEqual(newPlayer.location);
      }
    });
  });
});
