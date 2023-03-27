import { NextFunction, Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsFlexService from "../service/gtfs-flex-service";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException, InputException } from "../exceptions/http/http-exceptions";
import { FlexVersions } from "../database/entity/flex-version-entity";
import { validate, ValidationError } from "class-validator";

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
            console.error("Error while fetching the flex information", error);
            if (error instanceof InputException) {
                next(error);
            }
            else {
                next(new HttpException(500, "Error while fetching the pathways information"));
            }
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
            console.error('Error while getting the file stream', error);
            if (error instanceof HttpException)
                throw next(error);
            next(new HttpException(500, "Error while getting the file stream"));
        }
    }

    createAGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            let flex = FlexVersions.from(request.body);

            validate(flex).then(async errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.error('Upload flex file metadata information failed validation. errors: ', errors);
                    const message = errors.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
                    next(new HttpException(500, 'Input validation failed with below reasons : \n' + message));
                } else {
                    var newGtfsFlex = await gtfsFlexService.createAGtfsFlex(flex)
                        .catch((error: any) => {
                            if (error instanceof DuplicateException) {
                                throw error;
                            }
                            next(new HttpException(500, 'Error saving the flex version'));
                        });
                    response.send(newGtfsFlex);
                }
            });
        } catch (error) {
            console.error('Error saving the flex version', error);
            next(error);
        }
    }
}

const gtfsFlexController = new GtfsFlexController();
export default gtfsFlexController;