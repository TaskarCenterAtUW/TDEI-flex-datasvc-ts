import { Request, Response } from "express";
import gtfsFlexController from "../controller/gtfs-flex-controller";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import gtfsFlexService from "../service/gtfs-flex-service";

// group test using describe
describe("POST /api/v1/gtfsflex", () => {

    test("returns list of flex", async () => {

        const mockRequest = {
            url: "http://localhost:8080",
            query: {}
        } as Request;
        let responseObj = {};
        const mockResponse: Partial<Response> = {
            send: jest.fn().mockImplementation((result) => {
                responseObj = result;
            })
        };

        const list: GtfsFlexDTO[] = [new GtfsFlexDTO()]
        const spy = jest
            .spyOn(gtfsFlexService, "getAllGtfsFlex")
            .mockResolvedValueOnce(list);

        await gtfsFlexController.getAllGtfsFlex(mockRequest, mockResponse as Response);
        expect(responseObj).toEqual(list);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});