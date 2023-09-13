import dotenv from 'dotenv';
dotenv.config();
/**
 * Contains all the configurations required for setting up the core project
 * While most of the parameters are optional, appInsights connection is 
 * a required parameter since it is auto imported in the `tdei_logger.ts`
 */
export const environment = {
    appName: process.env.npm_package_name,
    eventBus: {
        connectionString: process.env.QUEUECONNECTION,
        validationTopic: process.env.VALIDATION_TOPIC,
        validationSubscription: process.env.VALIDATION_SUBSCRIPTION,
        dataServiceTopic: process.env.DATASVC_TOPIC,
    },
    database: {
        server_username: process.env.POSTGRES_USER,
        server_host: process.env.POSTGRES_HOST,
        server_password: process.env.POSTGRES_PASSWORD,
        flex_database: process.env.POSTGRES_DB,
        ssl: Boolean(process.env.SSL),
        server_port: parseInt(process.env.POSTGRES_PORT ?? "5432"),
    },
    appPort: parseInt(process.env.PORT ?? "8080"),
    authPermissionUrl: process.env.AUTH_HOST + '/api/v1/hasPermission',
    serviceUrl: process.env.SERVICE_URL,
    secretGenerateUrl: process.env.AUTH_HOST + '/api/v1/generateSecret',
    secretVerifyUrl: process.env.AUTH_HOST + '/api/v1/validateSecret',
    getewayUrl: process.env.GATEWAY_URL
}