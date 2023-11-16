// Test for upload metadata
import { validate } from "class-validator";
import { GtfsFlexUploadMeta } from "../src/model/gtfs-flex-upload-meta";
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
describe('GTFS Flex Upload metadata test', () => {
    describe('Unit tests', () => {

        test('When supplied without collected by, meta validation should fail', async () => {
            const meta = `{
                "tdei_project_group_id":"5e339544-3b12-40a5-8acd-78c66d1fa981",
                "tdei_service_id":"333",
                "collected_by":"",
                "collection_date":"2023-03-02T04:22:42.493Z",
                "collection_method":"manual",
                "valid_from":"2023-03-02T04:22:42.493Z",
                "valid_to":"2023-03-02T04:22:42.493Z",
                "data_source":"TDEITools",
                "polygon":{
                    "type":"FeatureCollection",
                    "features":[
                        {
                            "type":"Feature",
                            "properties":{},
                            "geometry":{
                                "coordinates":[
                                    [[-122.16214567229673,47.674335369752754],[-122.16214567229673,47.66421552524781],[-122.14711788984943,47.66421552524781],[-122.14711788984943,47.674335369752754],[-122.16214567229673,47.674335369752754]]],
                                    "type":"Polygon"
                                }
                            }]},
                "flex_schema_version":"v2.0"}`

            const gtfsdto = GtfsFlexUploadMeta.from(JSON.parse(meta));
            await expect(validate(gtfsdto)).resolves.toHaveLength(1);
        })

        test('Test JWT', async () => {
            const token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItblZQcnZCMnQ5aDZsNzdYbXlEY3ZJN0NXaDMyNVROdnpaNGdhaE5RNFJVIn0.eyJleHAiOjE2OTA3OTAyMjEsImlhdCI6MTY5MDc4OTUwMSwianRpIjoiNmMyMzQyODQtOTBkNy00MDEzLTlmNTMtZjc2MzFlZjQzZjhhIiwiaXNzIjoiaHR0cHM6Ly90ZGVpLWtleWNsb2FrLmF6dXJld2Vic2l0ZXMubmV0L3JlYWxtcy90ZGVpIiwic3ViIjoiYzU5ZDI5YjYtYTA2My00MjQ5LTk0M2YtZDMyMGQxNWFjOWFiIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidGRlaS1nYXRld2F5Iiwic2Vzc2lvbl9zdGF0ZSI6ImVhNjEwNmEwLTVhMjctNDBjNi1hODNiLTEzZDk0MGE4ZTE1MCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiIiwiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsidGRlaS1hZG1pbiIsImRlZmF1bHQtcm9sZXMtdGRlaSJdfSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwic2lkIjoiZWE2MTA2YTAtNWEyNy00MGM2LWE4M2ItMTNkOTQwYThlMTUwIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluQHRkZWkuY29tIiwiZ2l2ZW5fbmFtZSI6IiIsImZhbWlseV9uYW1lIjoiIiwiZW1haWwiOiJhZG1pbkB0ZGVpLmNvbSJ9.XEg9xZNH8Y0BjQrebtZQC7YUGbsnc7i49r2p3m6-KHRDxIWuH3P_MElK9hkbP2qoBWT54OcgvhP4xZ-GJ2Wpom3ot36-RA_rD5CQX933qt8riXjo9h0IEtbdihgoDnRcy0ysr4c60oGIR9b7iv-UhvK2_HiC5TUIWe4VA_4rPuIEpz1P_-bFidyvQxTx7zkfsV1SwcnKfxQoPLTQZs0Sy8p37jeGS50nHrtkNcohsR_8S-HGkWNYssOh2vPYbzzDBCpPgChlWx1pnGSoWJzvqQto-pri7D_fE6hbNZbhm_NchqsAO_jv67RWBW0vl4EJ6ZMDdovw6jBnFm0uFxvfsA";
            const exploded = jwt.decode(token);
            // console.log(exploded?.sub);
            expect(exploded?.sub).toBe('c59d29b6-a063-4249-943f-d320d15ac9ab');

        })
    })


})