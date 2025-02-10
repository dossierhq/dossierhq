import { v5 as uuidv5 } from 'uuid';
import { fetchJsonCached } from '../utils/fetchUtils.js';
import {
  createAdapterAndServer,
  createNewDatabase,
  optimizeAndCloseDatabase,
} from '../utils/shared-generator.js';
import type {
  AppDossierClient,
  Film,
  Person,
  Planet,
  Species,
  Starship,
  Transport,
  Vehicle,
} from './schema-types.js';
import { SCHEMA } from './schema.js';

const UUID_NAMESPACE = 'b0a4c16c-8feb-4a68-9d43-98f96719eee5';

type StarwarsFilms = {
  pk: number;
  model: string;
  fields: {
    starships: number[];
    edited: string;
    vehicles: number[];
    planets: number[];
    producer: string;
    title: string;
    created: string;
    episode_id: number;
    director: string;
    release_date: string;
    opening_crawl: string;
    characters: number[];
    species: number[];
  };
}[];

type StarwarsPeople = {
  pk: number;
  model: string;
  fields: {
    edited: string;
    name: string;
    created: string;
    gender: string;
    skin_color: string;
    hair_color: string;
    height: string;
    eye_color: string;
    mass: string;
    homeworld: number;
    birth_year: string;
  };
}[];

type StarwarsPlanets = {
  pk: number;
  model: string;
  fields: {
    edited: string;
    climate: string;
    surface_water: string;
    name: string;
    diameter: string;
    rotation_period: string;
    created: string;
    terrain: string;
    gravity: string;
    orbital_period: string;
    population: string;
  };
}[];

type StarwarsSpecies = {
  pk: number;
  model: string;
  fields: {
    edited: string;
    classification: string;
    name: string;
    designation: string;
    created: string;
    eye_colors: string;
    people: number[];
    skin_colors: string;
    language: string;
    hair_colors: string;
    homeworld?: number;
    average_lifespan: string;
    average_height: string;
  };
}[];

type StarwarsStarships = {
  pk: number;
  model: string;
  fields: {
    pilots: number[];
    MGLT: string;
    starship_class: string;
    hyperdrive_rating: string;
  };
}[];

type StarwarsTransport = {
  pk: number;
  model: string;
  fields: {
    edited: string;
    consumables: string;
    name: string;
    created: string;
    cargo_capacity: string;
    passengers: string;
    max_atmosphering_speed: string;
    crew: string;
    length: string;
    model: string;
    cost_in_credits: string;
    manufacturer: string;
  };
}[];

type StarwarsVehicles = {
  pk: number;
  model: string;
  fields: {
    vehicle_class: string;
    pilots: number[];
  };
}[];

async function downloadFile<T>(filename: string) {
  return await fetchJsonCached<T>(
    `https://raw.githubusercontent.com/Juriy/swapi/master/resources/fixtures/${filename}`,
    `cache/starwars/${filename}`,
  );
}

type IdType = 'film' | 'planet' | 'person' | 'species' | 'starship' | 'transport' | 'vehicle';

function uuidForEntity(type: IdType, pk: number) {
  return uuidv5(`${type}:${pk}`, UUID_NAMESPACE);
}

function uuidReferences(type: IdType, ids: number[]) {
  return ids.map((id) => ({ id: uuidForEntity(type, id) }));
}

function splitCsv(value: string) {
  return value.trim().split(/\s*,\s*/);
}

async function createFilms(client: AppDossierClient) {
  const filmsData = await downloadFile<StarwarsFilms>('films.json');
  for (const film of filmsData) {
    (
      await client.createEntity<Film>(
        {
          id: uuidForEntity('film', film.pk),
          info: { type: 'Film', name: film.fields.title },
          fields: {
            title: film.fields.title,
            episodeId: film.fields.episode_id,
            director: film.fields.director,
            producers: splitCsv(film.fields.producer),
            releaseDate: film.fields.release_date,
            openingCrawl: film.fields.opening_crawl.replace(/\r\n/g, '\n'),
            characters: uuidReferences('person', film.fields.characters),
            starships: uuidReferences('starship', film.fields.starships),
            vehicles: uuidReferences('vehicle', film.fields.vehicles),
            planets: uuidReferences('planet', film.fields.planets),
            species: uuidReferences('species', film.fields.species),
          },
        },
        { publish: true },
      )
    ).throwIfError();
  }
}

async function createPeople(client: AppDossierClient) {
  const peopleData = await downloadFile<StarwarsPeople>('people.json');
  for (const person of peopleData) {
    (
      await client.createEntity<Person>(
        {
          id: uuidForEntity('person', person.pk),
          info: { type: 'Person', name: person.fields.name },
          fields: {
            name: person.fields.name,
            gender: person.fields.gender,
            skinColors: splitCsv(person.fields.skin_color),
            hairColors: splitCsv(person.fields.hair_color),
            eyeColors: splitCsv(person.fields.eye_color),
            height: person.fields.height,
            mass: person.fields.mass,
            homeworld: { id: uuidForEntity('planet', person.fields.homeworld) },
            birthYear: person.fields.birth_year,
          },
        },
        { publish: true },
      )
    ).throwIfError();
  }
}

async function createPlanets(client: AppDossierClient) {
  const planetsData = await downloadFile<StarwarsPlanets>('planets.json');
  for (const planet of planetsData) {
    (
      await client.createEntity<Planet>(
        {
          id: uuidForEntity('planet', planet.pk),
          info: { type: 'Planet', name: planet.fields.name },
          fields: {
            name: planet.fields.name,
            climate: splitCsv(planet.fields.climate),
            surfaceWater: planet.fields.surface_water,
            diameter: planet.fields.diameter,
            terrain: splitCsv(planet.fields.terrain),
            gravity: planet.fields.gravity,
            rotationPeriod: planet.fields.rotation_period,
            orbitalPeriod: planet.fields.orbital_period,
            population: planet.fields.population,
          },
        },
        { publish: true },
      )
    ).throwIfError();
  }
}

async function createSpecies(client: AppDossierClient) {
  const speciesData = await downloadFile<StarwarsSpecies>('species.json');
  for (const species of speciesData) {
    (
      await client.createEntity<Species>(
        {
          id: uuidForEntity('species', species.pk),
          info: { type: 'Species', name: species.fields.name },
          fields: {
            name: species.fields.name,
            classification: species.fields.classification,
            designation: species.fields.designation,
            skinColors: splitCsv(species.fields.skin_colors),
            hairColors: splitCsv(species.fields.hair_colors),
            eyeColors: splitCsv(species.fields.eye_colors),
            language: species.fields.language,
            averageLifespan: species.fields.average_lifespan,
            averageHeight: species.fields.average_height,
            people: uuidReferences('person', species.fields.people),
            homeworld: species.fields.homeworld
              ? { id: uuidForEntity('planet', species.fields.homeworld) }
              : null,
          },
        },
        { publish: true },
      )
    ).throwIfError();
  }
}

async function createStarships(client: AppDossierClient) {
  const starshipsData = await downloadFile<StarwarsStarships>('starships.json');
  for (const starship of starshipsData) {
    (
      await client.createEntity<Starship>(
        {
          id: uuidForEntity('starship', starship.pk),
          info: { type: 'Starship', name: starship.fields.starship_class },
          fields: {
            starshipClass: starship.fields.starship_class,
            mglt: starship.fields.MGLT,
            hyperdriveRating: starship.fields.hyperdrive_rating,
            pilots: uuidReferences('person', starship.fields.pilots),
          },
        },
        { publish: true },
      )
    ).throwIfError();
  }
}

async function createTransports(client: AppDossierClient) {
  const transportsData = await downloadFile<StarwarsTransport>('transport.json');
  for (const transport of transportsData) {
    (
      await client.createEntity<Transport>(
        {
          id: uuidForEntity('transport', transport.pk),
          info: { type: 'Transport', name: transport.fields.name },
          fields: {
            name: transport.fields.name,
            model: transport.fields.model,
            manufacturers: splitCsv(transport.fields.manufacturer),
            consumables: transport.fields.consumables,
            cargoCapacity: transport.fields.cargo_capacity,
            crew: transport.fields.crew,
            passengers: transport.fields.passengers,
            maxAtmospheringSpeed: transport.fields.max_atmosphering_speed,
            length: transport.fields.length,
            costInCredits: transport.fields.cost_in_credits,
          },
        },
        { publish: true },
      )
    ).throwIfError();
  }
}

async function createVehicles(client: AppDossierClient) {
  const vehiclesData = await downloadFile<StarwarsVehicles>('vehicles.json');
  for (const vehicle of vehiclesData) {
    (
      await client.createEntity<Vehicle>(
        {
          id: uuidForEntity('vehicle', vehicle.pk),
          info: { type: 'Vehicle', name: vehicle.fields.vehicle_class },
          fields: {
            vehicleClass: vehicle.fields.vehicle_class,
            pilots: uuidReferences('person', vehicle.fields.pilots),
          },
        },
        { publish: true },
      )
    ).throwIfError();
  }
}

async function main() {
  const database = await createNewDatabase('dist/starwars.sqlite');
  const { client, server } = await createAdapterAndServer<AppDossierClient>(database, SCHEMA);

  // order is due to references between entities
  await createPlanets(client);
  await createPeople(client);
  await createSpecies(client);
  await createTransports(client);
  await createStarships(client);
  await createVehicles(client);
  await createFilms(client);

  await optimizeAndCloseDatabase(server);
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
