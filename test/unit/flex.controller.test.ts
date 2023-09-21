import gtfsFlexController from "../../src/controller/gtfs-flex-controller";
import { GtfsFlexDTO } from "../../src/model/gtfs-flex-dto";
import gtfsFlexService from "../../src/service/gtfs-flex-service";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { TdeiObjectFaker } from "../common/tdei-object-faker";
import HttpException from "../../src/exceptions/http/http-base-exception";
import { DuplicateException, InputException, OverlapException } from "../../src/exceptions/http/http-exceptions";
import { getMockFileEntity, mockCore, mockMulter } from "../common/mock-utils";
import storageService from "../../src/service/storage-service";



// group test using describe
describe("Flex Controller Test", () => {

    describe("Get Flex list", () => {
        describe("Functional", () => {
            test("When requested with empty search criteria, Expect to return flex list", async () => {
                //Arrange
                const req = getMockReq();
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

            test("When requested with bad collection_date input, Expect to return HTTP status 400", async () => {
                //Arrange
                const req = getMockReq({ body: { collection_date: "2023" } });
                const { res, next } = getMockRes();
                const getAllGtfsFlexSpy =
                jest
                    .spyOn(gtfsFlexService, "getAllGtfsFlex")
                    .mockRejectedValueOnce(new InputException("Invalid date provided."));
                //Act
                await gtfsFlexController.getAllGtfsFlex(req, res, next);
                //Assert
                expect(res.status).toHaveBeenCalledWith(400);
                expect(next).toHaveBeenCalled();
                expect(getAllGtfsFlexSpy).toHaveBeenCalledTimes(1);
            });

            test("When unknown or database exception occured while processing request, Expect to return HTTP status 500", async () => {
                //Arrange
                const req = getMockReq({ body: { collection_date: "2023" } });
                const { res, next } = getMockRes();
                jest
                    .spyOn(gtfsFlexService, "getAllGtfsFlex")
                    .mockRejectedValueOnce(new Error("unknown error"));
                //Act
                await gtfsFlexController.getAllGtfsFlex(req, res, next);
                //Assert
                expect(res.status).toHaveBeenCalledWith(500);
                expect(next).toHaveBeenCalled();
            });
        });
    });

    describe("Get Flex file by Id", () => {
        describe("Functional", () => {
            test("When requested for valid tdei_record_id, Expect to return downloadable file stream", async () => {
                //Arrange
                const req = getMockReq();
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

            test("When requested for invalid tdei_record_id, Expect to return HTTP status 404", async () => {
                //Arrange
                const req = getMockReq();
                const { res, next } = getMockRes();
                const getGtfsFlexByIdSpy =
                jest
                    .spyOn(gtfsFlexService, "getGtfsFlexById")
                    .mockRejectedValueOnce(new HttpException(404, "Record not found"));
                //Act
                await gtfsFlexController.getGtfsFlexById(req, res, next);
                //Assert
                expect(res.status).toBeCalledWith(404);
                expect(next).toHaveBeenCalled();
                expect(getGtfsFlexByIdSpy).toHaveBeenCalledTimes(1);
            });

            test("When unexpected error occured while processing request, Expect to return HTTP status 500", async () => {
                //Arrange
                const req = getMockReq();
                const { res, next } = getMockRes();
                const getGtfsFlexByIdSpy =
                jest
                    .spyOn(gtfsFlexService, "getGtfsFlexById")
                    .mockRejectedValueOnce(new Error("Unexpected error"));
                //Act
                await gtfsFlexController.getGtfsFlexById(req, res, next);
                //Assert
                expect(res.status).toBeCalledWith(500);
                expect(next).toHaveBeenCalled();
                expect(getGtfsFlexByIdSpy).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Create flex file', ()=>{

        beforeAll(()=>{
            mockCore();
        })
        test('When valid input provided, expect to return tdei_record_id for new record', async ()=>{
            mockCore();
            let req = getMockReq({ body: {"meta":JSON.stringify(TdeiObjectFaker.getGtfsFlexPayload2()),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            const {res, next} = getMockRes()
            const dummyResponse =  <GtfsFlexDTO>{
                tdei_record_id:"test_record_id"
            }
            const createGtfsFlexSpy = jest.spyOn(gtfsFlexService,"createGtfsFlex").mockResolvedValueOnce(dummyResponse);
            const storageCliSpy  = jest.spyOn(storageService,"uploadFile").mockResolvedValue('remote_url');
            const uploadSpy = jest.spyOn(gtfsFlexController.eventBusService,"publishUpload").mockImplementation()

            await gtfsFlexController.createGtfsFlex(req,res,next)
            expect(createGtfsFlexSpy).toHaveBeenCalledTimes(1);
            expect(res.status).toBeCalledWith(200);
        })

        test('When invalid meta is provided, expect to return 400 error', async ()=>{
            const payload = TdeiObjectFaker.getGtfsFlexPayload2()
            payload.collection_method = ""; // Empty collection method
            let req = getMockReq({ body: {"meta":JSON.stringify(payload),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            const {res, next} = getMockRes()
            await gtfsFlexController.createGtfsFlex(req,res,next);
            expect(res.status).toBeCalledWith(400);
        });

        test('When database exception occurs, expect to return same error', async ()=>{

            let req = getMockReq({ body: {"meta":JSON.stringify(TdeiObjectFaker.getGtfsFlexPayload2()),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            mockCore();
            const {res, next} = getMockRes()
           const exception  = new DuplicateException("test_record_id")
            const createGtfsFlexSpy = jest.spyOn(gtfsFlexService,"createGtfsFlex").mockRejectedValueOnce(exception)
            await gtfsFlexController.createGtfsFlex(req,res,next)
            expect(next).toBeCalledWith(exception);

        })
        test('When any HTTPexception occurs during the creation, its sent as response', async ()=>{

            let req = getMockReq({ body: {"meta":JSON.stringify(TdeiObjectFaker.getGtfsFlexPayload2()),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            mockCore();
            const {res, next} = getMockRes()
           const exception  = new OverlapException("test_record_id")
            const createGtfsFlexSpy = jest.spyOn(gtfsFlexService,"createGtfsFlex").mockRejectedValueOnce(exception)
            await gtfsFlexController.createGtfsFlex(req,res,next)
            expect(next).toBeCalledWith(exception);

        })

    })

   
    describe("Get Version list", () => {
        describe("Functional", () => {

            test("When requested version info, Expect to return HTTP status 200", async () => {
                //Arrange
                let req = getMockReq();
                const { res, next } = getMockRes();
                //Act
                await gtfsFlexController.getVersions(req, res, next);
                //Assert
                expect(res.status).toHaveBeenCalledWith(200);
            });
        });
    });
});