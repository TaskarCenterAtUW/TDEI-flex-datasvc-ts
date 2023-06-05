import { QueryResult } from "pg";
import flexDbClient from "../src/database/flex-data-source";
import flexService from "../src/service/gtfs-flex-service";
import { TdeiObjectFaker } from "./common/tdei-object-faker";
import { FlexQueryParams } from "../src/model/gtfs-flex-get-query-params";
import { GtfsFlexDTO } from "../src/model/gtfs-flex-dto";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { mockCore, mockUtility } from "./common/mock-utils";
import { FlexVersions } from "../src/database/entity/flex-version-entity";
import UniqueKeyDbException from "../src/exceptions/db/database-exceptions";
import { DuplicateException, InputException } from "../src/exceptions/http/http-exceptions";
import HttpException from "../src/exceptions/http/http-base-exception";
import { Core } from "nodets-ms-core";
import { ServiceDto } from "../src/model/service-dto";
import fetchMock from "jest-fetch-mock";
// group test using describe
describe("FLEX Service Test", () => {
    describe("Get all FLEX", () => {
        test("When requested for [GET] FLEX files with empty search filters, expect to return list", async () => {
            //Arrange
            var flexObj = TdeiObjectFaker.getGtfsFlexVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    flexObj
                ]
            };
            const getAllGtfsFlexSpy = jest
                .spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: FlexQueryParams = new FlexQueryParams();
            //Act
            var result = await flexService.getAllGtfsFlex(params);
            //Assert
            expect(Array.isArray(result));
            expect(result.every(item => item instanceof GtfsFlexDTO));
        });

        test("When requested for [GET] FLEX files with all search filters, expect to return list", async () => {
            //Arrange
            var flexObj = TdeiObjectFaker.getGtfsFlexVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    flexObj
                ]
            };
            const getAllGtfsFlexSpy = jest
                .spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: FlexQueryParams = new FlexQueryParams();
            params.page_no = 1;
            params.page_size = 10;
            params.date_time = "03-03-2023";
            params.tdei_org_id = "test_id";
            params.tdei_record_id = "test_id";
            params.tdei_org_id = "test_id";
            params.flex_schema_version = "v2.0";
            params.bbox = [1, 2, 3, 4]
            //Act
            var result = await flexService.getAllGtfsFlex(params);
            //Assert
            expect(Array.isArray(result));
            expect(result.every(item => item instanceof GtfsFlexDTO));
        });

        test("When requested for [GET] FLEX files with invalid date search filter, expect to return list", async () => {
            //Arrange
            var flexObj = TdeiObjectFaker.getGtfsFlexVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    flexObj
                ]
            };
            const getAllGtfsFlexSpy = jest
                .spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: FlexQueryParams = new FlexQueryParams();
            params.page_no = 1;
            params.page_size = 10;
            params.date_time = "13-13-2023";
            params.tdei_org_id = "test_id";
            params.tdei_record_id = "test_id";
            params.tdei_org_id = "test_id";
            params.flex_schema_version = "v2.0";
            params.bbox = [1, 2, 3, 4]
            //Act
            //Assert
            expect(flexService.getAllGtfsFlex(params)).rejects.toThrow(InputException);
        });

        test("When requested for [GET] FLEX files with invalid bbox search filter, expect to return list", async () => {
            //Arrange
            var flexObj = TdeiObjectFaker.getGtfsFlexVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    flexObj
                ]
            };
            const getAllGtfsFlexSpy = jest
                .spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: FlexQueryParams = new FlexQueryParams();
            params.page_no = 1;
            params.page_size = 10;
            params.date_time = "03-03-2023";
            params.tdei_org_id = "test_id";
            params.tdei_record_id = "test_id";
            params.tdei_org_id = "test_id";
            params.flex_schema_version = "v2.0";
            params.bbox = [1, 2]
            //Act
            //Assert
            expect(flexService.getAllGtfsFlex(params)).rejects.toThrow(InputException);
        });
    });

    describe("Get FLEX version by Id", () => {
        test("When requested for get FLEX version by tdei_record_id, expect to return FileEntity object", async () => {
            //Arrange
            var flexObj = TdeiObjectFaker.getGtfsFlexVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    {
                        file_upload_path: "test_path"
                    }
                ]
            };

            mockCore();
            jest.spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);

            //Act
            var result = await flexService.getGtfsFlexById("tdei_record_id");
            //Assert
            expect(result instanceof FileEntity);
        });

        test("When requested for get FLEX version with invalid tdei_record_id, expect to return error", async () => {
            //Arrange
            var flexObj = TdeiObjectFaker.getGtfsFlexVersionFromDB();
            const dummyResponse = <QueryResult<any>><unknown>{
                rows: [],
                rowCount: 0
            };

            mockCore();
            jest.spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);

            //Act
            //Assert
            expect(flexService.getGtfsFlexById("tdei_record_id")).rejects.toThrow(HttpException);
        });

        test("When Core failed obtaing storage client, expect to return error", async () => {
            //Arrange
            var flexObj = TdeiObjectFaker.getGtfsFlexVersionFromDB();
            const dummyResponse = <QueryResult<any>><unknown>{
                rows: [
                    {
                        file_upload_path: "test_path"
                    }
                ]
            };

            mockCore();
            //Overrride getStorageClient mock
            jest.spyOn(Core, "getStorageClient").mockImplementation(() => { return null; }
            );
            jest.spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);

            //Act
            //Assert
            expect(flexService.getGtfsFlexById("tdei_record_id")).rejects.toThrow();
        });
    });

    describe("Create FLEX version", () => {
        test("When requested for creating FLEX version with valid object, expect to return GtfsFlexDTO object", async () => {
            //Arrange
            var flexObj = FlexVersions.from(TdeiObjectFaker.getGtfsFlexVersion());

            const insertFlexResponse = <QueryResult<any>>{
                rows: [
                    flexObj
                ]
            };

            const overlapResponse = <QueryResult<any>>{
                rowCount: 0
            };

            jest.spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(overlapResponse)//first call getOverlapQuery
                .mockResolvedValueOnce(insertFlexResponse);//Second Insert flex version
            jest.spyOn(flexService as any, "getServiceById")
                .mockResolvedValueOnce(new ServiceDto());

            //Act
            var result = await flexService.createGtfsFlex(flexObj);
            //Assert
            expect(result instanceof GtfsFlexDTO);
        });

        test("When database exception with duplicate tdei_org_id occured while processing request, expect to return error", async () => {
            //Arrange
            var flexObj = FlexVersions.from(TdeiObjectFaker.getGtfsFlexVersion());

            const overlapResponse = <QueryResult<any>>{
                rowCount: 0
            };

            jest.spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(overlapResponse)//first call getOverlapQuery
                .mockRejectedValueOnce(new UniqueKeyDbException("Unique contraint error"));//Second Insert flex version
            jest.spyOn(flexService as any, "getServiceById")
                .mockResolvedValueOnce(new ServiceDto());

            //Act
            //Assert
            expect(flexService.createGtfsFlex(flexObj)).rejects.toThrow(DuplicateException);
        });

        test("When database exception occured while processing request, expect to return error", async () => {
            //Arrange
            var flexObj = FlexVersions.from(TdeiObjectFaker.getGtfsFlexVersion());

            const dummyResponse = <QueryResult<any>>{
                rows: [
                    flexObj
                ]
            };

            const overlapResponse = <QueryResult<any>>{
                rowCount: 0
            };

            jest.spyOn(flexDbClient, "query")
                .mockResolvedValueOnce(overlapResponse)//first call getOverlapQuery
                .mockRejectedValueOnce(new Error("Unknown Error"));//Second Insert flex version
            jest.spyOn(flexService as any, "getServiceById")
                .mockResolvedValueOnce(new ServiceDto());

            //Act
            //Assert
            expect(flexService.createGtfsFlex(flexObj)).rejects.toThrow();
        });
    });

    describe("Get Service Id", () => {
        test("When requested, expect to return service details", async () => {
            //Arrange
            fetchMock.mockResolvedValueOnce(Promise.resolve(<any>{
                status: 200,
                json: () => Promise.resolve([<ServiceDto>{
                    service_name: "test_service"
                }]),
            }));
            mockUtility();
            //Act
            var result = await flexService.getServiceById("test_service_id", "test_org_id");
            //Assert
            expect(result instanceof ServiceDto);
        });

        test("When requested & service call error, expect to return error", async () => {
            //Arrange
            fetchMock.mockRejectedValueOnce(Promise.resolve(<any>{
                status: 400,
                json: () => Promise.resolve({ "error": "Error fetching results." }),
            }));
            mockUtility();
            //Act
            //var result = await flexService.getServiceById("test_service_id", "test_org_id");
            //Assert
            await expect(flexService.getServiceById("test_service_id", "test_org_id")).rejects.toThrowError();
        });

        test("When requested & empty response, expect to return error", async () => {
            //Arrange
            fetchMock.mockResolvedValueOnce(Promise.resolve(<any>{
                status: 200,
                json: () => Promise.resolve([]),
            }));
            mockUtility();
            //Act
            //Assert
            await expect(flexService.getServiceById("test_service_id", "test_org_id")).rejects.toThrowError();
        });

        test("When requested & HTTP status not 200, expect to return error", async () => {
            //Arrange
            fetchMock.mockResolvedValueOnce(Promise.resolve(<any>{
                status: 400,
                json: () => Promise.resolve([]),
            }));
            mockUtility();
            //Act
            //Assert
            await expect(flexService.getServiceById("test_service_id", "test_org_id")).rejects.toThrowError();
        });
    });
});


