import gtfsFlexController from "../src/controller/gtfs-flex-controller";
import { GtfsFlexDTO } from "../src/model/gtfs-flex-dto";
import gtfsFlexService from "../src/service/gtfs-flex-service";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { TdeiObjectFaker } from "./common/tdei-object-faker";
import HttpException from "../src/exceptions/http/http-base-exception";
import { DuplicateException, InputException } from "../src/exceptions/http/http-exceptions";
import { getMockFileEntity } from "./common/mock-utils";

// group test using describe
describe("Flex API Controller Test", () => {

    describe("Get all Flex versions", () => {
        test("When requested with empty search criteria, expect to return list", async () => {
            //Arrange
            let req = getMockReq();
            const { res, next } = getMockRes();
            const list: GtfsFlexDTO[] = [<GtfsFlexDTO>{}]
            const getAllGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "getAllGtfsFlex")
                .mockResolvedValueOnce(list);
            //Act
            await gtfsFlexController.getAllGtfsFlex(req, res, next);
            //Assert
            expect(getAllGtfsFlexSpy).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toBeCalledWith(list);
        });

        test("When requested with bad input, expect to return error", async () => {
            //Arrange
            let req = getMockReq({ body: { collection_date: "2023" } });
            const { res, next } = getMockRes();
            const getAllGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "getAllGtfsFlex")
                .mockRejectedValueOnce(new InputException("Invalid date provided."));
            //Act
            await gtfsFlexController.getAllGtfsFlex(req, res, next);
            //Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).toHaveBeenCalled();
        });

        test("When unknown or database exception occured while processing request, expect to return error", async () => {
            //Arrange
            let req = getMockReq({ body: { collection_date: "2023" } });
            const { res, next } = getMockRes();
            const getAllGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "getAllGtfsFlex")
                .mockRejectedValueOnce(new Error("unknown error"));
            //Act
            await gtfsFlexController.getAllGtfsFlex(req, res, next);
            //Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("Get Flex file by Id", () => {
        test("When requested for valid tdei_record_id, expect to return downloadable file stream", async () => {
            //Arrange
            let req = getMockReq();
            const { res, next } = getMockRes();

            const getGtfsFlexByIdSpy = jest
                .spyOn(gtfsFlexService, "getGtfsFlexById")
                .mockResolvedValueOnce(getMockFileEntity());
            //Act
            await gtfsFlexController.getGtfsFlexById(req, res, next);
            //Assert
            expect(getGtfsFlexByIdSpy).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("When requested for invalid tdei_record_id, expect to return error", async () => {
            //Arrange
            let req = getMockReq();
            const { res, next } = getMockRes();

            const getGtfsFlexByIdSpy = jest
                .spyOn(gtfsFlexService, "getGtfsFlexById")
                .mockRejectedValueOnce(new HttpException(500, "DB Error"));
            //Act
            await gtfsFlexController.getGtfsFlexById(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When unexpected error occured while processing request, expect to return error", async () => {
            //Arrange
            let req = getMockReq();
            const { res, next } = getMockRes();

            const getGtfsFlexByIdSpy = jest
                .spyOn(gtfsFlexService, "getGtfsFlexById")
                .mockRejectedValueOnce(new Error("Unexpected error"));
            //Act
            await gtfsFlexController.getGtfsFlexById(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("Create Flex version", () => {

        test("When valid input provided, expect to return tdei_record_id for new record", async () => {
            //Arrange
            let req = getMockReq({ body: TdeiObjectFaker.getGtfsFlexVersion() });
            const { res, next } = getMockRes();
            var dummyResponse = <GtfsFlexDTO>{
                tdei_record_id: "test_record_id"
            };
            const createGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "createGtfsFlex")
                .mockResolvedValueOnce(dummyResponse);
            //Act
            await gtfsFlexController.createGtfsFlex(req, res, next);
            //Assert
            expect(createGtfsFlexSpy).toHaveBeenCalledTimes(1);
            expect(res.status).toBeCalledWith(200);
            expect(res.send).toBeCalledWith(dummyResponse);
        });

        test("When provided null body, expect to return error", async () => {
            //Arrange
            let req = getMockReq({ body: null });
            const { res, next } = getMockRes();
            var dummyResponse = <GtfsFlexDTO>{
                tdei_record_id: "test_record_id"
            };
            const createGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "createGtfsFlex")
                .mockResolvedValueOnce(dummyResponse);
            //Act
            await gtfsFlexController.createGtfsFlex(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When provided body with empty tdei_org_id, expect to return error", async () => {
            //Arrange
            let flexObject = TdeiObjectFaker.getGtfsFlexVersion();
            flexObject.tdei_org_id = "";
            let req = getMockReq({ body: flexObject });
            const { res, next } = getMockRes();
            var dummyResponse = <GtfsFlexDTO>{
                tdei_record_id: "test_record_id"
            };
            const createGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "createGtfsFlex")
                .mockRejectedValueOnce(dummyResponse);
            //Act
            await gtfsFlexController.createGtfsFlex(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When provided body with invalid polygon, expect to return error", async () => {
            //Arrange
            let flexObject = TdeiObjectFaker.getGtfsFlexVersion();
            flexObject.polygon = TdeiObjectFaker.getInvalidPolygon();
            let req = getMockReq({ body: flexObject });
            const { res, next } = getMockRes();
            //Act
            await gtfsFlexController.createGtfsFlex(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When database exception occured while processing request, expect to return error", async () => {
            //Arrange
            let flexObject = TdeiObjectFaker.getGtfsFlexVersion();
            let req = getMockReq({ body: flexObject });
            const { res, next } = getMockRes();

            const createGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "createGtfsFlex")
                .mockRejectedValueOnce(new Error("Unknown error"));
            //Act
            await gtfsFlexController.createGtfsFlex(req, res, next);
            //Assert
            expect(createGtfsFlexSpy).toHaveBeenCalledTimes(1);
            expect(res.status).toBeCalledWith(500);
        });

        test("When database exception with duplicate tdei_org_id occured while processing request, expect to return error", async () => {
            //Arrange
            let flexObject = TdeiObjectFaker.getGtfsFlexVersion();
            let req = getMockReq({ body: flexObject });
            const { res, next } = getMockRes();

            const createGtfsFlexSpy = jest
                .spyOn(gtfsFlexService, "createGtfsFlex")
                .mockRejectedValueOnce(new DuplicateException("test_record_id"));
            //Act
            await gtfsFlexController.createGtfsFlex(req, res, next);
            //Assert
            expect(createGtfsFlexSpy).toHaveBeenCalledTimes(1);
            expect(res.status).toBeCalledWith(400);
        });
    });
});