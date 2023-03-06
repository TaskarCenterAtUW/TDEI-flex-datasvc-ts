# Introduction 
Data service (micro-service) helps the TDEI system to query information specific to the GTFS flex.

# Getting Started
The project is built on top of NodeJS framework. All the regular nuances for a NodeJS project are valid for this.

## System requirements
| Software | Version|
|----|---|
| NodeJS | 16.17.0|
| Typescript | 4.8.2 |

### Local setup
Step 1: 
```docker compose up from root directory```

#### Build and Test
Follow the steps to install the node packages required for both building and running the application

1. Install the dependencies. Run the following command in terminal on the same directory as `package.json`
    ```shell
    npm install
    ```
2. To start the server, use the command `npm run start`
3. The http server by default starts with 8080 port or whatever is declared in `process.env.APPLICATION_PORT` (look at `index.ts` for more details)
4. A `ping` with get and post. Make `get` or `post` request to `http://localhost:8080/health/ping`

### Connectivity to cloud
- Connecting this to cloud will need `.env` file with environment variables mentioned below.


### Environment variables
|Name| Description |
|--|--|
| PROVIDER | Provider for cloud service or local |
|QUEUECONNECTION | Queue connection string |
|STORAGECONNECTION | Storage connection string|
|APPLICATION_PORT |Port on which application will run|
|VALIDATION_SUBSCRIPTION | Upload topic subscription name|
|VALIDATION_TOPIC | Validation topic name|
|EVENT_BUS_CONNECTION | Event bus connection string|
|AUTH_PERMISSION_URL | Authentication/Authorization url|
|DATASVC_TOPIC | Data service publishing topic|



