import { Request, Response } from "express";
import healthController from "../controller/health-controller";

// group test using describe
describe("Health of the Service", () => {
    it("Should return 'Healthy' if service is up and running", async () => {
        const mockRequest = {
            query: {}
        } as Request;
        let responseObj = {};
        const mockResponse: Partial<Response> = {
            send: jest.fn().mockImplementation((result) => {
                responseObj = result;
            })
        };
        await healthController.getping(mockRequest, mockResponse as Response);
        expect(responseObj).toEqual("I'm healthy !!");
    });
});