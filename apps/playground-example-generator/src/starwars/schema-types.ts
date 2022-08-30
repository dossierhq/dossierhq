import type { AdminEntity, EntityReference } from '@jonasb/datadata-core';

export interface AdminFilmFields {
  title: string | null;
  episodeId: string | null;
  director: string | null;
  producers: Array<string> | null;
  releaseDate: string | null;
  openingCrawl: string | null;
  characters: Array<EntityReference> | null;
  starships: Array<EntityReference> | null;
  vehicles: Array<EntityReference> | null;
  planets: Array<EntityReference> | null;
  species: Array<EntityReference> | null;
}

export type AdminFilm = AdminEntity<'Film', AdminFilmFields>;

export function isAdminFilm(entity: AdminEntity | AdminFilm): entity is AdminFilm {
  return entity.info.type === 'Film';
}

export function assertIsAdminFilm(entity: AdminEntity | AdminFilm): asserts entity is AdminFilm {
  if (entity.info.type !== 'Film') {
    throw new Error('Expected info.type = Film (but was ' + entity.info.type + ')');
  }
}

export interface AdminPersonFields {
  name: string | null;
  gender: string | null;
  skinColors: Array<string> | null;
  hairColors: Array<string> | null;
  eyeColors: Array<string> | null;
  height: string | null;
  mass: string | null;
  homeworld: EntityReference | null;
  birthYear: string | null;
}

export type AdminPerson = AdminEntity<'Person', AdminPersonFields>;

export function isAdminPerson(entity: AdminEntity | AdminPerson): entity is AdminPerson {
  return entity.info.type === 'Person';
}

export function assertIsAdminPerson(
  entity: AdminEntity | AdminPerson
): asserts entity is AdminPerson {
  if (entity.info.type !== 'Person') {
    throw new Error('Expected info.type = Person (but was ' + entity.info.type + ')');
  }
}

export interface AdminPlanetFields {
  name: string | null;
  climate: Array<string> | null;
  surfaceWater: string | null;
  diameter: string | null;
  terrain: Array<string> | null;
  gravity: string | null;
  rotationPeriod: string | null;
  orbitalPeriod: string | null;
  population: string | null;
}

export type AdminPlanet = AdminEntity<'Planet', AdminPlanetFields>;

export function isAdminPlanet(entity: AdminEntity | AdminPlanet): entity is AdminPlanet {
  return entity.info.type === 'Planet';
}

export function assertIsAdminPlanet(
  entity: AdminEntity | AdminPlanet
): asserts entity is AdminPlanet {
  if (entity.info.type !== 'Planet') {
    throw new Error('Expected info.type = Planet (but was ' + entity.info.type + ')');
  }
}

export interface AdminSpeciesFields {
  name: string | null;
  classification: string | null;
  designation: string | null;
  skinColors: Array<string> | null;
  hairColors: Array<string> | null;
  eyeColors: Array<string> | null;
  language: string | null;
  averageLifespan: string | null;
  averageHeight: string | null;
  people: Array<EntityReference> | null;
  homeworld: EntityReference | null;
}

export type AdminSpecies = AdminEntity<'Species', AdminSpeciesFields>;

export function isAdminSpecies(entity: AdminEntity | AdminSpecies): entity is AdminSpecies {
  return entity.info.type === 'Species';
}

export function assertIsAdminSpecies(
  entity: AdminEntity | AdminSpecies
): asserts entity is AdminSpecies {
  if (entity.info.type !== 'Species') {
    throw new Error('Expected info.type = Species (but was ' + entity.info.type + ')');
  }
}

export interface AdminStarshipFields {
  starshipClass: string | null;
  mglt: string | null;
  hyperdriveRating: string | null;
  pilots: Array<EntityReference> | null;
}

export type AdminStarship = AdminEntity<'Starship', AdminStarshipFields>;

export function isAdminStarship(entity: AdminEntity | AdminStarship): entity is AdminStarship {
  return entity.info.type === 'Starship';
}

export function assertIsAdminStarship(
  entity: AdminEntity | AdminStarship
): asserts entity is AdminStarship {
  if (entity.info.type !== 'Starship') {
    throw new Error('Expected info.type = Starship (but was ' + entity.info.type + ')');
  }
}

export interface AdminTransportFields {
  name: string | null;
  model: string | null;
  manufacturers: Array<string> | null;
  consumables: string | null;
  cargoCapacity: string | null;
  crew: string | null;
  passengers: string | null;
  maxAtmospheringSpeed: string | null;
  length: string | null;
  costInCredits: string | null;
}

export type AdminTransport = AdminEntity<'Transport', AdminTransportFields>;

export function isAdminTransport(entity: AdminEntity | AdminTransport): entity is AdminTransport {
  return entity.info.type === 'Transport';
}

export function assertIsAdminTransport(
  entity: AdminEntity | AdminTransport
): asserts entity is AdminTransport {
  if (entity.info.type !== 'Transport') {
    throw new Error('Expected info.type = Transport (but was ' + entity.info.type + ')');
  }
}

export interface AdminVehicleFields {
  vehicleClass: string | null;
  pilots: Array<EntityReference> | null;
}

export type AdminVehicle = AdminEntity<'Vehicle', AdminVehicleFields>;

export function isAdminVehicle(entity: AdminEntity | AdminVehicle): entity is AdminVehicle {
  return entity.info.type === 'Vehicle';
}

export function assertIsAdminVehicle(
  entity: AdminEntity | AdminVehicle
): asserts entity is AdminVehicle {
  if (entity.info.type !== 'Vehicle') {
    throw new Error('Expected info.type = Vehicle (but was ' + entity.info.type + ')');
  }
}

export type AllAdminValueItems = never;
