import { AdminClient, AdminSchemaSpecificationUpdate, FieldType } from '@jonasb/datadata-core';
import { fetchJsonCached } from '../utils/fetchUtils';
import { createAdapterAndServer, createDatabase, exportDatabase } from '../utils/shared-generator';
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = 'b0a4c16c-8feb-4a68-9d43-98f96719eee5';

const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'Film',
      fields: [
        { name: 'title', type: FieldType.String, required: true },
        {
          name: 'characters',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Person'],
          required: true,
        },
        {
          name: 'starships',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Starship'],
          required: true,
        },
        {
          name: 'vehicles',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Vehicle'],
          required: true,
        },
        {
          name: 'planets',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Planet'],
          required: true,
        },
        {
          name: 'species',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Species'],
          required: true,
        },
      ],
    },
    {
      name: 'Person',
      fields: [
        { name: 'name', type: FieldType.String, required: true },
        { name: 'homeworld', type: FieldType.EntityType, entityTypes: ['Planet'], required: true },
      ],
    },
    {
      name: 'Planet',
      fields: [
        { name: 'name', type: FieldType.String, required: true },
        { name: 'climate', type: FieldType.String, list: true, required: true },
      ],
    },
    {
      name: 'Species',
      fields: [
        { name: 'name', type: FieldType.String, required: true },
        { name: 'people', type: FieldType.EntityType, list: true, entityTypes: ['Person'] },
        { name: 'homeworld', type: FieldType.EntityType, entityTypes: ['Planet'] },
      ],
    },
    {
      name: 'Starship',
      fields: [
        { name: 'starshipClass', type: FieldType.String, required: true },
        { name: 'pilots', type: FieldType.EntityType, list: true, entityTypes: ['Person'] },
      ],
    },
    {
      name: 'Transport',
      fields: [{ name: 'name', type: FieldType.String, required: true }],
    },
    {
      name: 'Vehicle',
      fields: [
        { name: 'vehicleClass', type: FieldType.String, required: true },
        { name: 'pilots', type: FieldType.EntityType, list: true, entityTypes: ['Person'] },
      ],
    },
  ],
};

async function downloadFile(filename: string) {
  return await fetchJsonCached(
    `https://raw.githubusercontent.com/Juriy/swapi/master/resources/fixtures/${filename}`,
    `cache/starwars/${filename}`
  );
}

type IdType = 'film' | 'planet' | 'person' | 'species' | 'starship' | 'transport' | 'vehicle';

function uuidForEntity(type: IdType, pk: number) {
  if (typeof pk !== 'number') throw new Error(`pk is not a number (${pk})`);
  return uuidv5(`${type}:${pk}`, UUID_NAMESPACE);
}

function uuidReferences(type: IdType, ids: number[]) {
  return ids.map((id) => ({ id: uuidForEntity(type, id) }));
}

function splitCsv(value: string) {
  return value.trim().split(/\s*,\s*/);
}

async function createFilms(adminClient: AdminClient) {
  const filmsData = await downloadFile('films.json');
  for (const film of filmsData) {
    (
      await adminClient.createEntity(
        {
          id: uuidForEntity('film', film.pk),
          info: { type: 'Film', authKey: 'none', name: film.fields.title },
          fields: {
            title: film.fields.title,
            characters: uuidReferences('person', film.fields.characters),
            starships: uuidReferences('starship', film.fields.starships),
            vehicles: uuidReferences('vehicle', film.fields.vehicles),
            planets: uuidReferences('planet', film.fields.planets),
            species: uuidReferences('species', film.fields.species),
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createPeople(adminClient: AdminClient) {
  const peopleData = await downloadFile('people.json');
  for (const person of peopleData) {
    (
      await adminClient.createEntity(
        {
          id: uuidForEntity('person', person.pk),
          info: { type: 'Person', authKey: 'none', name: person.fields.name },
          fields: {
            name: person.fields.name,
            homeworld: { id: uuidForEntity('planet', person.fields.homeworld) },
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createPlanets(adminClient: AdminClient) {
  const planetsData = await downloadFile('planets.json');
  for (const planet of planetsData) {
    (
      await adminClient.createEntity(
        {
          id: uuidForEntity('planet', planet.pk),
          info: { type: 'Planet', authKey: 'none', name: planet.fields.name },
          fields: { name: planet.fields.name, climate: splitCsv(planet.fields.climate) },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createSpecies(adminClient: AdminClient) {
  const speciesData = await downloadFile('species.json');
  for (const species of speciesData) {
    (
      await adminClient.createEntity(
        {
          id: uuidForEntity('species', species.pk),
          info: { type: 'Species', authKey: 'none', name: species.fields.name },
          fields: {
            name: species.fields.name,
            people: uuidReferences('person', species.fields.people),
            homeworld: species.fields.homeworld
              ? { id: uuidForEntity('planet', species.fields.homeworld) }
              : null,
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createStarships(adminClient: AdminClient) {
  const starshipsData = await downloadFile('starships.json');
  for (const starship of starshipsData) {
    (
      await adminClient.createEntity(
        {
          id: uuidForEntity('starship', starship.pk),
          info: { type: 'Starship', authKey: 'none', name: starship.fields.starship_class },
          fields: {
            starshipClass: starship.fields.starship_class,
            pilots: uuidReferences('person', starship.fields.pilots),
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createTransports(adminClient: AdminClient) {
  const transportsData = await downloadFile('transport.json');
  for (const transport of transportsData) {
    (
      await adminClient.createEntity(
        {
          id: uuidForEntity('transport', transport.pk),
          info: { type: 'Transport', authKey: 'none', name: transport.fields.name },
          fields: {
            name: transport.fields.name,
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createVehicles(adminClient: AdminClient) {
  const vehiclesData = await downloadFile('vehicles.json');
  for (const vehicle of vehiclesData) {
    (
      await adminClient.createEntity(
        {
          id: uuidForEntity('vehicle', vehicle.pk),
          info: { type: 'Vehicle', authKey: 'none', name: vehicle.fields.vehicle_class },
          fields: {
            vehicleClass: vehicle.fields.vehicle_class,
            pilots: uuidReferences('person', vehicle.fields.pilots),
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function main() {
  const database = await createDatabase();
  const { adminClient } = await createAdapterAndServer(database, SCHEMA);

  // order is due to references between entities
  await createPlanets(adminClient);
  await createPeople(adminClient);
  await createSpecies(adminClient);
  await createTransports(adminClient);
  await createStarships(adminClient);
  await createVehicles(adminClient);
  await createFilms(adminClient);

  await exportDatabase(database, 'dist/starwars.sqlite');
  database.close();
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
