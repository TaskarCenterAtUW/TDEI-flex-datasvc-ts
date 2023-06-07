import { Pool, PoolClient, QueryConfig, QueryResult } from 'pg';
import { PostgresError } from '../constants/pg-error-constants';
import { environment } from '../environment/environment';
import UniqueKeyDbException, { ForeignKeyDbException } from '../exceptions/db/database-exceptions';

class FlexDataSource {
    private pool: Pool = new Pool;

    constructor() {
    }

    public initializaDatabase() {
        console.info("Initializing Flex database !");
        this.pool = new Pool({
            database: environment.database.flex_database,
            host: environment.database.server_host,
            user: environment.database.server_username,
            password: environment.database.server_password,
            ssl: environment.database.ssl,
            port: environment.database.server_port
        });

        this.pool.on('error', function (err: Error, _client: any) {
            console.log(`Flex : Idle-Client Error:\n${err.message}\n${err.stack}`);
        }).on('connect', () => {
            console.log("Flex Database initialized successfully !");
        });
    }

    /**
     * Async Query
     * @param sqlText 
     * @param params 
     * @returns 
     */
    async query(queryTextOrConfig: string | QueryConfig<any[]>, params: any[] = []): Promise<QueryResult<any>> {
        const client = await this.pool.connect();
        try {
            if (queryTextOrConfig instanceof String) {
                const result = await client.query(queryTextOrConfig, params);
                return result;
            }
            else {
                const result = await client.query(queryTextOrConfig);
                return result;
            }

        } catch (e: any) {

            switch (e.code) {
                case PostgresError.UNIQUE_VIOLATION:
                    throw new UniqueKeyDbException("Duplicate");
                case PostgresError.FOREIGN_KEY_VIOLATION:
                    throw new ForeignKeyDbException(e.constraint);
                default:
                    break;
            }

            throw e;
        } finally {
            client.release();
        }
    }
}

const flexDbClient = new FlexDataSource();
export default flexDbClient;