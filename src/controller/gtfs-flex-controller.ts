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
        this.router.post(this.path, this.createGtfsFlex);
    }

    getAllGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            const params: FlexQueryParams = new FlexQueryParams(JSON.parse(JSON.stringify(request.query)));
            const gtfsFlex = await gtfsFlexService.getAllGtfsFlex(params);
            response.status(200).send(gtfsFlex);
        } catch (error) {
            console.error("Error while fetching the flex information", error);
            if (error instanceof InputException) {
                response.status(error.status).send(error.message);
                next(error);
            }
            else {
                response.status(500).send("Error while fetching the flex information");
                next(new HttpException(500, "Error while fetching the flex information"));
            }
        }
    }

    getGtfsFlexById = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            const fileEntity: FileEntity = await gtfsFlexService.getGtfsFlexById(request.params.id);

            response.header('Content-Type', fileEntity.mimeType);
            response.header('Content-disposition', `attachment; filename=${fileEntity.fileName}`);
            response.status(200);
            (await fileEntity.getStream()).pipe(response);
        } catch (error) {
            console.error('Error while getting the file stream', error);
            if (error instanceof HttpException) {
                response.status(error.status).send(error.message);
                return next(error);
            }
            response.status(500).send("Error while getting the file stream");
            next(new HttpException(500, "Error while getting the file stream"));
        }
    }

    createGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            const flex = FlexVersions.from(request.body);

            return validate(flex).then(async errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.error('Upload flex file metadata information failed validation. errors: ', errors);
                    const message = errors.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
                    response.status(400).send('Input validation failed with below reasons : \n' + message);
                    next(new HttpException(400, 'Input validation failed with below reasons : \n' + message));
                } else {
                    return await gtfsFlexService.createGtfsFlex(flex)
                        .then(newFlex => {
                            return Promise.resolve(response.status(200).send(newFlex));
                        })
                        .catch((error: any) => {
                            if (error instanceof DuplicateException) {
                                response.status(error.status).send(error.message)
                                next(new HttpException(error.status, error.message));
                            }
                            else {
                                response.status(500).send('Error saving the flex version')
                                next(new HttpException(500, 'Error saving the flex version'));
                            }
                        });
                }
            });
        } catch (error) {
            console.error('Error saving the flex version', error);
            response.status(500).send('Error saving the flex version')
            next(new HttpException(500, "Error saving the flex version"));
        }
    }
}

const gtfsFlexController = new GtfsFlexController();
export default gtfsFlexController;