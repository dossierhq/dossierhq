import type {
  AdminClient,
  AdminEntity,
  AdminExceptionClient,
  EntityReference,
} from '@dossierhq/core';

export type AppAdminClient = AdminClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes
>;

export type AppAdminUniqueIndexes = never;

export type AppAdminEntity =
  | AdminFilm
  | AdminPerson
  | AdminPlanet
  | AdminSpecies
  | AdminStarship
  | AdminTransport
  | AdminVehicle;

export interface AdminFilmFields {
  title: string | null;
  episodeId: number | null;
  director: string | null;
  producers: string[] | null;
  releaseDate: string | null;
  openingCrawl: string | null;
  characters: EntityReference[] | null;
  starships: EntityReference[] | null;
  vehicles: EntityReference[] | null;
  planets: EntityReference[] | null;
  species: EntityReference[] | null;
}

export type AdminFilm = AdminEntity<'Film', AdminFilmFields, ''>;

export function isAdminFilm(entity: AdminEntity<string, object>): entity is AdminFilm {
  return entity.info.type === 'Film';
}

export function assertIsAdminFilm(
  entity: AdminEntity<string, object>,
): asserts entity is AdminFilm {
  if (entity.info.type !== 'Film') {
    throw new Error('Expected info.type = Film (but was ' + entity.info.type + ')');
  }
}

export interface AdminPersonFields {
  name: string | null;
  gender: string | null;
  skinColors: string[] | null;
  hairColors: string[] | null;
  eyeColors: string[] | null;
  height: string | null;
  mass: string | null;
  homeworld: EntityReference | null;
  birthYear: string | null;
}

export type AdminPerson = AdminEntity<'Person', AdminPersonFields, ''>;

export function isAdminPerson(entity: AdminEntity<string, object>): entity is AdminPerson {
  return entity.info.type === 'Person';
}

export function assertIsAdminPerson(
  entity: AdminEntity<string, object>,
): asserts entity is AdminPerson {
  if (entity.info.type !== 'Person') {
    throw new Error('Expected info.type = Person (but was ' + entity.info.type + ')');
  }
}

export interface AdminPlanetFields {
  name: string | null;
  climate: string[] | null;
  surfaceWater: string | null;
  diameter: string | null;
  terrain: string[] | null;
  gravity: string | null;
  rotationPeriod: string | null;
  orbitalPeriod: string | null;
  population: string | null;
}

export type AdminPlanet = AdminEntity<'Planet', AdminPlanetFields, ''>;

export function isAdminPlanet(entity: AdminEntity<string, object>): entity is AdminPlanet {
  return entity.info.type === 'Planet';
}

export function assertIsAdminPlanet(
  entity: AdminEntity<string, object>,
): asserts entity is AdminPlanet {
  if (entity.info.type !== 'Planet') {
    throw new Error('Expected info.type = Planet (but was ' + entity.info.type + ')');
  }
}

export interface AdminSpeciesFields {
  name: string | null;
  classification: string | null;
  designation: string | null;
  skinColors: string[] | null;
  hairColors: string[] | null;
  eyeColors: string[] | null;
  language: string | null;
  averageLifespan: string | null;
  averageHeight: string | null;
  people: EntityReference[] | null;
  homeworld: EntityReference | null;
}

export type AdminSpecies = AdminEntity<'Species', AdminSpeciesFields, ''>;

export function isAdminSpecies(entity: AdminEntity<string, object>): entity is AdminSpecies {
  return entity.info.type === 'Species';
}

export function assertIsAdminSpecies(
  entity: AdminEntity<string, object>,
): asserts entity is AdminSpecies {
  if (entity.info.type !== 'Species') {
    throw new Error('Expected info.type = Species (but was ' + entity.info.type + ')');
  }
}

export interface AdminStarshipFields {
  starshipClass: string | null;
  mglt: string | null;
  hyperdriveRating: string | null;
  pilots: EntityReference[] | null;
}

export type AdminStarship = AdminEntity<'Starship', AdminStarshipFields, ''>;

export function isAdminStarship(entity: AdminEntity<string, object>): entity is AdminStarship {
  return entity.info.type === 'Starship';
}

export function assertIsAdminStarship(
  entity: AdminEntity<string, object>,
): asserts entity is AdminStarship {
  if (entity.info.type !== 'Starship') {
    throw new Error('Expected info.type = Starship (but was ' + entity.info.type + ')');
  }
}

export interface AdminTransportFields {
  name: string | null;
  model: string | null;
  manufacturers: string[] | null;
  consumables: string | null;
  cargoCapacity: string | null;
  crew: string | null;
  passengers: string | null;
  maxAtmospheringSpeed: string | null;
  length: string | null;
  costInCredits: string | null;
}

export type AdminTransport = AdminEntity<'Transport', AdminTransportFields, ''>;

export function isAdminTransport(entity: AdminEntity<string, object>): entity is AdminTransport {
  return entity.info.type === 'Transport';
}

export function assertIsAdminTransport(
  entity: AdminEntity<string, object>,
): asserts entity is AdminTransport {
  if (entity.info.type !== 'Transport') {
    throw new Error('Expected info.type = Transport (but was ' + entity.info.type + ')');
  }
}

export interface AdminVehicleFields {
  vehicleClass: string | null;
  pilots: EntityReference[] | null;
}

export type AdminVehicle = AdminEntity<'Vehicle', AdminVehicleFields, ''>;

export function isAdminVehicle(entity: AdminEntity<string, object>): entity is AdminVehicle {
  return entity.info.type === 'Vehicle';
}

export function assertIsAdminVehicle(
  entity: AdminEntity<string, object>,
): asserts entity is AdminVehicle {
  if (entity.info.type !== 'Vehicle') {
    throw new Error('Expected info.type = Vehicle (but was ' + entity.info.type + ')');
  }
}

export type AppAdminComponent = never;
