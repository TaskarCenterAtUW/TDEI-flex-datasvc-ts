import { NextFunction, Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsFlexService from "../service/gtfs-flex-service";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException } from "../exceptions/http/http-exceptions";

class GtfsFlexController implements IController {
    public path = '/api/v1/gtfsflex';
    public router = express.Router();
    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get(this.path, this.getAllGtfsFlex);
        this.router.get(`${this.path}/:id`, this.getGtfsFlexById);
        this.router.post(this.path, this.createAGtfsFlex);
    }

    getAllGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            var params: FlexQueryParams = new FlexQueryParams(JSON.parse(JSON.stringify(request.query)));
            const gtfsFlex = await gtfsFlexService.getAllGtfsFlex(params);
            response.send(gtfsFlex);
        } catch (error) {
            console.log(error);
            next(new HttpException(500, "Error while fetching the flex information"));
        }
    }

    getGtfsFlexById = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            let fileEntity: FileEntity = await gtfsFlexService.getGtfsFlexById(request.params.id);

            response.header('Content-Type', fileEntity.mimeType);
            response.header('Content-disposition', `attachment; filename=${fileEntity.fileName}`);
            response.status(200);
            (await fileEntity.getStream()).pipe(response);
        } catch (error) {
            console.log('Error while getting the file stream');
            console.log(error);
            next(new HttpException(500, "Error while getting the file stream"));
        }
    }

    createAGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            var newGtfsFlex = await gtfsFlexService.createAGtfsFlex(request.body)
                .catch((error: any) => {
                    if (error instanceof DuplicateException) {
                        throw error;
                    }
                    throw new HttpException(500, 'Error saving the flex version');
                });
            response.send(newGtfsFlex);
        } catch (error) {
            console.log('Error saving the flex version');
            console.log(error);
            next(error);
        }
    }
}

const gtfsFlexController = new GtfsFlexController();
export default gtfsFlexController;