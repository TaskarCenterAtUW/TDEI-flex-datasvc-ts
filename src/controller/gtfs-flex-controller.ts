import { NextFunction, Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsFlexService from "../service/gtfs-flex-service";
import HttpException from "../exceptions/http/http-base-exception";
import { FileTypeException, InputException } from "../exceptions/http/http-exceptions";
import { FlexVersions } from "../database/entity/flex-version-entity";
import { validate, ValidationError } from "class-validator";
import { Version, Versions } from "../model/versions-dto";
import { environment } from "../environment/environment";
import multer, { memoryStorage } from "multer";
import { GtfsFlexUploadMeta } from "../model/gtfs-flex-upload-meta";
import storageService from "../service/storage-service";
import path from "path";
import { Readable } from "stream";
// import EventBusService from "../service/event-bus-service";
import { tokenValidator } from "../middleware/token-validation-middleware";
import { metajsonValidator } from "../middleware/json-validation-middleware";
import { EventBusService } from "../service/event-bus-service";

/**
 * Multer for multiple uploads
 * Configured to pull to `uploads` folder
 * and buffer is available with the request
 * File filter is added to ensure only files with .zip extension
 * are allowed
 */
const upload = multer({
    dest: 'uploads/',
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if(ext != '.zip') {
            cb(new FileTypeException());
        }
        cb(null,true);
    },
});

class GtfsFlexController implements IController {
    public path = '/api/v1/gtfs-flex';
    public router = express.Router();
    constructor() {
        this.intializeRoutes();
    }
    eventBusService = new EventBusService();

    public intializeRoutes() {
        this.router.get(this.path, this.getAllGtfsFlex);
        this.router.get(`${this.path}/:id`, this.getGtfsFlexById);
        this.router.post(this.path, this.createGtfsFlex);
        this.router.get(`${this.path}/versions/info`, this.getVersions);
    }

    getVersions = async (request: Request, response: express.Response, next: NextFunction) => {
        let versionsList = new Versions([{
            documentation: environment.getewayUrl as string,
            specification: "https://github.com/MobilityData/gtfs-flex",
            version: "v2.0"
        }]);

        response.status(200).send(versionsList);
        this.router.post(this.path,upload.single('file') ,this.createGtfsFlex);
        this.router.post(this.path,upload.single('file'),tokenValidator,this.createGtfsFlex);
        this.router.post(this.path,upload.single('file'),metajsonValidator,tokenValidator,this.createGtfsFlex);
    }

    getAllGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            const params: FlexQueryParams = new FlexQueryParams(JSON.parse(JSON.stringify(request.query)));
            const gtfsFlex = await gtfsFlexService.getAllGtfsFlex(params);
            gtfsFlex.forEach(x => {
                x.download_url = `${this.path}/${x.tdei_record_id}`;
            })
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
    /**
     * Function to create record in the database and upload the gtfs-files
     * @param request - request 
     * @param response - response
     * @param next 
     * @returns 
     */
    createGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            console.log('Received upload request');
            const meta = JSON.parse(request.body['meta']);
            const userId = request.body.user_id;
            // Validate the meta data
            const gtfsdto = GtfsFlexUploadMeta.from(meta);
            const result = await validate(gtfsdto);
            console.log('result', result);
        
            if(result.length != 0){
                console.log('Metadata validation failed');
                console.log(result);
                // Need to send these as response
                const message = result.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
                return response.status(400).send('Input validation failed with below reasons : \n' + message);
            }
            // Generate the files and upload them
            const uid = storageService.generateRandomUUID(); // Fetches a random UUID for the record
            const folderPath = storageService.getFolderPath(gtfsdto.tdei_org_id,uid);
            const uploadedFile = request.file;
            const uploadPath = path.join(folderPath,uploadedFile!.originalname)
            const remoteUrl = await storageService.uploadFile(uploadPath,'application/zip',Readable.from(uploadedFile!.buffer))
            // Upload the meta file  
            const metaFilePath = path.join(folderPath,'meta.json');
            const metaUrl = await storageService.uploadFile(metaFilePath,'text/json',gtfsdto.getStream());
            // Insert into database
            const flex = FlexVersions.from(meta);
            flex.tdei_record_id = uid;
            flex.file_upload_path = remoteUrl;
            flex.uploaded_by = userId;
            const returnInfo = await gtfsFlexService.createGtfsFlex(flex);

            // Publish to the topic
            this.eventBusService.publishUpload(gtfsdto,uid,remoteUrl,userId,metaUrl);
            // Also send the information to the queue
            console.log('Responding to request');
            return response.status(200).send(uid);

        } catch (error) {
            console.error('Error saving the flex file', error);
            response.status(500).send('Error saving the flex file');
        }
    }
}

const gtfsFlexController = new GtfsFlexController();
export default gtfsFlexController;