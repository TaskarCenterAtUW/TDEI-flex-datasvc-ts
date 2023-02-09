import { Request, Response } from "express";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsFlexController from "../controller/gtfs-flex-controller";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import gtfsFlexService from "../service/gtfs-flex-service";

// group test using describe
describe("GTFS Flex listing", () => {

    it("Should return list of flex", async () => {
        const mockRequest = {
            query: {}
        } as Request;
        let responseObj: any = {};
        const mockResponse: Partial<Response> = {
            send: jest.fn().mockImplementation((result) => {
                responseObj = result;
            })
        };

        const list: GtfsFlexDTO[] = [GtfsFlexDTO.from({
            tdei_org_id: '101',
            tdei_service_id: '201',
            tdei_record_id: '301'
        })];
        let next = jest.fn();
        const spy = jest
            .spyOn(gtfsFlexService, "getAllGtfsFlex")
            .mockResolvedValueOnce(list);

        await gtfsFlexController.getAllGtfsFlex(mockRequest, mockResponse as Response, next);
        expect(responseObj[0].tdei_org_id).toEqual(list[0].tdei_org_id);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});

describe("Create GTFS Flex", () => {
    test("Returns newly created GTFS Flex object", async () => {
        const mockRequest = {
            query: {}
        } as Request;
        let responseObj: any = {};
        const mockResponse: Partial<Response> = {
            send: jest.fn().mockImplementation((result: FileEntity) => {
                responseObj = result;
            })
        };

        let obj: GtfsFlexDTO = <GtfsFlexDTO>{
            tdei_record_id: "101",
            tdei_org_id: "201"
        };

        let next = jest.fn();
        const spy = jest
            .spyOn(gtfsFlexService, "createAGtfsFlex")
            .mockResolvedValueOnce(Promise.resolve(obj));

        await gtfsFlexController.createAGtfsFlex(mockRequest, mockResponse as Response, next);
        expect(responseObj.tdei_record_id).toEqual(obj.tdei_record_id);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});

describe("Get GTFS Flex file", () => {
    test("Returns GTFS Flex file stream", async () => {
        const mockRequest = {
            url: "http://localhost/api/v1/gtfsflex",
            params: { "id": "101" },
            query: {}
        } as unknown as Request;
        let responseStatus: any = {};

        const mockResponse: Partial<Response> = {
            header: jest.fn(),
            status: jest.fn().mockImplementation((result: number) => {
                responseStatus = result;
            }),
        };

        const mockReadStream = { pipe: jest.fn() };
        let fileEntity: FileEntity = <FileEntity><unknown>{
            fileName: "test",
            mimeType: "zip",
            filePath: "/test",
            upload: {},
            getStream: jest.fn().mockReturnValueOnce(mockReadStream),
            getBodyText: {}
        };

        let next = jest.fn();
        const spy = jest
            .spyOn(gtfsFlexService, "getGtfsFlexById")
            .mockImplementation(id => { return Promise.resolve(fileEntity) });

        await gtfsFlexController.getGtfsFlexById(mockRequest, mockResponse as Response, next);
        expect(responseStatus).toEqual(200);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});