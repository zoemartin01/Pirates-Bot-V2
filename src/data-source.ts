import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { AutoResponse } from "./entity/autoresponse";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  logging: true,
  entities: [AutoResponse],
  subscribers: [],
  migrations: [],
});

AppDataSource.initialize()
  .then(() => {
    // here you can start to work with your database
  })
  .catch((error) => console.log(error));
