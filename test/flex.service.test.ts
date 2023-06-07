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
describe("Flex Service Test", () => {
    describe("Get all Flex", () => {
        describe("Functional", () => {
            test("When requested with empty search filters, Expect to return flex list", async () => {
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

            test("When requested with all search filters, Expect to return flex list", async () => {
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

            test("When requested with invalid date search filter, Expect to throw InputException", async () => {
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

            test("When requested with invalid bbox search filter, Expect to throw InputException", async () => {
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
    });

    describe("Get Flex version by Id", () => {
        describe("Functional", () => {
            test("When requested for get Flex version by tdei_record_id, Expect to return FileEntity object", async () => {
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

            test("When requested for get Flex version with invalid tdei_record_id, Expect to throw HttpException", async () => {
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

            test("When Core failed obtaing storage client, Expect to throw error", async () => {
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
    });

    describe("Create Flex version", () => {
        describe("Functional", () => {
            test("When requested for creating Flex version with valid input, Expect to return GtfsFlexDTO object", async () => {
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

            test("When database exception with duplicate tdei_org_id occured while processing request, Expect to throw DuplicateException", async () => {
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

            test("When database exception occured while processing request, Expect to throw error", async () => {
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
    });

    describe("Get Service Id", () => {
        describe("Functional", () => {
            test("When requested, Expect to return service details", async () => {
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

            test("When external service get call fails unexpected, Expect to throw error", async () => {
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

            test("When requested invalid service id, Expect to throw error", async () => {
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

            test("When external service get call fails with 400 HTTP status, Expect to throw error", async () => {
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
});


