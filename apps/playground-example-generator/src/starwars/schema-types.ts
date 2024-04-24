import type {
  DossierClient,
  DossierExceptionClient,
  Entity,
  EntityReference,
} from '@dossierhq/core';

export type AppAdminClient = DossierClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = DossierExceptionClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes
>;

export type AppUniqueIndexes = never;

export type AppEntity = Film | Person | Planet | Species | Starship | Transport | Vehicle;

export interface FilmFields {
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

export type Film = Entity<'Film', FilmFields, ''>;

export function isFilm(entity: Entity<string, object>): entity is Film {
  return entity.info.type === 'Film';
}

export function assertIsFilm(entity: Entity<string, object>): asserts entity is Film {
  if (entity.info.type !== 'Film') {
    throw new Error('Expected info.type = Film (but was ' + entity.info.type + ')');
  }
}

export interface PersonFields {
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

export type Person = Entity<'Person', PersonFields, ''>;

export function isPerson(entity: Entity<string, object>): entity is Person {
  return entity.info.type === 'Person';
}

export function assertIsPerson(entity: Entity<string, object>): asserts entity is Person {
  if (entity.info.type !== 'Person') {
    throw new Error('Expected info.type = Person (but was ' + entity.info.type + ')');
  }
}

export interface PlanetFields {
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

export type Planet = Entity<'Planet', PlanetFields, ''>;

export function isPlanet(entity: Entity<string, object>): entity is Planet {
  return entity.info.type === 'Planet';
}

export function assertIsPlanet(entity: Entity<string, object>): asserts entity is Planet {
  if (entity.info.type !== 'Planet') {
    throw new Error('Expected info.type = Planet (but was ' + entity.info.type + ')');
  }
}

export interface SpeciesFields {
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

export type Species = Entity<'Species', SpeciesFields, ''>;

export function isSpecies(entity: Entity<string, object>): entity is Species {
  return entity.info.type === 'Species';
}

export function assertIsSpecies(entity: Entity<string, object>): asserts entity is Species {
  if (entity.info.type !== 'Species') {
    throw new Error('Expected info.type = Species (but was ' + entity.info.type + ')');
  }
}

export interface StarshipFields {
  starshipClass: string | null;
  mglt: string | null;
  hyperdriveRating: string | null;
  pilots: EntityReference[] | null;
}

export type Starship = Entity<'Starship', StarshipFields, ''>;

export function isStarship(entity: Entity<string, object>): entity is Starship {
  return entity.info.type === 'Starship';
}

export function assertIsStarship(entity: Entity<string, object>): asserts entity is Starship {
  if (entity.info.type !== 'Starship') {
    throw new Error('Expected info.type = Starship (but was ' + entity.info.type + ')');
  }
}

export interface TransportFields {
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

export type Transport = Entity<'Transport', TransportFields, ''>;

export function isTransport(entity: Entity<string, object>): entity is Transport {
  return entity.info.type === 'Transport';
}

export function assertIsTransport(entity: Entity<string, object>): asserts entity is Transport {
  if (entity.info.type !== 'Transport') {
    throw new Error('Expected info.type = Transport (but was ' + entity.info.type + ')');
  }
}

export interface VehicleFields {
  vehicleClass: string | null;
  pilots: EntityReference[] | null;
}

export type Vehicle = Entity<'Vehicle', VehicleFields, ''>;

export function isVehicle(entity: Entity<string, object>): entity is Vehicle {
  return entity.info.type === 'Vehicle';
}

export function assertIsVehicle(entity: Entity<string, object>): asserts entity is Vehicle {
  if (entity.info.type !== 'Vehicle') {
    throw new Error('Expected info.type = Vehicle (but was ' + entity.info.type + ')');
  }
}

export type AppComponent = never;
