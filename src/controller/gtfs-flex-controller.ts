import { Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsFlexService from "../service/gtfs-flex-service";

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

    getAllGtfsFlex = async (request: Request, response: express.Response) => {
        var params: FlexQueryParams = JSON.parse(JSON.stringify(request.query));

        const gtfsFlex = await gtfsFlexService.getAllGtfsFlex(params);
        response.send(gtfsFlex);
    }

    getGtfsFlexById = async (request: Request, response: express.Response) => {

        try {
            let fileEntity: FileEntity = await gtfsFlexService.getGtfsFlexById(request.params.id);

            response.header('Content-Type', fileEntity.mimeType);
            response.header('Content-disposition', `attachment; filename=${fileEntity.fileName}`);
            response.status(200);
            (await fileEntity.getStream()).pipe(response);
        } catch (error) {
            console.log('Error while getting the file stream');
            console.log(error);
            response.status(404);
            response.end();
            return;
        }
    }

    createAGtfsFlex = async (request: Request, response: express.Response) => {

        var newGtfsFlex = await gtfsFlexService.createAGtfsFlex(request.body).catch((error: any) => {
            console.log('Error saving the flex version');
            console.log(error);
            response.status(500);
            response.end();
            return;
        });
        response.send(newGtfsFlex);
    }
}

const gtfsFlexController = new GtfsFlexController();
export default gtfsFlexController;